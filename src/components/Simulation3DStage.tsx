import { useState, useEffect } from "react";
import {
  ArrowLeft,
  Eye,
  Sliders,
  Info,
  LogOut,
  Mic,
} from "lucide-react";
import type { SimulationModel } from "../types/simulation";
import type { SafetyResult } from "../algorithm/banker";
import DynamicResourceScene from "../scene3d/DynamicResourceScene";
import ExecutionController from "../scene3d/ExecutionController";
import WebGLFallback from "../scene3d/WebGLFallback";

interface Simulation3DStageProps {
  model: SimulationModel;
  safetyResult: SafetyResult;
  onBackToAnalysis: () => void;
  onBackToMatrices: () => void;
  onExitSession: () => void;
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

export default function Simulation3DStage({
  model,
  safetyResult,
  onBackToAnalysis,
  onBackToMatrices,
  onExitSession,
  resourceColors,
}: Simulation3DStageProps) {
  const [stepIndex, setStepIndex] = useState(0);
  const [isWebGLSupported] = useState<boolean>(() => checkWebGLSupported());
  const [force2DMode, setForce2DMode] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(
    () => checkReducedMotion(),
  );

  // Detect prefers-reduced-motion updates
  useEffect(() => {
    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
      const listener = (e: MediaQueryListEvent) =>
        setPrefersReducedMotion(e.matches);
      mediaQuery.addEventListener?.("change", listener);
      return () => mediaQuery.removeEventListener?.("change", listener);
    }
  }, []);

  const show3D = isWebGLSupported && !force2DMode;

  return (
    <div className="stage-panel simulation-3d-panel">
      <div className="stage-panel-header">
        <div className="header-flex">
          <div>
            <span className="eyebrow">STAGE 06 / 3D CINEMATIC EXECUTION</span>
            <h2>Resource Universe 3D</h2>
            <p className="panel-description">
              Interactive 3D simulation of process execution, resource acquisition,
              and instance reclamation based on Dijkstra's safety algorithm.
            </p>
          </div>
          <div className="header-action-group">
            <button
              type="button"
              className="secondary-button"
              onClick={() => setForce2DMode(!force2DMode)}
              title={force2DMode ? "Switch to 3D WebGL" : "Switch to 2D Fallback"}
            >
              <Eye size={14} /> {force2DMode ? "Enable 3D View" : "2D Table View"}
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={onBackToAnalysis}
            >
              <ArrowLeft size={14} /> Safety Analysis
            </button>
            <button
              type="button"
              className="secondary-button danger-tint"
              onClick={onExitSession}
              title="End simulation session"
            >
              <LogOut size={14} /> Exit Session
            </button>
          </div>
        </div>
      </div>

      <div className="voice-prompt-banner">
        <Mic size={18} className="pulse-cyan" />
        <div>
          <strong>Voice Controls:</strong> Say &ldquo;Play&rdquo;, &ldquo;Pause&rdquo;, &ldquo;Next&rdquo;, &ldquo;Reset&rdquo;, or say &ldquo;Exit&rdquo; to finish your laboratory session.
        </div>
      </div>

      {/* 3D Scene Container */}
      <div className="scene-view-container">
        {show3D ? (
          <DynamicResourceScene
            model={model}
            safetyResult={safetyResult}
            stepIndex={stepIndex}
            resourceColors={resourceColors}
            prefersReducedMotion={prefersReducedMotion}
          />
        ) : (
          <WebGLFallback
            model={model}
            safetyResult={safetyResult}
            stepIndex={stepIndex}
            resourceColors={resourceColors}
          />
        )}

        {/* 3D Scene Controls Overlay Notice */}
        {show3D && (
          <div className="scene-hint-badge">
            <Info size={13} />
            <span>Drag to rotate · Scroll to zoom · Right-click to pan</span>
          </div>
        )}
      </div>

      {/* Resource & Process Color Legend */}
      <div className="scene-legend-bar">
        <div className="legend-section">
          <span className="legend-heading">RESOURCES:</span>
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
          <span className="legend-heading">NODE STATUS:</span>
          <div className="legend-items">
            <span className="legend-pill">
              <i style={{ backgroundColor: "#facc15" }} />
              Active (Evaluating)
            </span>
            <span className="legend-pill">
              <i style={{ backgroundColor: "#34d399" }} />
              Completed (Returned)
            </span>
            <span className="legend-pill">
              <i style={{ backgroundColor: "#ff718c" }} />
              Blocked (Unsafe)
            </span>
            <span className="legend-pill">
              <i style={{ backgroundColor: "#a78bfa" }} />
              Pending
            </span>
          </div>
        </div>
      </div>

      {/* Execution Controller */}
      <ExecutionController
        model={model}
        safetyResult={safetyResult}
        stepIndex={stepIndex}
        onStepChange={setStepIndex}
        resourceColors={resourceColors}
      />

      <div className="stage-actions-row">
        <button
          type="button"
          className="secondary-button"
          onClick={onBackToAnalysis}
        >
          <ArrowLeft size={16} /> Back to Safety Analysis
        </button>

        <div className="stage-actions-right">
          <button
            type="button"
            className="secondary-button"
            onClick={onBackToMatrices}
          >
            <Sliders size={16} /> Edit System Matrices
          </button>
          <button
            type="button"
            className="primary-button danger-tint"
            onClick={onExitSession}
          >
            <LogOut size={16} /> Say &ldquo;Exit&rdquo; / End Session
          </button>
        </div>
      </div>
    </div>
  );
}
