# Aegis

Sovereign, non-custodial Solana wallet with local-first AI: Sign Guard, Voice Commander, and Portfolio Brain.

All AI inference runs entirely in the browser using [Transformers.js](https://huggingface.co/docs/transformers.js) (ONNX runtime) and [Tesseract.js](https://tesseract.projectnaptha.com/). No telemetry. No cloud inference. Your keys and data never leave the device.

## Architecture

```
Browser
├── Wallet (WDK + @solana/web3.js)   — real keypairs, live RPC
├── Sign Guard                        — OCR (Tesseract.js) + LLM risk analysis
├── Voice Commander                   — Whisper STT + intent parser
└── Portfolio Brain                   — MiniLM embeddings + Vectra vector DB + Qwen2.5 LLM
```

| AI Component | Model | Library | Size |
|---|---|---|---|
| LLM (Sign Guard / Portfolio) | Qwen2.5-0.5B-Instruct (q4) | @huggingface/transformers | ~500 MB |
| Embeddings (Portfolio Brain) | all-MiniLM-L6-v2 | @huggingface/transformers | ~25 MB |
| Speech-to-text (Voice) | whisper-tiny.en | @huggingface/transformers | ~40 MB |
| OCR (Sign Guard upload) | eng traineddata | tesseract.js | ~10 MB |

Models are downloaded from the Hugging Face CDN on first use and cached in the browser's IndexedDB — subsequent loads are instant.

## Requirements

- Node.js 18+
- A Solana RPC endpoint (see [DEPLOY.md](DEPLOY.md) for provider options)
- Modern browser with WebAssembly support (Chrome 89+, Firefox 89+, Safari 15.2+)

## Setup

```bash
npm install
cp .env.example .env
# Edit .env and set VITE_SOLANA_RPC to your RPC endpoint
npm run dev
```

Open http://localhost:5173. On first load the app downloads ~570 MB of ONNX models. Subsequent loads are instant from browser cache.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `VITE_SOLANA_RPC` | Yes | Solana RPC endpoint URL |
| `VITE_SOLANA_NETWORK` | No | Label shown in UI (`mainnet-beta` or `devnet`). Default: `mainnet-beta` |
| `VITE_USDT_MINT` | No | SPL USDT mint address. Default: mainnet USDT |
| `VITE_QVAC_LOG_LEVEL` | No | Log level (`error`/`warn`/`info`/`debug`). Default: `warn` |

## Build

```bash
npm run build
npm run preview
```

## Deploy

See [DEPLOY.md](DEPLOY.md) for step-by-step Vercel and Netlify deployment guides.

## License

MIT — see [LICENSE](LICENSE).
