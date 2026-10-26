// Enhanced Speech synthesis and recognition manager for KERNEL 3D

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

export type VoiceState = "idle" | "speaking" | "listening" | "paused" | "error";

interface SpeechRecognitionResultItem {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: {
    length: number;
    [itemIndex: number]: SpeechRecognitionResultItem;
    isFinal: boolean;
  };
}

interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message?: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
}

interface WindowWithSpeechRecognition {
  AudioContext?: typeof AudioContext;
  webkitAudioContext?: typeof AudioContext;
  SpeechRecognition?: new () => ISpeechRecognition;
  webkitSpeechRecognition?: new () => ISpeechRecognition;
}

class SpeechManager {
  private isMuted: boolean = false;
  private recognitionInstance: ISpeechRecognition | null = null;
  private isListeningActive: boolean = false;
  private isPausedForTTS: boolean = false;
  private activeHandlers: SpeechRecognitionHandlers | null = null;
  private audioContext: AudioContext | null = null;

  constructor() {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.onvoiceschanged = () => {
        // Voices available in browser
      };
    }
  }

  public isTTSSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public isSTTSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    );
  }

  /**
   * Initializes audio context on user gesture to unlock browser autoplay restriction.
   */
  public async unlockAudioContext(): Promise<boolean> {
    try {
      if (typeof window !== "undefined") {
        const win = window as unknown as WindowWithSpeechRecognition;
        const AudioCtx = win.AudioContext || win.webkitAudioContext;
        if (AudioCtx) {
          if (!this.audioContext) {
            this.audioContext = new AudioCtx();
          }
          if (this.audioContext && this.audioContext.state === "suspended") {
            await this.audioContext.resume();
          }
        }
      }
      return true;
    } catch {
      return false;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  public stopSpeaking() {
    if (this.isTTSSupported()) {
      window.speechSynthesis.cancel();
    }
  }

  /**
   * Speaks the text via browser speechSynthesis.
   * Automatically pauses speech recognition while speaking to prevent feedback loops,
   * then resumes recognition after speech ends.
   */
  public speak(
    text: string,
    options?: {
      onStart?: () => void;
      onEnd?: () => void;
      onError?: (err: unknown) => void;
    },
  ) {
    if (!this.isTTSSupported() || this.isMuted) {
      options?.onEnd?.();
      return;
    }

    try {
      // Pause recognition while speaking so Lisa doesn't hear herself
      this.pauseRecognitionForSpeech();

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.98; // natural, measured rate
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      const preferredVoice =
        voices.find(
          (v) =>
            v.lang.startsWith("en") &&
            (v.name.includes("Female") ||
              v.name.includes("Samantha") ||
              v.name.includes("Victoria") ||
              v.name.includes("Zira") ||
              v.name.includes("Google UK English Female") ||
              v.name.includes("Karen")),
        ) ||
        voices.find((v) => v.lang.startsWith("en")) ||
        voices[0];

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        options?.onEnd?.();
        // Resume listening after speaking finishes
        this.resumeRecognitionAfterSpeech();
      };

      utterance.onerror = (event) => {
        options?.onError?.(event);
        this.resumeRecognitionAfterSpeech();
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      options?.onError?.(e);
      this.resumeRecognitionAfterSpeech();
    }
  }

  /**
   * Begins listening continuously for speech commands.
   */
  public startListening(handlers: SpeechRecognitionHandlers): () => void {
    if (!this.isSTTSupported()) {
      handlers.onError("Speech recognition is not supported in this browser. Voice controls will use typing fallback.");
      return () => {};
    }

    this.activeHandlers = handlers;
    this.isListeningActive = true;
    this.isPausedForTTS = false;

    this.createAndStartRecognition();

    return () => {
      this.stopListening();
    };
  }

  private createAndStartRecognition() {
    if (!this.isListeningActive || this.isPausedForTTS) return;

    try {
      if (this.recognitionInstance) {
        try {
          this.recognitionInstance.abort();
        } catch {
          // ignore
        }
        this.recognitionInstance = null;
      }

      const windowRef = window as unknown as WindowWithSpeechRecognition;
      const SpeechRecognitionCtor =
        windowRef.SpeechRecognition || windowRef.webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) return;

      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        this.activeHandlers?.onStart();
      };

      recognition.onresult = (event: SpeechRecognitionEvent) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript?.trim() || "";
          const isFinal = Boolean(result.isFinal);
          if (transcript) {
            this.activeHandlers?.onResult(transcript, isFinal);
          }
        }
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        // "no-speech" and "aborted" are routine browser events in continuous mode
        if (event.error === "no-speech" || event.error === "aborted") {
          return;
        }

        let msg = "Microphone error";
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          msg = "Microphone access was denied. Please allow microphone permission in your browser.";
          this.isListeningActive = false;
        } else if (event.error === "network") {
          msg = "Voice recognition network connectivity issue.";
        }
        this.activeHandlers?.onError(msg);
      };

      recognition.onend = () => {
        this.activeHandlers?.onEnd();
        // If still marked active and not paused for TTS, restart recognition cleanly
        if (this.isListeningActive && !this.isPausedForTTS) {
          setTimeout(() => {
            if (this.isListeningActive && !this.isPausedForTTS) {
              this.createAndStartRecognition();
            }
          }, 250);
        }
      };

      this.recognitionInstance = recognition;
      recognition.start();
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to initialize microphone.";
      this.activeHandlers?.onError(msg);
    }
  }

  private pauseRecognitionForSpeech() {
    if (this.isListeningActive && this.recognitionInstance) {
      this.isPausedForTTS = true;
      try {
        this.recognitionInstance.abort();
      } catch {
        // ignore
      }
    }
  }

  private resumeRecognitionAfterSpeech() {
    if (this.isListeningActive && this.isPausedForTTS) {
      this.isPausedForTTS = false;
      setTimeout(() => {
        if (this.isListeningActive && !this.isPausedForTTS) {
          this.createAndStartRecognition();
        }
      }, 300);
    }
  }

  /**
   * Completely stops listening and releases microphone.
   */
  public stopListening() {
    this.isListeningActive = false;
    this.isPausedForTTS = false;
    this.activeHandlers = null;

    if (this.recognitionInstance) {
      try {
        this.recognitionInstance.abort();
      } catch {
        // ignore
      }
      this.recognitionInstance = null;
    }
  }

  public getIsListening(): boolean {
    return this.isListeningActive && !this.isPausedForTTS;
  }
}

export const speechManager = new SpeechManager();
