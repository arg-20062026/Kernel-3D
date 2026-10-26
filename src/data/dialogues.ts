import type { SimulationStage } from "../types/simulation";

export const STAGE_DIALOGUES: Record<SimulationStage, string> = {
  WELCOME:
    "Hi, I'm Lisa. Welcome to Banker's Algorithm. Say Start to begin the simulation.",
  SYSTEM_CONFIG:
    "Before we begin, enter the number of processes and resource types you want to simulate.",
  PROCESS_NAMING:
    "Great! Now enter the names of your processes. You can use P1, P2, P3, or any names you prefer.",
  RESOURCE_NAMING:
    "Now enter the names of your resource types, for example A, B, and C.",
  ALLOCATION_INPUT:
    "Good! Now enter the allocated and maximum resources for each process, along with the currently available resources.",
  SAFETY_ANALYSIS:
    "Here is the safety analysis. We evaluate remaining Need against available Work to prove deadlock avoidance.",
  SIMULATION_3D:
    "Welcome to the 3D Resource Universe. Follow along as each process executes and safely returns resources.",
};

export const STAGE_TITLES: Record<SimulationStage, string> = {
  WELCOME: "Laboratory Introduction",
  SYSTEM_CONFIG: "System Dimensions",
  PROCESS_NAMING: "Process Identifiers",
  RESOURCE_NAMING: "Resource Classes",
  ALLOCATION_INPUT: "Resource Matrices",
  SAFETY_ANALYSIS: "Safety Verification",
  SIMULATION_3D: "Resource Universe 3D",
};
