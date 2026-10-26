import { useState } from "react";
import {
  Mic,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Radio,
  Send,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";
import lisaAvatarUrl from "../assets/lisa-avatar.jpg";
import Lisa3DCharacter from "../scene3d/Lisa3DCharacter";
import type { VoiceWorkflowState } from "../types/simulation";

export type AssistantVisualState =
  | "welcome"
  | "speaking"
  | "listening"
  | "processing"
  | "waiting"
  | "success"
  | "warning"
  | "error"
  | "minimized"
  | "session-ended";

interface LisaAssistantProps {
  dialogue: string;
  isWelcomeStage?: boolean;
  visualState: AssistantVisualState;
  workflowState: VoiceWorkflowState;
  isMuted: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  isActivated?: boolean;
  autoplayBlocked?: boolean;
  lastTranscript?: string;
  lastCommandStatus?: {
    type: "accepted" | "rejected" | "clarify";
    message: string;
  } | null;
  onToggleMute: () => void;
  onReplayDialogue: () => void;
  onVoiceCommandSubmit: (cmd: string) => void;
  onAdvanceStage?: () => void;
  onActivateVoice?: () => void;
  hintActionText?: string;
}

export default function LisaAssistant({
  dialogue,
  isWelcomeStage = false,
  visualState,
  isMuted,
  isListening,
  isSpeaking,
  isActivated = false,
  autoplayBlocked = false,
  lastTranscript,
  lastCommandStatus,
  onToggleMute,
  onReplayDialogue,
  onVoiceCommandSubmit,
  onAdvanceStage,
  onActivateVoice,
  hintActionText,
}: LisaAssistantProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [typedInput, setTypedInput] = useState("");

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const cmd = typedInput.trim();
    setTypedInput("");
    onVoiceCommandSubmit(cmd);
  };

  const statusLabel = isSpeaking
    ? "LISA IS SPEAKING"
    : isListening
      ? "LISTENING FOR COMMAND"
      : visualState === "processing"
        ? "PROCESSING INPUT"
        : visualState === "session-ended"
          ? "SESSION ENDED"
          : "VOICE ONLINE";

  if (isWelcomeStage) {
    return (
      <div className="lisa-welcome-hero" role="region" aria-label="Lisa AI Guide">
        <div className="lisa-avatar-wrapper large">
          <Lisa3DCharacter
            mode="hero"
            isSpeaking={isSpeaking}
            isListening={isListening}
            isMuted={isMuted}
          />
          <div className="lisa-status-badge">
            <Radio size={12} className={isSpeaking || isListening ? "pulse" : ""} />
            <span>{statusLabel}</span>
          </div>
        </div>

        <div className="lisa-welcome-content">
          <div className="lisa-guide-tag">
            <Sparkles size={14} />
            <span>VIRTUAL AI PROFESSOR</span>
          </div>
          <h2 className="lisa-name-title">Lisa</h2>
          <p className="lisa-speech-balloon">{dialogue}</p>

          {(!isActivated || autoplayBlocked) && onActivateVoice && (
            <div className="lisa-autoplay-action-wrap">
              <button
                type="button"
                className="primary-button lisa-enable-audio-btn"
                onClick={onActivateVoice}
              >
                <Volume2 size={18} />
                <span>Enable Lisa&apos;s Voice &amp; Microphone</span>
              </button>
              <span className="autoplay-hint">
                Click to unlock browser voice output and speak commands.
              </span>
            </div>
          )}

          <div className="lisa-live-transcript-bar">
            <Mic size={14} className={isListening ? "mic-glow" : ""} />
            <span className="transcript-label">Live Speech:</span>
            <span className="transcript-text">
              {lastTranscript ? `"${lastTranscript}"` : isListening ? "Listening... Speak now" : "Mic paused"}
            </span>
          </div>

          {lastCommandStatus && (
            <div className={`command-status-pill ${lastCommandStatus.type}`} role="status">
              {lastCommandStatus.type === "accepted" ? (
                <CheckCircle2 size={14} />
              ) : lastCommandStatus.type === "rejected" ? (
                <AlertCircle size={14} />
              ) : (
                <HelpCircle size={14} />
              )}
              <span>{lastCommandStatus.message}</span>
            </div>
          )}

          <div className="lisa-controls-row">
            <button
              type="button"
              className="icon-tool-button"
              onClick={onReplayDialogue}
              title="Replay Lisa's voice"
              aria-label="Replay speech"
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              className={`icon-tool-button ${isMuted ? "muted" : ""}`}
              onClick={onToggleMute}
              title={isMuted ? "Unmute Lisa" : "Mute voice"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>

            {hintActionText && onAdvanceStage && (
              <button
                type="button"
                className="primary-button quick-action-btn"
                onClick={onAdvanceStage}
              >
                {hintActionText}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Floating dock assistant for Step 6 onwards (or minimized state)
  return (
    <aside
      className={`lisa-floating-panel ${isMinimized ? "minimized" : ""}`}
      aria-label="Lisa AI Floating Guide"
    >
      {isMinimized ? (
        <button
          type="button"
          className="lisa-minimized-pill"
          onClick={() => setIsMinimized(false)}
          title="Expand Lisa assistant"
        >
          <div className="avatar-pill-ring">
            <img src={lisaAvatarUrl} alt="Lisa" className="avatar-pill-img" />
            <span
              className={`pill-dot ${isSpeaking ? "speaking" : isListening ? "listening" : ""}`}
            />
          </div>
          <span className="pill-name">Lisa</span>
          <ChevronUp size={14} />
        </button>
      ) : (
        <div className="lisa-card">
          <div className="lisa-card-header">
            <div className="lisa-header-identity">
              <div className="lisa-mini-avatar-3d">
                <Lisa3DCharacter
                  mode="compact"
                  isSpeaking={isSpeaking}
                  isListening={isListening}
                  isMuted={isMuted}
                />
              </div>
              <div>
                <strong className="lisa-title-text">Lisa</strong>
                <span className="lisa-sub-text">{statusLabel}</span>
              </div>
            </div>

            <div className="lisa-header-actions">
              <button
                type="button"
                className="icon-mini-button"
                onClick={onReplayDialogue}
                title="Replay dialogue"
                aria-label="Replay dialogue"
              >
                <RotateCcw size={13} />
              </button>

              <button
                type="button"
                className={`icon-mini-button ${isMuted ? "muted" : ""}`}
                onClick={onToggleMute}
                title={isMuted ? "Unmute" : "Mute"}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? <VolumeX size={13} /> : <Volume2 size={13} />}
              </button>

              <button
                type="button"
                className="icon-mini-button"
                onClick={() => setIsMinimized(true)}
                title="Minimize assistant"
                aria-label="Minimize assistant"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          </div>

          <div className="lisa-card-body">
            <p className="lisa-dialogue-text">{dialogue}</p>

            <div className="lisa-mini-transcript">
              <Mic size={12} className={isListening ? "mic-glow" : ""} />
              <span className="mini-transcript-val">
                {lastTranscript ? `"${lastTranscript}"` : isListening ? "Listening..." : "Paused"}
              </span>
            </div>

            {lastCommandStatus && (
              <div className={`mini-command-status ${lastCommandStatus.type}`}>
                {lastCommandStatus.message}
              </div>
            )}
          </div>

          <div className="lisa-card-footer">
            <form onSubmit={handleCommandSubmit} className="lisa-command-form">
              <input
                type="text"
                placeholder="Or type voice command (e.g. 'Next', 'Start')..."
                value={typedInput}
                onChange={(e) => setTypedInput(e.target.value)}
                className="lisa-text-input"
                aria-label="Type a command for Lisa"
              />
              <button
                type="submit"
                className="lisa-send-btn"
                title="Submit command"
                aria-label="Submit command"
              >
                <Send size={13} />
              </button>
            </form>

            {hintActionText && onAdvanceStage && (
              <button
                type="button"
                className="lisa-action-pill"
                onClick={onAdvanceStage}
              >
                {hintActionText}
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
