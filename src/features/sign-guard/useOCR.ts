import { useState } from "react";
import { ocr } from "../../lib/qvac";
import { logger } from "../../lib/logger";

export function useOCR() {
  const [isProcessing, setIsProcessing] = useState(false);

  const extractText = async (file: File): Promise<string> => {
    setIsProcessing(true);
    try {
      const result = await ocr.recognize(file);
      return result.text;
    } catch (error) {
      logger.warn("OCR failed", error);
      return "";
    } finally {
      setIsProcessing(false);
    }
  };

  return { isProcessing, extractText };
}
