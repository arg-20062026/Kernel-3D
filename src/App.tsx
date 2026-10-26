import { useState, useMemo, lazy, Suspense } from "react";
import {
  Cpu,
  RotateCcw,
  AlertTriangle,
  Activity,
} from "lucide-react";
import type { SimulationStage, SimulationModel } from "./types/simulation";
import {
  CLASSIC_5X3_PRESET,
  UNSAFE_PRESET,
  createDefaultProcessNames,
  createDefaultResourceNames,
  createEmptyMatrix,
  createEmptyVector,
} from "./data/presets";
import { STAGE_DIALOGUES } from "./data/dialogues";
import { calculateNeed, runSafetyAlgorithm, type SafetyResult } from "./algorithm/banker";

import StageNavigation from "./components/StageNavigation";
import WelcomeStage from "./components/WelcomeStage";
import SystemConfigStage from "./components/SystemConfigStage";
import ProcessNamingStage from "./components/ProcessNamingStage";
import ResourceNamingStage from "./components/ResourceNamingStage";
import MatrixEditorStage from "./components/MatrixEditorStage";
import SafetyAnalysisStage from "./components/SafetyAnalysisStage";
import LisaAssistant from "./components/LisaAssistant";
import "./App.css";

// Lazy load 3D Scene to keep initial bundle ultra-lean
const Simulation3DStage = lazy(
  () => import("./components/Simulation3DStage"),
);

const RESOURCE_COLOR_PALETTE = [
  "#55e8ff", // cyan
  "#a78bfa", // purple
  "#55f0b5", // emerald green
  "#f472b6", // rose
  "#fbbf24", // amber
  "#60a5fa", // sky blue
];

