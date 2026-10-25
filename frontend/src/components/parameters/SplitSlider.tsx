import React from "react";
import { Card, CardBody, CardHeader, Divider, Slider, Switch, Chip } from "@heroui/react";
import { PieChart, CheckCircle2, SplitSquareVertical } from "lucide-react";
import { MlpParameters } from "../../types/mlp";

export interface SplitSliderProps {
  parameters: MlpParameters;
  onChange: (updated: Partial<MlpParameters>) => void;
  totalSamples?: number;
}

export const SplitSlider: React.FC<SplitSliderProps> = ({
  parameters,
  onChange,
  totalSamples = 150,
}) => {
  const { trainingRate, sameFileForTesting } = parameters;
  const percentage = Math.round(trainingRate * 100);

  const trainCount = Math.round(totalSamples * (percentage / 100));
  const testCount = Math.max(0, totalSamples - trainCount);

  return (
    <Card className="border border-default-200/50 bg-content1/60 backdrop-blur-md shadow-sm">
      <CardHeader className="flex gap-3 pb-2">
        <div className="p-2 rounded-lg bg-success/10 text-success">
          <SplitSquareVertical className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold">Train / Test Dataset Partitioning</h3>
          <p className="text-xs text-default-500">
            Configure dataset split ratio and cross-validation behavior
          </p>
        </div>
      </CardHeader>
      <Divider />
      <CardBody className="p-4 sm:p-5 space-y-6">
        {/* Dynamic Samples Breakdown Chips */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl bg-content2/40 border border-default-200/50">
          <div className="space-y-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-default-500">
              Sample Distribution
            </span>
            <p className="text-sm font-bold text-foreground">
              {percentage}% Training / {100 - percentage}% Testing
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Chip
              size="sm"
              color="primary"
              variant="flat"
              startContent={<PieChart className="h-3 w-3 ml-1" />}
            >
              Train: {trainCount} samples
            </Chip>
            <Chip
              size="sm"
              color="secondary"
              variant="flat"
              startContent={<CheckCircle2 className="h-3 w-3 ml-1" />}
            >
              Test: {testCount} samples
            </Chip>
          </div>
        </div>

        {/* HeroUI Slider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-foreground">Training Split Ratio</label>
            <span className="text-xs font-mono font-bold text-primary">{percentage}%</span>
          </div>
          <Slider
            aria-label="Training Split Ratio"
            size="md"
            step={5}
            minValue={50}
            maxValue={100}
            value={percentage}
            onChange={(val) => {
              const numVal = typeof val === "number" ? val : val[0];
              onChange({ trainingRate: numVal / 100 });
            }}
            color="primary"
            className="max-w-full"
            marks={[
              { value: 50, label: "50%" },
              { value: 70, label: "70%" },
              { value: 80, label: "80%" },
              { value: 90, label: "90%" },
              { value: 100, label: "100%" },
            ]}
          />
        </div>

        <Divider />

        {/* Same file for testing toggle */}
        <div className="flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <label className="text-xs font-semibold text-foreground">
              Use Same File for Testing & Validation
            </label>
            <p className="text-[11px] text-default-500 leading-tight">
              When enabled, training and test samples are partitioned from the same active dataset.
            </p>
          </div>
          <Switch
            size="sm"
            color="primary"
            isSelected={sameFileForTesting}
            onValueChange={(isSelected) => onChange({ sameFileForTesting: isSelected })}
            aria-label="Same file for testing"
          />
        </div>
      </CardBody>
    </Card>
  );
};
