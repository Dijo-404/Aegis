export type EmbedOptions = {
  modelPath: string;
};

export class EmbedLlamaCpp {
  constructor(options: EmbedOptions);
  load(): Promise<void>;
  embed(text: string): Promise<number[]>;
}
