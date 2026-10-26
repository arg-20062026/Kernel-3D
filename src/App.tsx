import { useState, useMemo, lazy, Suspense, useEffect, useCallback, useRef } from "react";
import {
  Cpu,
  RotateCcw,
  AlertTriangle,
  Activity,
  Volume2,
  VolumeX,
} from "lucide-react";
import type {
  SimulationStage,
  SimulationModel,
  VoiceWorkflowState,
} from "./types/simulation";
import {
  CLASSIC_5X3_PRESET,
  UNSAFE_PRESET,
  generateDeterministicPreset,
} from "./data/presets";
import { STAGE_DIALOGUES, WORKFLOW_PROMPTS } from "./data/dialogues";
import {
  calculateNeed,
  runSafetyAlgorithm,
  type SafetyResult,
} from "./algorithm/banker";
import { speechManager } from "./utils/speech";
import {
  normalizeVoiceInput,
  parseProcessCount,
  parseResourceCount,
  parseMatrixEditCommand,
  isExactCommand,
} from "./utils/voiceCommander";

import StageNavigation from "./components/StageNavigation";
import WelcomeStage from "./components/WelcomeStage";
import SystemConfigStage from "./components/SystemConfigStage";
import Exploring3DStage from "./components/Exploring3DStage";
import MatrixEditorStage from "./components/MatrixEditorStage";
import SafetyAnalysisStage from "./components/SafetyAnalysisStage";
import SessionEndedStage from "./components/SessionEndedStage";
import LisaAssistant, { type AssistantVisualState } from "./components/LisaAssistant";
import "./App.css";

// Lazy load 3D Execution Stage to keep initial bundle ultra-lean
const Simulation3DStage = lazy(
  () => import("./components/Simulation3DStage"),
);

const RESOURCE_COLOR_PALETTE = [
  "#0284c7", // Sky blue
  "#7c3aed", // Violet
  "#059669", // Emerald
  "#db2777", // Pink
  "#d97706", // Amber
  "#2563eb", // Royal blue
];

