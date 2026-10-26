import { Activity } from "lucide-react";
import type { SimulationModel } from "../types/simulation";
import type { SafetyResult } from "../algorithm/banker";

interface WebGLFallbackProps {
  model: SimulationModel;
  safetyResult: SafetyResult;
  stepIndex: number;
  resourceColors: string[];
}

export default function WebGLFallback({
  model,
  safetyResult,
  stepIndex,
  resourceColors,
}: WebGLFallbackProps) {
  const currentStep =
    stepIndex > 0 ? safetyResult.steps[stepIndex - 1] ?? null : null;
  const completedProcesses = safetyResult.steps
    .slice(0, stepIndex)
    .map((s) => s.process);
  const activeProcess = currentStep?.process ?? null;

  return (
    <div className="webgl-fallback-container">
      <div className="fallback-header">
        <Activity size={18} />
        <span>2D Simulation Display (WebGL Alternative Mode)</span>
      </div>

      <div className="fallback-grid">
        {/* Process nodes */}
        <div className="fallback-column">
          <h4>PROCESS NODES</h4>
          <div className="fallback-nodes-list">
            {model.processNames.map((name, i) => {
              const isActive = activeProcess === i;
              const isCompleted = completedProcesses.includes(i);
              const isBlocked =
                !safetyResult.isSafe &&
                safetyResult.unfinishedProcesses.includes(i);

              const statusClass = isActive
                ? "active"
                : isCompleted
                  ? "completed"
                  : isBlocked
                    ? "blocked"
                    : "idle";

              return (
                <div key={i} className={`fallback-node-card ${statusClass}`}>
                  <div className="node-title-row">
                    <strong>{name}</strong>
                    <span className="node-status-text">
                      {isActive
                        ? "EVALUATING"
                        : isCompleted
                          ? "COMPLETED"
                          : isBlocked
                            ? "BLOCKED"
                            : "PENDING"}
                    </span>
                  </div>
                  <div className="node-alloc-row">
                    Allocated: [{model.allocation[i]?.join(", ")}]
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Resource pool */}
        <div className="fallback-column">
          <h4>RESOURCE POOL</h4>
          <div className="fallback-resources-list">
            {model.resourceNames.map((name, j) => {
              const color = resourceColors[j % resourceColors.length];
              const currentFree = currentStep
                ? currentStep.workAfter[j]
                : model.available[j];

              return (
                <div
                  key={j}
                  className="fallback-res-card"
                  style={{ borderLeftColor: color }}
                >
                  <strong style={{ color }}>{name}</strong>
                  <div className="res-stat-line">
                    Available in Pool: <strong>{currentFree}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
