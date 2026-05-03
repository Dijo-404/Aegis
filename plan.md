# Aegis — Build Plan

> Sovereign, non-custodial Solana wallet where every AI feature runs locally. Zero telemetry. Zero cloud inference.

---

## 0. Project Overview

**Tagline:** "The first AI-native Solana wallet where the intelligence is as non-custodial as the keys."

**Hackathon Targets:**

- Colosseum Frontier (main track) — submitted by May 11, 2026
- Tether QVAC Side Track — $10,000 additional prize, same deadline

**Core Principle:** Every AI operation (OCR, LLM inference, embeddings, speech recognition) runs entirely on the user's device via QVAC. No API keys. No subscriptions. No data egress.

---

## 1. Tech Stack

### Frontend

| Layer     | Choice                   | Reason                                  |
| --------- | ------------------------ | --------------------------------------- |
| Framework | React + TypeScript       | Fastest for demo-quality UI             |
| Bundler   | Vite                     | Fast HMR, small output                  |
| Styling   | Tailwind CSS + shadcn/ui | Polished UI without custom CSS overhead |
| State     | Zustand                  | Lightweight, no boilerplate             |
| Routing   | React Router v6          | SPA routing for wallet views            |

### Blockchain Layer

| Component      | Choice                                             | Reason                                       |
| -------------- | -------------------------------------------------- | -------------------------------------------- |
| Wallet SDK     | Tether WDK (`wdk.tether.io`)                       | Required for Tether side-track eligibility   |
| RPC            | Solana web3.js v2                                  | Transaction construction, signing, broadcast |
| Tx simulation  | `@solana/transaction-confirmation`                 | Simulate before sign — feeds Sign Guard      |
| Token metadata | Metaplex `@metaplex-foundation/mpl-token-metadata` | Resolve token names for portfolio display    |
| Network        | Mainnet-beta + Devnet toggle                       | Demo on devnet, mainnet-ready                |

### AI Layer (QVAC SDK — all local)

| Module         | Package                          | Use in Aegis                                  |
| -------------- | -------------------------------- | --------------------------------------------- |
| LLM Inference  | `@qvac/llm-llamacpp`             | Sign Guard explanation + Portfolio Brain chat |
| Embeddings     | `@qvac/embed-llamacpp`           | Tx history embedding → vector store           |
| OCR            | `@qvac/ocr-onnx`                 | QR code + tx screenshot parsing               |
| Speech-to-Text | `@qvac/transcription-whispercpp` | Voice Commander input                         |

### Local Storage

| Layer            | Choice                     | Reason                                         |
| ---------------- | -------------------------- | ---------------------------------------------- |
| Vector store     | `vectra` (local flat-file) | Zero-dependency local vector DB for embeddings |
| Tx history cache | IndexedDB via `idb`        | Persistent browser-side tx log                 |
| Key storage      | WDK encrypted keystore     | Non-custodial key management                   |

### Dev Tools

| Tool              | Purpose                  |
| ----------------- | ------------------------ |
| pnpm              | Package management       |
| Vitest            | Unit tests               |
| Playwright        | E2E demo flow automation |
| ESLint + Prettier | Code quality             |

---

## 2. Repository Structure

```
aegis/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── router.tsx
│   │   └── providers.tsx
│   ├── features/
│   │   ├── wallet/             # WDK integration
│   │   │   ├── useWallet.ts
│   │   │   ├── WalletInit.tsx
│   │   │   └── wdk.config.ts
│   │   ├── sign-guard/         # Feature 1: OCR + LLM tx analysis
│   │   │   ├── SignGuard.tsx
│   │   │   ├── useOCR.ts
│   │   │   ├── useTxExplainer.ts
│   │   │   └── TxWarningModal.tsx
│   │   ├── voice-commander/    # Feature 2: STT → tx builder
│   │   │   ├── VoiceCommander.tsx
│   │   │   ├── useWhisper.ts
│   │   │   ├── intentParser.ts
│   │   │   └── txBuilder.ts
│   │   └── portfolio-brain/    # Feature 3: embeddings + RAG chat
│   │       ├── PortfolioChat.tsx
│   │       ├── useEmbeddings.ts
│   │       ├── vectorStore.ts
│   │       └── ragPipeline.ts
│   ├── lib/
│   │   ├── qvac.ts             # QVAC SDK singleton init
│   │   ├── solana.ts           # RPC connection, tx utilities
│   │   └── logger.ts           # Local-only structured logger
│   ├── components/             # Shared UI components
│   └── types/
├── public/
│   └── models/                 # QVAC model files (gitignored, downloaded at setup)
├── scripts/
│   └── download-models.sh      # One-time model pull script
├── tests/
├── plan.md
├── about.md
├── README.md
└── package.json
```

