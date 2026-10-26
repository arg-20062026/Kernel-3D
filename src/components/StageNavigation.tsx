import {
  Sparkles,
  Sliders,
  Box,
  TableProperties,
  ShieldCheck,
  Play,
  Check,
} from "lucide-react";
import type { SimulationStage } from "../types/simulation";

interface StageNavigationProps {
  currentStage: SimulationStage;
  onSelectStage: (stage: SimulationStage) => void;
  canNavigateTo: (stage: SimulationStage) => boolean;
}

const STAGES: {
  id: SimulationStage;
  label: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
}[] = [
  { id: "WELCOME", label: "Welcome", icon: Sparkles },
  { id: "SYSTEM_CONFIG", label: "Dimensions", icon: Sliders },
  { id: "EXPLORING_3D", label: "3D Universe", icon: Box },
  { id: "ALLOCATION_INPUT", label: "Predefined Matrices", icon: TableProperties },
  { id: "SAFETY_ANALYSIS", label: "Safety Verification", icon: ShieldCheck },
  { id: "SIMULATION_3D", label: "Execution Trace", icon: Play },
];

export default function StageNavigation({
  currentStage,
  onSelectStage,
  canNavigateTo,
}: StageNavigationProps) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  return (
    <nav className="stage-nav-bar" aria-label="Simulation Workflow Steps">
      <div className="stage-nav-track">
        {STAGES.map((step, idx) => {
          const Icon = step.icon;
          const isActive = step.id === currentStage;
          const isDone = currentIndex !== -1 && idx < currentIndex;
          const isAccessible = canNavigateTo(step.id);

          return (
            <button
              key={step.id}
              type="button"
              className={`stage-nav-item ${isActive ? "active" : ""} ${
                isDone ? "completed" : ""
              } ${!isAccessible ? "disabled" : ""}`}
              onClick={() => {
                if (isAccessible) onSelectStage(step.id);
              }}
              disabled={!isAccessible}
              aria-current={isActive ? "step" : undefined}
            >
              <div className="stage-nav-bullet">
                {isDone ? (
                  <Check size={12} strokeWidth={3} />
                ) : (
                  <Icon size={12} />
                )}
              </div>
              <span className="stage-nav-text">
                <span className="stage-step-num">0{idx + 1}</span>
                <span className="stage-step-title">{step.label}</span>
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
