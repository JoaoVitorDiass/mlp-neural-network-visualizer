import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

function robustParseCsv(text) {
  if (!text || !text.trim()) throw new Error('Empty CSV');
  const lines = text.trim().split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) throw new Error('At least header and 1 row required');

  // Simple regex-based token parsing supporting quoted fields
  const parseLine = (line) => {
    const tokens = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        inQuotes = !inQuotes;
      } else if (c === ',' && !inQuotes) {
        tokens.push(current.trim());
        current = '';
      } else {
        current += c;
      }
    }
    tokens.push(current.trim());
    return tokens;
  };

  const headers = parseLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = parseLine(lines[i]);
    if (parts.length !== headers.length) {
      throw new Error(`Row ${i} length mismatch`);
    }
    const row = {};
    headers.forEach((h, idx) => {
      const val = parts[idx];
      const num = Number(val);
      row[h] = val !== '' && !Number.isNaN(num) ? num : val;
    });
    rows.push(row);
  }
  return { headers, rows };
}

describe('Tier 2 - F6 Boundary: CSV Drag-and-Drop Edge Cases', () => {
  it('F6-B1: CSV with quoted fields containing commas parses correctly', () => {
    const csv = 'Name,Value\n"Item, Special",42';
    const { rows } = robustParseCsv(csv);
    assert.strictEqual(rows[0].Name, 'Item, Special');
    assert.strictEqual(rows[0].Value, 42);
  });

  it('F6-B2: CSV with multiple trailing blank lines ignores blank lines cleanly', () => {
    const csv = 'A,B\n1,2\n3,4\n\n\n  \n';
    const { rows } = robustParseCsv(csv);
    assert.strictEqual(rows.length, 2);
  });

  it('F6-B3: Non-numeric strings in numeric columns are retained as strings for role selector inspection', () => {
    const csv = 'Feature,Class\n"N/A",Class1\n12.5,Class2';
    const { rows } = robustParseCsv(csv);
    assert.strictEqual(rows[0].Feature, 'N/A');
    assert.strictEqual(rows[1].Feature, 12.5);
  });

  it('F6-B4: Large CSV (1,000 rows) parses within 100ms without memory exhaustion', () => {
    const lines = ['f1,f2,target'];
    for (let i = 0; i < 1000; i++) {
      lines.push(`${i},${i * 0.5},Class${i % 3}`);
    }
    const t0 = performance.now();
    const { rows } = robustParseCsv(lines.join('\n'));
    const duration = performance.now() - t0;
    assert.strictEqual(rows.length, 1000);
    assert.ok(duration < 100, `Large CSV parse should be fast (took ${duration.toFixed(1)}ms)`);
  });

  it('F6-B5: CSV containing only header row throws validation error', () => {
    assert.throws(() => robustParseCsv('Header1,Header2\n'), /at least header and 1 row/i);
  });
});
