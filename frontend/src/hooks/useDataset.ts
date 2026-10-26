import { useState, useEffect, useCallback } from "react";
import { ColumnMeta, ColumnRole, ProcessedDataset } from "../types/dataset";
import { parseCsvString, detectColumnMetadata, processDataset, processTestDataset } from "../utils/csvParser";
import { getPresetById, PRESETS } from "../data/presets";

export interface UseDatasetReturn {
  currentPresetId: string | null;
  fileName: string;
  rawRows: Record<string, any>[];
  columns: ColumnMeta[];
  processedDataset: ProcessedDataset | null;
  isLoading: boolean;
  error: string | null;

  // Separate test file properties
  isSeparateTestFile: boolean;
  setIsSeparateTestFile: (val: boolean) => void;
  testFileName: string | null;
  testRawRows: Record<string, any>[];
  testProcessedDataset: ProcessedDataset | null;
  testError: string | null;

  loadPreset: (presetId: string) => void;
  loadCsvString: (csvText: string, fileName?: string) => void;
  loadCsvFile: (file: File) => Promise<void>;
  loadTestCsvString: (csvText: string, fileName?: string) => void;
  loadTestCsvFile: (file: File) => Promise<void>;
  clearTestFile: () => void;
  setColumnRole: (columnName: string, newRole: ColumnRole) => void;
  reset: () => void;
}

