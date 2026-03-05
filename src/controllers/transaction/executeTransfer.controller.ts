import { Request, Response } from 'express';
import { privy } from '../../services/privy';
import { userService } from '../../db/services/userService';
import { transactionService } from '../../db/services/transactionService';
import { buildUsdcTransferTransaction, SOLANA_CAIP2, connection } from '../../services/solana';
import { logger } from '../../utils/logger';

export const executeTransfer = async (req: Request, res: Response): Promise<void> => {
    try {
        const senderPrivyDID = req.user!.userId;
        const { recipientPhone, amount } = req.body;

        if (!recipientPhone || !amount || Number(amount) <= 0) {
            res.status(400).json({ message: 'recipientPhone and a positive amount are required' });
            return;
        }

        // Look up sender
        const sender = await userService.getUserById(senderPrivyDID) as any;
        if (!sender?.privyWalletId || !sender?.solanaAddress) {
            res.status(404).json({ message: 'Sender wallet not found. Please complete registration.' });
            return;
        }

        // Look up or pregenerate recipient wallet
        const sanitizedPhone = String(recipientPhone).replace(/[\s-]/g, '');
        let recipient = await userService.getUserByPhone(sanitizedPhone) as any;

        if (!recipient) {
            const wallet = await privy.wallets().create({ chain_type: 'solana' });
            recipient = await userService.createUser({
                privyDID: `pregenerated:${sanitizedPhone}`,
                phoneNumber: sanitizedPhone,
                solanaAddress: wallet.address,
                privyWalletId: wallet.id,
                countryCode: sanitizedPhone.slice(0, 3),
            }) as any;
        }

        if (!recipient?.solanaAddress) {
            res.status(500).json({ message: 'Recipient wallet not configured' });
            return;
        }

        // Build the unsigned USDC SPL transfer transaction (base64)
        const base64Tx = await buildUsdcTransferTransaction(
            sender.solanaAddress,
            recipient.solanaAddress,
            Number(amount)
        );

        // Sign via Privy (returns base64 signed transaction)
        const signed = await privy.wallets().solana().signTransaction(
            sender.privyWalletId,
            { transaction: base64Tx }
        );

        // Broadcast via our own Helius connection (avoids RPC blockhash mismatch)
        const txhash = await connection.sendRawTransaction(
            Buffer.from(signed.signed_transaction, 'base64'),
            { skipPreflight: false, preflightCommitment: 'confirmed' }
        );

        // Record in database
        await transactionService.createTransaction({
            txhash,
            transactionType: 'SEND',
            senderId: sender.id,
            receiverId: recipient.id,
            amount: Number(amount),
            transactionStatus: 'COMPLETED',
        });

        logger.info(`Transfer ${amount} USDC from ${sender.solanaAddress} to ${recipient.solanaAddress}. Tx: ${txhash}`);
        res.status(200).json({ success: true, txhash });
    } catch (error: any) {
        logger.error('Execute Transfer Error', error);
        res.status(500).json({ message: 'Transfer failed', error: error?.message || 'Unknown error' });
    }
};
