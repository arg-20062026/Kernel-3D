import type { SimulationStage, VoiceWorkflowState } from "../types/simulation";

export const STAGE_DIALOGUES: Record<SimulationStage, string> = {
  WELCOME:
    "Hi, I'm Lisa, welcome to Banker's Algorithm Simulation. Please allow microphone access to proceed.",
  SYSTEM_CONFIG:
    "Cool. We need the number of processes. Tell me how many processes you want.",
  PROCESS_NAMING:
    "Process count confirmed. Now tell me the number of resource types.",
  RESOURCE_NAMING:
    "Resource types confirmed. Let's inspect the system in 3D.",
  EXPLORING_3D:
    "This is the 3D view. Processes are represented by boxes, and resource types are represented by spheres. You can explore the scene. Say 'Next' when you're ready.",
  ALLOCATION_INPUT:
    "No need to type. This is a predefined matrix of Allocation and Maximum values. Say what you want to change, or say 'Skip' to continue.",
  SAFETY_ANALYSIS:
    "Here is the safety analysis. We evaluate remaining Need against available Work to prove deadlock avoidance.",
  SIMULATION_3D:
    "Watch as processes execute in safe sequence order. Each completed process safely returns its allocated resources to the system pool.",
  SESSION_ENDED:
    "Simulation session ended. Microphone and audio resources have been released. Say 'Restart' to begin a new session.",
};

export const WORKFLOW_PROMPTS: Record<VoiceWorkflowState, string> = {
  "awaiting-activation":
    "Hi, I'm Lisa, welcome to Banker's Algorithm Simulation. Please enable voice and microphone to proceed.",
  "requesting-microphone":
    "Please grant microphone permission in your browser prompt.",
  welcoming:
    "Hi, I'm Lisa, welcome to Banker's Algorithm Simulation. Please allow microphone access to proceed.",
  "awaiting-start":
    "Good, say start to proceed.",
  "asking-process-count":
    "Cool. We need the number of processes. Tell me how many processes you want.",
  "asking-resource-count":
    "Now tell me the number of resource types.",
  "exploring-3d":
    "This is the 3D view. Processes are represented by boxes, and resource types are represented by spheres. You can explore the scene. Say 'Next' when you're ready.",
  "awaiting-matrix-choice":
    "No need to type. This is a predefined matrix of Allocation and Maximum values. Say what you want to change, or say 'Skip' to continue.",
  "editing-matrix":
    "You can change a row, for example say: 'Change Allocation of P1 to 2 0 0'. Or say 'Next' when done.",
  "awaiting-matrix-confirmation":
    "Matrix updated. Say another change, or say 'Next' to analyze safety.",
  "analyzing-safety":
    "Safety analysis complete. Inspect the safe sequence and execution trace. Say 'Next' for 3D simulation.",
  "explaining-execution":
    "Executing safe trace. Say 'Play', 'Pause', 'Next', or 'Reset'. Say 'Exit' to finish.",
  "session-ended":
    "Simulation session ended. Microphone and audio have been released. Say 'Restart' to begin again.",
  "recoverable-error":
    "I didn't quite catch that. Please repeat your command.",
};

export const STAGE_TITLES: Record<SimulationStage, string> = {
  WELCOME: "Laboratory Introduction",
  SYSTEM_CONFIG: "System Dimensions",
  PROCESS_NAMING: "Process Identifiers",
  RESOURCE_NAMING: "Resource Classes",
  EXPLORING_3D: "3D Universe Exploration",
  ALLOCATION_INPUT: "Resource Matrices",
  SAFETY_ANALYSIS: "Safety Verification",
  SIMULATION_3D: "3D Process Execution",
  SESSION_ENDED: "Session Complete",
};
