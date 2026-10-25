import React from "react";
import { Card, CardBody, CardHeader, Divider, Input, Button, Tooltip } from "@heroui/react";
import { Sparkles, Gauge, Target, Repeat, RotateCcw, Info } from "lucide-react";
import { MlpParameters } from "../../types/mlp";

export interface HyperparametersProps {
  parameters: MlpParameters;
  onChange: (updated: Partial<MlpParameters>) => void;
  onReset?: () => void;
}

export const Hyperparameters: React.FC<HyperparametersProps> = ({
  parameters,
  onChange,
  onReset,
}) => {
  const { learningRate, errorValue, epochs } = parameters;

  return (
    <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
      <CardHeader className="flex items-center justify-between gap-3 pb-2">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-warning/10 text-warning">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold">Training Hyperparameters</h3>
            <p className="text-xs text-default-500">
              Configure convergence thresholds, learning step, and epoch budget
            </p>
          </div>
        </div>

        {onReset && (
          <Button
            size="sm"
            variant="flat"
            color="default"
            onClick={onReset}
            startContent={<RotateCcw className="h-3.5 w-3.5" />}
            className="text-xs"
          >
            Reset Defaults
          </Button>
        )}
      </CardHeader>
      <Divider />
      <CardBody className="p-4 sm:p-5 space-y-4">
        {/* Learning Rate */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-foreground">
                Learning Rate (<span className="font-serif italic">&eta;</span>)
              </label>
              <Tooltip content="Step size taken along the negative gradient during backpropagation weight updates. Recommended: 0.05 - 0.3.">
                <Info className="h-3 w-3 text-default-400 cursor-pointer" />
              </Tooltip>
            </div>
            <span className="text-[10px] text-default-500 font-mono">0.001 - 1.0</span>
          </div>
          <Input
            type="number"
            size="sm"
            step="0.01"
            min={0.001}
            max={1.0}
            value={learningRate.toString()}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!Number.isNaN(val) && val > 0) {
                onChange({ learningRate: val });
              }
            }}
            startContent={<Sparkles className="h-3.5 w-3.5 text-warning" />}
            description="Gradient descent step multiplier"
          />
        </div>

        {/* Target Minimum Error */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-foreground">
                Target Minimum Error (<span className="font-serif italic">E<sub>min</sub></span>)
              </label>
              <Tooltip content="Early stopping barrier. When average sample error drops below this value, training halts successfully. Recommended: 0.01 - 0.03.">
                <Info className="h-3 w-3 text-default-400 cursor-pointer" />
              </Tooltip>
            </div>
            <span className="text-[10px] text-default-500 font-mono">0.0001 - 0.5</span>
          </div>
          <Input
            type="number"
            size="sm"
            step="0.005"
            min={0.0001}
            max={0.5}
            value={errorValue.toString()}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (!Number.isNaN(val) && val > 0) {
                onChange({ errorValue: val });
              }
            }}
            startContent={<Target className="h-3.5 w-3.5 text-danger" />}
            description="Early convergence stop threshold"
          />
        </div>

        {/* Maximum Epochs */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <label className="text-xs font-semibold text-foreground">Maximum Epochs</label>
              <Tooltip content="Upper limit on full passes over the training dataset. SignalR progress emits ~100 events across this span.">
                <Info className="h-3 w-3 text-default-400 cursor-pointer" />
              </Tooltip>
            </div>
            <span className="text-[10px] text-default-500 font-mono">10 - 10000</span>
          </div>
          <Input
            type="number"
            size="sm"
            step="100"
            min={10}
            max={10000}
            value={epochs.toString()}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val) && val >= 1) {
                onChange({ epochs: val });
              }
            }}
            startContent={<Repeat className="h-3.5 w-3.5 text-primary" />}
            description="Maximum training iterations"
          />
        </div>
      </CardBody>
    </Card>
  );
};
