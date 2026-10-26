import React, { useState, useRef } from "react";
import { Button, Chip } from "@heroui/react";
import { UploadCloud, FileSpreadsheet, AlertCircle, CheckCircle2 } from "lucide-react";

export interface CsvDropzoneProps {
  onFileLoaded: (file: File) => void;
  fileName?: string;
  rowCount?: number;
  isLoading?: boolean;
  error?: string | null;
}

export const CsvDropzone: React.FC<CsvDropzoneProps> = ({
  onFileLoaded,
  fileName,
  rowCount,
  isLoading = false,
  error = null,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const validateAndUpload = (file: File) => {
    setValidationError(null);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setValidationError("Apenas arquivos .csv são suportados.");
      return;
    }
    if (file.size === 0) {
      setValidationError("O arquivo enviado está vazio (0 bytes).");
      return;
    }
    onFileLoaded(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
    // Reset file input so user can re-select the same file if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const effectiveError = validationError || error;

  return (
    <div className="w-full space-y-3">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center p-6 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-200 select-none ${
          isDragOver
            ? "border-primary bg-primary/10 shadow-lg scale-[1.01]"
            : effectiveError
            ? "border-danger/60 bg-danger/5 hover:border-danger hover:bg-danger/10"
            : fileName
            ? "border-success/50 bg-content2/40 hover:border-primary/50"
            : "border-default-300 hover:border-primary/60 bg-content1/50 hover:bg-content2/30"
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center text-center space-y-3">
          <div
            className={`p-3.5 rounded-2xl transition-colors ${
              effectiveError
                ? "bg-danger/20 text-danger"
                : fileName
                ? "bg-success/20 text-success"
                : "bg-primary/10 text-primary"
            }`}
          >
            {effectiveError ? (
              <AlertCircle className="h-7 w-7" />
            ) : fileName ? (
              <CheckCircle2 className="h-7 w-7" />
            ) : (
              <UploadCloud className="h-7 w-7" />
            )}
          </div>

          <div className="space-y-1">
            <p className="text-sm font-semibold text-foreground">
              {fileName ? "Dataset Carregado" : "Arraste e solte o arquivo CSV aqui"}
            </p>
            <p className="text-xs text-default-500">
              {fileName ? (
                <span className="font-mono text-primary font-medium">{fileName}</span>
              ) : (
                "ou clique para selecionar do dispositivo (.csv)"
              )}
            </p>
          </div>

          {fileName && typeof rowCount === "number" && (
            <div className="flex items-center gap-2 pt-1">
              <Chip size="sm" color="success" variant="flat" startContent={<FileSpreadsheet className="h-3.5 w-3.5 ml-1" />}>
                {rowCount} linhas carregadas
              </Chip>
              <Button
                size="sm"
                variant="light"
                color="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                isLoading={isLoading}
                className="text-xs h-7 px-2"
              >
                Trocar arquivo
              </Button>
            </div>
          )}
        </div>
      </div>

      {effectiveError && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-danger/10 text-danger border border-danger/20">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{effectiveError}</span>
        </div>
      )}
    </div>
  );
};
