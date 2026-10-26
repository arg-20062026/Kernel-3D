import { useState } from "react";
import { ArrowLeft, ArrowRight, AlertCircle, Cpu, Layers } from "lucide-react";

interface SystemConfigStageProps {
  initialProcessCount: number;
  initialResourceCount: number;
  onConfirm: (processCount: number, resourceCount: number) => void;
  onBack: () => void;
}

const MIN_PROCESSES = 1;
const MAX_PROCESSES = 10;
const MIN_RESOURCES = 1;
const MAX_RESOURCES = 6;

export default function SystemConfigStage({
  initialProcessCount,
  initialResourceCount,
  onConfirm,
  onBack,
}: SystemConfigStageProps) {
  const [processInput, setProcessInput] = useState(String(initialProcessCount));
  const [resourceInput, setResourceInput] = useState(String(initialResourceCount));
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const pCount = Number(processInput);
    const rCount = Number(resourceInput);

    if (!Number.isInteger(pCount) || pCount < MIN_PROCESSES || pCount > MAX_PROCESSES) {
      setErrorMessage(
        `Number of processes must be an integer between ${MIN_PROCESSES} and ${MAX_PROCESSES} to ensure reliable visualization.`,
      );
      return;
    }

    if (!Number.isInteger(rCount) || rCount < MIN_RESOURCES || rCount > MAX_RESOURCES) {
      setErrorMessage(
        `Number of resource types must be an integer between ${MIN_RESOURCES} and ${MAX_RESOURCES} for clear matrix display.`,
      );
      return;
    }

    onConfirm(pCount, rCount);
  };

  return (
    <div className="stage-panel">
      <div className="stage-panel-header">
        <span className="eyebrow">STAGE 02 / SYSTEM ARCHITECTURE</span>
        <h2>Define Dimensions</h2>
        <p className="panel-description">
          Specify how many concurrent processes and distinct resource classes your operating system instance will manage.
        </p>
      </div>

      <form onSubmit={handleContinue} className="config-form">
        <div className="config-grid">
          <div className="config-card">
            <div className="config-card-icon">
              <Cpu size={24} />
            </div>
            <label htmlFor="process-count-input" className="config-label">
              PROCESS COUNT (N)
            </label>
            <span className="config-hint">
              Between {MIN_PROCESSES} and {MAX_PROCESSES} processes
            </span>
            <input
              id="process-count-input"
              type="number"
              min={MIN_PROCESSES}
              max={MAX_PROCESSES}
              step={1}
              value={processInput}
              onChange={(e) => {
                setProcessInput(e.target.value);
                setErrorMessage(null);
              }}
              className="dimension-input"
              required
            />
          </div>

          <div className="config-card">
            <div className="config-card-icon">
              <Layers size={24} />
            </div>
            <label htmlFor="resource-count-input" className="config-label">
              RESOURCE TYPES (M)
            </label>
            <span className="config-hint">
              Between {MIN_RESOURCES} and {MAX_RESOURCES} resource types
            </span>
            <input
              id="resource-count-input"
              type="number"
              min={MIN_RESOURCES}
              max={MAX_RESOURCES}
              step={1}
              value={resourceInput}
              onChange={(e) => {
                setResourceInput(e.target.value);
                setErrorMessage(null);
              }}
              className="dimension-input"
              required
            />
          </div>
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
            Continue to Process Naming <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
