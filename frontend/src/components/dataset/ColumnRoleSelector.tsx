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
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/80 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Layers className="h-4 w-4" />
          </div>
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
            Papéis das Colunas
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip
            size="sm"
            variant="flat"
            startContent={<ArrowRightCircle className="h-3.5 w-3.5 ml-1 text-blue-600 dark:text-blue-400" />}
            className="bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300 font-semibold rounded-xl text-xs"
          >
            {inputCount} Entradas
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            startContent={<Target className="h-3.5 w-3.5 ml-1 text-emerald-600 dark:text-emerald-400" />}
            className="bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 font-semibold rounded-xl text-xs"
          >
            {targetCount > 0 ? "1 Classe Alvo" : "0 Classes Alvo"}
          </Chip>
          <Chip
            size="sm"
            variant="flat"
            startContent={<EyeOff className="h-3.5 w-3.5 ml-1 text-slate-500" />}
            className="bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 font-medium rounded-xl text-xs"
          >
            {ignoreCount} Ignoradas
          </Chip>
        </div>
      </div>

      {/* Warnings */}
      {targetCount === 0 && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border border-amber-200/70 dark:border-amber-900/50">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
          <span>Nenhuma coluna alvo selecionada. Por favor, defina uma coluna como classe de saída.</span>
        </div>
      )}
      {inputCount === 0 && (
        <div className="flex items-center gap-2 p-3 text-xs rounded-2xl bg-rose-50 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200/70 dark:border-rose-900/50">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>Nenhuma coluna de entrada selecionada. Selecione ao menos 1 atributo de entrada.</span>
        </div>
      )}

      {/* Columns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-1">
        {columns.map((col) => {
          const isInput = col.role === "input";
          const isTarget = col.role === "target";
          const isIgnore = col.role === "ignore";

          return (
            <Card
              key={col.name}
              className={`border rounded-2xl transition-all duration-150 ${
                isTarget
                  ? "border-emerald-300 dark:border-emerald-800 bg-emerald-50/40 dark:bg-emerald-950/20 shadow-sm"
                  : isInput
                  ? "border-blue-200 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/15 shadow-sm"
                  : "border-slate-200/60 dark:border-slate-800/60 bg-slate-50/50 dark:bg-slate-900/20 opacity-70"
              }`}
            >
              <CardBody className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold text-foreground truncate">
                        {col.name}
                      </span>
                      <Chip
                        size="sm"
                        variant="flat"
                        className="text-[10px] h-5 rounded-lg font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
                      >
                        {col.type === "numeric" ? "numérico" : "categórico"}
                      </Chip>
                    </div>

                    {/* Metadata bounds or unique classes */}
                    <p className="text-[11px] text-default-500 truncate">
                      {col.type === "numeric" && col.min !== undefined && col.max !== undefined ? (
                        <span className="flex items-center gap-1">
                          <Hash className="h-3 w-3 shrink-0 text-slate-400" />
                          <span>
                            Intervalo: [{col.min.toFixed(1)}, {col.max.toFixed(1)}]
                          </span>
                        </span>
                      ) : col.uniqueValues ? (
                        <span className="flex items-center gap-1">
                          <Tag className="h-3 w-3 shrink-0 text-slate-400" />
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
                    className="capitalize text-[11px] h-6 rounded-xl font-bold shrink-0"
                  >
                    {isTarget ? "Classe Alvo" : isInput ? "Entrada" : "Ignorada"}
                  </Chip>
                </div>

                {/* Role Switcher Button Group */}
                <ButtonGroup size="sm" variant="flat" className="w-full bg-white dark:bg-slate-900 p-1 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <Tooltip content="Usar como atributo numérico de entrada para a rede">
                    <Button
                      color={isInput ? "primary" : "default"}
                      variant={isInput ? "solid" : "light"}
                      onClick={() => onRoleChange(col.name, "input")}
                      className={`flex-1 text-xs font-semibold rounded-lg h-7 transition-all ${
                        isInput ? "shadow-sm shadow-blue-500/20" : "text-default-600"
                      }`}
                      startContent={<ArrowRightCircle className="h-3.5 w-3.5" />}
                    >
                      Entrada
                    </Button>
                  </Tooltip>

                  <Tooltip content="Definir como rótulo de classe (saída one-hot)">
                    <Button
                      color={isTarget ? "success" : "default"}
                      variant={isTarget ? "solid" : "light"}
                      onClick={() => onRoleChange(col.name, "target")}
                      className={`flex-1 text-xs font-semibold rounded-lg h-7 transition-all ${
                        isTarget ? "shadow-sm shadow-emerald-500/20" : "text-default-600"
                      }`}
                      startContent={<Binary className="h-3.5 w-3.5" />}
                    >
                      Classe
                    </Button>
                  </Tooltip>

                  <Tooltip content="Ignorar no treinamento e na extração de vetores">
                    <Button
                      color={isIgnore ? "danger" : "default"}
                      variant={isIgnore ? "solid" : "light"}
                      onClick={() => onRoleChange(col.name, "ignore")}
                      className={`flex-1 text-xs font-semibold rounded-lg h-7 transition-all ${
                        isIgnore ? "shadow-sm shadow-rose-500/20" : "text-default-600"
                      }`}
                      startContent={<EyeOff className="h-3.5 w-3.5" />}
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
