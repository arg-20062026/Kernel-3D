// Voice command parsing and normalization for KERNEL 3D

const NUMBER_WORDS: Record<string, number> = {
  zero: 0,
  one: 1,
  two: 2,
  to: 2, // common STT homophone
  too: 2,
  three: 3,
  tree: 3,
  four: 4,
  for: 4, // common STT homophone
  fore: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  ate: 8,
  nine: 9,
  ten: 10,
};

/**
 * Normalizes speech input by trimming, lowercasing, and removing punctuation.
 */
export function normalizeVoiceInput(input: string): string {
  return input
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()?]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Parses a single number word or digit string into an integer.
 */
export function parseSpokenNumber(token: string): number | null {
  const clean = token.toLowerCase().trim();
  if (clean in NUMBER_WORDS) {
    return NUMBER_WORDS[clean];
  }
  const parsed = parseInt(clean, 10);
  if (!Number.isNaN(parsed)) {
    return parsed;
  }
  return null;
}

/**
 * Parses process count from natural student utterances like:
 * "five", "5", "five processes", "I want 5 processes", "let's do 4"
 */
export function parseProcessCount(input: string): number | null {
  const norm = normalizeVoiceInput(input);
  if (!norm) return null;

  // Check direct single number word/digit
  const direct = parseSpokenNumber(norm);
  if (direct !== null) return direct;

  const tokens = norm.split(" ");
  for (let i = 0; i < tokens.length; i++) {
    const num = parseSpokenNumber(tokens[i]);
    if (num !== null) {
      return num;
    }
  }

  return null;
}

/**
 * Parses resource count from natural student utterances like:
 * "three", "3", "three resources", "three resource types", "I need 2"
 */
export function parseResourceCount(input: string): number | null {
  return parseProcessCount(input);
}

export interface MatrixVoiceEdit {
  matrixType: "allocation" | "max";
  processIndex: number;
  values: number[];
}

export type MatrixEditParseResult =
  | { success: true; edit: MatrixVoiceEdit }
  | { success: false; error: string };

/**
 * Parses voice commands to edit a matrix row.
 * Example commands:
 * - "change allocation matrix of process p2 to 1 3 4"
 * - "change max matrix of process p0 to 7 5 3"
 * - "change allocation of p1 to 2 0 0"
 * - "set max for process 2 to 3 2 2"
 */
export function parseMatrixEditCommand(
  rawTranscript: string,
  processCount: number,
  resourceCount: number,
): MatrixEditParseResult {
  const norm = normalizeVoiceInput(rawTranscript);

  // Must mention allocation or max
  let matrixType: "allocation" | "max";
  if (norm.includes("allocation") || norm.includes("allocated")) {
    matrixType = "allocation";
  } else if (norm.includes("max") || norm.includes("maximum")) {
    matrixType = "max";
  } else {
    return {
      success: false,
      error: "Specify whether you want to change 'Allocation' or 'Maximum'.",
    };
  }

  // Must have "to" separating the process and the values
  const toSplit = norm.split(/\bto\b/);
  if (toSplit.length < 2) {
    return {
      success: false,
      error: "Please say 'to' before the values, for example: 'Change Allocation of P1 to 1 2 3'.",
    };
  }

  const prefix = toSplit[0].trim();
  const valueTokens = toSplit[1].trim().split(/\s+/).filter(Boolean);

  // Extract process index from prefix
  let processIndex: number | null = null;
  // Match "p0", "p1", "process 0", "process p0", "process zero"
  const pMatch = prefix.match(/\bp\s*(\d+)\b/i) || prefix.match(/\bprocess\s*(?:p)?\s*(\w+)\b/i);
  if (pMatch) {
    const rawP = pMatch[1];
    processIndex = parseSpokenNumber(rawP);
  }

  if (processIndex === null) {
    return {
      success: false,
      error: "Could not identify the process. Please specify, for example: 'process P0' or 'process P1'.",
    };
  }

  if (processIndex < 0 || processIndex >= processCount) {
    return {
      success: false,
      error: `Process P${processIndex} is out of range. Current processes are P0 through P${processCount - 1}.`,
    };
  }

  // Parse values
  const values: number[] = [];
  for (const token of valueTokens) {
    const num = parseSpokenNumber(token);
    if (num === null || num < 0) {
      return {
        success: false,
        error: `Could not parse value '${token}'. Values must be non-negative integers.`,
      };
    }
    values.push(num);
  }

  if (values.length !== resourceCount) {
    return {
      success: false,
      error: `Expected ${resourceCount} resource values, but heard ${values.length} values ([${values.join(", ")}]).`,
    };
  }

  return {
    success: true,
    edit: {
      matrixType,
      processIndex,
      values,
    },
  };
}

/**
 * Checks if transcript contains a recognized primary command.
 */
export function isExactCommand(
  transcript: string,
  command: "start" | "next" | "skip" | "back" | "exit" | "play" | "pause" | "reset",
): boolean {
  const norm = normalizeVoiceInput(transcript);
  if (!norm) return false;

  switch (command) {
    case "start":
      if (norm.includes("restart")) return false;
      return (
        norm === "start" ||
        norm === "start please" ||
        norm === "please start" ||
        norm === "lets start" ||
        norm === "let's start" ||
        norm === "start simulation" ||
        norm === "start the simulation" ||
        norm === "begin" ||
        norm === "begin simulation" ||
        /^(?:please\s+|let(?:'?s)?\s+)?start(?:\s+please|\s+now|\s+simulation|\s+the\s+simulation)?$/i.test(
          norm,
        )
      );
    case "next":
      return norm === "next" || norm === "continue" || norm === "proceed" || norm === "go next";
    case "skip":
      return norm === "skip" || norm === "skip editing" || norm === "keep predefined";
    case "back":
      return norm === "back" || norm === "go back" || norm === "previous";
    case "exit":
      return norm === "exit" || norm === "stop" || norm === "quit" || norm === "end session";
    case "play":
      return norm === "play" || norm === "run" || norm === "resume";
    case "pause":
      return norm === "pause" || norm === "hold";
    case "reset":
      return norm === "reset" || norm === "restart";
    default:
      return false;
  }
}