export default function App() {
  const [stage, setStage] = useState<SimulationStage>("WELCOME");
  const [model, setModel] = useState<SimulationModel>(() =>
    structuredClone(CLASSIC_5X3_PRESET),
  );
  const [dialogue, setDialogue] = useState<string>(STAGE_DIALOGUES.WELCOME);
  const [showResetModal, setShowResetModal] = useState(false);

  // Compute safety result whenever model matrices change
  const safetyResult: SafetyResult | null = useMemo(() => {
    try {
      calculateNeed(model.allocation, model.max);
      return runSafetyAlgorithm({
        allocation: model.allocation,
        max: model.max,
        available: model.available,
      });
    } catch {
      return null;
    }
  }, [model.allocation, model.max, model.available]);

  // Stage transition helper
  const navigateTo = (nextStage: SimulationStage, customDialogue?: string) => {
    setStage(nextStage);
    setDialogue(customDialogue ?? STAGE_DIALOGUES[nextStage]);
  };

  // Stage accessibility guard
  const canNavigateTo = (targetStage: SimulationStage): boolean => {
    if (targetStage === "WELCOME") return true;
    if (targetStage === "SYSTEM_CONFIG") return true;
    if (targetStage === "PROCESS_NAMING") return model.processCount > 0;
    if (targetStage === "RESOURCE_NAMING")
      return model.processNames.length === model.processCount;
    if (targetStage === "ALLOCATION_INPUT")
      return model.resourceNames.length === model.resourceCount;
    if (targetStage === "SAFETY_ANALYSIS") {
      try {
        calculateNeed(model.allocation, model.max);
        return true;
      } catch {
        return false;
      }
    }
    if (targetStage === "SIMULATION_3D") {
      return safetyResult !== null;
    }
    return false;
  };

  // Voice and text command dispatcher
  const handleVoiceCommand = (rawCommand: string) => {
    const cmd = rawCommand.toLowerCase().trim();

    if (cmd.includes("start") || cmd.includes("begin")) {
      if (stage === "WELCOME") {
        navigateTo("SYSTEM_CONFIG");
      }
      return;
    }

    if (cmd.includes("classic") || cmd.includes("textbook")) {
      setModel(structuredClone(CLASSIC_5X3_PRESET));
      navigateTo(
        "SAFETY_ANALYSIS",
        "Classic 5 processes and 3 resources dataset loaded. Let's analyze its safety sequence.",
      );
      return;
    }

    if (cmd.includes("unsafe") || cmd.includes("deadlock")) {
      setModel(structuredClone(UNSAFE_PRESET));
      navigateTo(
        "SAFETY_ANALYSIS",
        "Unsafe dataset loaded. Notice how the safety algorithm detects deadlock risk.",
      );
      return;
    }

    if (cmd.includes("next") || cmd.includes("continue")) {
      if (stage === "WELCOME") navigateTo("SYSTEM_CONFIG");
      else if (stage === "SYSTEM_CONFIG") navigateTo("PROCESS_NAMING");
      else if (stage === "PROCESS_NAMING") navigateTo("RESOURCE_NAMING");
      else if (stage === "RESOURCE_NAMING") navigateTo("ALLOCATION_INPUT");
      else if (stage === "ALLOCATION_INPUT" && canNavigateTo("SAFETY_ANALYSIS"))
        navigateTo("SAFETY_ANALYSIS");
      else if (stage === "SAFETY_ANALYSIS" && canNavigateTo("SIMULATION_3D"))
        navigateTo("SIMULATION_3D");
      return;
    }

    if (cmd.includes("back") || cmd.includes("previous")) {
      if (stage === "SYSTEM_CONFIG") navigateTo("WELCOME");
      else if (stage === "PROCESS_NAMING") navigateTo("SYSTEM_CONFIG");
      else if (stage === "RESOURCE_NAMING") navigateTo("PROCESS_NAMING");
      else if (stage === "ALLOCATION_INPUT") navigateTo("RESOURCE_NAMING");
      else if (stage === "SAFETY_ANALYSIS") navigateTo("ALLOCATION_INPUT");
      else if (stage === "SIMULATION_3D") navigateTo("SAFETY_ANALYSIS");
      return;
    }

    if (cmd.includes("analyze") || cmd.includes("safety")) {
      if (canNavigateTo("SAFETY_ANALYSIS")) {
        navigateTo("SAFETY_ANALYSIS");
      }
      return;
    }

    if (cmd.includes("3d") || cmd.includes("universe") || cmd.includes("simulation")) {
      if (canNavigateTo("SIMULATION_3D")) {
        navigateTo("SIMULATION_3D");
      }
      return;
    }

    if (cmd.includes("reset") || cmd.includes("restart")) {
      setShowResetModal(true);
      return;
    }

    // Default friendly fallback
    setDialogue(`I heard "${rawCommand}". Try saying "Next", "Back", "Analyze", or "3D Universe".`);
  };

  // Dimensions confirmed in Stage 2
  const handleDimensionsConfirm = (pCount: number, rCount: number) => {
    setModel((prev) => {
      // Re-dimension process names if count changed
      let pNames = [...prev.processNames];
      if (pNames.length < pCount) {
        const extra = createDefaultProcessNames(pCount);
        pNames = [...pNames, ...extra.slice(pNames.length)];
      } else {
        pNames = pNames.slice(0, pCount);
      }

      // Re-dimension resource names if count changed
      let rNames = [...prev.resourceNames];
      if (rNames.length < rCount) {
        const extra = createDefaultResourceNames(rCount);
        rNames = [...rNames, ...extra.slice(rNames.length)];
      } else {
        rNames = rNames.slice(0, rCount);
      }

      // Resize allocation matrix
      const newAlloc = createEmptyMatrix(pCount, rCount, 0);
      for (let i = 0; i < Math.min(prev.allocation.length, pCount); i++) {
        for (let j = 0; j < Math.min(prev.allocation[i]?.length || 0, rCount); j++) {
          newAlloc[i][j] = prev.allocation[i][j];
        }
      }

      // Resize max matrix
      const newMax = createEmptyMatrix(pCount, rCount, 0);
      for (let i = 0; i < Math.min(prev.max.length, pCount); i++) {
        for (let j = 0; j < Math.min(prev.max[i]?.length || 0, rCount); j++) {
          newMax[i][j] = prev.max[i][j];
        }
      }

      // Resize available vector
      const newAvail = createEmptyVector(rCount, 2);
      for (let j = 0; j < Math.min(prev.available.length, rCount); j++) {
        newAvail[j] = prev.available[j];
      }

      return {
        processCount: pCount,
        resourceCount: rCount,
        processNames: pNames,
        resourceNames: rNames,
        allocation: newAlloc,
        max: newMax,
        available: newAvail,
      };
    });

    navigateTo("PROCESS_NAMING");
  };

  // Process names confirmed in Stage 3
  const handleProcessNamesConfirm = (names: string[]) => {
    setModel((prev) => ({ ...prev, processNames: names }));
    navigateTo("RESOURCE_NAMING");
  };

  // Resource names confirmed in Stage 4
  const handleResourceNamesConfirm = (names: string[]) => {
    setModel((prev) => ({ ...prev, resourceNames: names }));
    navigateTo("ALLOCATION_INPUT");
  };

  // Reset to initial classic state
  const handleGlobalReset = () => {
    setModel(structuredClone(CLASSIC_5X3_PRESET));
    setShowResetModal(false);
    navigateTo("WELCOME", "Simulation reset to initial state. Say Start or click to begin.");
  };

  return (
    <main className="app-shell">
      {/* GLOBAL TOPBAR */}
      <header className="topbar">
        <div
          className="brand"
          onClick={() => navigateTo("WELCOME")}
          role="button"
          tabIndex={0}
          title="Return to Welcome"
        >
          <div className="brand-mark">
            <Cpu size={23} />
          </div>
          <div>
            <div className="brand-name">
              KERNEL <span>3D</span>
            </div>
            <div className="brand-subtitle">
              BANKER'S ALGORITHM LABORATORY
            </div>
          </div>
        </div>

        <div className="system-status">
          <span className="status-dot" />
          <span>OS SIMULATOR ONLINE</span>
          <span className="status-divider">/</span>
          <span className="status-stage-label">STAGE: {stage}</span>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowResetModal(true)}
            title="Reset entire simulation"
          >
            <RotateCcw size={14} /> Reset Simulation
          </button>
        </div>
      </header>

      {/* WORKFLOW STEPPER NAVIGATION */}
      <StageNavigation
        currentStage={stage}
        onSelectStage={(s) => navigateTo(s)}
        canNavigateTo={canNavigateTo}
      />

      {/* CONFIRM RESET MODAL */}
      {showResetModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-title">
              <AlertTriangle size={20} className="modal-warning-icon" />
              Reset Simulation to Initial State?
            </div>
            <p className="modal-desc">
              All custom process names, resource names, and matrix values will
              be restored to defaults. Are you sure you want to proceed?
            </p>
            <div className="modal-buttons">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button danger-btn"
                onClick={handleGlobalReset}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE STAGE WORKSPACE */}
      <div className="stage-content-container">
        {stage === "WELCOME" && (
          <WelcomeStage
            dialogue={dialogue}
            onStartCustom={() => navigateTo("SYSTEM_CONFIG")}
            onLoadClassic={() => {
              setModel(structuredClone(CLASSIC_5X3_PRESET));
              navigateTo(
                "SAFETY_ANALYSIS",
                "Classic 5-process, 3-resource example loaded. Let's inspect the safety sequence.",
              );
            }}
            onLoadUnsafe={() => {
              setModel(structuredClone(UNSAFE_PRESET));
              navigateTo(
                "SAFETY_ANALYSIS",
                "Unsafe state loaded. Notice how the safety algorithm detects deadlock risk.",
              );
            }}
            onVoiceCommand={handleVoiceCommand}
          />
        )}

        {stage === "SYSTEM_CONFIG" && (
          <SystemConfigStage
            initialProcessCount={model.processCount}
            initialResourceCount={model.resourceCount}
            onConfirm={handleDimensionsConfirm}
            onBack={() => navigateTo("WELCOME")}
          />
        )}

        {stage === "PROCESS_NAMING" && (
          <ProcessNamingStage
            processCount={model.processCount}
            initialNames={model.processNames}
            onConfirm={handleProcessNamesConfirm}
            onBack={() => navigateTo("SYSTEM_CONFIG")}
          />
        )}

        {stage === "RESOURCE_NAMING" && (
          <ResourceNamingStage
            resourceCount={model.resourceCount}
            initialNames={model.resourceNames}
            onConfirm={handleResourceNamesConfirm}
            onBack={() => navigateTo("PROCESS_NAMING")}
          />
        )}

        {stage === "ALLOCATION_INPUT" && (
          <MatrixEditorStage
            model={model}
            onUpdateModel={setModel}
            onAnalyze={() => {
              const res = safetyResult;
              const msg = res?.isSafe
                ? "The system is in a safe state! A valid safe execution sequence was verified."
                : "The system is in an unsafe state. No execution order guarantees avoidance of deadlock.";
              navigateTo("SAFETY_ANALYSIS", msg);
            }}
            onBack={() => navigateTo("RESOURCE_NAMING")}
            onReset={() => {
              setModel((prev) => ({
                ...prev,
                allocation: createEmptyMatrix(prev.processCount, prev.resourceCount, 0),
                max: createEmptyMatrix(prev.processCount, prev.resourceCount, 0),
                available: createEmptyVector(prev.resourceCount, 1),
              }));
            }}
            resourceColors={RESOURCE_COLOR_PALETTE}
          />
        )}

        {stage === "SAFETY_ANALYSIS" && (
          <SafetyAnalysisStage
            model={model}
            onLaunch3D={() => navigateTo("SIMULATION_3D")}
            onBackToMatrices={() => navigateTo("ALLOCATION_INPUT")}
            onApplyRequest={(newModel) => {
              setModel(newModel);
              setDialogue(
                "Resource request granted! Allocation and Available have been updated and safety verified.",
              );
            }}
            resourceColors={RESOURCE_COLOR_PALETTE}
          />
        )}

        {stage === "SIMULATION_3D" && (
          <Suspense
            fallback={
              <div className="scene-loading-placeholder">
                <Activity size={32} className="spin-slow" />
                <span>Initializing 3D Resource Universe...</span>
              </div>
            }
          >
            {safetyResult && (
              <Simulation3DStage
                model={model}
                safetyResult={safetyResult}
                onBackToAnalysis={() => navigateTo("SAFETY_ANALYSIS")}
                onBackToMatrices={() => navigateTo("ALLOCATION_INPUT")}
                resourceColors={RESOURCE_COLOR_PALETTE}
              />
            )}
          </Suspense>
        )}
      </div>

      {/* FLOATING LISA ASSISTANT (Stages 2 through 7) */}
      {stage !== "WELCOME" && (
        <LisaAssistant
          dialogue={dialogue}
          isWelcomeStage={false}
          onVoiceCommand={handleVoiceCommand}
          onAdvanceStage={() => {
            if (stage === "SYSTEM_CONFIG") navigateTo("PROCESS_NAMING");
            else if (stage === "PROCESS_NAMING") navigateTo("RESOURCE_NAMING");
            else if (stage === "RESOURCE_NAMING") navigateTo("ALLOCATION_INPUT");
            else if (stage === "ALLOCATION_INPUT" && canNavigateTo("SAFETY_ANALYSIS"))
              navigateTo("SAFETY_ANALYSIS");
            else if (stage === "SAFETY_ANALYSIS" && canNavigateTo("SIMULATION_3D"))
              navigateTo("SIMULATION_3D");
          }}
          hintActionText={
            stage === "ALLOCATION_INPUT"
              ? "Analyze"
              : stage === "SAFETY_ANALYSIS"
                ? "3D View"
                : "Next"
          }
        />
      )}

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-left">
          <span>KERNEL 3D</span>
          <span className="footer-dot">/</span>
          <span>BANKER'S ALGORITHM SCIENTIFIC SIMULATOR</span>
        </div>
        <div className="footer-right">
          <span>GUIDED BY LISA AI</span>
          <span className="footer-dot">·</span>
          <span>DIJKSTRA DEADLOCK AVOIDANCE ENGINE</span>
        </div>
      </footer>
    </main>
  );
}
