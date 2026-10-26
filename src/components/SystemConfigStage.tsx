import { ArrowLeft, ArrowRight, AlertCircle, Cpu, Layers, Mic } from "lucide-react";

interface SystemConfigStageProps {
  processCount: number;
  resourceCount: number;
  isAskingProcess: boolean;
  onProcessCountChange: (count: number) => void;
  onResourceCountChange: (count: number) => void;
  onConfirm: () => void;
  onBack: () => void;
  errorMessage?: string | null;
}

const MIN_PROCESSES = 1;
const MAX_PROCESSES = 10;
const MIN_RESOURCES = 1;
const MAX_RESOURCES = 6;

export default function SystemConfigStage({
  processCount,
  resourceCount,
  isAskingProcess,
  onProcessCountChange,
  onResourceCountChange,
  onConfirm,
  onBack,
  errorMessage,
}: SystemConfigStageProps) {
  return (
    <div className="stage-panel">
      <div className="stage-panel-header">
        <span className="eyebrow">STAGE 02 / SYSTEM ARCHITECTURE</span>
        <h2>Define Dimensions</h2>
        <p className="panel-description">
          Tell Lisa how many concurrent processes and distinct resource classes your operating system will simulate.
        </p>
      </div>

      <div className="voice-prompt-banner">
        <Mic size={20} className="pulse-cyan" />
        <div>
          <strong>
            {isAskingProcess
              ? "Lisa is listening: Tell me how many processes you want (e.g. 'Five')."
              : "Lisa is listening: Tell me the number of resource types (e.g. 'Three')."}
          </strong>
          <span>Say a number like &ldquo;Five&rdquo;, or say &ldquo;Next&rdquo; when ready.</span>
        </div>
      </div>

      <div className="config-grid">
        <div className={`config-card ${isAskingProcess ? "active-listening-card" : ""}`}>
          <div className="config-card-icon">
            <Cpu size={24} />
          </div>
          <label htmlFor="process-count-input" className="config-label">
            PROCESS COUNT (N)
          </label>
          <span className="config-hint">
            Say &ldquo;Five&rdquo; or choose between {MIN_PROCESSES} and {MAX_PROCESSES}
          </span>
          <input
            id="process-count-input"
            type="number"
            min={MIN_PROCESSES}
            max={MAX_PROCESSES}
            step={1}
            value={processCount}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val)) onProcessCountChange(val);
            }}
            className="dimension-input"
            required
          />
        </div>

        <div className={`config-card ${!isAskingProcess ? "active-listening-card" : ""}`}>
          <div className="config-card-icon">
            <Layers size={24} />
          </div>
          <label htmlFor="resource-count-input" className="config-label">
            RESOURCE TYPES (M)
          </label>
          <span className="config-hint">
            Say &ldquo;Three&rdquo; or choose between {MIN_RESOURCES} and {MAX_RESOURCES}
          </span>
          <input
            id="resource-count-input"
            type="number"
            min={MIN_RESOURCES}
            max={MAX_RESOURCES}
            step={1}
            value={resourceCount}
            onChange={(e) => {
              const val = parseInt(e.target.value, 10);
              if (!Number.isNaN(val)) onResourceCountChange(val);
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
        <button type="button" className="secondary-button" onClick={onBack}>
          <ArrowLeft size={16} /> Back
        </button>
        <button type="button" className="primary-button" onClick={onConfirm}>
          <span>Continue to 3D View (or say &ldquo;Next&rdquo;)</span>
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
