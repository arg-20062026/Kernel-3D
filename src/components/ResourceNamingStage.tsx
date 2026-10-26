import { useState } from "react";
import { ArrowLeft, ArrowRight, AlertCircle, RefreshCw } from "lucide-react";
import { createDefaultResourceNames } from "../data/presets";

interface ResourceNamingStageProps {
  resourceCount: number;
  initialNames: string[];
  onConfirm: (names: string[]) => void;
  onBack: () => void;
}

const RESOURCE_COLOR_PALETTE = [
  "#67e8f9", // cyan
  "#a78bfa", // purple
  "#34d399", // emerald
  "#f472b6", // pink
  "#fbbf24", // amber
  "#60a5fa", // sky blue
];

export default function ResourceNamingStage({
  resourceCount,
  initialNames,
  onConfirm,
  onBack,
}: ResourceNamingStageProps) {
  const [names, setNames] = useState<string[]>(() => {
    const list = [...initialNames];
    const defaults = createDefaultResourceNames(resourceCount);
    while (list.length < resourceCount) {
      list.push(defaults[list.length] ?? `Resource R${list.length + 1}`);
    }
    return list.slice(0, resourceCount);
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleNameChange = (index: number, val: string) => {
    const next = [...names];
    next[index] = val;
    setNames(next);
    setErrorMessage(null);
  };

  const handleResetDefaults = () => {
    setNames(createDefaultResourceNames(resourceCount));
    setErrorMessage(null);
  };

  const handleContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const trimmed = names.map((n) => n.trim());

    // Validate empty
    for (let i = 0; i < trimmed.length; i++) {
      if (!trimmed[i]) {
        setErrorMessage(`Resource class #${i + 1} cannot have an empty name.`);
        return;
      }
    }

    // Validate duplicates ignoring case
    const lowerMap = new Set<string>();
    for (let i = 0; i < trimmed.length; i++) {
      const lower = trimmed[i].toLowerCase();
      if (lowerMap.has(lower)) {
        setErrorMessage(
          `Duplicate resource name "${trimmed[i]}" detected. Every resource type must have a unique identifier.`,
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
            <span className="eyebrow">STAGE 04 / RESOURCE CATALOG</span>
            <h2>Name Your Resource Types</h2>
            <p className="panel-description">
              Assign distinct names to each of the {resourceCount} resource types.
              These names will define your matrix columns and 3D visual indicators.
            </p>
          </div>
          <button
            type="button"
            className="secondary-button"
            onClick={handleResetDefaults}
            title="Reset to default resource names"
          >
            <RefreshCw size={14} /> Reset Defaults
          </button>
        </div>
      </div>

      <form onSubmit={handleContinue} className="naming-form">
        <div className="naming-grid">
          {names.map((name, index) => {
            const color =
              RESOURCE_COLOR_PALETTE[index % RESOURCE_COLOR_PALETTE.length];
            return (
              <div
                key={index}
                className="naming-card"
                style={{ borderLeftColor: color }}
              >
                <div className="resource-color-header">
                  <span
                    className="color-dot"
                    style={{ backgroundColor: color }}
                  />
                  <label
                    htmlFor={`res-name-${index}`}
                    className="naming-label"
                  >
                    RESOURCE #{index + 1}
                  </label>
                </div>
                <input
                  id={`res-name-${index}`}
                  type="text"
                  value={name}
                  maxLength={25}
                  placeholder={`Resource ${String.fromCharCode(65 + index)}`}
                  onChange={(e) => handleNameChange(index, e.target.value)}
                  className="naming-input"
                  required
                />
              </div>
            );
          })}
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
            Continue to Matrix Editor <ArrowRight size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}
