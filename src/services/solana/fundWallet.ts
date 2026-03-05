import {
    Keypair,
    PublicKey,
    Transaction,
    SystemProgram,
    sendAndConfirmTransaction,
    LAMPORTS_PER_SOL,
} from '@solana/web3.js';
import { connection } from './index';
import bs58 from 'bs58';
import { logger } from '../../utils/logger';

const FUNDING_AMOUNT_SOL = 0.01;

/**
 * Seeds a new user wallet with SOL from the NumPay treasury wallet.
 * This covers: ATA creation (~0.002 SOL) + many future transaction fees (~0.000005 SOL each).
 *
 * Set TREASURY_SOL_PRIVATE_KEY in .env as a base58-encoded Solana private key.
 * Fire-and-forget: call without awaiting so it doesn't block registration.
 */
export async function fundNewWallet(recipientAddress: string): Promise<void> {
    const treasuryKey = process.env.TREASURY_SOL_PRIVATE_KEY;
    if (!treasuryKey) {
        logger.warn('TREASURY_SOL_PRIVATE_KEY not set — skipping SOL funding for new wallet');
        return;
    }

    try {
        const treasuryKeypair = Keypair.fromSecretKey(bs58.decode(treasuryKey));
        const recipient = new PublicKey(recipientAddress);
        const lamports = Math.round(FUNDING_AMOUNT_SOL * LAMPORTS_PER_SOL);

        const tx = new Transaction().add(
            SystemProgram.transfer({
                fromPubkey: treasuryKeypair.publicKey,
                toPubkey: recipient,
                lamports,
            })
        );

        const sig = await sendAndConfirmTransaction(connection, tx, [treasuryKeypair]);
        logger.info(`Funded ${recipientAddress} with ${FUNDING_AMOUNT_SOL} SOL. Sig: ${sig}`);
    } catch (error) {
        logger.error(`Failed to fund wallet ${recipientAddress} with SOL`, error);
    }
}
