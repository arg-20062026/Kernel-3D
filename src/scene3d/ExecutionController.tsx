import { useState, useEffect } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  SkipBack,
  CheckCircle2,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Activity,
} from "lucide-react";
import type { SimulationModel } from "../types/simulation";
import type { SafetyResult } from "../algorithm/banker";

interface ExecutionControllerProps {
  model: SimulationModel;
  safetyResult: SafetyResult;
  stepIndex: number;
  onStepChange: (newStep: number) => void;
  resourceColors: string[];
}

export default function ExecutionController({
  model,
  safetyResult,
  stepIndex,
  onStepChange,
  resourceColors,
}: ExecutionControllerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speedMs, setSpeedMs] = useState(2000); // 2000ms = 1x

  const totalSteps = safetyResult.steps.length;

  // Auto-play timer
  useEffect(() => {
    if (!isPlaying || stepIndex >= totalSteps) return;

    const timer = setTimeout(() => {
      const nextStep = stepIndex + 1;
      if (nextStep >= totalSteps) {
        setIsPlaying(false);
      }
      onStepChange(nextStep);
    }, speedMs);

    return () => clearTimeout(timer);
  }, [isPlaying, stepIndex, totalSteps, speedMs, onStepChange]);

  const handlePlayToggle = () => {
    if (stepIndex >= totalSteps) {
      // Loop or restart if at end
      onStepChange(0);
      setIsPlaying(true);
    } else {
      setIsPlaying(!isPlaying);
    }
  };

  const handleStepForward = () => {
    setIsPlaying(false);
    if (stepIndex < totalSteps) {
      onStepChange(stepIndex + 1);
    }
  };

  const handleStepBackward = () => {
    setIsPlaying(false);
    if (stepIndex > 0) {
      onStepChange(stepIndex - 1);
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    onStepChange(0);
  };

  const currentStep =
    stepIndex > 0 ? safetyResult.steps[stepIndex - 1] ?? null : null;
  const currentWork = currentStep
    ? currentStep.workAfter
    : model.available;
  const activeProcName = currentStep
    ? model.processNames[currentStep.process] ?? `P${currentStep.process}`
    : null;

  return (
    <div className="execution-controller-panel">
      {/* Playback Controls Toolbar */}
      <div className="playback-toolbar">
        <div className="playback-buttons-group">
          <button
            type="button"
            className="ctrl-btn"
            onClick={handleReset}
            title="Reset to Step 0"
            aria-label="Reset execution"
          >
            <RotateCcw size={16} />
          </button>

          <button
            type="button"
            className="ctrl-btn"
            onClick={handleStepBackward}
            disabled={stepIndex === 0}
            title="Step Backward"
            aria-label="Step Backward"
          >
            <SkipBack size={16} />
          </button>

          <button
            type="button"
            className={`ctrl-btn play-btn ${isPlaying ? "playing" : ""}`}
            onClick={handlePlayToggle}
            title={isPlaying ? "Pause execution" : "Play safe sequence"}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          </button>

          <button
            type="button"
            className="ctrl-btn"
            onClick={handleStepForward}
            disabled={stepIndex >= totalSteps}
            title="Step Forward"
            aria-label="Step Forward"
          >
            <SkipForward size={16} />
          </button>
        </div>

        {/* Step Indicator */}
        <div className="step-counter-badge">
          <span className="counter-label">STEP</span>
          <strong>{stepIndex}</strong>
          <span className="counter-total">/ {totalSteps}</span>
        </div>

        {/* Playback Speed selector */}
        <div className="speed-selector-group">
          <Clock size={14} className="speed-icon" />
          <button
            type="button"
            className={`speed-chip ${speedMs === 3000 ? "active" : ""}`}
            onClick={() => setSpeedMs(3000)}
          >
            0.5×
          </button>
          <button
            type="button"
            className={`speed-chip ${speedMs === 2000 ? "active" : ""}`}
            onClick={() => setSpeedMs(2000)}
          >
            1.0×
          </button>
          <button
            type="button"
            className={`speed-chip ${speedMs === 1000 ? "active" : ""}`}
            onClick={() => setSpeedMs(1000)}
          >
            2.0×
          </button>
        </div>
      </div>

      {/* Dynamic Work Vector Display */}
      <div className="work-vector-tracker">
        <span className="tracker-title">AVAILABLE WORK IN POOL:</span>
        <div className="work-tokens-row">
          {model.resourceNames.map((rName, j) => {
            const color = resourceColors[j % resourceColors.length];
            const freeCount = currentWork[j] ?? 0;
            return (
              <div
                key={j}
                className="work-token"
                style={{ borderColor: color }}
              >
                <span className="work-token-label" style={{ color }}>
                  {rName}
                </span>
                <span className="work-token-val">{freeCount}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Step Explanation Card */}
      {currentStep ? (
        <div className="step-live-card">
          <div className="step-live-header">
            <div>
              <span className="live-step-tag">EXECUTION EVENT</span>
              <h4>Process {activeProcName} Finished</h4>
            </div>
            <div className="live-status-badge">
              <CheckCircle2 size={15} /> RESOURCES RETURNED
            </div>
          </div>

          <div className="step-live-details">
            <p>
              Process <strong>{activeProcName}</strong> satisfied its remaining
              Need: [
              {currentStep.need.join(", ")}] ≤ Work Before [
              {currentStep.workBefore.join(", ")}].
            </p>
            <p className="work-math-detail">
              Allocated instances returned: +[
              {model.allocation[currentStep.process]?.join(", ")}]. New Work = [
              {currentStep.workAfter.join(", ")}].
            </p>
          </div>
        </div>
      ) : (
        <div className="step-live-card idle">
          <Activity size={18} />
          <span>
            {stepIndex === 0
              ? "Initial system state. Click Play or Step Forward to watch processes acquire and return resources."
              : "Execution sequence complete."}
          </span>
        </div>
      )}

      {/* Completion or Unsafe Notice */}
      {stepIndex >= totalSteps && safetyResult.isSafe && (
        <div className="execution-summary-banner safe">
          <ShieldCheck size={20} />
          <div>
            <strong>Safe Sequence Execution Complete!</strong>
            <p>
              All {model.processCount} processes completed safely in sequence:{" "}
              {safetyResult.safeSequence
                .map((i) => model.processNames[i] ?? `P${i}`)
                .join(" → ")}
              . All resources returned to system pool.
            </p>
          </div>
        </div>
      )}

      {!safetyResult.isSafe && (
        <div className="execution-summary-banner unsafe">
          <ShieldAlert size={20} />
          <div>
            <strong>Unsafe Execution Notice</strong>
            <p>
              {safetyResult.unfinishedProcesses.length} process(es) remain
              blocked:{" "}
              {safetyResult.unfinishedProcesses
                .map((i) => model.processNames[i] ?? `P${i}`)
                .join(", ")}
              . Their remaining Need cannot be met by available Work.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
