export type WhisperOptions = {
  modelPath: string;
};

export class WhisperCpp {
  constructor(options: WhisperOptions);
  load(): Promise<void>;
  transcribe(audio: Blob): Promise<{ text: string }>;
}
