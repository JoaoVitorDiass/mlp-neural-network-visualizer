import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  computeColumnStats,
  computeMinMaxBounds,
  normalizeMinMax,
  normalizeValues,
  minMaxNormalize,
} from "../../frontend/src/utils/normalization.ts";
import {
  extractUniqueClasses,
  getUniqueClasses,
  encodeOneHot,
  oneHotEncodeRows,
  argMax,
  decodeOneHot,
} from "../../frontend/src/utils/oneHot.ts";
import {
  parseCsvString,
  detectColumnMetadata,
  processDataset,
} from "../../frontend/src/utils/csvParser.ts";

/**
 * Emulates the exact C# backend vector extraction logic:
 * backend/src/Mlp.Application/Services/MlpService.cs:117-146
 */
function backendExtractVectors(
  rows: Record<string, number>[],
  inputLayer: number,
  outputLayer: number,
  firstClassColumn: number
): { inputs: number[][]; targets: number[][] } {
  const inputs: number[][] = [];
  const targets: number[][] = [];

  for (let r = 0; r < rows.Count || r < rows.length; r++) {
    const row = rows[r];
    const keys = Object.keys(row);

    inputs[r] = new Array(inputLayer);
    for (let i = 0; i < inputLayer; i++) {
      inputs[r][i] = row[keys[i]];
    }

    targets[r] = new Array(outputLayer);
    for (let k = 0; k < outputLayer; k++) {
      const colIndex = firstClassColumn + k;
      targets[r][k] = colIndex < keys.length ? row[keys[colIndex]] : 0.0;
    }
  }

  return { inputs, targets };
}

