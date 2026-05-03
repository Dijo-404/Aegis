# Aegis

Sovereign, non-custodial Solana wallet with local-first AI: Sign Guard, Voice Commander, and Portfolio Brain.

## Requirements

- Node.js 18+
- pnpm
- Modern browser with WebGPU or WebAssembly support

## Setup

```bash
pnpm install
pnpm models:download
```

If you have custom QVAC OCR assets, place them under `public/models/ocr/`.

## Environment

Copy `.env.example` to `.env` and adjust if needed:

```bash
cp .env.example .env
```

If you want USDT transfers in devnet, set `VITE_USDT_MINT` to a devnet mint address.

## Run (Devnet)

```bash
pnpm dev
```

## Build

```bash
pnpm build
pnpm preview
```

## Project Structure

- `src/features/wallet` - WDK integration and balance
- `src/features/sign-guard` - OCR + LLM transaction analysis
- `src/features/voice-commander` - Whisper STT + intent parsing
- `src/features/portfolio-brain` - embeddings, vector store, RAG chat

## Notes

- All AI inference runs locally via QVAC SDK modules.
- No telemetry or cloud inference is used.
- Default network is devnet.
- The bundled WDK package is a local devnet stub so installs work without private registry access.
- QVAC SDK packages are stubbed locally for this repo; replace with official packages when you have registry access.
