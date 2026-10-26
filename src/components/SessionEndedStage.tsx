import { RotateCcw, CheckCircle2, ShieldCheck } from "lucide-react";
import lisaAvatarUrl from "../assets/lisa-avatar.jpg";

interface SessionEndedStageProps {
  onRestart: () => void;
}

export default function SessionEndedStage({ onRestart }: SessionEndedStageProps) {
  return (
    <div className="stage-panel session-ended-panel">
      <div className="session-ended-card">
        <div className="ended-avatar-wrap">
          <img src={lisaAvatarUrl} alt="Lisa" className="ended-avatar-img" />
          <div className="ended-check-badge">
            <CheckCircle2 size={16} />
          </div>
        </div>

        <h2>Session Complete</h2>
        <p className="session-ended-desc">
          Thank you for exploring Dijkstra&apos;s Banker&apos;s Algorithm with Lisa.
          Microphone listening and speech resources have been safely released.
        </p>

        <div className="ended-summary-box">
          <div className="ended-stat">
            <ShieldCheck size={20} className="text-emerald" />
            <div>
              <strong>Deadlock Avoidance Verified</strong>
              <span>Algorithm tested state transitions and validated resource requests.</span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="primary-button restart-hero-btn"
          onClick={onRestart}
        >
          <RotateCcw size={16} />
          <span>Say &ldquo;Restart&rdquo; or Click to Begin Again</span>
        </button>
      </div>
    </div>
  );
}
