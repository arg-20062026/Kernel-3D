import { useState } from "react";
import { ArrowLeft, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { createDefaultProcessNames } from "../data/presets";

interface ProcessNamingStageProps {
  processCount: number;
  initialNames: string[];
  onConfirm: (names: string[]) => void;
  onBack: () => void;
}

export default function ProcessNamingStage({
  processCount,
  initialNames,
  onConfirm,
  onBack,
}: ProcessNamingStageProps) {
  // Ensure array has exact length of processCount
  const [names, setNames] = useState<string[]>(() => {
    const list = [...initialNames];
    while (list.length < processCount) {
      list.push(`P${list.length}`);
    }
    return list.slice(0, processCount);
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNameChange = (index: number, val: string) => {
    const next = [...names];
    next[index] = val;
    setNames(next);
    setErrorMessage(null);
  };

  const handleResetDefaults = () => {
    setNames(createDefaultProcessNames(processCount));
    setErrorMessage(null);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = names.map((n) => n.trim());

    // Validate empty
    for (let i = 0; i < trimmed.length; i++) {
      if (!trimmed[i]) {
        setErrorMessage(`Process #${i + 1} cannot have an empty name.`);
        return;
      }
    }

    // Validate duplicates ignoring case
    const lowerMap = new Set<string>();
    for (let i = 0; i < trimmed.length; i++) {
      const lower = trimmed[i].toLowerCase();
      if (lowerMap.has(lower)) {
        setErrorMessage(
          `Duplicate process name "${trimmed[i]}" detected. Every process must have a unique identifier.`,
        );
        return;
      }
      lowerMap.add(lower);
    }

    onConfirm(trimmed);
  };

  return (
    <div className="stage-panel">
      <div className="stage-panel-header">
        <div className="header-flex">
          <div>
            <span className="eyebrow">STAGE 03 / PROCESS DIRECTORY</span>
            <h2>Name Your Processes</h2>
            <p className="panel-description">
              Assign distinct names to each of the {processCount} processes.
              You can keep default labels (P0, P1, ...) or enter custom domain
              names (e.g. WebWorker, RenderService, DatabaseEngine).
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={handleResetDefaults}
            title="Reset to P0, P1, P2..."
          >
            <RefreshCw size={14} /> Reset Defaults
          </button>
        </div>
      </div>

      <form onSubmit={handleContinue} className="naming-form">
        <div className="naming-grid">
          {names.map((name, index) => (
            <div key={index} className="naming-card">
              <label htmlFor={`proc-name-${index}`} className="naming-label">
                PROCESS #{index + 1}
              </label>
              <input
                id={`proc-name-${index}`}
                type="text"
                value={name}
                maxLength={20}
                placeholder={`P${index}`}
                onChange={(e) => handleNameChange(index, e.target.value)}
                className="naming-input"
                required
              />
            </div>
          ))}
        </div>

        {errorMessage && (
          <div className="form-error-banner" role="alert">
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="stage-actions-row">
          <button
            type="button"
            className="secondary-button"
            onClick={onBack}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <button
            type="submit"
            className="primary-button"
          >
            Continue to Resource Naming <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
