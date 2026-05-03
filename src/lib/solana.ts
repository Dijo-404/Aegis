import { Connection, PublicKey } from '@solana/web3.js';

const rpcUrl = import.meta.env.VITE_SOLANA_RPC ?? 'https://api.devnet.solana.com';
const connection = new Connection(rpcUrl, 'confirmed');

export const getConnection = () => connection;

export async function getSolBalance(address: string) {
  const lamports = await connection.getBalance(new PublicKey(address));
  return lamports / 1e9;
}