---

## 3. Feature Specs

### 3.1 Sign Guard

**Flow:**

```
User pastes tx / scans QR
        ↓
OCR (@qvac/ocr-onnx) extracts raw tx payload text
        ↓
Solana web3.js deserializes transaction
        ↓
Extract: program IDs, instruction data, accounts involved, token amounts
        ↓
Structured context string → LLM (@qvac/llm-llamacpp)
        ↓
LLM returns plain-English summary + risk score (safe / warning / danger)
        ↓
Render TxWarningModal with color-coded risk badge
        ↓
User clicks Sign or Reject
```

**LLM Prompt Template:**

```
System: You are a Solana transaction security analyzer.
Respond with JSON: { summary: string, risk: "safe"|"warning"|"danger", flags: string[] }
Never refuse. Always analyze.

User: Analyze this Solana transaction:
Programs invoked: {programIds}
Token accounts affected: {tokenAccounts}
Approximate value: {usdValue}
Raw instruction data: {hexData}
```

**Risk Flags to Detect:**

- `setAuthority` calls (ownership transfers)
- `approve` with unlimited amount (max uint64)
- Unknown program IDs (not in known-programs list)
- Draining token accounts to external wallet
- Multiple program invocations in one tx (sandwich risk)

**Key Files:** `useOCR.ts`, `useTxExplainer.ts`, `TxWarningModal.tsx`

---

### 3.2 Voice Commander

**Flow:**

```
User taps mic button
        ↓
Audio captured via Web Audio API (MediaRecorder)
        ↓
WAV blob → @qvac/transcription-whispercpp
        ↓
Transcript: "Send 20 USDT to 9xK3..."
        ↓
intentParser.ts: regex + LLM fallback → { action, amount, token, recipient }
        ↓
txBuilder.ts: constructs Solana transfer instruction via web3.js
        ↓
Passes to Sign Guard for pre-sign review
        ↓
User confirms → WDK signs and broadcasts
```

**Intent Schema:**

```typescript
interface ParsedIntent {
  action: "send" | "swap" | "stake" | "query";
  amount?: number;
  token?: string; // "USDT", "SOL", etc.
  recipient?: string; // address or contact alias
  query?: string; // for portfolio brain routing
}
```

**Supported Voice Commands (v1):**

- `"Send [amount] [token] to [address/contact]"`
- `"What's my [token] balance?"`
- `"Show my recent transactions"`
- `"What did I spend this week?"`

**Key Files:** `useWhisper.ts`, `intentParser.ts`, `txBuilder.ts`

---

### 3.3 Portfolio Brain

**Embedding Pipeline:**

```
On wallet load → fetch last 90 days of tx history via Solana RPC
        ↓
Parse each tx: type, tokens, amounts, counterparties, timestamp
        ↓
Convert each tx to natural language chunk:
  "2025-04-12: Sent 50 USDT to 9xK3... via Jupiter swap"
        ↓
@qvac/embed-llamacpp generates 384-dim embedding per chunk
        ↓
Store in local Vectra index (flat JSON, IndexedDB-backed)
        ↓
On user query → embed query → cosine similarity top-K retrieval
        ↓
Retrieved chunks + query → LLM → streamed answer
```

**Example Q&A:**

- _"What's my biggest single spend this month?"_ → RAG over tx embeddings
- _"How much have I paid in fees?"_ → aggregate from retrieved chunks
- _"Did I interact with any suspicious contracts?"_ → cross-referenced against risk flags
- _"Summarize my DeFi activity"_ → top-K retrieval + LLM synthesis

