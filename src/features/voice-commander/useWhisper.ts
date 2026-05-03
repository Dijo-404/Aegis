import { useState } from "react";
import { whisper } from "../../lib/qvac";

export function useWhisper() {
  const [isTranscribing, setIsTranscribing] = useState(false);

  const transcribe = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      const result = await whisper.transcribe(blob);
      return result?.text ?? "";
    } catch {
      return "";
    } finally {
      setIsTranscribing(false);
    }
  };

  return { isTranscribing, transcribe };
}
