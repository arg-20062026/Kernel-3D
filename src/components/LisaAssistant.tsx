import { useState, useEffect, useRef } from "react";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Radio,
  Send,
} from "lucide-react";
import { speechManager } from "../utils/speech";
import lisaAvatarUrl from "../assets/lisa-avatar.jpg";

interface LisaAssistantProps {
  dialogue: string;
  isWelcomeStage?: boolean;
  onVoiceCommand?: (command: string) => void;
  onAdvanceStage?: () => void;
  hintActionText?: string;
}

export default function LisaAssistant({
  dialogue,
  isWelcomeStage = false,
  onVoiceCommand,
  onAdvanceStage,
  hintActionText,
}: LisaAssistantProps) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [typedInput, setTypedInput] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const prevDialogueRef = useRef<string>("");

  // Speak when dialogue changes if not muted
  useEffect(() => {
    if (dialogue && dialogue !== prevDialogueRef.current) {
      prevDialogueRef.current = dialogue;
      if (!isMuted) {
        speechManager.speak(dialogue, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    }
  }, [dialogue, isMuted]);

  // Clean up speech on unmount
  useEffect(() => {
    return () => {
      speechManager.stopSpeaking();
      speechManager.stopListening();
    };
  }, []);

  const toggleMute = () => {
    const next = !isMuted;
    setIsMuted(next);
    speechManager.setMuted(next);
    if (next) {
      setIsSpeaking(false);
    } else {
      // Re-speak current dialogue
      speechManager.speak(dialogue, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  };

  const replayDialogue = () => {
    setIsSpeaking(true);
    speechManager.speak(dialogue, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => setIsSpeaking(false),
      onError: () => setIsSpeaking(false),
    });
  };

  const toggleListening = () => {
    if (isListening) {
      speechManager.stopListening();
      setIsListening(false);
      return;
    }

    if (!speechManager.isSTTSupported()) {
      setFeedbackMessage("Speech recognition is not supported in this browser. You can type or click below.");
      setTimeout(() => setFeedbackMessage(null), 4000);
      return;
    }

    setIsListening(true);
    setFeedbackMessage("Listening... Speak now");

    speechManager.startListening({
      onStart: () => {
        setIsListening(true);
      },
      onResult: (transcript) => {
        setIsListening(false);
        setFeedbackMessage(`Heard: "${transcript}"`);
        setTimeout(() => setFeedbackMessage(null), 3000);
        onVoiceCommand?.(transcript);
      },
      onError: (err) => {
        setIsListening(false);
        setFeedbackMessage(err);
        setTimeout(() => setFeedbackMessage(null), 4000);
      },
      onEnd: () => {
        setIsListening(false);
      },
    });
  };

  const handleCommandSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!typedInput.trim()) return;
    const cmd = typedInput.trim().toLowerCase();
    setTypedInput("");
    onVoiceCommand?.(cmd);
  };

  if (isWelcomeStage) {
    return (
      <div className="lisa-welcome-hero">
        <div className="lisa-avatar-wrapper large">
          <div className={`lisa-avatar-ring ${isSpeaking ? "speaking" : ""} ${isListening ? "listening" : ""}`}>
            <img
              src={lisaAvatarUrl}
              alt="Lisa - Virtual AI Guide"
              className="lisa-avatar-img"
            />
          </div>
          <div className="lisa-status-badge">
            <Radio size={12} className={isSpeaking || isListening ? "pulse" : ""} />
            <span>{isSpeaking ? "SPEAKING" : isListening ? "LISTENING" : "ONLINE"}</span>
          </div>
        </div>

        <div className="lisa-welcome-content">
          <div className="lisa-guide-tag">
            <Sparkles size={14} />
            <span>AI SIMULATION GUIDE</span>
          </div>
          <h2 className="lisa-name-title">Lisa</h2>
          <p className="lisa-speech-balloon">{dialogue}</p>

          <div className="lisa-controls-row">
            <button
              type="button"
              className={`mic-button ${isListening ? "active" : ""}`}
              onClick={toggleListening}
              title={isListening ? "Stop listening" : "Click to speak voice command"}
              aria-label="Toggle voice input"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              <span>{isListening ? "Listening..." : "Say 'Start'"}</span>
            </button>

            <button
              type="button"
              className="icon-tool-button"
              onClick={replayDialogue}
              title="Replay Lisa's voice"
              aria-label="Replay speech"
            >
              <RotateCcw size={16} />
            </button>

            <button
              type="button"
              className={`icon-tool-button ${isMuted ? "muted" : ""}`}
              onClick={toggleMute}
              title={isMuted ? "Unmute Lisa" : "Mute voice"}
              aria-label={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>

          {feedbackMessage && (
            <div className="lisa-feedback-notice" role="status">
              {feedbackMessage}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Floating dock assistant for Stage 2 to 7
  return (
    <aside
      className={`lisa-floating-panel ${isMinimized ? "minimized" : ""}`}
      aria-label="Lisa AI Guide"
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
            <span className={`pill-dot ${isSpeaking ? "speaking" : ""}`} />
          </div>
          <span className="pill-name">Lisa</span>
          <ChevronUp size={14} />
        </button>
      ) : (
        <div className="lisa-card">
          <div className="lisa-card-header">
            <div className="lisa-header-identity">
              <div className="lisa-mini-avatar">
                <img
                  src={lisaAvatarUrl}
                  alt="Lisa"
                  className={`mini-avatar-img ${isSpeaking ? "pulse-border" : ""}`}
                />
                <span className={`status-indicator ${isSpeaking ? "speaking" : isListening ? "listening" : "idle"}`} />
              </div>
              <div>
                <strong className="lisa-title-text">Lisa</strong>
                <span className="lisa-sub-text">
                  {isSpeaking ? "Speaking..." : isListening ? "Listening..." : "OS Assistant"}
                </span>
              </div>
            </div>

            <div className="lisa-header-actions">
              <button
                type="button"
                className="icon-mini-button"
                onClick={replayDialogue}
                title="Replay dialogue"
                aria-label="Replay dialogue"
              >
                <RotateCcw size={13} />
              </button>

              <button
                type="button"
                className={`icon-mini-button ${isMuted ? "muted" : ""}`}
                onClick={toggleMute}
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
          </div>

          <div className="lisa-card-footer">
            <form onSubmit={handleCommandSubmit} className="lisa-command-form">
              <input
                type="text"
                placeholder="Ask or command (e.g. 'next', 'start')..."
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

            <div className="lisa-quick-bar">
              <button
                type="button"
                className={`lisa-mic-toggle ${isListening ? "active" : ""}`}
                onClick={toggleListening}
                title={isListening ? "Stop listening" : "Speak command"}
                aria-label="Voice input"
              >
                {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                <span>{isListening ? "Listening..." : "Speak"}</span>
              </button>

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

            {feedbackMessage && (
              <div className="lisa-feedback-small" role="status">
                {feedbackMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
