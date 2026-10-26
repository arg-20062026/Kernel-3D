
import {
  calculateNeed,
  runSafetyAlgorithm,
  type BankerInput,
} from "./banker";

export type ResourceRequestResult =
  | {
      granted: true;
      input: BankerInput;
      safeSequence: number[];
    }
  | {
      granted: false;
      reason:
        | "invalid-process"
        | "invalid-request"
        | "exceeds-need"
        | "unavailable"
        | "unsafe";
      message: string;
      unfinishedProcesses?: number[];
    };

function cloneInput(input: BankerInput): BankerInput {
  return {
    allocation: input.allocation.map((row) => [...row]),
    max: input.max.map((row) => [...row]),
    available: [...input.available],
  };
}

export function evaluateResourceRequest(
  input: BankerInput,
  process: number,
  request: number[],
): ResourceRequestResult {
  if (
    !Number.isSafeInteger(process) ||
    process < 0 ||
    process >= input.allocation.length
  ) {
    return {
      granted: false,
      reason: "invalid-process",
      message: "Select a valid process.",
    };
  }

  if (
    request.length !== input.available.length ||
    !request.every(
      (value) => Number.isSafeInteger(value) && value >= 0,
    )
  ) {
    return {
      granted: false,
      reason: "invalid-request",
      message: "Enter a non-negative integer for every resource type.",
    };
  }

  let need: number[][];

  try {
    need = calculateNeed(input.allocation, input.max);
    runSafetyAlgorithm(input);
  } catch (error) {
    return {
      granted: false,
      reason: "invalid-request",
      message:
        error instanceof Error
          ? error.message
          : "The current system state is invalid.",
    };
  }

  if (request.some((value, j) => value > need[process][j])) {
    return {
      granted: false,
      reason: "exceeds-need",
      message: `P${process} cannot request more than its remaining Need.`,
    };
  }

  if (request.some((value, j) => value > input.available[j])) {
    return {
      granted: false,
      reason: "unavailable",
      message: "The system does not have enough Available resources.",
    };
  }

  const tentative = cloneInput(input);

  for (let j = 0; j < request.length; j++) {
    tentative.available[j] -= request[j];
    tentative.allocation[process][j] += request[j];
  }

  const result = runSafetyAlgorithm(tentative);

  if (!result.isSafe) {
    return {
      granted: false,
      reason: "unsafe",
      message: "Granting this request would leave the system in an unsafe state.",
      unfinishedProcesses: result.unfinishedProcesses,
    };
  }

  return {
    granted: true,
    input: tentative,
    safeSequence: result.safeSequence,
  };
}
