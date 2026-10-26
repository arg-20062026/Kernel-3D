import { useState, useMemo } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Box,
  Terminal,
  Activity,
} from "lucide-react";
import type { SimulationModel } from "../types/simulation";
import {
  calculateNeed,
  runSafetyAlgorithm,
} from "../algorithm/banker";
import ResourceRequestLab from "./ResourceRequestLab";

interface SafetyAnalysisStageProps {
  model: SimulationModel;
  onLaunch3D: () => void;
  onBackToMatrices: () => void;
  onApplyRequest: (newModel: SimulationModel) => void;
  resourceColors: string[];
}

export default function SafetyAnalysisStage({
  model,
  onLaunch3D,
  onBackToMatrices,
  onApplyRequest,
  resourceColors,
}: SafetyAnalysisStageProps) {
  const [selectedTraceStep, setSelectedTraceStep] = useState<number>(0);

  // Compute Banker's Algorithm
  const { need, safetyResult, error } = useMemo(() => {
    try {
      const computedNeed = calculateNeed(model.allocation, model.max);
      const res = runSafetyAlgorithm({
        allocation: model.allocation,
        max: model.max,
        available: model.available,
      });
      return { need: computedNeed, safetyResult: res, error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to run safety analysis.";
      return {
        need: [],
        safetyResult: null,
        error: msg,
      };
    }
  }, [model.allocation, model.max, model.available]);

  if (error || !safetyResult) {
    return (
      <div className="stage-panel error-stage-panel">
        <div className="form-error-banner" role="alert">
          <ShieldAlert size={24} />
          <div>
            <h3>Safety Analysis Calculation Error</h3>
            <p>{error}</p>
          </div>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={onBackToMatrices}
        >
          <ArrowLeft size={16} /> Return to Matrix Editor
        </button>
      </div>
    );
  }

  const isSafe = safetyResult.isSafe;
  const safeSequenceNames = safetyResult.safeSequence.map(
    (idx) => model.processNames[idx] ?? `P${idx}`,
  );
  const unfinishedNames = safetyResult.unfinishedProcesses.map(
    (idx) => model.processNames[idx] ?? `P${idx}`,
  );

  return (
    <div className="stage-panel safety-stage-panel">
      <div className="stage-panel-header">
        <div className="header-flex">
          <div>
            <span className="eyebrow">STAGE 06 / VERIFICATION ENGINE</span>
            <h2>Safety Analysis</h2>
            <p className="panel-description">
              Formal verification using Dijkstra's Banker's Algorithm. We determine
              whether a complete sequence of processes exists where each process's
              maximum remaining claim can be satisfied by current Work.
            </p>
          </div>
          <button
            type="button"
            className="primary-button launch-3d-top-btn"
            onClick={onLaunch3D}
          >
            <Box size={16} /> Launch 3D Universe <ArrowRight size={16} />
          </button>
        </div>
      </div>

      {/* VERDICT HERO BANNER */}
      <div className="voice-prompt-banner">
        <Activity size={20} className="pulse-cyan" />
        <div>
          <strong>Voice Active:</strong> Say &ldquo;Next&rdquo; to launch 3D execution trace animation, or say &ldquo;Back&rdquo; to modify matrices.
        </div>
      </div>

      <div className={`verdict-banner ${isSafe ? "safe" : "unsafe"}`}>
        <div className="verdict-banner-icon">
          {isSafe ? <ShieldCheck size={36} /> : <ShieldAlert size={36} />}
        </div>
        <div className="verdict-banner-content">
          <div className="verdict-tag">
            {isSafe ? "STATUS: SAFE STATE" : "STATUS: UNSAFE STATE"}
          </div>
          <h3>
            {isSafe
              ? "System is in a Provably Safe State"
              : "System is in an Unsafe State"}
          </h3>
          <p className="verdict-explanation">
            {isSafe ? (
              <>
                A valid execution schedule exists where every process can
                guarantee completion without deadlock. Below is one valid safe
                ordering found by the engine. (Note: multiple safe sequences
                may be possible; any valid sequence avoids deadlock).
              </>
            ) : (
              <>
                No complete safe execution sequence exists. The system cannot
                guarantee that deadlock will be avoided if processes request
                their maximum claims.{" "}
                <strong>
                  Important note: An unsafe state is not currently deadlocked
                </strong>
                , but deadlock is possible if processes make concurrent maximum
                requests.
              </>
            )}
          </p>

          {isSafe && (
            <div className="safe-sequence-display">
              <span className="seq-title">VERIFIED SAFE SEQUENCE:</span>
              <div className="seq-flow">
                {safeSequenceNames.map((name, i) => (
                  <div key={i} className="seq-node-wrapper">
                    <div className="seq-badge">
                      <span className="seq-idx">{i + 1}</span>
                      <strong>{name}</strong>
                    </div>
                    {i < safeSequenceNames.length - 1 && (
                      <ArrowRight size={16} className="seq-arrow" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isSafe && (
            <div className="unsafe-summary-box">
              <span className="unsafe-title">UNFINISHED PROCESSES BLOCKED:</span>
              <div className="blocked-list">
                {unfinishedNames.map((name, i) => {
                  const pIdx = safetyResult.unfinishedProcesses[i];
                  const pNeed = need[pIdx] ?? [];
                  return (
                    <div key={name} className="blocked-item">
                      <strong>{name}</strong>
                      <span>
                        Need: [{pNeed.join(", ")}] &gt; Available Work: [
                        {safetyResult.finalWork.join(", ")}]
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* EXECUTION TRACE DETAILS */}
      <div className="trace-section-card">
        <div className="trace-section-header">
          <div>
            <span className="eyebrow">STEP-BY-STEP MATHEMATICAL PROOF</span>
            <h3>Safety Algorithm Execution Trace</h3>
            <p className="panel-sub">
              Inspect how the Work vector evolves as each schedulable process runs
              to completion and returns its allocated resources.
            </p>
          </div>
          <Terminal size={22} className="heading-icon" />
        </div>

        {safetyResult.steps.length > 0 ? (
          <div className="trace-steps-container">
            <div className="trace-step-tabs">
              {safetyResult.steps.map((step, idx) => {
                const pName = model.processNames[step.process] ?? `P${step.process}`;
                return (
                  <button
                    key={idx}
                    type="button"
                    className={`trace-tab-btn ${
                      selectedTraceStep === idx ? "active" : ""
                    }`}
                    onClick={() => setSelectedTraceStep(idx)}
                  >
                    <span>Step {idx + 1}</span>
                    <strong>{pName}</strong>
                  </button>
                );
              })}
            </div>

            {safetyResult.steps[selectedTraceStep] && (
              <div className="trace-step-card">
                <div className="trace-step-card-header">
                  <div>
                    <span className="step-count-badge">
                      Step {selectedTraceStep + 1} of {safetyResult.steps.length}
                    </span>
                    <h4>
                      Process{" "}
                      {model.processNames[
                        safetyResult.steps[selectedTraceStep].process
                      ]}
                    </h4>
                  </div>
                  <div className="trace-status-pill">
                    <CheckCircle2 size={15} /> CAN COMPLETE
                  </div>
                </div>

                <div className="trace-math-grid">
                  <div className="math-box">
                    <span className="math-label">Work Vector Before</span>
                    <strong className="math-vector">
                      [{safetyResult.steps[selectedTraceStep].workBefore.join(", ")}]
                    </strong>
                    <span className="math-sub">Available free resources</span>
                  </div>

                  <div className="math-operator">
                    <span>Satisfies</span>
                    <ArrowRight size={20} />
                  </div>

                  <div className="math-box">
                    <span className="math-label">Process Remaining Need</span>
                    <strong className="math-vector highlight-cyan">
                      [{safetyResult.steps[selectedTraceStep].need.join(", ")}]
                    </strong>
                    <span className="math-sub">
                      Condition: $Need \le Work$ holds true
                    </span>
                  </div>

                  <div className="math-operator">
                    <span>Yields</span>
                    <ArrowRight size={20} />
                  </div>

                  <div className="math-box">
                    <span className="math-label">Work Vector After</span>
                    <strong className="math-vector highlight-green">
                      [{safetyResult.steps[selectedTraceStep].workAfter.join(", ")}]
                    </strong>
                    <span className="math-sub">
                      $Work = Work + Allocation$
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-trace-notice">
            <Activity size={20} />
            <span>
              No processes could satisfy their Need with initial Available
              resources. Execution halted immediately at step 0.
            </span>
          </div>
        )}
      </div>

      {/* CONSOLIDATED SYSTEM STATE TABLES */}
      <div className="consolidated-tables-card">
        <div className="tables-header">
          <div>
            <span className="eyebrow">SYSTEM SNAPSHOT</span>
            <h3>Consolidated Resource State</h3>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={onBackToMatrices}
          >
            Edit Matrices
          </button>
        </div>

        <div className="table-responsive">
          <table className="consolidated-table">
            <thead>
              <tr>
                <th rowSpan={2} className="th-sticky">
                  PROCESS
                </th>
                <th colSpan={model.resourceCount} className="th-group-alloc">
                  ALLOCATION
                </th>
                <th colSpan={model.resourceCount} className="th-group-max">
                  MAX CLAIM
                </th>
                <th colSpan={model.resourceCount} className="th-group-need">
                  NEED ($Max - Alloc$)
                </th>
              </tr>
              <tr>
                {model.resourceNames.map((r, j) => (
                  <th
                    key={`alloc-${j}`}
                    style={{ color: resourceColors[j % resourceColors.length] }}
                  >
                    {r}
                  </th>
                ))}
                {model.resourceNames.map((r, j) => (
                  <th
                    key={`max-${j}`}
                    style={{ color: resourceColors[j % resourceColors.length] }}
                  >
                    {r}
                  </th>
                ))}
                {model.resourceNames.map((r, j) => (
                  <th
                    key={`need-${j}`}
                    style={{ color: resourceColors[j % resourceColors.length] }}
                  >
                    {r}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {model.allocation.map((row, i) => (
                <tr key={i}>
                  <td className="proc-name-cell">
                    <strong>{model.processNames[i]}</strong>
                  </td>
                  {row.map((val, j) => (
                    <td key={`alloc-${i}-${j}`}>{val}</td>
                  ))}
                  {model.max[i]?.map((val, j) => (
                    <td key={`max-${i}-${j}`}>{val}</td>
                  ))}
                  {need[i]?.map((val, j) => (
                    <td key={`need-${i}-${j}`} className="need-cell">
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="available-bar-display">
          <span className="avail-title">CURRENT AVAILABLE VECTOR:</span>
          <div className="avail-badges">
            {model.available.map((val, j) => (
              <span
                key={j}
                className="avail-badge"
                style={{
                  borderColor: resourceColors[j % resourceColors.length],
                }}
              >
                <strong
                  style={{ color: resourceColors[j % resourceColors.length] }}
                >
                  {model.resourceNames[j]}:
                </strong>{" "}
                {val} instances
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* WHAT-IF RESOURCE REQUEST LAB */}
      <ResourceRequestLab
        model={model}
        onApplyRequest={onApplyRequest}
        resourceColors={resourceColors}
      />

      <div className="stage-actions-row">
        <button
          type="button"
          className="secondary-button"
          onClick={onBackToMatrices}
        >
          <ArrowLeft size={16} /> Back to Matrices
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={onLaunch3D}
        >
          <Box size={18} />
          <span>Launch 3D Process Execution</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
