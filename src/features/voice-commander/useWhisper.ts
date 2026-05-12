import { useState } from "react";
import { whisper } from "../../lib/qvac";
import { logger } from "../../lib/logger";

export function useWhisper() {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const transcribe = async (blob: Blob): Promise<string> => {
    setIsTranscribing(true);
    try {
      const result = await whisper.transcribe(blob);
      return result.text;
    } catch (error) {
      logger.warn("Whisper transcription failed", error);
      return "";
    } finally {
      setIsTranscribing(false);
    }
  };

  return { isTranscribing, transcribe };
}
