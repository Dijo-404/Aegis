import { useState } from "react";
import { ocr } from "../../lib/qvac";

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false);

  const extractText = async (file: File) => {
    setIsProcessing(true);
    try {
      const result = await ocr.recognize(file);
      return result?.text ?? "";
    } catch {
      return "";
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, extractText };
}
