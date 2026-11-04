import React from "react";
import { Check, Database, Sliders, PlayCircle, BarChart3, ChevronRight } from "lucide-react";

export type StepId = "datasets" | "parameters" | "training" | "evaluation";

export interface StepperProps {
  currentStep: StepId;
  onStepChange: (step: StepId) => void;
  isDatasetReady: boolean;
  isTrained: boolean;
}

interface StepItem {
  id: StepId;
  number: number;
  title: string;
  subtitle: string;
  icon: React.ComponentType<{ className?: string }>;
  accentColor: {
    badgeActive: string;
    badgeDone: string;
    cardActive: string;
    cardIdle: string;
    borderActive: string;
    text: string;
  };
}

const STEPS: StepItem[] = [
  {
    id: "datasets",
    number: 1,
    title: "Dados & Datasets",
    subtitle: "Escolha ou envie CSV",
    icon: Database,
    accentColor: {
      badgeActive: "bg-sky-600 text-white shadow-sky-500/30",
      badgeDone: "bg-sky-100 text-sky-700 dark:bg-sky-950/60 dark:text-sky-300",
      cardActive: "bg-sky-50/80 dark:bg-sky-950/30 border-sky-300 dark:border-sky-800 shadow-sm",
      cardIdle: "bg-content1/60 hover:bg-content1 border-default-200/60",
      borderActive: "border-sky-500",
      text: "text-sky-700 dark:text-sky-300",
    },
  },
  {
    id: "parameters",
    number: 2,
    title: "Arquitetura da Rede",
    subtitle: "Neurônios e Hiperparâmetros",
    icon: Sliders,
    accentColor: {
      badgeActive: "bg-purple-600 text-white shadow-purple-500/30",
      badgeDone: "bg-purple-100 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300",
      cardActive: "bg-purple-50/80 dark:bg-purple-950/30 border-purple-300 dark:border-purple-800 shadow-sm",
      cardIdle: "bg-content1/60 hover:bg-content1 border-default-200/60",
      borderActive: "border-purple-500",
      text: "text-purple-700 dark:text-purple-300",
    },
  },
  {
    id: "training",
    number: 3,
    title: "Treinamento ao Vivo",
    subtitle: "Convergência a 60 FPS",
    icon: PlayCircle,
    accentColor: {
      badgeActive: "bg-amber-600 text-white shadow-amber-500/30",
      badgeDone: "bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300",
      cardActive: "bg-amber-50/80 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 shadow-sm",
      cardIdle: "bg-content1/60 hover:bg-content1 border-default-200/60",
      borderActive: "border-amber-500",
      text: "text-amber-700 dark:text-amber-300",
    },
  },
  {
    id: "evaluation",
    number: 4,
    title: "Avaliação & Métricas",
    subtitle: "Matriz de Confusão",
    icon: BarChart3,
    accentColor: {
      badgeActive: "bg-emerald-600 text-white shadow-emerald-500/30",
      badgeDone: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300",
      cardActive: "bg-emerald-50/80 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800 shadow-sm",
      cardIdle: "bg-content1/60 hover:bg-content1 border-default-200/60",
      borderActive: "border-emerald-500",
      text: "text-emerald-700 dark:text-emerald-300",
    },
  },
];

export const Stepper: React.FC<StepperProps> = ({
  currentStep,
  onStepChange,
  isDatasetReady,
  isTrained,
}) => {
  const isStepCompleted = (stepId: StepId) => {
    if (stepId === "datasets") return isDatasetReady;
    if (stepId === "parameters") return isDatasetReady;
    if (stepId === "training") return isTrained;
    if (stepId === "evaluation") return isTrained;
    return false;
  };

  return (
    <nav aria-label="Progresso do Wizard" className="w-full">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {STEPS.map((step, idx) => {
          const isActive = currentStep === step.id;
          const isDone = isStepCompleted(step.id);
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              type="button"
              onClick={() => onStepChange(step.id)}
              className={`relative flex items-center gap-3 p-3.5 sm:p-4 rounded-2xl border text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                isActive
                  ? `${step.accentColor.cardActive} ring-1 ring-inset ${step.accentColor.borderActive}`
                  : step.accentColor.cardIdle
              }`}
            >
              {/* Step indicator badge */}
              <div
                className={`flex items-center justify-center h-9 w-9 rounded-xl font-bold text-xs shrink-0 transition-all ${
                  isActive
                    ? `${step.accentColor.badgeActive} shadow-md`
                    : isDone
                    ? step.accentColor.badgeDone
                    : "bg-slate-100 dark:bg-slate-800 text-slate-500"
                }`}
              >
                {isDone && !isActive ? (
                  <Check className="h-4 w-4 stroke-[2.5]" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Title & Subtitle */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-default-400">
                    Passo {step.number}
                  </span>
                  {idx < STEPS.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-default-300 hidden md:block shrink-0" />
                  )}
                </div>
                <p
                  className={`text-xs sm:text-sm font-bold truncate leading-tight ${
                    isActive ? step.accentColor.text : "text-foreground"
                  }`}
                >
                  {step.title}
                </p>
                <p className="text-[11px] text-default-400 truncate hidden sm:block">
                  {step.subtitle}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
