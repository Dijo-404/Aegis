import { QVAC } from '@qvac/sdk';
import { LlamaCpp } from '@qvac/llm-llamacpp';
import { EmbedLlamaCpp } from '@qvac/embed-llamacpp';
import { OcrOnnx } from '@qvac/ocr-onnx';
import { WhisperCpp } from '@qvac/transcription-whispercpp';
import { logger } from './logger';

const modelBase = './public/models';

export const qvac = new QVAC();

export const llm = new LlamaCpp({
  modelPath: `${modelBase}/llm/mistral-7b-q4.gguf`,
  contextSize: 4096,
  gpuLayers: 32,
});

export const embedder = new EmbedLlamaCpp({
  modelPath: `${modelBase}/embed/nomic-embed-text-v1.5.gguf`,
});

export const ocr = new OcrOnnx({
  modelPath: `${modelBase}/ocr/`,
});

export const whisper = new WhisperCpp({
  modelPath: `${modelBase}/whisper/ggml-base.en.bin`,
});

export async function initQVAC() {
  logger.info('[QVAC] Initializing local models');
  await qvac.initialize();
  await Promise.all([llm.load(), embedder.load(), ocr.load(), whisper.load()]);
  logger.info('[QVAC] Models ready');
}