export default function App() {
  const [stage, setStage] = useState<SimulationStage>("WELCOME");
  const [workflowState, setWorkflowState] =
    useState<VoiceWorkflowState>("awaiting-start");
  const [model, setModel] = useState<SimulationModel>(() =>
    structuredClone(CLASSIC_5X3_PRESET),
  );
  const [dialogue, setDialogue] = useState<string>(STAGE_DIALOGUES.WELCOME);

  const [isActivated, setIsActivated] = useState<boolean>(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState<boolean>(
    () => !speechManager.isTTSSupported(),
  );
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [lastTranscript, setLastTranscript] = useState<string>("");
  const [lastCommandStatus, setLastCommandStatus] = useState<{
    type: "accepted" | "rejected" | "clarify";
    message: string;
  } | null>(null);

  const [showResetModal, setShowResetModal] = useState(false);
  const [configErrorMessage, setConfigErrorMessage] = useState<string | null>(null);
  const [isAskingProcess, setIsAskingProcess] = useState<boolean>(true);

  // References to keep current state accessible inside continuous recognition callbacks
  const stateRef = useRef({
    stage,
    workflowState,
    model,
    isAskingProcess,
  });
  useEffect(() => {
    stateRef.current = { stage, workflowState, model, isAskingProcess };
  }, [stage, workflowState, model, isAskingProcess]);

  // Compute safety result whenever model matrices change
  const safetyResult: SafetyResult | null = useMemo(() => {
    try {
      calculateNeed(model.allocation, model.max);
      return runSafetyAlgorithm({
        allocation: model.allocation,
        max: model.max,
        available: model.available,
      });
    } catch {
      return null;
    }
  }, [model.allocation, model.max, model.available]);

  // Central speech announcer
  const announceSpeech = useCallback((text: string) => {
    setDialogue(text);
    if (!isMuted) {
      setIsSpeaking(true);
      speechManager.speak(text, {
        onStart: () => setIsSpeaking(true),
        onEnd: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    }
  }, [isMuted]);

  const handleVoiceCommandRef = useRef<(rawCommand: string) => void>(() => {});
  const greetingAttemptedRef = useRef(false);
  const isTransitioningRef = useRef(false);

  // Reusable listener initializer
  const startListeningSession = useCallback(() => {
    speechManager.startListening({
      onStart: () => setIsListening(true),
      onResult: (transcript, isFinal) => {
        setLastTranscript(transcript);
        if (isFinal) {
          handleVoiceCommandRef.current(transcript);
        }
      },
      onError: (err) => {
        setLastCommandStatus({
          type: "rejected",
          message: err,
        });
      },
      onEnd: () => {
        setIsListening(speechManager.getIsListening());
      },
    });
  }, []);

  // Single-gesture audio and mic activator when autoplay blocked
  const handleActivateVoice = useCallback(async () => {
    await speechManager.unlockAudioContext();
    setIsActivated(true);
    setAutoplayBlocked(false);
    setWorkflowState("awaiting-start");
    setStage("WELCOME");

    startListeningSession();
    announceSpeech(STAGE_DIALOGUES.WELCOME);
  }, [announceSpeech, startListeningSession]);

  // AUTOMATIC GREETING ON INITIAL LOAD
  useEffect(() => {
    if (greetingAttemptedRef.current) return;
    greetingAttemptedRef.current = true;

    const greeting = STAGE_DIALOGUES.WELCOME;
    setDialogue(greeting);

    // Attempt automatic spoken greeting on first load
    if (speechManager.isTTSSupported()) {
      speechManager.speak(greeting, {
        onStart: () => {
          setIsSpeaking(true);
          setIsActivated(true);
          setAutoplayBlocked(false);
        },
        onEnd: () => setIsSpeaking(false),
        onError: () => {
          setIsSpeaking(false);
          // Browser audio autoplay policy blocked playback until user gesture
          setAutoplayBlocked(true);
        },
      });
    }

    // Attempt listening if browser permissions allow
    if (speechManager.isSTTSupported()) {
      startListeningSession();
    }
  }, [startListeningSession]);

  // Stage transition helper
  const navigateTo = (nextStage: SimulationStage, nextWorkflow: VoiceWorkflowState, promptText?: string) => {
    setStage(nextStage);
    setWorkflowState(nextWorkflow);
    const speech = promptText ?? WORKFLOW_PROMPTS[nextWorkflow] ?? STAGE_DIALOGUES[nextStage];
    announceSpeech(speech);
  };

  // Voice Command Dispatcher with explicit state machine guards
  const handleVoiceCommand = (rawCommand: string) => {
    const { stage: curStage, workflowState: curWorkflow, model: curModel, isAskingProcess: curAskingProcess } = stateRef.current;
    const clean = normalizeVoiceInput(rawCommand);
    if (!clean) return;

    // Global EXIT command
    if (isExactCommand(clean, "exit")) {
      speechManager.stopSpeaking();
      speechManager.stopListening();
      setIsListening(false);
      setIsSpeaking(false);
      setStage("SESSION_ENDED");
      setWorkflowState("session-ended");
      setLastCommandStatus({
        type: "accepted",
        message: "Session ended. Audio and microphone released.",
      });
      announceSpeech(STAGE_DIALOGUES.SESSION_ENDED);
      return;
    }

    // Global RESTART command
    if (isExactCommand(clean, "reset") || clean === "restart") {
      setModel(structuredClone(CLASSIC_5X3_PRESET));
      setIsAskingProcess(true);
      navigateTo("WELCOME", "awaiting-start", "Simulation restarted. Say Start to begin.");
      setLastCommandStatus({
        type: "accepted",
        message: "Simulation reset to initial state.",
      });
      return;
    }

    // STATE: awaiting-start or WELCOME
    if (curWorkflow === "awaiting-start" || curStage === "WELCOME") {
      if (isExactCommand(clean, "start")) {
        if (isTransitioningRef.current) return;
        isTransitioningRef.current = true;

        setLastCommandStatus({
          type: "accepted",
          message: "Command 'Start' accepted. Moving to Dimensions.",
        });
        setIsAskingProcess(true);
        navigateTo(
          "SYSTEM_CONFIG",
          "asking-process-count",
          "Cool. We need the number of processes. Tell me how many processes you want.",
        );
        setTimeout(() => {
          isTransitioningRef.current = false;
        }, 1200);
        return;
      }
      if (clean.includes("classic") || clean.includes("textbook")) {
        setModel(structuredClone(CLASSIC_5X3_PRESET));
        setLastCommandStatus({
          type: "accepted",
          message: "Loaded classic 5x3 textbook preset.",
        });
        navigateTo("SAFETY_ANALYSIS", "analyzing-safety", "Classic 5 processes and 3 resources dataset loaded. Let's analyze safety.");
        return;
      }
      if (clean.includes("unsafe") || clean.includes("deadlock")) {
        setModel(structuredClone(UNSAFE_PRESET));
        setLastCommandStatus({
          type: "accepted",
          message: "Loaded 4x2 unsafe preset.",
        });
        navigateTo("SAFETY_ANALYSIS", "analyzing-safety", "Unsafe dataset loaded. Notice how the safety algorithm detects deadlock risk.");
        return;
      }
    }

    // STATE: SYSTEM_CONFIG (asking process or resource count)
    if (curStage === "SYSTEM_CONFIG") {
      if (curAskingProcess) {
        const count = parseProcessCount(clean);
        if (count !== null) {
          if (count >= 1 && count <= 10) {
            setConfigErrorMessage(null);
            setModel((prev) => generateDeterministicPreset(count, prev.resourceCount));
            setIsAskingProcess(false);
            setWorkflowState("asking-resource-count");
            setLastCommandStatus({
              type: "accepted",
              message: `Process count set to ${count}.`,
            });
            announceSpeech("Now tell me the number of resource types.");
            return;
          } else {
            setConfigErrorMessage("Process count must be between 1 and 10.");
            setLastCommandStatus({
              type: "clarify",
              message: "Please choose between 1 and 10 processes.",
            });
            announceSpeech("Please tell me a number between 1 and 10 for processes.");
            return;
          }
        }
      } else {
        const rCount = parseResourceCount(clean);
        if (rCount !== null) {
          if (rCount >= 1 && rCount <= 6) {
            setConfigErrorMessage(null);
            setModel((prev) => generateDeterministicPreset(prev.processCount, rCount));
            setLastCommandStatus({
              type: "accepted",
              message: `Resource count set to ${rCount}.`,
            });
            navigateTo(
              "EXPLORING_3D",
              "exploring-3d",
              "This is the 3D view. Processes are represented by boxes, and resource types are represented by spheres. You can explore the scene. Say 'Next' when you're ready.",
            );
            return;
          } else {
            setConfigErrorMessage("Resource types must be between 1 and 6.");
            setLastCommandStatus({
              type: "clarify",
              message: "Please choose between 1 and 6 resource types.",
            });
            announceSpeech("Please tell me a number between 1 and 6 for resource types.");
            return;
          }
        }
      }

      if (isExactCommand(clean, "next")) {
        navigateTo(
          "EXPLORING_3D",
          "exploring-3d",
          "This is the 3D view. Processes are represented by boxes, and resource types are represented by spheres. You can explore the scene. Say 'Next' when you're ready.",
        );
        return;
      }
      if (isExactCommand(clean, "back")) {
        navigateTo("WELCOME", "awaiting-start", "Back to start. Say Start to begin.");
        return;
      }
    }

    // STATE: EXPLORING_3D
    if (curStage === "EXPLORING_3D") {
      if (isExactCommand(clean, "next") || isExactCommand(clean, "skip")) {
        setLastCommandStatus({
          type: "accepted",
          message: "Advancing to predefined matrices.",
        });
        navigateTo(
          "ALLOCATION_INPUT",
          "awaiting-matrix-choice",
          "No need to type. This is a predefined matrix of Allocation and Maximum values. Say what you want to change, or say 'Skip' to continue.",
        );
        return;
      }
      if (isExactCommand(clean, "back")) {
        setIsAskingProcess(false);
        navigateTo("SYSTEM_CONFIG", "asking-resource-count", "Back to system dimensions.");
        return;
      }
    }

    // STATE: ALLOCATION_INPUT (Voice matrix editing or skip/next)
    if (curStage === "ALLOCATION_INPUT") {
      if (isExactCommand(clean, "skip") || isExactCommand(clean, "next")) {
        setLastCommandStatus({
          type: "accepted",
          message: "Predefined matrices confirmed. Analyzing safety.",
        });
        navigateTo("SAFETY_ANALYSIS", "analyzing-safety", "Safety analysis complete. Let's inspect the safe sequence.");
        return;
      }

      if (isExactCommand(clean, "back")) {
        navigateTo("EXPLORING_3D", "exploring-3d", "Returning to 3D scene.");
        return;
      }

      // Check if command is a matrix row edit
      if (clean.includes("change") || clean.includes("set")) {
        const parseRes = parseMatrixEditCommand(clean, curModel.processCount, curModel.resourceCount);
        if (parseRes.success) {
          const { matrixType, processIndex, values } = parseRes.edit;

          // Validate Allocation <= Max
          if (matrixType === "allocation") {
            const exceeds = values.some((val, j) => val > (curModel.max[processIndex]?.[j] ?? 0));
            if (exceeds) {
              setLastCommandStatus({
                type: "rejected",
                message: "Allocation cannot exceed Maximum claim for any resource.",
              });
              announceSpeech("Allocation cannot exceed Maximum claim. Please specify valid values.");
              return;
            }
          } else {
            const violatesAlloc = values.some((val, j) => val < (curModel.allocation[processIndex]?.[j] ?? 0));
            if (violatesAlloc) {
              setLastCommandStatus({
                type: "rejected",
                message: "Maximum claim cannot be less than currently held Allocation.",
              });
              announceSpeech("Maximum claim cannot be less than currently held Allocation.");
              return;
            }
          }

          // Apply edit
          setModel((prev) => {
            const next = structuredClone(prev);
            next[matrixType][processIndex] = [...values];
            return next;
          });

          setLastCommandStatus({
            type: "accepted",
            message: `Updated ${matrixType} for P${processIndex} to [${values.join(", ")}].`,
          });
          announceSpeech(`Updated ${matrixType} for process P${processIndex} to ${values.join(", ")}. Say another change, or say 'Next' to analyze.`);
          return;
        } else {
          setLastCommandStatus({
            type: "clarify",
            message: parseRes.error,
          });
          announceSpeech(parseRes.error);
          return;
        }
      }
    }

    // STATE: SAFETY_ANALYSIS
    if (curStage === "SAFETY_ANALYSIS") {
      if (isExactCommand(clean, "next") || clean.includes("3d") || clean.includes("simulate")) {
        setLastCommandStatus({
          type: "accepted",
          message: "Launching 3D Execution Trace.",
        });
        navigateTo("SIMULATION_3D", "explaining-execution", "Watch as processes execute in safe sequence order. Each completed process safely returns its allocated resources to the system pool.");
        return;
      }
      if (isExactCommand(clean, "back")) {
        navigateTo("ALLOCATION_INPUT", "awaiting-matrix-choice", "Returning to matrix review.");
        return;
      }
    }

    // Unrecognized utterance fallback
    setLastCommandStatus({
      type: "clarify",
      message: `Heard "${rawCommand}". Try saying "Start", "Next", "Skip", or "Back".`,
    });
  };

  useEffect(() => {
    handleVoiceCommandRef.current = handleVoiceCommand;
  });

  // Stage accessibility guard for manual navigation
  const canNavigateTo = (targetStage: SimulationStage): boolean => {
    if (targetStage === "WELCOME") return true;
    if (targetStage === "SYSTEM_CONFIG") return true;
    if (targetStage === "EXPLORING_3D") return model.processCount > 0;
    if (targetStage === "ALLOCATION_INPUT") return model.resourceCount > 0;
    if (targetStage === "SAFETY_ANALYSIS") return safetyResult !== null;
    if (targetStage === "SIMULATION_3D") return safetyResult !== null;
    return false;
  };

  const assistantVisualState: AssistantVisualState = useMemo(() => {
    if (stage === "SESSION_ENDED") return "session-ended";
    if (isSpeaking) return "speaking";
    if (isListening) return "listening";
    if (stage === "WELCOME") return "welcome";
    if (lastCommandStatus?.type === "accepted") return "success";
    if (lastCommandStatus?.type === "rejected") return "error";
    if (lastCommandStatus?.type === "clarify") return "warning";
    return "waiting";
  }, [stage, isSpeaking, isListening, lastCommandStatus]);

  return (
    <main className="app-shell light-theme">
      {/* LIGHT-THEME GLOBAL TOPBAR */}
      <header className="topbar">
        <div
          className="brand"
          onClick={() => navigateTo("WELCOME", "awaiting-start")}
          role="button"
          tabIndex={0}
          title="Return to Welcome"
        >
          <div className="brand-mark">
            <Cpu size={22} />
          </div>
          <div>
            <div className="brand-name">
              KERNEL <span>3D</span>
            </div>
            <div className="brand-subtitle">
              VOICE-FIRST BANKER&apos;S ALGORITHM LABORATORY
            </div>
          </div>
        </div>

        <div className="system-status">
          <span className={`status-dot ${isListening ? "listening" : isSpeaking ? "speaking" : "online"}`} />
          <span>
            {isSpeaking ? "LISA SPEAKING" : isListening ? "LISTENING ACTIVE" : "VOICE ENGINE READY"}
          </span>
          <span className="status-divider">/</span>
          <span className="status-stage-label">{stage}</span>
        </div>

        <div className="topbar-actions">
          <button
            type="button"
            className="secondary-button"
            onClick={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              speechManager.setMuted(nextMute);
            }}
            title={isMuted ? "Unmute Lisa" : "Mute voice output"}
          >
            {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
            <span>{isMuted ? "Unmute" : "Mute"}</span>
          </button>

          <button
            type="button"
            className="secondary-button"
            onClick={() => setShowResetModal(true)}
            title="Reset simulation"
          >
            <RotateCcw size={14} /> Reset
          </button>
        </div>
      </header>

      {/* STAGE NAVIGATION STEPPER */}
      <StageNavigation
        currentStage={stage}
        onSelectStage={(s) => {
          if (s === "WELCOME") navigateTo("WELCOME", "awaiting-start");
          else if (s === "SYSTEM_CONFIG") navigateTo("SYSTEM_CONFIG", "asking-process-count");
          else if (s === "EXPLORING_3D") navigateTo("EXPLORING_3D", "exploring-3d");
          else if (s === "ALLOCATION_INPUT") navigateTo("ALLOCATION_INPUT", "awaiting-matrix-choice");
          else if (s === "SAFETY_ANALYSIS") navigateTo("SAFETY_ANALYSIS", "analyzing-safety");
          else if (s === "SIMULATION_3D") navigateTo("SIMULATION_3D", "explaining-execution");
        }}
        canNavigateTo={canNavigateTo}
      />

      {/* CONFIRM RESET MODAL */}
      {showResetModal && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal-dialog">
            <div className="modal-title">
              <AlertTriangle size={20} className="modal-warning-icon" />
              Reset Simulation to Initial State?
            </div>
            <p className="modal-desc">
              All custom process counts, resource counts, and matrix values will be reset. Are you sure?
            </p>
            <div className="modal-buttons">
              <button
                type="button"
                className="secondary-button"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="primary-button danger-btn"
                onClick={() => {
                  setShowResetModal(false);
                  setModel(structuredClone(CLASSIC_5X3_PRESET));
                  setIsAskingProcess(true);
                  navigateTo("WELCOME", "awaiting-start", "Simulation reset to initial state. Say Start to begin.");
                }}
              >
                Confirm Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ACTIVE STAGE WORKSPACE */}
      <div className="stage-content-container">
        {stage === "WELCOME" && (
          <WelcomeStage
            dialogue={dialogue}
            workflowState={workflowState}
            visualState={assistantVisualState}
            isMuted={isMuted}
            isListening={isListening}
            isSpeaking={isSpeaking}
            isActivated={isActivated}
            autoplayBlocked={autoplayBlocked}
            lastTranscript={lastTranscript}
            lastCommandStatus={lastCommandStatus}
            onToggleMute={() => {
              const nextMute = !isMuted;
              setIsMuted(nextMute);
              speechManager.setMuted(nextMute);
            }}
            onReplayDialogue={() => announceSpeech(dialogue)}
            onStartCustom={() => {
              setIsAskingProcess(true);
              navigateTo("SYSTEM_CONFIG", "asking-process-count");
            }}
            onLoadClassic={() => {
              setModel(structuredClone(CLASSIC_5X3_PRESET));
              navigateTo("SAFETY_ANALYSIS", "analyzing-safety", "Classic 5 processes and 3 resources dataset loaded. Let's analyze safety.");
            }}
            onLoadUnsafe={() => {
              setModel(structuredClone(UNSAFE_PRESET));
              navigateTo("SAFETY_ANALYSIS", "analyzing-safety", "Unsafe state loaded. Notice how the safety algorithm detects deadlock risk.");
            }}
            onVoiceCommandSubmit={handleVoiceCommand}
            onActivateVoice={handleActivateVoice}
          />
        )}

        {stage === "SYSTEM_CONFIG" && (
          <SystemConfigStage
            processCount={model.processCount}
            resourceCount={model.resourceCount}
            isAskingProcess={isAskingProcess}
            onProcessCountChange={(count) => {
              setModel((prev) => generateDeterministicPreset(count, prev.resourceCount));
            }}
            onResourceCountChange={(rCount) => {
              setModel((prev) => generateDeterministicPreset(prev.processCount, rCount));
            }}
            onConfirm={() => {
              navigateTo("EXPLORING_3D", "exploring-3d");
            }}
            onBack={() => navigateTo("WELCOME", "awaiting-start")}
            errorMessage={configErrorMessage}
          />
        )}

        {stage === "EXPLORING_3D" && (
          <Exploring3DStage
            model={model}
            safetyResult={safetyResult}
            onNext={() => navigateTo("ALLOCATION_INPUT", "awaiting-matrix-choice")}
            onBack={() => {
              setIsAskingProcess(false);
              navigateTo("SYSTEM_CONFIG", "asking-resource-count");
            }}
            resourceColors={RESOURCE_COLOR_PALETTE}
          />
        )}

        {stage === "ALLOCATION_INPUT" && (
          <MatrixEditorStage
            model={model}
            onUpdateModel={setModel}
            onAnalyze={() => navigateTo("SAFETY_ANALYSIS", "analyzing-safety")}
            onSkip={() => navigateTo("SAFETY_ANALYSIS", "analyzing-safety")}
            onBack={() => navigateTo("EXPLORING_3D", "exploring-3d")}
            onReset={() => {
              setModel((prev) => generateDeterministicPreset(prev.processCount, prev.resourceCount));
            }}
            resourceColors={RESOURCE_COLOR_PALETTE}
          />
        )}

        {stage === "SAFETY_ANALYSIS" && (
          <SafetyAnalysisStage
            model={model}
            onLaunch3D={() => navigateTo("SIMULATION_3D", "explaining-execution")}
            onBackToMatrices={() => navigateTo("ALLOCATION_INPUT", "awaiting-matrix-choice")}
            onApplyRequest={(newModel) => {
              setModel(newModel);
              announceSpeech("Resource request granted! Allocation and Available have been updated and verified safe.");
            }}
            resourceColors={RESOURCE_COLOR_PALETTE}
          />
        )}

        {stage === "SIMULATION_3D" && (
          <Suspense
            fallback={
              <div className="scene-loading-placeholder">
                <Activity size={32} className="spin-slow" />
                <span>Initializing 3D Universe...</span>
              </div>
            }
          >
            {safetyResult && (
              <Simulation3DStage
                model={model}
                safetyResult={safetyResult}
                onBackToAnalysis={() => navigateTo("SAFETY_ANALYSIS", "analyzing-safety")}
                onBackToMatrices={() => navigateTo("ALLOCATION_INPUT", "awaiting-matrix-choice")}
                onExitSession={() => {
                  speechManager.stopSpeaking();
                  speechManager.stopListening();
                  setIsListening(false);
                  setIsSpeaking(false);
                  setStage("SESSION_ENDED");
                  setWorkflowState("session-ended");
                  announceSpeech(STAGE_DIALOGUES.SESSION_ENDED);
                }}
                resourceColors={RESOURCE_COLOR_PALETTE}
              />
            )}
          </Suspense>
        )}

        {stage === "SESSION_ENDED" && (
          <SessionEndedStage
            onRestart={() => {
              setModel(structuredClone(CLASSIC_5X3_PRESET));
              setIsAskingProcess(true);
              handleActivateVoice();
            }}
          />
        )}
      </div>

      {/* FLOATING LISA ASSISTANT (Stages 2 through 7) */}
      {stage !== "WELCOME" && stage !== "SESSION_ENDED" && (
        <LisaAssistant
          dialogue={dialogue}
          isWelcomeStage={false}
          visualState={assistantVisualState}
          workflowState={workflowState}
          isMuted={isMuted}
          isListening={isListening}
          isSpeaking={isSpeaking}
          lastTranscript={lastTranscript}
          lastCommandStatus={lastCommandStatus}
          onToggleMute={() => {
            const nextMute = !isMuted;
            setIsMuted(nextMute);
            speechManager.setMuted(nextMute);
          }}
          onReplayDialogue={() => announceSpeech(dialogue)}
          onVoiceCommandSubmit={handleVoiceCommand}
          onAdvanceStage={() => {
            if (stage === "SYSTEM_CONFIG") navigateTo("EXPLORING_3D", "exploring-3d");
            else if (stage === "EXPLORING_3D") navigateTo("ALLOCATION_INPUT", "awaiting-matrix-choice");
            else if (stage === "ALLOCATION_INPUT") navigateTo("SAFETY_ANALYSIS", "analyzing-safety");
            else if (stage === "SAFETY_ANALYSIS") navigateTo("SIMULATION_3D", "explaining-execution");
          }}
          hintActionText={
            stage === "ALLOCATION_INPUT"
              ? "Say 'Next'"
              : stage === "EXPLORING_3D"
                ? "Say 'Next'"
                : stage === "SAFETY_ANALYSIS"
                  ? "Say 'Next'"
                  : "Say 'Next'"
          }
        />
      )}

      {/* LIGHT-THEME FOOTER */}
      <footer className="app-footer">
        <div className="footer-left">
          <span>KERNEL 3D</span>
          <span className="footer-dot">/</span>
          <span>VOICE-FIRST BANKER&apos;S ALGORITHM LABORATORY</span>
        </div>
        <div className="footer-right">
          <span>AI GUIDE: LISA</span>
          <span className="footer-dot">&bull;</span>
          <span>DIJKSTRA DEADLOCK AVOIDANCE ENGINE</span>
        </div>
      </footer>
    </main>
  );
}
