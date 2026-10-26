import { DatasetPreset } from "../../types/dataset";
import { baseBenchmarkPreset } from "./baseBenchmark";
import { irisPreset } from "./iris";
import { colorBallsPreset } from "./colorBalls";

export * from "./baseBenchmark";
export * from "./iris";
export * from "./colorBalls";

export const PRESETS: DatasetPreset[] = [
  baseBenchmarkPreset,
  irisPreset,
  colorBallsPreset,
];

export function getPresetById(idOrName: string): DatasetPreset | undefined {
  if (!idOrName) return undefined;
  const normalized = idOrName.toLowerCase().replace(/[-_\s]/g, "");
  return PRESETS.find((preset) => {
    const presetId = preset.id.toLowerCase().replace(/[-_\s]/g, "");
    const presetName = preset.name.toLowerCase().replace(/[-_\s]/g, "");
    return presetId === normalized || presetName === normalized;
  });
}
