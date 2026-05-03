const hashText = (text) => {
  const vector = new Array(32).fill(0);
  for (let i = 0; i < text.length; i += 1) {
    const code = text.charCodeAt(i);
    vector[i % 32] += code / 255;
  }
  return vector;
};

export class EmbedLlamaCpp {
  constructor(options) {
    this.options = options;
  }

  async load() {
    return;
  }

  async embed(text) {
    return hashText(text);
  }
}
