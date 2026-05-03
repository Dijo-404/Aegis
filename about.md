# Aegis

> The first AI-native Solana wallet where the intelligence is as non-custodial as the keys.

---

## The Problem

Crypto wallets have a trust problem — and AI is making it worse.

When you ask ChatGPT to explain a transaction before you sign it, you've just sent your wallet activity, contract interactions, and financial intentions to a centralized server. When Coinbase adds "AI insights" to your portfolio, your spending patterns and risk profile are being processed in a cloud you don't control.

The industry calls this "helpful." We call it a new attack surface.

There's a deeper contradiction: Web3 was built on the principle that you shouldn't have to trust anyone with your assets. But every AI feature bolted onto modern wallets requires you to trust a third party with your data.

Aegis removes that contradiction entirely.

---

## What Aegis Is

Aegis is a non-custodial Solana wallet with three AI-powered features — **Sign Guard**, **Voice Commander**, and **Portfolio Brain** — where every model runs directly on your device using Tether's QVAC SDK.

No API keys. No cloud inference. No telemetry. The AI is as sovereign as your keys.

### Sign Guard

Before you sign any transaction, Aegis analyzes it.

You paste a transaction payload or scan a QR code. QVAC's OCR engine (`@qvac/ocr-onnx`) extracts the raw data. A local LLM (`@qvac/llm-llamacpp`) decodes exactly what the transaction is asking — in plain English.

*"This contract is requesting unlimited approval to spend your USDT. This is a common pattern in phishing attacks."*

Risk is color-coded: **Safe**, **Warning**, or **Danger**. You see the flags. You decide. The analysis never left your device.

This is not a novelty feature. Approval phishing was responsible for over $1 billion in crypto losses in 2023 alone. Sign Guard is the security layer that wallets should have shipped years ago — the only reason they didn't is because running a capable LLM locally wasn't possible. QVAC makes it possible.

### Voice Commander

Talk to your wallet.

Hold the mic button and say: *"Send 20 USDT to 9xK3..."*

`@qvac/transcription-whispercpp` transcribes your speech locally — no audio ever reaches a server. The transcript is parsed into a structured intent (`action: send, amount: 20, token: USDT, recipient: 9xK3...`), a Solana transfer instruction is constructed via WDK, and it's routed through Sign Guard before you confirm.

Voice commands that work in v1: send tokens, check balances, query recent transactions, ask portfolio questions. All processed on-device.

No Google STT. No OpenAI Whisper API. No audio logs. Your voice commands are yours.

### Portfolio Brain

Your wallet history, embedded and queryable.

When Aegis loads, it fetches your last 90 days of on-chain activity, converts each transaction into a natural language description, and generates embeddings via `@qvac/embed-llamacpp`. These vectors live in a local index on your device.

When you ask a question — *"What did I spend on gas fees this month?"* or *"Have I interacted with any unknown programs?"* — Aegis retrieves the most relevant transactions semantically, feeds them as context to the local LLM, and streams back a grounded, accurate answer.

This is RAG (Retrieval-Augmented Generation) running entirely offline. No financial data leaves your machine. Your spending patterns are not a product someone else is selling.

---

## Why QVAC

QVAC is the only SDK that makes all three of these features possible without a cloud dependency.

Its hardware-agnostic Vulkan engine means models run on any GPU — not just NVIDIA, not just high-end hardware. Its unified API across LLM inference, embeddings, OCR, and speech recognition means Aegis uses a single SDK to power all three AI layers. And critically, QVAC's local-first architecture is not a workaround or a fallback — it's the point.

For a security-sensitive application like a wallet, the absence of data egress is not a nice-to-have. It's the product.

---

## Why WDK

Tether's WDK provides the non-custodial wallet infrastructure — key generation, encrypted storage, transaction construction, and broadcast — without requiring Aegis to build or trust a custom key management system. Keys stay in the user's encrypted local store. Aegis never transmits them.

WDK and QVAC are philosophically aligned: both are built on the premise that users shouldn't have to trust infrastructure they don't control. Aegis is the application layer that connects them.

---

## The Core Thesis

Cloud AI wallets ask you to make a trade: convenience in exchange for surveillance.

Aegis makes the trade unnecessary. Local inference is fast enough. Models are small enough. Hardware is capable enough. The only thing missing was an SDK that made it all work without a PhD in MLOps.

QVAC is that SDK. Aegis is the proof.

---

## Technical Summary

| Component | Technology |
|---|---|
| Wallet SDK | Tether WDK |
| Blockchain | Solana (web3.js v2) |
| LLM Inference | `@qvac/llm-llamacpp` (Mistral 7B Q4) |
| Embeddings | `@qvac/embed-llamacpp` (Nomic Embed v1.5) |
| OCR | `@qvac/ocr-onnx` |
| Speech-to-Text | `@qvac/transcription-whispercpp` (Whisper Base) |
| Vector Store | Vectra (local flat-file, IndexedDB-backed) |
| Frontend | React + TypeScript + Tailwind |
| Runtime | Browser / Electron (cross-platform) |

---

## Who Builds This

Built for the Colosseum Frontier Hackathon and Tether QVAC Side Track (May 2026).

The people most at risk from phishing attacks, surveillance, and data harvesting are not the privacy maximalists who already know what's at stake. They're regular users who don't know their "AI-powered" wallet is logging their financial life to a server in Virginia.

Aegis is built for them.

---

## Links

- GitHub: `github.com/[your-handle]/aegis`
- Demo: `[video link]`
- QVAC Docs: https://docs.qvac.tether.io
- WDK: https://wdk.tether.io
- Colosseum Frontier: https://www.colosseum.org/frontier
