# Workflows

This document outlines the core operational workflows for the Aegis local-first AI features. All workflows execute entirely within the browser.

## Sign Guard Workflow

Sign Guard protects users from malicious transactions by locally analyzing the transaction data before signing.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Aegis UI
    participant OCR as OCR Engine (ONNX)
    participant LLM as LLM Engine (Llama.cpp)
    participant Wallet as Wallet Module

    User->>App: Initiates transaction
    App->>App: Intercept payload / Generate visual preview
    App->>OCR: Pass visual preview for text extraction
    OCR-->>App: Extracted text & data
    App->>LLM: Send payload & extracted text for risk analysis
    LLM-->>App: Risk score & security warnings
    
    alt is safe / user approves
        App->>User: Display safe status
        User->>App: Confirms signature
        App->>Wallet: Sign & broadcast transaction
        Wallet-->>User: Transaction success
    else is malicious
        App->>User: Display HIGH RISK warning
        User->>App: Rejects transaction
        App->>App: Abort signing process
    end
```

## Voice Commander Workflow

Voice Commander allows users to execute wallet operations using natural language speech, transcribed and parsed locally.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Aegis UI
    participant STT as Whisper.cpp (Transcription)
    participant LLM as Llama.cpp (Intent Parser)
    participant Wallet as Wallet Module

    User->>App: Speaks command (e.g., "Send 10 SOL to Alice")
    App->>STT: Stream audio data
    STT-->>App: Transcribed text string
    App->>LLM: Send text for intent classification
    LLM-->>App: Parsed intent JSON (action, amount, recipient)
    
    App->>User: Request confirmation of parsed intent
    User->>App: Confirms intent
    App->>Wallet: Draft transaction & request signature
```

## Portfolio Brain (RAG) Workflow

Portfolio Brain provides an intelligent chat interface that is aware of the user's past transactions, balances, and custom notes using a local vector database.

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant App as Aegis UI
    participant VectorDB as Vectra (Local Vector Store)
    participant LLM as Llama.cpp (Generation)

    User->>App: Asks question ("How much did I spend on NFTs last week?")
    App->>VectorDB: Compute embedding for query & search
    VectorDB-->>App: Return top relevant context (past txs)
    App->>LLM: Provide prompt: Question + Context
    LLM-->>App: Generate natural language answer
    App-->>User: Display answer in chat interface
```
