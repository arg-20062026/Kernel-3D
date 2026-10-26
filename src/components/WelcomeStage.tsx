import { Play, BookOpen, AlertTriangle, ArrowRight } from "lucide-react";
import LisaAssistant from "./LisaAssistant";

interface WelcomeStageProps {
  dialogue: string;
  onStartCustom: () => void;
  onLoadClassic: () => void;
  onLoadUnsafe: () => void;
  onVoiceCommand: (cmd: string) => void;
}

export default function WelcomeStage({
  dialogue,
  onStartCustom,
  onLoadClassic,
  onLoadUnsafe,
  onVoiceCommand,
}: WelcomeStageProps) {
  return (
    <div className="welcome-stage-container">
      <LisaAssistant
        dialogue={dialogue}
        isWelcomeStage={true}
        onVoiceCommand={onVoiceCommand}
        onAdvanceStage={onStartCustom}
        hintActionText="Start"
      />

      <div className="welcome-action-card">
        <div className="welcome-card-heading">
          <span className="eyebrow">DIJKSTRA'S DEADLOCK AVOIDANCE</span>
          <h3>Banker's Algorithm Laboratory</h3>
          <p>
            An interactive, cinematic simulator designed for Operating Systems
            education. Test safe state transitions, simulate tentative resource
            claims, and inspect process scheduling in real-time 3D.
          </p>
        </div>

        <div className="welcome-buttons-grid">
          <button
            type="button"
            className="primary-button hero-start-btn"
            onClick={onStartCustom}
          >
            <Play size={18} />
            <span>Configure Custom Simulation</span>
            <ArrowRight size={16} />
          </button>

          <button
            type="button"
            className="secondary-button preset-btn"
            onClick={onLoadClassic}
          >
            <BookOpen size={16} />
            <span>Load Classic 5×3 Textbook Example</span>
          </button>

          <button
            type="button"
            className="secondary-button preset-btn warning-tint"
            onClick={onLoadUnsafe}
          >
            <AlertTriangle size={16} />
            <span>Inspect Unsafe / Deadlock Scenario</span>
          </button>
        </div>

        <div className="welcome-specs-grid">
          <div className="spec-card">
            <strong>Pure Algorithm</strong>
            <span>Exact matrix vector arithmetic ($Need = Max - Allocation$)</span>
          </div>
          <div className="spec-card">
            <strong>Voice &amp; Visual Guide</strong>
            <span>Guided speech narration &amp; voice commands by Lisa</span>
          </div>
          <div className="spec-card">
            <strong>Cinematic 3D</strong>
            <span>Interactive WebGL process-resource universe</span>
          </div>
        </div>
      </div>
    </div>
  );
}
