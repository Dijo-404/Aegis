import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddress,
  createTransferInstruction,
} from "@solana/spl-token";

const STORAGE_KEY = "aegis:wdk-keypair";

const decodeBase64 = (value) => {
  if (typeof atob === "function") {
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  return Uint8Array.from(Buffer.from(value, "base64"));
};

const encodeBase64 = (value) => {
  if (typeof btoa === "function") {
    let binary = "";
    value.forEach((byte) => {
      binary += String.fromCharCode(byte);
    });
    return btoa(binary);
  }
  return Buffer.from(value).toString("base64");
};

const loadKeypair = () => {
  if (typeof localStorage === "undefined") {
    return undefined;
  }
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return undefined;
  }
  try {
    const bytes = decodeBase64(raw);
    return Keypair.fromSecretKey(bytes);
  } catch {
    return undefined;
  }
};

const saveKeypair = (keypair) => {
  if (typeof localStorage === "undefined") {
    return;
  }
  const encoded = encodeBase64(keypair.secretKey);
  localStorage.setItem(STORAGE_KEY, encoded);
};

export class WDK {
  constructor(config) {
    this.connection = new Connection(config.rpcUrl, "confirmed");
    this.usdtMint = config.usdtMint ? new PublicKey(config.usdtMint) : null;
    this.keypair = loadKeypair();
  }

  async createWallet() {
    if (!this.keypair) {
      this.keypair = Keypair.generate();
      saveKeypair(this.keypair);
    }
    return {
      address: this.keypair.publicKey.toBase58(),
      publicKey: this.keypair.publicKey.toBase58(),
    };
  }

  async buildTransfer({ to, amount, token }) {
    if (!this.keypair) {
      await this.createWallet();
    }
    const recipient = new PublicKey(to);
    const transaction = new Transaction();

    if (token === "SOL") {
      transaction.add(
        SystemProgram.transfer({
          fromPubkey: this.keypair.publicKey,
          toPubkey: recipient,
          lamports: Math.round(amount * LAMPORTS_PER_SOL),
        }),
      );
    } else {
      if (!this.usdtMint) {
        throw new Error("USDT mint address not configured.");
      }
      const sourceAta = await getAssociatedTokenAddress(
        this.usdtMint,
        this.keypair.publicKey,
      );
      const destinationAta = await getAssociatedTokenAddress(
        this.usdtMint,
        recipient,
      );
      transaction.add(
        createTransferInstruction(
          sourceAta,
          destinationAta,
          this.keypair.publicKey,
          Math.round(amount),
        ),
      );
    }

    const { blockhash } = await this.connection.getLatestBlockhash("finalized");
    transaction.feePayer = this.keypair.publicKey;
    transaction.recentBlockhash = blockhash;
    return transaction;
  }

  async sign(tx) {
    if (!this.keypair) {
      await this.createWallet();
    }
    tx.partialSign(this.keypair);
    return tx;
  }

  async broadcast(tx) {
    const signature = await this.connection.sendRawTransaction(tx.serialize());
    await this.connection.confirmTransaction(signature, "confirmed");
    return signature;
  }
}
