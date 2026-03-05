import {
    Connection,
    Keypair,
    PublicKey,
    Transaction,
} from '@solana/web3.js';
import {
    getAssociatedTokenAddress,
    createAssociatedTokenAccountInstruction,
    createTransferInstruction,
    TOKEN_PROGRAM_ID,
    ASSOCIATED_TOKEN_PROGRAM_ID,
} from '@solana/spl-token';
import bs58 from 'bs58';

const SOLANA_RPC_URL = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';

export const USDC_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');
export const SOLANA_CAIP2 = 'solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp';
export const connection = new Connection(SOLANA_RPC_URL, 'confirmed');

// Relayer keypair pays gas fees on behalf of users (gasless UX)
// If RELAYER_PRIVATE_KEY is not set, sender pays their own gas
const RELAYER_PRIVATE_KEY = process.env.RELAYER_PRIVATE_KEY;
export const relayerKeypair: Keypair | null = RELAYER_PRIVATE_KEY
    ? Keypair.fromSecretKey(bs58.decode(RELAYER_PRIVATE_KEY))
    : null;

if (relayerKeypair) {
    console.log(`[relayer] Fee payer: ${relayerKeypair.publicKey.toBase58()}`);
} else {
    console.warn('[relayer] RELAYER_PRIVATE_KEY not set — sender pays their own gas fees');
}

/**
 * Builds a USDC SPL token transfer transaction (base64 encoded, partially signed).
 * If a relayer keypair is configured, the relayer is set as fee payer and
 * partially signs the transaction so users need zero SOL.
 *
 * @returns base64-encoded serialized Transaction ready for Privy to sign
 */
export async function buildUsdcTransferTransaction(
    senderAddress: string,
    recipientAddress: string,
    amountUsdc: number
): Promise<string> {
    const senderPubkey = new PublicKey(senderAddress);
    const recipientPubkey = new PublicKey(recipientAddress);
    const feePayer = relayerKeypair ? relayerKeypair.publicKey : senderPubkey;

    const senderAta = await getAssociatedTokenAddress(USDC_MINT, senderPubkey);
    const recipientAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey);

    // Use 'finalized' so the blockhash is known by ALL nodes (including Privy's internal RPC).
    // 'confirmed' from Helius can be a few blocks ahead of Privy's node → "Blockhash not found"
    const { blockhash } = await connection.getLatestBlockhash('finalized');

    const tx = new Transaction({
        recentBlockhash: blockhash,
        feePayer,
    });

    // Create recipient ATA if it doesn't exist (~0.002 SOL, paid by fee payer)
    const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
    if (!recipientAtaInfo) {
        tx.add(
            createAssociatedTokenAccountInstruction(
                feePayer,
                recipientAta,
                recipientPubkey,
                USDC_MINT,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
        );
    }

    // USDC has 6 decimal places
    const amountRaw = BigInt(Math.round(amountUsdc * 1_000_000));

    tx.add(
        createTransferInstruction(
            senderAta,
            recipientAta,
            senderPubkey,
            amountRaw,
            [],
            TOKEN_PROGRAM_ID
        )
    );

    // Relayer partially signs first (adds gas fee signature)
    if (relayerKeypair) {
        tx.partialSign(relayerKeypair);
    }

    return tx.serialize({ requireAllSignatures: false }).toString('base64');
}

/**
 * Fetches the USDC balance (as a human-readable float) for a Solana address.
 */
export async function getUsdcBalance(solanaAddress: string): Promise<number> {
    try {
        const pubkey = new PublicKey(solanaAddress);
        const ata = await getAssociatedTokenAddress(USDC_MINT, pubkey);
        console.log(`[balance] wallet=${solanaAddress} ata=${ata.toBase58()}`);
        const ataInfo = await connection.getAccountInfo(ata);
        if (!ataInfo) { console.log(`[balance] ATA does not exist yet for ${solanaAddress}`); return 0; }
        const tokenBalance = await connection.getTokenAccountBalance(ata);
        return tokenBalance.value.uiAmount ?? 0;
    } catch (err) {
        console.error(`[balance] Error fetching USDC balance for ${solanaAddress}:`, err);
        return 0;
    }
}
