import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import type { SimulationModel } from "../types/simulation";
import { calculateNeed } from "../algorithm/banker";
import { CLASSIC_5X3_PRESET, UNSAFE_PRESET } from "../data/presets";

interface MatrixEditorStageProps {
  model: SimulationModel;
  onUpdateModel: (updater: (prev: SimulationModel) => SimulationModel) => void;
  onAnalyze: () => void;
  onBack: () => void;
  onReset: () => void;
  resourceColors: string[];
}

export default function MatrixEditorStage({
  model,
  onUpdateModel,
  onAnalyze,
  onBack,
  onReset,
  resourceColors,
}: MatrixEditorStageProps) {
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Compute live Need safely, catching invalid states
  const { need, error: needError } = useMemo(() => {
    try {
      const computed = calculateNeed(model.allocation, model.max);
      return { need: computed, error: null };
    } catch (err: unknown) {
      // Fallback zero matrix for display if an element violates Allocation <= Max
      const fallback = model.allocation.map((row, i) =>
        row.map((allocVal, j) => {
          const maxVal = model.max[i]?.[j] ?? 0;
          return maxVal >= allocVal ? maxVal - allocVal : "—";
        }),
      );
      const msg = err instanceof Error ? err.message : "Invalid matrix state";
      return { need: fallback, error: msg };
    }
  }, [model.allocation, model.max]);

  // Validation checks for the current matrix
  const validationErrors = useMemo(() => {
    const errors: string[] = [];
    if (needError) {
      errors.push(needError);
    }

    // Check available vector values
    for (let j = 0; j < model.available.length; j++) {
      const val = model.available[j];
      if (!Number.isSafeInteger(val) || val < 0) {
        errors.push(
          `Available instance for ${model.resourceNames[j] ?? `R${j}`} must be a non-negative integer.`,
        );
      }
    }

    return errors;
  }, [needError, model.available, model.resourceNames]);

  const isValid = validationErrors.length === 0;

  const handleAllocationChange = (row: number, col: number, rawVal: string) => {
    const val = rawVal === "" ? 0 : Math.max(0, parseInt(rawVal, 10) || 0);
    onUpdateModel((prev) => {
      const nextAlloc = prev.allocation.map((r) => [...r]);
      nextAlloc[row][col] = val;
      return { ...prev, allocation: nextAlloc };
    });
  };

  const handleMaxChange = (row: number, col: number, rawVal: string) => {
    const val = rawVal === "" ? 0 : Math.max(0, parseInt(rawVal, 10) || 0);
    onUpdateModel((prev) => {
      const nextMax = prev.max.map((r) => [...r]);
      nextMax[row][col] = val;
      return { ...prev, max: nextMax };
    });
  };

  const handleAvailableChange = (col: number, rawVal: string) => {
    const val = rawVal === "" ? 0 : Math.max(0, parseInt(rawVal, 10) || 0);
    onUpdateModel((prev) => {
      const nextAvail = [...prev.available];
      nextAvail[col] = val;
      return { ...prev, available: nextAvail };
    });
  };

  const loadPreset = (preset: SimulationModel) => {
    onUpdateModel(() => structuredClone(preset));
  };

  return (
    <div className="stage-panel matrix-stage-panel">
      <div className="stage-panel-header">
        <div className="header-flex">
          <div>
            <span className="eyebrow">STAGE 05 / RESOURCE ALLOCATION MATRICES</span>
            <h2>State Matrix Editor</h2>
            <p className="panel-description">
              Enter current allocations, declared maximum claims, and unallocated available instances.
              The Need matrix updates dynamically via $Need[i][j] = Max[i][j] - Allocation[i][j]$.
            </p>
          </div>
          <div className="header-action-group">
            <button
              type="button"
              className="secondary-button"
              onClick={() => loadPreset(CLASSIC_5X3_PRESET)}
              title="Load standard 5x3 textbook dataset"
            >
              <Sparkles size={14} /> Load 5×3 Preset
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => loadPreset(UNSAFE_PRESET)}
              title="Load 4x2 unsafe dataset"
            >
              <AlertTriangle size={14} /> Load Unsafe Preset
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => setShowResetConfirm(true)}
              title="Reset matrix data"
            >
              <RotateCcw size={14} /> Reset
            </button>
          </div>
        </div>
      </div>

      {showResetConfirm && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-title">
              <AlertTriangle size={20} className="modal-warning-icon" />
              Reset Matrix Values?
            </div>
            <p className="modal-desc">
              This will reset all current allocations, maximums, and available resource inputs. Are you sure?
            </p>
            <div className="modal-buttons">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowResetConfirm(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button danger-btn"
                onClick={() => {
                  setShowResetConfirm(false);
                  onReset();
                }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="matrices-wrapper">
        {/* ALLOCATION MATRIX */}
        <div className="matrix-block-card">
          <div className="matrix-card-header">
            <div>
              <h3>ALLOCATION MATRIX</h3>
              <span className="matrix-sub">Currently held instances</span>
            </div>
            <span className="matrix-badge">EDITABLE</span>
          </div>

          <div className="table-responsive">
            <table className="matrix-grid-table">
              <thead>
                <tr>
                  <th className="proc-col-header">PROCESS</th>
                  {model.resourceNames.map((resName, j) => (
                    <th
                      key={j}
                      style={{ color: resourceColors[j % resourceColors.length] }}
                      title={resName}
                    >
                      {resName}
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
                    {row.map((val, j) => {
                      const isRowViolating =
                        model.max[i]?.[j] !== undefined && val > model.max[i][j];
                      return (
                        <td key={j} className={isRowViolating ? "cell-error" : ""}>
                          <input
                            type="number"
                            min={0}
                            step={1}
                            value={val}
                            aria-label={`Allocation for ${model.processNames[i]}, ${model.resourceNames[j]}`}
                            onChange={(e) =>
                              handleAllocationChange(i, j, e.target.value)
                            }
                            className="cell-number-input"
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* MAXIMUM CLAIM MATRIX */}
        <div className="matrix-block-card">
          <div className="matrix-card-header">
            <div>
              <h3>MAXIMUM CLAIM MATRIX</h3>
              <span className="matrix-sub">Maximum potential instances</span>
            </div>
            <span className="matrix-badge">EDITABLE</span>
          </div>

          <div className="table-responsive">
            <table className="matrix-grid-table">
              <thead>
                <tr>
                  <th className="proc-col-header">PROCESS</th>
                  {model.resourceNames.map((resName, j) => (
                    <th
                      key={j}
                      style={{ color: resourceColors[j % resourceColors.length] }}
                      title={resName}
                    >
                      {resName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {model.max.map((row, i) => (
                  <tr key={i}>
                    <td className="proc-name-cell">
                      <strong>{model.processNames[i]}</strong>
                    </td>
                    {row.map((val, j) => (
                      <td key={j}>
                        <input
                          type="number"
                          min={0}
                          step={1}
                          value={val}
                          aria-label={`Max for ${model.processNames[i]}, ${model.resourceNames[j]}`}
                          onChange={(e) =>
                            handleMaxChange(i, j, e.target.value)
                          }
                          className="cell-number-input"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* NEED MATRIX (DERIVED) */}
        <div className="matrix-block-card derived-card">
          <div className="matrix-card-header">
            <div>
              <h3>NEED MATRIX</h3>
              <span className="matrix-sub">Max − Allocation (Derived)</span>
            </div>
            <span className="matrix-badge derived-badge">CALCULATED</span>
          </div>

          <div className="table-responsive">
            <table className="matrix-grid-table">
              <thead>
                <tr>
                  <th className="proc-col-header">PROCESS</th>
                  {model.resourceNames.map((resName, j) => (
                    <th
                      key={j}
                      style={{ color: resourceColors[j % resourceColors.length] }}
                      title={resName}
                    >
                      {resName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {need.map((row, i) => (
                  <tr key={i}>
                    <td className="proc-name-cell">
                      <strong>{model.processNames[i]}</strong>
                    </td>
                    {row.map((val, j) => (
                      <td key={j} className="cell-derived">
                        <span className="derived-val">{val}</span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AVAILABLE VECTOR */}
      <div className="available-vector-section">
        <div className="available-header">
          <div>
            <h3>AVAILABLE VECTOR</h3>
            <span className="panel-sub">Unallocated resource instances ready for assignment</span>
          </div>
          <span className="matrix-badge">EDITABLE</span>
        </div>

        <div className="available-inputs-row">
          {model.available.map((val, j) => {
            const color = resourceColors[j % resourceColors.length];
            return (
              <div
                key={j}
                className="available-input-card"
                style={{ borderTopColor: color }}
              >
                <span className="available-res-label" style={{ color }}>
                  {model.resourceNames[j]}
                </span>
                <input
                  type="number"
                  min={0}
                  step={1}
                  value={val}
                  aria-label={`Available instances for ${model.resourceNames[j]}`}
                  onChange={(e) => handleAvailableChange(j, e.target.value)}
                  className="available-number-input"
                />
              </div>
            );
          })}
        </div>
      </div>

      {validationErrors.length > 0 && (
        <div className="form-error-banner" role="alert">
          <AlertTriangle size={18} />
          <div>
            <strong>Matrix Validation Issue:</strong>
            <ul className="error-list">
              {validationErrors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <div className="stage-actions-row">
        <button
          type="button"
          className="secondary-button"
          onClick={onBack}
        >
          <ArrowLeft size={16} /> Back to Naming
        </button>

        <button
          type="button"
          className="primary-button"
          onClick={onAnalyze}
          disabled={!isValid}
        >
          <ShieldCheck size={18} />
          <span>Analyze System Safety</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
