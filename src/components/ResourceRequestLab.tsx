import { useState } from "react";
import {
  FlaskConical,
  CheckCircle2,
  ShieldAlert,
  Activity,
  ShieldCheck,
} from "lucide-react";
import type { SimulationModel } from "../types/simulation";
import { evaluateResourceRequest } from "../algorithm/resourceRequest";

interface ResourceRequestLabProps {
  model: SimulationModel;
  onApplyRequest: (newModel: SimulationModel) => void;
  resourceColors: string[];
}

export default function ResourceRequestLab({
  model,
  onApplyRequest,
  resourceColors,
}: ResourceRequestLabProps) {
  const [selectedProcess, setSelectedProcess] = useState(0);
  const [requestVector, setRequestVector] = useState<number[]>(() =>
    model.resourceNames.map(() => 0),
  );
  const [resultMessage, setResultMessage] = useState<{
    type: "success" | "error" | "info";
    title: string;
    detail: string;
  } | null>(null);

  // Sync request vector length if resource count changed
  if (requestVector.length !== model.resourceCount) {
    setRequestVector(model.resourceNames.map(() => 0));
  }

  const handleRequestValueChange = (index: number, rawVal: string) => {
    const val = rawVal === "" ? 0 : Math.max(0, parseInt(rawVal, 10) || 0);
    const next = [...requestVector];
    next[index] = val;
    setRequestVector(next);
    setResultMessage(null);
  };

  const handleProcessSelect = (pIndex: number) => {
    setSelectedProcess(pIndex);
    setResultMessage(null);
  };

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    setResultMessage(null);

    const bankerInput = {
      allocation: model.allocation,
      max: model.max,
      available: model.available,
    };

    const evaluation = evaluateResourceRequest(
      bankerInput,
      selectedProcess,
      requestVector,
    );

    const procName = model.processNames[selectedProcess] ?? `P${selectedProcess}`;

    if (!evaluation.granted) {
      if (evaluation.reason === "unsafe") {
        const blockedNames = (evaluation.unfinishedProcesses ?? [])
          .map((idx) => model.processNames[idx] ?? `P${idx}`)
          .join(", ");

        setResultMessage({
          type: "error",
          title: "Request Denied — Unsafe State",
          detail: `Tentatively allocating [${requestVector.join(", ")}] to ${procName} leaves the system unable to guarantee completion for: ${blockedNames}. The system state was safely preserved with no allocations modified.`,
        });
        return;
      }

      if (evaluation.reason === "exceeds-need") {
        setResultMessage({
          type: "error",
          title: "Request Denied — Exceeds Need",
          detail: `Process ${procName} requested more resources than its declared remaining Need. In Banker's Algorithm, a process cannot exceed its declared maximum claim.`,
        });
        return;
      }

      if (evaluation.reason === "unavailable") {
        setResultMessage({
          type: "error",
          title: "Request Denied — Insufficient Available Resources",
          detail: `The requested vector exceeds currently unallocated Available instances. Process ${procName} must wait until other processes release their held resources.`,
        });
        return;
      }

      setResultMessage({
        type: "error",
        title: "Request Denied — Invalid Request",
        detail: evaluation.message,
      });
      return;
    }

    // Granted: update model state
    const newModel: SimulationModel = {
      ...model,
      allocation: evaluation.input.allocation,
      available: evaluation.input.available,
    };

    onApplyRequest(newModel);

    const safeSeqNames = evaluation.safeSequence
      .map((idx) => model.processNames[idx] ?? `P${idx}`)
      .join(" → ");

    setResultMessage({
      type: "success",
      title: "Request Granted — Safe State Verified",
      detail: `Resources allocated to ${procName}. A new safe sequence was successfully verified: ${safeSeqNames}.`,
    });
  };

  const currentNeed = model.allocation[selectedProcess]
    ? model.max[selectedProcess].map(
        (maxVal, j) => maxVal - model.allocation[selectedProcess][j],
      )
    : [];

  return (
    <div className="request-lab-panel">
      <div className="request-lab-header">
        <div>
          <span className="eyebrow">WHAT-IF SIMULATION / DIJKSTRA HYPOTHESIS</span>
          <h3>Resource Request Laboratory</h3>
          <p className="panel-description">
            Simulate an active process requesting additional resource instances.
            The algorithm tests: 1) $Request \le Need$, 2) $Request \le Available$,
            and 3) Tentative safety check. If unsafe, tentative changes are rolled back.
          </p>
        </div>
        <FlaskConical size={24} className="heading-icon cyan-icon" />
      </div>

      <form onSubmit={handleEvaluate} className="request-lab-form">
        <div className="request-proc-selector">
          <label htmlFor="proc-selector" className="form-label">
            REQUESTING PROCESS:
          </label>
          <select
            id="proc-selector"
            className="proc-dropdown"
            value={selectedProcess}
            onChange={(e) => handleProcessSelect(Number(e.target.value))}
          >
            {model.processNames.map((name, i) => (
              <option key={i} value={i}>
                {name} (Allocated: [{model.allocation[i]?.join(", ")}], Need: [
                {currentNeed.join(", ")}])
              </option>
            ))}
          </select>
        </div>

        <div className="request-vector-section">
          <span className="form-label">REQUEST VECTOR:</span>
          <div className="request-vector-grid">
            {model.resourceNames.map((rName, j) => {
              const color = resourceColors[j % resourceColors.length];
              const needVal = currentNeed[j] ?? 0;
              const availVal = model.available[j] ?? 0;

              return (
                <div
                  key={j}
                  className="request-input-card"
                  style={{ borderLeftColor: color }}
                >
                  <div className="request-label-row">
                    <span className="res-badge-name" style={{ color }}>
                      {rName}
                    </span>
                    <span className="res-meta-text">
                      Need: {needVal} · Free: {availVal}
                    </span>
                  </div>
                  <input
                    type="number"
                    min={0}
                    step={1}
                    value={requestVector[j] ?? 0}
                    aria-label={`Request for ${rName}`}
                    onChange={(e) =>
                      handleRequestValueChange(j, e.target.value)
                    }
                    className="request-number-input"
                  />
                </div>
              );
            })}
          </div>
        </div>

        <div className="request-submit-row">
          <button type="submit" className="primary-button request-action-btn">
            <FlaskConical size={16} />
            <span>Evaluate &amp; Simulate Request</span>
          </button>
        </div>

        {resultMessage ? (
          <div
            className={`request-result-banner ${resultMessage.type}`}
            role="status"
          >
            <div className="result-banner-title">
              {resultMessage.type === "success" ? (
                <CheckCircle2 size={20} />
              ) : resultMessage.type === "error" ? (
                <ShieldAlert size={20} />
              ) : (
                <Activity size={20} />
              )}
              <strong>{resultMessage.title}</strong>
            </div>
            <p className="result-banner-detail">{resultMessage.detail}</p>
          </div>
        ) : (
          <div className="request-rule-reminder">
            <ShieldCheck size={18} />
            <span>
              Rule Checks: 1. Request ≤ Need &nbsp;|&nbsp; 2. Request ≤ Available
              &nbsp;|&nbsp; 3. Tentative System State must be Safe.
            </span>
          </div>
        )}
      </form>
    </div>
  );
}
