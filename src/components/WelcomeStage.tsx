import { Play, BookOpen, AlertTriangle, ArrowRight, Mic } from "lucide-react";
import LisaAssistant, { type AssistantVisualState } from "./LisaAssistant";
import type { VoiceWorkflowState } from "../types/simulation";

interface WelcomeStageProps {
  dialogue: string;
  workflowState: VoiceWorkflowState;
  visualState: AssistantVisualState;
  isMuted: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  lastTranscript?: string;
  lastCommandStatus?: {
    type: "accepted" | "rejected" | "clarify";
    message: string;
  } | null;
  onToggleMute: () => void;
  onReplayDialogue: () => void;
  onStartCustom: () => void;
  onLoadClassic: () => void;
  onLoadUnsafe: () => void;
  onVoiceCommandSubmit: (cmd: string) => void;
}

export default function WelcomeStage({
  dialogue,
  workflowState,
  visualState,
  isMuted,
  isListening,
  isSpeaking,
  lastTranscript,
  lastCommandStatus,
  onToggleMute,
  onReplayDialogue,
  onStartCustom,
  onLoadClassic,
  onLoadUnsafe,
  onVoiceCommandSubmit,
}: WelcomeStageProps) {
  return (
    <div className="welcome-stage-container">
      <LisaAssistant
        dialogue={dialogue}
        isWelcomeStage={true}
        visualState={visualState}
        workflowState={workflowState}
        isMuted={isMuted}
        isListening={isListening}
        isSpeaking={isSpeaking}
        lastTranscript={lastTranscript}
        lastCommandStatus={lastCommandStatus}
        onToggleMute={onToggleMute}
        onReplayDialogue={onReplayDialogue}
        onVoiceCommandSubmit={onVoiceCommandSubmit}
        onAdvanceStage={onStartCustom}
        hintActionText="Say 'Start'"
      />

      <div className="welcome-action-card">
        <div className="welcome-card-heading">
          <span className="eyebrow">DIJKSTRA&apos;S DEADLOCK AVOIDANCE</span>
          <h3>Banker&apos;s Algorithm Laboratory</h3>
          <p>
            An interactive, voice-guided simulator designed for Operating Systems students.
            Say <strong className="voice-callout">&ldquo;Start&rdquo;</strong> into your microphone or choose a quick-start preset below.
          </p>
        </div>

        <div className="welcome-voice-instruction-box">
          <div className="instruction-badge">
            <Mic size={16} />
            <span>VOICE-FIRST MODE ACTIVE</span>
          </div>
          <p>
            You do not need to type. Simply speak to Lisa naturally. Try saying:
          </p>
          <ul className="voice-tips-list">
            <li>&ldquo;Start&rdquo; or &ldquo;Begin&rdquo; to launch simulation</li>
            <li>&ldquo;Five&rdquo; or &ldquo;Three&rdquo; when asked for process or resource counts</li>
            <li>&ldquo;Next&rdquo; or &ldquo;Skip&rdquo; to proceed through matrices and 3D scenes</li>
          </ul>
        </div>

        <div className="welcome-buttons-grid">
          <button
            type="button"
            className="primary-button hero-start-btn"
            onClick={onStartCustom}
          >
            <Play size={18} />
            <span>Say &ldquo;Start&rdquo; or Click Here</span>
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
            <strong>Voice-First Assistant</strong>
            <span>Live continuous speech recognition &amp; spoken guide</span>
          </div>
          <div className="spec-card">
            <strong>3D Spatial Universe</strong>
            <span>Interactive process boxes &amp; resource spheres</span>
          </div>
        </div>
      </div>
    </div>
  );
}
