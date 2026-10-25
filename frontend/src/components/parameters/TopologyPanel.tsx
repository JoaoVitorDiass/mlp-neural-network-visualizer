import React from "react";
import { Card, CardBody, CardHeader, Divider, Input, Button, Chip, Tooltip } from "@heroui/react";
import { Sliders, Cpu, ArrowRight, Info, Plus, Minus, Layers } from "lucide-react";
import { MlpParameters } from "../../types/mlp";

export interface TopologyPanelProps {
  parameters: MlpParameters;
  onChange: (updated: Partial<MlpParameters>) => void;
  datasetInputCount?: number;
  datasetOutputCount?: number;
}

export const TopologyPanel: React.FC<TopologyPanelProps> = ({
  parameters,
  onChange,
  datasetInputCount,
  datasetOutputCount,
}) => {
  const { inputLayer, hiddenLayer, outputLayer, firstClassColumn } = parameters;

  const handleHiddenChange = (delta: number) => {
    const nextVal = Math.max(1, Math.min(64, hiddenLayer + delta));
    onChange({ hiddenLayer: nextVal });
  };

  return (
    <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
      <CardHeader className="flex gap-3 pb-2">
        <div className="p-2 rounded-lg bg-primary/10 text-primary">
          <Cpu className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Network Architecture & Topology</h3>
          <p className="text-xs text-default-500">
            Define input, hidden, and output layer dimensions
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="p-4 sm:p-5 space-y-6">
        {/* Visual Layer Architecture Diagram */}
        <div className="p-4 rounded-2xl bg-content2/40 border border-default-200/50">
          <div className="flex items-center justify-between pb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-default-500">
              Live Topology Flow
            </span>
            <Chip size="sm" color="primary" variant="flat">
              {inputLayer} × {hiddenLayer} × {outputLayer} MLP
            </Chip>
          </div>

          <div className="flex items-center justify-between gap-2 py-3 px-2 overflow-x-auto">
            {/* Input Layer Card */}
            <div className="flex flex-col items-center p-3 rounded-xl bg-primary/10 border border-primary/30 min-w-[90px] text-center">
              <span className="text-[11px] font-medium text-primary">Input Layer</span>
              <span className="text-xl font-extrabold text-foreground">{inputLayer}</span>
              <span className="text-[10px] text-default-500">features</span>
            </div>

            <ArrowRight className="h-4 w-4 text-default-400 shrink-0" />

            {/* Hidden Layer Card */}
            <div className="flex flex-col items-center p-3 rounded-xl bg-secondary/10 border border-secondary/30 min-w-[90px] text-center">
              <span className="text-[11px] font-medium text-secondary">Hidden Layer</span>
              <span className="text-xl font-extrabold text-foreground">{hiddenLayer}</span>
              <span className="text-[10px] text-default-500">neurons</span>
            </div>

            <ArrowRight className="h-4 w-4 text-default-400 shrink-0" />

            {/* Output Layer Card */}
            <div className="flex flex-col items-center p-3 rounded-xl bg-success/10 border border-success/30 min-w-[90px] text-center">
              <span className="text-[11px] font-medium text-success">Output Layer</span>
              <span className="text-xl font-extrabold text-foreground">{outputLayer}</span>
              <span className="text-[10px] text-default-500">classes</span>
            </div>
          </div>
        </div>

        {/* Form Inputs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Input Neurons */}
          <div>
            <div className="flex items-center justify-between pb-1.5">
              <label className="text-xs font-semibold text-foreground">Input Neurons</label>
              {typeof datasetInputCount === "number" && (
                <span className="text-[10px] text-primary">Synced from dataset</span>
              )}
            </div>
            <Input
              type="number"
              size="sm"
              min={1}
              value={inputLayer.toString()}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!Number.isNaN(val) && val >= 1) {
                  onChange({ inputLayer: val, firstClassColumn: val });
                }
              }}
              startContent={<Layers className="h-3.5 w-3.5 text-default-400" />}
            />
          </div>

          {/* Hidden Neurons with steppers */}
          <div>
            <div className="flex items-center justify-between pb-1.5">
              <label className="text-xs font-semibold text-foreground">Hidden Neurons</label>
              <span className="text-[10px] text-default-500">Range: 1 - 64</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onClick={() => handleHiddenChange(-1)}
                disabled={hiddenLayer <= 1}
                aria-label="Decrease hidden neurons"
              >
                <Minus className="h-3.5 w-3.5" />
              </Button>
              <Input
                type="number"
                size="sm"
                min={1}
                max={64}
                value={hiddenLayer.toString()}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!Number.isNaN(val) && val >= 1) {
                    onChange({ hiddenLayer: val });
                  }
                }}
                className="text-center font-semibold"
              />
              <Button
                isIconOnly
                size="sm"
                variant="flat"
                onClick={() => handleHiddenChange(1)}
                disabled={hiddenLayer >= 64}
                aria-label="Increase hidden neurons"
              >
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Output Neurons */}
          <div>
            <div className="flex items-center justify-between pb-1.5">
              <label className="text-xs font-semibold text-foreground">Output Neurons</label>
              {typeof datasetOutputCount === "number" && (
                <span className="text-[10px] text-success">Synced from classes</span>
              )}
            </div>
            <Input
              type="number"
              size="sm"
              min={1}
              value={outputLayer.toString()}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!Number.isNaN(val) && val >= 1) {
                  onChange({ outputLayer: val });
                }
              }}
              startContent={<Sliders className="h-3.5 w-3.5 text-default-400" />}
            />
          </div>

          {/* First Class Column Index */}
          <div>
            <div className="flex items-center justify-between pb-1.5">
              <div className="flex items-center gap-1">
                <label className="text-xs font-semibold text-foreground">First Class Column</label>
                <Tooltip content="Zero-indexed column in the payload where target one-hot values begin. Matches inputLayer.">
                  <Info className="h-3 w-3 text-default-400 cursor-pointer" />
                </Tooltip>
              </div>
              <span className="text-[10px] text-default-500 font-mono">Index {firstClassColumn}</span>
            </div>
            <Input
              type="number"
              size="sm"
              min={0}
              value={firstClassColumn.toString()}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!Number.isNaN(val) && val >= 0) {
                  onChange({ firstClassColumn: val });
                }
              }}
              startContent={<span className="text-xs font-mono text-default-400">#</span>}
            />
          </div>
        </div>
      </CardBody>
    </Card>
  );
};
