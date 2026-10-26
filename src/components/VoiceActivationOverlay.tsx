import { Mic, Volume2, Sparkles } from "lucide-react";
import lisaAvatarUrl from "../assets/lisa-avatar.jpg";

interface VoiceActivationOverlayProps {
  onActivate: () => void;
  isActivating: boolean;
  errorMessage?: string | null;
}

export default function VoiceActivationOverlay({
  onActivate,
  isActivating,
  errorMessage,
}: VoiceActivationOverlayProps) {
  return (
    <div className="activation-backdrop" role="dialog" aria-modal="true">
      <div className="activation-card">
        <div className="activation-avatar-wrap">
          <img
            src={lisaAvatarUrl}
            alt="Lisa - Virtual AI Guide"
            className="activation-avatar-img"
          />
          <div className="activation-badge">
            <Sparkles size={13} />
            <span>AI GUIDE</span>
          </div>
        </div>

        <h2 className="activation-title">Welcome to KERNEL 3D</h2>
        <p className="activation-sub">
          An interactive, voice-guided Banker's Algorithm laboratory led by your virtual assistant, Lisa.
        </p>

        <div className="activation-info-box">
          <div className="info-item">
            <Volume2 size={18} className="info-icon" />
            <div>
              <strong>Spoken Explanations</strong>
              <span>Lisa guides you step-by-step through deadlock avoidance.</span>
            </div>
          </div>
          <div className="info-item">
            <Mic size={18} className="info-icon" />
            <div>
              <strong>Voice-First Control</strong>
              <span>Speak commands like &ldquo;Start&rdquo;, &ldquo;Next&rdquo;, or &ldquo;Change Allocation of P1 to 2 0 0&rdquo;.</span>
            </div>
          </div>
        </div>

        {errorMessage && (
          <div className="activation-error" role="alert">
            {errorMessage}
          </div>
        )}

        <button
          type="button"
          className="primary-button activation-btn"
          onClick={onActivate}
          disabled={isActivating}
        >
          <Mic size={18} />
          <span>{isActivating ? "Initializing Voice Engine..." : "Enable Voice & Microphone"}</span>
        </button>

        <span className="activation-note">
          Browser security requires one user click to activate audio and request microphone access.
        </span>
      </div>
    </div>
  );
}