export function useDataset(): UseDatasetReturn {
  const [currentPresetId, setCurrentPresetId] = useState<string | null>("base-benchmark");
  const [fileName, setFileName] = useState<string>("base_treinamento.csv");
  const [rawRows, setRawRows] = useState<Record<string, any>[]>([]);
  const [columns, setColumns] = useState<ColumnMeta[]>([]);
  const [processedDataset, setProcessedDataset] = useState<ProcessedDataset | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Dedicated test file state
  const [isSeparateTestFile, setIsSeparateTestFile] = useState<boolean>(true);
  const [testFileName, setTestFileName] = useState<string | null>("base_teste.csv");
  const [testRawRows, setTestRawRows] = useState<Record<string, any>[]>([]);
  const [testProcessedDataset, setTestProcessedDataset] = useState<ProcessedDataset | null>(null);
  const [testError, setTestError] = useState<string | null>(null);

  const loadCsvStringInternal = useCallback((
    csvText: string,
    customFileName?: string,
    presetId?: string,
    testCsvText?: string,
    testCustomFileName?: string
  ) => {
    setIsLoading(true);
    setError(null);
    setTestError(null);

    try {
      const parsed = parseCsvString(csvText);
      if (parsed.error) {
        setError(parsed.error);
        setIsLoading(false);
        return;
      }

      let detectedCols = detectColumnMetadata(parsed.data, parsed.columnNames);

      // Preset configurations
      if (presetId === "iris") {
        detectedCols = detectedCols.map((c) => {
          if (c.name.toLowerCase() === "id") return { ...c, role: "ignore" as ColumnRole };
          if (c.name.toLowerCase() === "species") return { ...c, role: "target" as ColumnRole, type: "categorical" as const };
          return { ...c, role: "input" as ColumnRole, type: "numeric" as const };
        });
      } else if (presetId === "colorballs" || presetId === "color-balls") {
        detectedCols = detectedCols.map((c) => {
          if (c.name.toLowerCase() === "color") return { ...c, role: "target" as ColumnRole, type: "categorical" as const };
          return { ...c, role: "input" as ColumnRole, type: "numeric" as const };
        });
      } else if (presetId === "base-benchmark") {
        detectedCols = detectedCols.map((c) => {
          if (c.name.toLowerCase() === "classe" || c.name.toLowerCase() === "class")
            return { ...c, role: "target" as ColumnRole, type: "categorical" as const };
          return { ...c, role: "input" as ColumnRole, type: "numeric" as const };
        });
      }

      const processedTrain = processDataset(parsed.data, detectedCols);

      setRawRows(parsed.data);
      setColumns(detectedCols);
      setProcessedDataset(processedTrain);
      setFileName(customFileName || (presetId ? `${presetId}.csv` : "custom.csv"));
      setCurrentPresetId(presetId ?? null);

      // Handle paired test dataset if provided
      if (testCsvText) {
        const parsedTest = parseCsvString(testCsvText);
        if (parsedTest.error) {
          setTestError(parsedTest.error);
        } else {
          const processedTest = processTestDataset(parsedTest.data, processedTrain);
          setTestRawRows(parsedTest.data);
          setTestProcessedDataset(processedTest);
          setTestFileName(testCustomFileName || "test.csv");
          setIsSeparateTestFile(true);
        }
      } else {
        setTestRawRows([]);
        setTestProcessedDataset(null);
        setTestFileName(null);
        setIsSeparateTestFile(false);
      }
    } catch (err: any) {
      setError(err?.message || "Falha ao processar o dataset CSV");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadPreset = useCallback((presetId: string) => {
    const preset = getPresetById(presetId);
    if (!preset) {
      setError(`Preset '${presetId}' não encontrado`);
      return;
    }
    loadCsvStringInternal(
      preset.csvContent,
      `${preset.name}.csv`,
      preset.id,
      preset.testCsvContent,
      preset.testCsvContent ? `${preset.name} - Teste.csv` : undefined
    );
  }, [loadCsvStringInternal]);

  const loadCsvString = useCallback((csvText: string, customFileName?: string) => {
    loadCsvStringInternal(csvText, customFileName || "uploaded.csv", undefined);
  }, [loadCsvStringInternal]);

  const loadCsvFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setError(null);

    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("O arquivo deve ser um formato .csv válido");
      }
      const text = await file.text();
      loadCsvStringInternal(text, file.name, undefined);
    } catch (err: any) {
      setError(err?.message || "Falha ao ler o arquivo CSV");
      setIsLoading(false);
    }
  }, [loadCsvStringInternal]);

  const loadTestCsvString = useCallback((csvText: string, customFileName?: string) => {
    if (!processedDataset) {
      setTestError("Carregue o dataset de treinamento antes de carregar o teste.");
      return;
    }
    try {
      const parsed = parseCsvString(csvText);
      if (parsed.error) {
        setTestError(parsed.error);
        return;
      }
      const processedTest = processTestDataset(parsed.data, processedDataset);
      setTestRawRows(parsed.data);
      setTestProcessedDataset(processedTest);
      setTestFileName(customFileName || "test.csv");
      setIsSeparateTestFile(true);
      setTestError(null);
    } catch (err: any) {
      setTestError(err?.message || "Falha ao processar dataset de teste.");
    }
  }, [processedDataset]);

  const loadTestCsvFile = useCallback(async (file: File) => {
    setTestError(null);
    try {
      if (!file.name.toLowerCase().endsWith(".csv")) {
        throw new Error("O arquivo de teste deve ser .csv");
      }
      const text = await file.text();
      loadTestCsvString(text, file.name);
    } catch (err: any) {
      setTestError(err?.message || "Falha ao ler o arquivo de teste CSV");
    }
  }, [loadTestCsvString]);

  const clearTestFile = useCallback(() => {
    setTestRawRows([]);
    setTestProcessedDataset(null);
    setTestFileName(null);
    setTestError(null);
    setIsSeparateTestFile(false);
  }, []);

  const setColumnRole = useCallback((columnName: string, newRole: ColumnRole) => {
    setColumns((prevCols) => {
      const updated = prevCols.map((col) => {
        if (col.name === columnName) {
          return { ...col, role: newRole };
        }
        if (newRole === "target" && col.role === "target") {
          return { ...col, role: (col.type === "numeric" ? "input" : "ignore") as ColumnRole };
        }
        return col;
      });

      // Re-run dataset processing with new column configurations
      if (rawRows.length > 0) {
        const reprocessedTrain = processDataset(rawRows, updated);
        setProcessedDataset(reprocessedTrain);

        if (testRawRows.length > 0) {
          const reprocessedTest = processTestDataset(testRawRows, reprocessedTrain);
          setTestProcessedDataset(reprocessedTest);
        }
      }

      return updated;
    });
  }, [rawRows, testRawRows]);

  const reset = useCallback(() => {
    loadPreset("base-benchmark");
  }, [loadPreset]);

  // Initial mount: load base-benchmark preset (primary benchmark with train & test files)
  useEffect(() => {
    const defaultPreset = getPresetById("base-benchmark") || PRESETS[0];
    if (defaultPreset) {
      loadCsvStringInternal(
        defaultPreset.csvContent,
        "base_treinamento.csv",
        defaultPreset.id,
        defaultPreset.testCsvContent,
        "base_teste.csv"
      );
    }
  }, [loadCsvStringInternal]);

  return {
    currentPresetId,
    fileName,
    rawRows,
    columns,
    processedDataset,
    isLoading,
    error,

    isSeparateTestFile,
    setIsSeparateTestFile,
    testFileName,
    testRawRows,
    testProcessedDataset,
    testError,

    loadPreset,
    loadCsvString,
    loadCsvFile,
    loadTestCsvString,
    loadTestCsvFile,
    clearTestFile,
    setColumnRole,
    reset,
  };
}