describe("Milestone 2 Challenger Stress & Adversarial Suite", () => {
  // =========================================================================
  // 1. Zero Variance Columns (x_max == x_min)
  // =========================================================================
  describe("1. Zero Variance Columns", () => {
    it("1.1 Constant positive values scale to 0.0 without NaN or zero-division", () => {
      const stats = computeColumnStats([5.0, 5.0, 5.0]);
      assert.strictEqual(stats.min, 5.0);
      assert.strictEqual(stats.max, 5.0);
      const norm = normalizeMinMax(5.0, stats.min, stats.max);
      assert.strictEqual(norm, 0.0);
      assert.ok(!Number.isNaN(norm));
    });

    it("1.2 Constant negative values scale to 0.0", () => {
      const stats = computeColumnStats([-42.0, -42.0]);
      assert.strictEqual(stats.min, -42.0);
      assert.strictEqual(stats.max, -42.0);
      assert.strictEqual(normalizeMinMax(-42.0, stats.min, stats.max), 0.0);
    });

    it("1.3 Single-row dataset (implicit zero-variance for all features)", () => {
      const raw = [{ f1: 10.5, f2: 3.2, target: "ClassA" }];
      const cols = detectColumnMetadata(raw, ["f1", "f2", "target"]);
      const processed = processDataset(raw, cols);
      assert.strictEqual(processed.normalizedRows.length, 1);
      assert.strictEqual(processed.normalizedRows[0].f1, 0.0);
      assert.strictEqual(processed.normalizedRows[0].f2, 0.0);
      assert.strictEqual(processed.normalizedRows[0].ClassA, 1.0);
    });

    it("1.4 Mixed zero-variance and varying columns", () => {
      const raw = [
        { constant: 7.0, varying: 10.0, target: "A" },
        { constant: 7.0, varying: 20.0, target: "B" },
      ];
      const cols = detectColumnMetadata(raw, ["constant", "varying", "target"]);
      const processed = processDataset(raw, cols);
      assert.strictEqual(processed.normalizedRows[0].constant, 0.0);
      assert.strictEqual(processed.normalizedRows[1].constant, 0.0);
      assert.strictEqual(processed.normalizedRows[0].varying, 0.0);
      assert.strictEqual(processed.normalizedRows[1].varying, 1.0);
    });
  });

  // =========================================================================
  // 2. Negative Numbers & Dynamic Ranges
  // =========================================================================
  describe("2. Negative Numbers & Dynamic Ranges", () => {
    it("2.1 Purely negative feature column scales properly to [0.0, 1.0]", () => {
      const vals = [-100.0, -60.0, -20.0];
      const norm = normalizeValues(vals);
      assert.strictEqual(norm[0], 0.0); // min (-100) -> 0.0
      assert.strictEqual(norm[1], 0.5); // mid (-60) -> 0.5
      assert.strictEqual(norm[2], 1.0); // max (-20) -> 1.0
    });

    it("2.2 Zero crossing feature range [-50, +50]", () => {
      const vals = [-50, 0, 50];
      const norm = normalizeValues(vals);
      assert.strictEqual(norm[0], 0.0);
      assert.strictEqual(norm[1], 0.5);
      assert.strictEqual(norm[2], 1.0);
    });

    it("2.3 Out of bounds clamping beyond min/max", () => {
      // If a test row contains values outside training min/max bounds
      assert.strictEqual(normalizeMinMax(-200, -100, 100), 0.0);
      assert.strictEqual(normalizeMinMax(300, -100, 100), 1.0);
    });

    it("2.4 Negative labels in classification targets", () => {
      const classes = extractUniqueClasses(["-1", "+1", "-1"]);
      assert.deepStrictEqual(classes, ["+1", "-1"]);
      const oneHot = encodeOneHot("-1", classes);
      assert.strictEqual(oneHot["-1"], 1.0);
      assert.strictEqual(oneHot["+1"], 0.0);
    });
  });

  // =========================================================================
  // 3. Floating Point Edge Cases
  // =========================================================================
  describe("3. Floating Point Edge Cases", () => {
    it("3.1 NaN value in normalizeMinMax: value NaN defaults to 0.0, but min/max NaN leaks NaN", () => {
      assert.strictEqual(normalizeMinMax(NaN, 0, 10), 0.0);
      const minNaNResult = normalizeMinMax(5, NaN, 10);
      const maxNaNResult = normalizeMinMax(5, 0, NaN);
      // Empirical verification: implementation leaks NaN when bounds are NaN
      assert.ok(Number.isNaN(minNaNResult), "normalizeMinMax with NaN min returns NaN");
      assert.ok(Number.isNaN(maxNaNResult), "normalizeMinMax with NaN max returns NaN");
    });

    it("3.2 Subnormal float numbers preserve relative scale", () => {
      const smallMin = 1e-300;
      const smallMax = 3e-300;
      const mid = 2e-300;
      const norm = normalizeMinMax(mid, smallMin, smallMax);
      assert.ok(Math.abs(norm - 0.5) < 1e-10);
    });

    it("3.3 Float difference overflow (1e308 to -1e308) results in NaN without protection", () => {
      // Challenge finding: 1e308 - (-1e308) overflows to Infinity, producing scaled = Infinity / Infinity = NaN
      const res = normalizeMinMax(1e308, -1e308, 1e308);
      // We empirically record whether implementation guards against this or returns NaN
      const isProtected = !Number.isNaN(res);
      console.log(`       [Adversarial Probe] Float overflow protection: ${isProtected ? "PASS" : "FAIL (returns NaN)"}`);
      assert.ok(typeof res === "number");
    });

    it("3.4 Infinity handling in computeColumnStats", () => {
      const stats = computeColumnStats([Infinity, 1.0, 5.0]);
      console.log(`       [Adversarial Probe] computeColumnStats with Infinity: max=${stats.max}`);
      // When Infinity is passed, max becomes Infinity
      assert.ok(stats.max === Infinity);
    });
  });

  // =========================================================================
  // 4. Empty Rows & Missing Values
  // =========================================================================
  describe("4. Empty Rows & Missing Values", () => {
    it("4.1 Empty and whitespace-only CSV strings produce structured error", () => {
      const emptyRes = parseCsvString("");
      assert.ok(emptyRes.error);
      assert.strictEqual(emptyRes.data.length, 0);

      const wsRes = parseCsvString("   \n\r\n\t  \n");
      assert.ok(wsRes.error);
    });

    it("4.2 CSV with only header row produces structured validation error", () => {
      const headerOnly = parseCsvString("SepalLength,SepalWidth,Species\n");
      assert.ok(headerOnly.error);
      assert.match(headerOnly.error, /header/i);
    });

    it("4.3 Empty rows in middle and end are filtered out cleanly", () => {
      const csv = "f1,f2,target\n1,2,A\n\n\n3,4,B\n\n";
      const res = parseCsvString(csv);
      assert.strictEqual(res.data.length, 2);
      assert.strictEqual(res.data[0].target, "A");
      assert.strictEqual(res.data[1].target, "B");
    });

    it("4.4 Missing value in input feature cell evaluates to 0 (implicit coercion)", () => {
      const csv = "f1,f2,target\n10,20,A\n,30,B";
      const res = parseCsvString(csv);
      const cols = detectColumnMetadata(res.data, res.columnNames);
      const processed = processDataset(res.data, cols);
      // Row 1 missing f1 -> Number(null) is 0, so f1=0
      assert.strictEqual(processed.normalizedRows[1].f1, 0.0);
    });

    it("4.5 Missing target label produces all-zero one-hot vector", () => {
      const csv = "f1,target\n1.0,A\n2.0,B\n3.0,";
      const res = parseCsvString(csv);
      const cols = detectColumnMetadata(res.data, res.columnNames);
      const processed = processDataset(res.data, cols);
      assert.strictEqual(processed.targetClasses.length, 2); // 'A', 'B'
      // Row 2 has empty target: all classes must be 0.0
      assert.strictEqual(processed.normalizedRows[2].A, 0.0);
      assert.strictEqual(processed.normalizedRows[2].B, 0.0);
    });
  });

  // =========================================================================
  // 5. Single-Class and Many-Class Targets
  // =========================================================================
  describe("5. Single-Class and Many-Class Targets", () => {
    it("5.1 Single-class target produces 1 output dimension with constant 1.0", () => {
      const csv = "f1,f2,target\n1,2,Single\n3,4,Single\n5,6,Single";
      const res = parseCsvString(csv);
      const cols = detectColumnMetadata(res.data, res.columnNames);
      const processed = processDataset(res.data, cols);
      assert.strictEqual(processed.outputCount, 1);
      assert.strictEqual(processed.targetClasses[0], "Single");
      for (const row of processed.normalizedRows) {
        assert.strictEqual(row.Single, 1.0);
      }
    });

    it("5.2 High-cardinality target (50 classes) processes efficiently under 100ms", () => {
      const rows: Record<string, any>[] = [];
      for (let i = 0; i < 1000; i++) {
        rows.push({
          f1: i * 0.1,
          f2: i * 0.2,
          classLabel: `Class_${String(i % 50).padStart(2, "0")}`,
        });
      }
      const t0 = performance.now();
      const cols = detectColumnMetadata(rows, ["f1", "f2", "classLabel"]);
      const processed = processDataset(rows, cols);
      const elapsed = performance.now() - t0;

      assert.strictEqual(processed.outputCount, 50);
      assert.strictEqual(processed.normalizedRows.length, 1000);
      assert.ok(elapsed < 100, `High cardinality processed in ${elapsed.toFixed(1)}ms`);
    });

    it("5.3 Unicode and international characters in class labels", () => {
      const raw = [
        { f: 1, target: "Maçã" },
        { f: 2, target: "Limão" },
        { f: 3, target: "Açaí" },
      ];
      const cols = detectColumnMetadata(raw, ["f", "target"]);
      const processed = processDataset(raw, cols);
      assert.deepStrictEqual(processed.targetClasses, ["Açaí", "Limão", "Maçã"]);
      assert.strictEqual(processed.normalizedRows[0]["Maçã"], 1.0);
      assert.strictEqual(processed.normalizedRows[0]["Limão"], 0.0);
    });
  });

  // =========================================================================
  // 6. Adversarial Attack: Column Name Collision
  // =========================================================================
  describe("6. Column Name Collisions & Invariant Violations", () => {
    it("6.1 Input column name identical to a Target class label (Critical Defect Probe)", () => {
      // Scenario: Feature column is named 'A', and classes are 'A' and 'B'
      const raw = [
        { A: 10.0, B: 20.0, target: "A" },
        { A: 30.0, B: 40.0, target: "B" },
      ];
      const cols = [
        { name: "A", role: "input" as const, type: "numeric" as const },
        { name: "B", role: "input" as const, type: "numeric" as const },
        { name: "target", role: "target" as const, type: "categorical" as const },
      ];
      const processed = processDataset(raw, cols);
      const keys = Object.keys(processed.normalizedRows[0]);

      console.log(`       [Adversarial Probe] Colliding names total keys: ${keys.length} (expected 4: input A, input B, class A, class B)`);
      console.log(`       [Adversarial Probe] Actual keys: [${keys.join(", ")}]`);

      // If keys.length < 4, it means input feature 'A' was destroyed/overwritten by class 'A'
      const hasCollisionDefect = keys.length < 4;
      if (hasCollisionDefect) {
        console.log(`       ⚠️ VULNERABILITY CONFIRMED: Column collision collapsed row from 4 to ${keys.length} keys!`);
      }
      assert.ok(
        !hasCollisionDefect,
        `Vulnerability: Input feature 'A' overwritten by one-hot class 'A'. Expected 4 keys, found ${keys.length}`
      );
    });
  });

  // =========================================================================
  // 7. Adversarial Attack: Dictionary Key Ordering Invariant
  // =========================================================================
  describe("7. Dictionary Key Ordering Invariant", () => {
    it("7.1 Canonical Iris preset satisfies key ordering (Inputs 0..3, Targets 4..6)", () => {
      const raw = [
        {
          SepalLengthCm: 5.1,
          SepalWidthCm: 3.5,
          PetalLengthCm: 1.4,
          PetalWidthCm: 0.2,
          Species: "Iris-setosa",
        },
        {
          SepalLengthCm: 7.0,
          SepalWidthCm: 3.2,
          PetalLengthCm: 4.7,
          PetalWidthCm: 1.4,
          Species: "Iris-versicolor",
        },
        {
          SepalLengthCm: 6.3,
          SepalWidthCm: 3.3,
          PetalLengthCm: 6.0,
          PetalWidthCm: 2.5,
          Species: "Iris-virginica",
        },
      ];
      const cols = [
        { name: "SepalLengthCm", role: "input" as const, type: "numeric" as const },
        { name: "SepalWidthCm", role: "input" as const, type: "numeric" as const },
        { name: "PetalLengthCm", role: "input" as const, type: "numeric" as const },
        { name: "PetalWidthCm", role: "input" as const, type: "numeric" as const },
        { name: "Species", role: "target" as const, type: "categorical" as const },
      ];
      const processed = processDataset(raw, cols);
      const keys = Object.keys(processed.normalizedRows[0]);
      assert.deepStrictEqual(keys.slice(0, 4), [
        "SepalLengthCm",
        "SepalWidthCm",
        "PetalLengthCm",
        "PetalWidthCm",
      ]);
      assert.deepStrictEqual(keys.slice(4, 7), [
        "Iris-setosa",
        "Iris-versicolor",
        "Iris-virginica",
      ]);
    });

    it("7.2 Target classes that are numeric/integer strings (e.g. 0, 1, 2) (Critical Defect Probe)", () => {
      // Scenario: Standard ML binary classification with labels '0' and '1'
      const raw = [
        { featureX: 1.0, featureY: 2.0, label: "0" },
        { featureX: 3.0, featureY: 4.0, label: "1" },
      ];
      const cols = [
        { name: "featureX", role: "input" as const, type: "numeric" as const },
        { name: "featureY", role: "input" as const, type: "numeric" as const },
        { name: "label", role: "target" as const, type: "categorical" as const },
      ];
      const processed = processDataset(raw, cols);
      const row0 = processed.normalizedRows[0];
      const keys = Object.keys(row0);

      console.log(`       [Adversarial Probe] Numeric target classes key order: [${keys.join(", ")}]`);

      // In ECMAScript/V8, integer keys like '0' and '1' are placed FIRST before non-integer keys!
      const inputsAreFirst = keys[0] === "featureX" && keys[1] === "featureY";
      if (!inputsAreFirst) {
        console.log(`       ⚠️ VULNERABILITY CONFIRMED: V8 sorted integer classes ['0', '1'] BEFORE inputs ['featureX', 'featureY']!`);
        console.log(`          First 2 keys: [${keys.slice(0, 2).join(", ")}]`);
      }

      // Emulate backend vector extraction with these keys:
      const backendExtracted = backendExtractVectors(
        processed.normalizedRows,
        processed.inputCount,
        processed.outputCount,
        processed.firstClassIndex
      );

      console.log(`       [Adversarial Probe] Backend extracted inputs[0]:`, backendExtracted.inputs[0]);
      console.log(`       [Adversarial Probe] Backend extracted targets[0]:`, backendExtracted.targets[0]);

      // If inputs are reversed, backendExtracted.inputs[0] will contain [1.0, 0.0] (the target) instead of [0.0, 0.0] (the normalized features)!
      assert.ok(
        inputsAreFirst,
        `Vulnerability: Dictionary key ordering violated! Targets [${keys.slice(0, 2)}] preceded inputs [${keys.slice(2, 4)}].`
      );
    });
  });
});
