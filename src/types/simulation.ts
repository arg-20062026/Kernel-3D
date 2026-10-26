export type SimulationStage =
  | "WELCOME"
  | "SYSTEM_CONFIG"
  | "PROCESS_NAMING"
  | "RESOURCE_NAMING"
  | "EXPLORING_3D"
  | "ALLOCATION_INPUT"
  | "SAFETY_ANALYSIS"
  | "SIMULATION_3D"
  | "SESSION_ENDED";

export type VoiceWorkflowState =
  | "awaiting-activation"
  | "requesting-microphone"
  | "welcoming"
  | "awaiting-start"
  | "asking-process-count"
  | "asking-resource-count"
  | "exploring-3d"
  | "awaiting-matrix-choice"
  | "editing-matrix"
  | "awaiting-matrix-confirmation"
  | "analyzing-safety"
  | "explaining-execution"
  | "session-ended"
  | "recoverable-error";

export interface SystemDimensions {
  processCount: number;
  resourceCount: number;
}

export interface SimulationModel {
  processCount: number;
  resourceCount: number;
  processNames: string[];
  resourceNames: string[];
  allocation: number[][];
  max: number[][];
  available: number[];
}

export interface ExecutionState {
  currentStepIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
}

export interface DialogueState {
  text: string;
  isSpeaking: boolean;
  isListening: boolean;
  status: "idle" | "speaking" | "listening" | "error" | "processing";
  lastError?: string;
}

export interface ResourceRequestFormState {
  processIndex: number;
  requestVector: number[];
}