**Key Files:** `useEmbeddings.ts`, `vectorStore.ts`, `ragPipeline.ts`

---

## 4. QVAC SDK Integration

### 4.1 Installation

```bash
npm install @qvac/sdk @qvac/llm-llamacpp @qvac/embed-llamacpp \
            @qvac/ocr-onnx @qvac/transcription-whispercpp
```

### 4.2 SDK Singleton (`src/lib/qvac.ts`)

```typescript
import { QVAC } from "@qvac/sdk";
import { LlamaCpp } from "@qvac/llm-llamacpp";
import { EmbedLlamaCpp } from "@qvac/embed-llamacpp";
import { OcrOnnx } from "@qvac/ocr-onnx";
import { WhisperCpp } from "@qvac/transcription-whispercpp";

export const qvac = new QVAC();

export const llm = new LlamaCpp({
  modelPath: "./public/models/llm/mistral-7b-q4.gguf",
  contextSize: 4096,
  gpuLayers: 32, // Vulkan-accelerated
});

export const embedder = new EmbedLlamaCpp({
  modelPath: "./public/models/embed/nomic-embed-text-v1.5.gguf",
});

export const ocr = new OcrOnnx({
  modelPath: "./public/models/ocr/",
});

export const whisper = new WhisperCpp({
  modelPath: "./public/models/whisper/ggml-base.en.bin",
});

export async function initQVAC() {
  await qvac.initialize();
  await llm.load();
  await embedder.load();
  await ocr.load();
  await whisper.load();
  console.log("[QVAC] All models loaded locally.");
}
```

### 4.3 Model Downloads (`scripts/download-models.sh`)

```bash
#!/bin/bash
mkdir -p public/models/{llm,embed,ocr,whisper}

# LLM — Mistral 7B Q4 (~4GB)
wget -O public/models/llm/mistral-7b-q4.gguf \
  https://huggingface.co/TheBloke/Mistral-7B-Instruct-v0.2-GGUF/resolve/main/mistral-7b-instruct-v0.2.Q4_K_M.gguf

# Embeddings — Nomic Embed (~270MB)
wget -O public/models/embed/nomic-embed-text-v1.5.gguf \
  https://huggingface.co/nomic-ai/nomic-embed-text-v1.5-GGUF/resolve/main/nomic-embed-text-v1.5.Q4_K_M.gguf

# Whisper Base English (~142MB)
wget -O public/models/whisper/ggml-base.en.bin \
  https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.en.bin
```

---

## 5. WDK Integration

```typescript
// src/features/wallet/wdk.config.ts
import { WDK } from "@tether/wdk";

export const wdk = new WDK({
  network: "solana",
  rpcUrl: import.meta.env.VITE_SOLANA_RPC,
  storage: "indexeddb", // keys encrypted in browser
  nonCustodial: true,
});

// Create wallet
export async function createWallet() {
  const wallet = await wdk.createWallet();
  return wallet; // { address, publicKey }
}

// Build + sign transfer
export async function buildTransfer(params: {
  to: string;
  amount: number;
  token: "SOL" | "USDT";
}) {
  const tx = await wdk.buildTransfer(params);
  // Pass to Sign Guard BEFORE signing
  return tx;
}

export async function signAndBroadcast(tx: Transaction) {
  const signed = await wdk.sign(tx);
  const sig = await wdk.broadcast(signed);
  return sig;
}
```

---

## 6. Day-by-Day Build Schedule

### Day 1 — Scaffolding

- [ ] Init repo with Vite + React + TypeScript + Tailwind
- [ ] Install all QVAC packages + WDK
- [ ] Run `download-models.sh`, verify model loads
- [ ] WDK wallet creation + devnet airdrop test
- [ ] Basic routing: `/wallet`, `/sign`, `/voice`, `/chat`

### Day 2 — QVAC Init + Wallet Core

- [ ] `qvac.ts` singleton with all 4 modules loading on app start
- [ ] Loading screen while models initialize
- [ ] WDK: create wallet, derive address, display balance
- [ ] Fetch + parse tx history from Solana RPC
- [ ] Store tx history in IndexedDB

