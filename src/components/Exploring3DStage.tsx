import { ArrowLeft, ArrowRight, Eye, Info, Mic } from "lucide-react";
import type { SimulationModel } from "../types/simulation";
import type { SafetyResult } from "../algorithm/banker";
import DynamicResourceScene from "../scene3d/DynamicResourceScene";
import WebGLFallback from "../scene3d/WebGLFallback";
import { useState, useEffect } from "react";

interface Exploring3DStageProps {
  model: SimulationModel;
  safetyResult: SafetyResult | null;
  onNext: () => void;
  onBack: () => void;
  resourceColors: string[];
}

function checkWebGLSupported(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      canvas.getContext("webgl") || canvas.getContext("experimental-webgl"),
    );
  } catch {
    return false;
  }
}

function checkReducedMotion(): boolean {
  if (typeof window !== "undefined" && window.matchMedia) {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }
  return false;
}

export default function Exploring3DStage({
  model,
  safetyResult,
  onNext,
  onBack,
  resourceColors,
}: Exploring3DStageProps) {
  const [isWebGLSupported] = useState<boolean>(() => checkWebGLSupported());
  const [force2DMode, setForce2DMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () => checkReducedMotion(),
  );

  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (e: MediaQueryListEvent) =>
        setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener?.("change", listener);
      return () => mediaQuery.removeEventListener?.("change", listener);
    }
  }, []);

  const dummySafetyResult: SafetyResult = safetyResult ?? {
    isSafe: true,
    safeSequence: model.processNames.map((_, i) => i),
    steps: [],
    unfinishedProcesses: [],
    finalWork: [...model.available],
  };

  const show3D = isWebGLSupported && !force2DMode;

  return (
    <div className="stage-panel simulation-3d-panel">
      <div className="stage-panel-header">
        <div className="header-flex">
          <div>
            <span className="eyebrow">STAGE 03 / SPATIAL TOPOLOGY</span>
            <h2>3D Resource Universe</h2>
            <p className="panel-description">
              Processes are represented by futuristic computational modules ({model.processCount} pods),
              and resource classes are represented by glowing energy reactor cores ({model.resourceCount} types).
            </p>
          </div>
          <div className="header-action-group">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setForce2DMode(!force2DMode)}
            >
              <Eye size={14} /> {force2DMode ? "Enable 3D View" : "2D Table View"}
            </button>
            <button type="button" className="primary-button" onClick={onNext}>
              <span>Say &ldquo;Next&rdquo; for Matrices</span> <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="voice-prompt-banner">
        <Mic size={18} className="pulse-cyan" />
        <div>
          <strong>Voice Active:</strong> Say &ldquo;Next&rdquo; when you are ready to review the predefined resource allocation matrix.
        </div>
      </div>

      <div className="scene-view-container">
        {show3D ? (
          <DynamicResourceScene
            model={model}
            safetyResult={dummySafetyResult}
            stepIndex={0}
            resourceColors={resourceColors}
            prefersReducedMotion={prefersReducedMotion}
          />
        ) : (
          <WebGLFallback
            model={model}
            safetyResult={dummySafetyResult}
            stepIndex={0}
            resourceColors={resourceColors}
          />
        )}

        {show3D && (
          <div className="scene-hint-badge">
            <Info size={13} />
            <span>Drag to rotate 3D orbit · Scroll to zoom · Say &ldquo;Next&rdquo; to advance</span>
          </div>
        )}
      </div>

      <div className="scene-legend-bar">
        <div className="legend-section">
          <span className="legend-heading">RESOURCES (ENERGY CORES):</span>
          <div className="legend-items">
            {model.resourceNames.map((rName, j) => {
              const color = resourceColors[j % resourceColors.length];
              return (
                <span key={j} className="legend-pill">
                  <i style={{ backgroundColor: color }} />
                  {rName}
                </span>
              );
            })}
          </div>
        </div>

        <div className="legend-section">
          <span className="legend-heading">PROCESSES (COMPUTATIONAL PODS):</span>
          <div className="legend-items">
            {model.processNames.map((pName, i) => (
              <span key={i} className="legend-pill">
                <i style={{ backgroundColor: "#6366f1" }} />
                {pName}
              </span>
            ))}
          </div>
        </div>
      </div>

      <div className="stage-actions-row">
        <button type="button" className="secondary-button" onClick={onBack}>
          <ArrowLeft size={16} /> Back to Dimensions
        </button>
        <button type="button" className="primary-button" onClick={onNext}>
          <span>Proceed to Matrix Review (or say &ldquo;Next&rdquo;)</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
