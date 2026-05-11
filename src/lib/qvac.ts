import {
  pipeline as hfPipeline,
  env as tfEnv,
  type AutomaticSpeechRecognitionPipeline,
  type FeatureExtractionPipeline,
  type TextGenerationPipeline,
  type ProgressInfo,
} from "@huggingface/transformers";

// Wrapper that escapes the overload union complexity TypeScript can't represent.
const pipeline = hfPipeline as (
  task: string,
  model: string,
  options?: Record<string, unknown>,
) => Promise<unknown>;
import { createWorker, type Worker as TesseractWorker } from "tesseract.js";
import { logger } from "./logger";

// Fetch from HF CDN; do not look for local model files.
tfEnv.allowLocalModels = false;
tfEnv.useBrowserCache = true;

export type ModelLoadProgress = {
  status: string;
  progress: number;
};

type ProgressCallback = (p: ModelLoadProgress) => void;

let _llm: TextGenerationPipeline | null = null;
let _embedder: FeatureExtractionPipeline | null = null;
let _whisper: AutomaticSpeechRecognitionPipeline | null = null;
let _tesseract: TesseractWorker | null = null;

export const llm = {
  async generate({
    prompt,
    maxTokens = 360,
    temperature = 0.2,
  }: {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ text: string }> {
    if (!_llm) {
      throw new Error("LLM not initialized. Call initQVAC() first.");
    }
    const messages = [{ role: "user" as const, content: prompt }];
    const result = await (_llm as TextGenerationPipeline)(messages, {
      max_new_tokens: maxTokens,
      temperature,
      do_sample: temperature > 0,
    });
    const output = Array.isArray(result) ? result[0] : result;
    const generated = (output as { generated_text?: unknown }).generated_text;
    if (Array.isArray(generated)) {
      const last = generated[generated.length - 1] as { content?: string };
      return { text: last?.content ?? "" };
    }
    return { text: String(generated ?? "") };
  },
};

export const embedder = {
  async embed(text: string): Promise<number[]> {
    if (!_embedder) {
      throw new Error("Embedder not initialized. Call initQVAC() first.");
    }
    const result = await _embedder(text, { pooling: "mean", normalize: true });
    return Array.from(result.data as Float32Array);
  },
};

export const whisper = {
  async transcribe(blob: Blob): Promise<{ text: string }> {
    if (!_whisper) {
      throw new Error("Whisper not initialized. Call initQVAC() first.");
    }
    const buffer = await blob.arrayBuffer();
    const float32 = blobToFloat32(buffer);
    const result = await (_whisper as AutomaticSpeechRecognitionPipeline)(
      float32,
      { language: "english" },
    );
    const text = Array.isArray(result)
      ? (result[0] as { text?: string })?.text ?? ""
      : (result as { text?: string })?.text ?? "";
    return { text };
  },
};

export const ocr = {
  async recognize(file: File): Promise<{ text: string }> {
    if (!_tesseract) {
      throw new Error("OCR not initialized. Call initQVAC() first.");
    }
    const url = URL.createObjectURL(file);
    try {
      const { data } = await _tesseract.recognize(url);
      return { text: data.text };
    } finally {
      URL.revokeObjectURL(url);
    }
  },
};

function blobToFloat32(buffer: ArrayBuffer): Float32Array {
  // If it's already raw PCM f32, return as-is. Otherwise naive passthrough —
  // whisper.cpp WASM handles WebM/Ogg internally; Transformers.js does too.
  return new Float32Array(buffer);
}

export async function initQVAC(onProgress?: ProgressCallback): Promise<void> {
  const report = (status: string, progress: number) => {
    logger.info(`[QVAC] ${status} (${Math.round(progress)}%)`);
    onProgress?.({ status, progress });
  };

  report("Loading models", 0);

  // Initialize all four in parallel. Each reports progress separately;
  // we aggregate into a rough 4-slot average.
  const progSlots = [0, 0, 0, 0];
  const aggregate = (slot: number, pct: number) => {
    progSlots[slot] = pct;
    const avg = progSlots.reduce((a, b) => a + b, 0) / progSlots.length;
    report("Downloading models", avg);
  };

  const makeHFProgress = (slot: number) => (p: ProgressInfo) => {
    aggregate(slot, "progress" in p ? (p.progress ?? 0) : 0);
  };

  _llm = (await pipeline("text-generation", "onnx-community/Qwen2.5-0.5B-Instruct", {
    dtype: "q4",
    progress_callback: makeHFProgress(0),
  })) as TextGenerationPipeline;

  _embedder = (await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2", {
    progress_callback: makeHFProgress(1),
  })) as FeatureExtractionPipeline;

  _whisper = (await pipeline("automatic-speech-recognition", "Xenova/whisper-tiny.en", {
    progress_callback: makeHFProgress(2),
  })) as AutomaticSpeechRecognitionPipeline;

  // Tesseract runs separately — no progress slot needed (instant init).
  _tesseract = await createWorker("eng", 1, {
    logger: (m: { status: string; progress: number }) => {
      aggregate(3, m.progress * 100);
    },
  });

  report("Models ready", 100);
  logger.info("[QVAC] All models ready");
}
