export type OcrOptions = {
  modelPath: string;
};

export class OcrOnnx {
  constructor(options: OcrOptions);
  load(): Promise<void>;
  recognize(file: Blob): Promise<{ text: string }>;
}
