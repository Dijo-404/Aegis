export type LlamaOptions = {
  modelPath: string;
  contextSize?: number;
  gpuLayers?: number;
};

export class LlamaCpp {
  constructor(options: LlamaOptions);
  load(): Promise<void>;
  generate(input: {
    prompt: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ text: string }>;
}
