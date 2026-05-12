# Deploying Aegis

## Prerequisites

### 1. Solana RPC Endpoint

The public endpoint (`https://api.mainnet-beta.solana.com`) is rate-limited and not suitable for production. Use a dedicated provider:

| Provider | Free Tier | Notes |
|---|---|---|
| [Helius](https://helius.dev) | 100k requests/day | Recommended — enhanced transaction parsing |
| [Quicknode](https://quicknode.com) | 10M credits/month | Global edge network |
| [Alchemy](https://www.alchemy.com/solana) | 300M compute units/month | Strong dashboard tooling |

Copy the RPC URL from your provider's dashboard.

### 2. USDT Mint Address

| Network | Mint address |
|---|---|
| Mainnet | `Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB` |
| Devnet | Use your own devnet USDT deployment |

---

## Vercel

1. Push the repo to GitHub.
2. Import the project in the [Vercel dashboard](https://vercel.com/new).
3. Set **Framework Preset** to `Vite`.
4. Add environment variables under **Settings → Environment Variables**:

   ```
   VITE_SOLANA_RPC       = https://mainnet.helius-rpc.com/?api-key=YOUR_KEY
   VITE_SOLANA_NETWORK   = mainnet-beta
   VITE_USDT_MINT        = Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB
   VITE_QVAC_LOG_LEVEL   = warn
   ```

5. Deploy. The `vercel.json` in the repo root automatically sets the required COOP/COEP headers for WebAssembly threading.

---

## Netlify

1. Push the repo to GitHub.
2. Create a new site in the [Netlify dashboard](https://app.netlify.com) → **Import from Git**.
3. Set **Build command**: `npm run build`, **Publish directory**: `dist`.
4. Add environment variables under **Site settings → Environment variables**.
5. Deploy. The `netlify.toml` in the repo root sets the COOP/COEP headers and build config automatically.

---

## Why COOP/COEP headers?

Transformers.js uses `SharedArrayBuffer` for multi-threaded WASM inference (faster model loading). Browsers require these two headers to enable it:

```
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

Both `vercel.json` and `netlify.toml` set these on all routes. Without them the app falls back to single-threaded WASM, which still works but is slower on first model load.

---

## Model Caching

On first visit, the browser downloads ~570 MB of ONNX models from the Hugging Face CDN. These are cached in the browser's IndexedDB via Transformers.js's built-in cache. Subsequent visits load instantly.

**To self-host models** (for air-gapped or offline deployments):

1. Download the model files from Hugging Face and place them under `public/models/`.
2. In `src/lib/qvac.ts`, set `tfEnv.allowLocalModels = true` and update the model IDs to local paths.

---

## Devnet Testing

To run against devnet instead of mainnet, set:

```
VITE_SOLANA_RPC     = https://api.devnet.solana.com
VITE_SOLANA_NETWORK = devnet
VITE_USDT_MINT      = <your devnet USDT mint>
```

The app will display the network label from `VITE_SOLANA_NETWORK` in the UI header and footer.
