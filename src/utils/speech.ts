// Speech synthesis and recognition utility with safe browser fallbacks

export interface SpeechRecognitionHandlers {
  onResult: (transcript: string) => void;
  onError: (error: string) => void;
  onStart: () => void;
  onEnd: () => void;
}

// Global speech synthesis manager
class SpeechManager {
  private isMuted: boolean = false;
  private recognitionInstance: EventTarget | null = null;

  public isTTSSupported(): boolean {
    return typeof window !== "undefined" && "speechSynthesis" in window;
  }

  public isSTTSupported(): boolean {
    return (
      typeof window !== "undefined" &&
      ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    );
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
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.05;

      const voices = window.speechSynthesis.getVoices();
      // Try finding preferred English female voice
      const preferredVoice = voices.find(
        (v) =>
          v.lang.startsWith("en") &&
          (v.name.includes("Female") ||
            v.name.includes("Samantha") ||
            v.name.includes("Victoria") ||
            v.name.includes("Zira") ||
            v.name.includes("Google UK English Female") ||
            v.name.includes("Karen")),
      ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        options?.onStart?.();
      };

      utterance.onend = () => {
        options?.onEnd?.();
      };

      utterance.onerror = (event) => {
        options?.onError?.(event);
      };

      window.speechSynthesis.speak(utterance);
    } catch (e) {
      options?.onError?.(e);
    }
  }

  public startListening(handlers: SpeechRecognitionHandlers): () => void {
    if (!this.isSTTSupported()) {
      handlers.onError("Speech recognition is not supported in this browser.");
      return () => {};
    }

    try {
      const windowRef = window as unknown as Record<string, unknown>;
      const SpeechRecognitionCtor = (windowRef.SpeechRecognition ||
        windowRef.webkitSpeechRecognition) as new () => {
        continuous: boolean;
        interimResults: boolean;
        lang: string;
        onstart: () => void;
        onresult: (e: { results: { [index: number]: { [index: number]: { transcript: string } } } }) => void;
        onerror: (e: { error: string }) => void;
        onend: () => void;
        start: () => void;
        abort: () => void;
      };

      const recognition = new SpeechRecognitionCtor();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        handlers.onStart();
      };

      recognition.onresult = (event) => {
        const transcript =
          event.results[0]?.[0]?.transcript?.trim().toLowerCase() || "";
        handlers.onResult(transcript);
      };

      recognition.onerror = (event) => {
        let msg = "Microphone error";
        if (event.error === "not-allowed" || event.error === "permission-denied") {
          msg = "Microphone permission was denied.";
        } else if (event.error === "no-speech") {
          msg = "No speech detected. Please try again.";
        } else if (event.error === "network") {
          msg = "Speech recognition network issue.";
        }
        handlers.onError(msg);
      };

      recognition.onend = () => {
        handlers.onEnd();
      };

      this.recognitionInstance = recognition as unknown as EventTarget;
      recognition.start();

      return () => {
        try {
          recognition.abort();
        } catch {
          // ignore
        }
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to start speech recognition.";
      handlers.onError(msg);
      return () => {};
    }
  }

  public stopListening() {
    if (this.recognitionInstance) {
      try {
        const rec = this.recognitionInstance as unknown as { abort: () => void };
        rec.abort();
      } catch {
        // ignore
      }
      this.recognitionInstance = null;
    }
  }
}

export const speechManager = new SpeechManager();
