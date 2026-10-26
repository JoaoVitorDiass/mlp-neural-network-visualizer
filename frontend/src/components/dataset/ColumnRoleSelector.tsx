import React from "react";
import { Button, ButtonGroup, Chip, Card, CardBody, Tooltip } from "@heroui/react";
import {
  Binary,
  Layers,
  EyeOff,
  Target,
  ArrowRightCircle,
  AlertTriangle,
  Hash,
  Tag,
} from "lucide-react";
import { ColumnMeta, ColumnRole } from "../../types/dataset";

export interface ColumnRoleSelectorProps {
  columns: ColumnMeta[];
  onRoleChange: (columnName: string, newRole: ColumnRole) => void;
}

export const ColumnRoleSelector: React.FC<ColumnRoleSelectorProps> = ({
  columns,
  onRoleChange,
}) => {
  const inputCount = columns.filter((c) => c.role === "input").length;
  const targetColumn = columns.find((c) => c.role === "target");
  const targetCount = targetColumn ? 1 : 0;
  const ignoreCount = columns.filter((c) => c.role === "ignore").length;

  return (
    <div className="space-y-4">
      {/* Summary Badges Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-content2/40 border border-default-200/50">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold uppercase tracking-wider text-default-600">
            Papéis das Colunas
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            size="sm"
            color="primary"
            variant="flat"
            startContent={<ArrowRightCircle className="h-3 w-3 ml-1" />}
          >
            {inputCount} Entradas
          </Chip>
          <Chip
            size="sm"
            color="success"
            variant="flat"
            startContent={<Target className="h-3 w-3 ml-1" />}
          >
            {targetCount > 0 ? "1 Classe Alvo" : "0 Classes Alvo"}
          </Chip>
          <Chip
            size="sm"
            color="default"
            variant="flat"
            startContent={<EyeOff className="h-3 w-3 ml-1" />}
          >
            {ignoreCount} Ignoradas
          </Chip>
        </div>
      </div>

      {/* Warnings */}
      {targetCount === 0 && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-warning/10 text-warning border border-warning/20">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Nenhuma coluna alvo selecionada. Por favor, defina uma coluna como alvo de classificação.</span>
        </div>
      )}
      {inputCount === 0 && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-xl bg-danger/10 text-danger border border-danger/20">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Nenhuma coluna de entrada selecionada. Selecione ao menos 1 atributo de entrada.</span>
        </div>
      )}

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1">
        {columns.map((col) => {
          const isInput = col.role === "input";
          const isTarget = col.role === "target";
          const isIgnore = col.role === "ignore";

          return (
            <Card
              key={col.name}
              className={`border transition-all duration-150 ${
                isTarget
                  ? "border-success/60 bg-success/5 shadow-sm"
                  : isInput
                  ? "border-primary/50 bg-primary/5 shadow-sm"
                  : "border-default-200/50 bg-content1/40 opacity-70"
              }`}
            >
              <CardBody className="p-3.5 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-foreground truncate">
                        {col.name}
                      </span>
                      <Chip
                        size="sm"
                        variant="dot"
                        color={col.type === "numeric" ? "primary" : "secondary"}
                        className="text-[10px] h-5 border-none"
                      >
                        {col.type === "numeric" ? "numérico" : "categórico"}
                      </Chip>
                    </div>
                    {/* Metadata bounds or unique classes */}
                    <p className="text-[11px] text-default-500 truncate">
                      {col.type === "numeric" && col.min !== undefined && col.max !== undefined ? (
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3 shrink-0" />
                          <span>
                            Intervalo: [{col.min.toFixed(1)}, {col.max.toFixed(1)}]
                          </span>
                        </span>
                      ) : col.uniqueValues ? (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3 shrink-0" />
                          <span>
                            {col.uniqueValues.length} classes: {col.uniqueValues.slice(0, 3).join(", ")}
                            {col.uniqueValues.length > 3 ? "..." : ""}
                          </span>
                        </span>
                      ) : null}
                    </p>
                  </div>

                  {/* Active Role Badge */}
                  <Chip
                    size="sm"
                    variant="solid"
                    color={isTarget ? "success" : isInput ? "primary" : "default"}
                    className="capitalize text-[11px] h-6 shrink-0"
                  >
                    {isTarget ? "Alvo" : isInput ? "Entrada" : "Ignorada"}
                  </Chip>
                </div>

                {/* Role Switcher Button Group */}
                <ButtonGroup size="sm" variant="flat" className="w-full">
                  <Tooltip content="Usar como atributo de entrada da rede neural">
                    <Button
                      color={isInput ? "primary" : "default"}
                      variant={isInput ? "solid" : "flat"}
                      onClick={() => onRoleChange(col.name, "input")}
                      className="flex-1 text-xs font-medium"
                      startContent={<ArrowRightCircle className="h-3 w-3" />}
                    >
                      Entrada
                    </Button>
                  </Tooltip>
                  <Tooltip content="Definir como rótulo de classe alvo (codificação one-hot)">
                    <Button
                      color={isTarget ? "success" : "default"}
                      variant={isTarget ? "solid" : "flat"}
                      onClick={() => onRoleChange(col.name, "target")}
                      className="flex-1 text-xs font-medium"
                      startContent={<Binary className="h-3 w-3" />}
                    >
                      Classe
                    </Button>
                  </Tooltip>
                  <Tooltip content="Ignorar no treinamento e na extração de vetores">
                    <Button
                      color={isIgnore ? "danger" : "default"}
                      variant={isIgnore ? "solid" : "flat"}
                      onClick={() => onRoleChange(col.name, "ignore")}
                      className="flex-1 text-xs font-medium"
                      startContent={<EyeOff className="h-3 w-3" />}
                    >
                      Ignorar
                    </Button>
                  </Tooltip>
                </ButtonGroup>
              </CardBody>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