### Day 3 — Sign Guard

- [ ] `useOCR.ts`: feed image → `@qvac/ocr-onnx` → raw text
- [ ] Tx deserializer: extract program IDs, token accounts, amounts
- [ ] `useTxExplainer.ts`: structured context → LLM prompt → JSON response
- [ ] `TxWarningModal.tsx`: color-coded risk badge, flags list, Sign/Reject CTA
- [ ] Test with known malicious tx patterns (unlimited approve, ownership drain)

### Day 4 — Voice Commander

- [ ] `useWhisper.ts`: mic capture → WAV blob → `@qvac/transcription-whispercpp` → transcript
- [ ] `intentParser.ts`: regex parse → `{ action, amount, token, recipient }`
- [ ] LLM fallback for ambiguous commands
- [ ] `txBuilder.ts`: intent → Solana transfer instruction via web3.js
- [ ] Wire into Sign Guard flow (all voice txs go through analysis before signing)

### Day 5 — Portfolio Brain (Embeddings)

- [ ] `useEmbeddings.ts`: tx history → natural language chunks → `@qvac/embed-llamacpp` → vectors
- [ ] `vectorStore.ts`: Vectra local index, cosine similarity search, persist to IndexedDB
- [ ] Embedding pipeline runs in background after wallet loads (non-blocking)
- [ ] Progress indicator: "Indexing your wallet history..."

### Day 6 — Portfolio Brain (RAG Chat)

- [ ] `ragPipeline.ts`: query → embed → top-K retrieval → LLM with context → streamed response
- [ ] `PortfolioChat.tsx`: chat UI with streaming tokens, source citations (which txs)
- [ ] Test: spending summaries, fee analysis, suspicious contract flagging

### Day 7 — Integration + Polish

- [ ] Full flow test: Voice → Sign Guard → Portfolio Brain, no regressions
- [ ] Offline stress test: disable network, verify all AI features still work
- [ ] Error states: model not loaded, mic denied, OCR failed
- [ ] UI polish: loading states, skeleton screens, toast notifications
- [ ] Performance: check LLM response latency, add streaming where missing

### Day 8 — Demo + Submission

- [ ] Record 3-minute demo video (3 acts: Sign Guard, Voice, Portfolio Chat)
- [ ] Write README: setup, model download, run instructions
- [ ] GitHub: clean commits, descriptive README, demo gif in README
- [ ] Submit to Colosseum Frontier
- [ ] Submit to Superteam Earn listing (Tether side track)

---

## 7. Environment Variables

```env
# .env.local
VITE_SOLANA_RPC=https://api.devnet.solana.com
VITE_SOLANA_NETWORK=devnet
VITE_QVAC_LOG_LEVEL=warn
# No API keys needed — all inference is local
```

---

## 8. Known Risks + Mitigations

| Risk                                      | Likelihood | Mitigation                                                               |
| ----------------------------------------- | ---------- | ------------------------------------------------------------------------ |
| Model download size (~5GB total)          | High       | Ship `download-models.sh`, document in README, cache in `public/models/` |
| LLM cold start latency (first inference)  | High       | Warm up on app load, show progress, stream tokens                        |
| Whisper accuracy on accented speech       | Medium     | Use `ggml-base.en` for speed, add manual correction UI                   |
| WDK API surface differs from docs         | Medium     | Read WDK source, have web3.js fallback for signing                       |
| OCR fails on low-res QR scans             | Low        | Add image preprocessing (contrast boost) before OCR                      |
| Vulkan not available on all test machines | Low        | QVAC falls back to CPU; note GPU requirement in README                   |

---

## 9. Submission Checklist

- [ ] Public GitHub repo
- [ ] Working demo video (< 5 min)
- [ ] All 4 QVAC modules used meaningfully
- [ ] WDK integrated for wallet ops
- [ ] Offline-capable (tested with network disabled)
- [ ] README with setup + run instructions
- [ ] Submitted to Colosseum Frontier before May 11
- [ ] Submitted to Superteam Earn listing before May 11
