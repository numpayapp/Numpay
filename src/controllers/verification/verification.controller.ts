import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';

// Store verification codes (in production, use a database)
const verificationCodes: Map<string, { code: string; expires: Date }> = new Map();

// Helper function to generate random 6-digit code
const generateVerificationCode = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

export const generateVerificationCodeController = (req: Request, res: Response): void => {
    const { email } = req.body;

    if (!email) {
        res.status(400).json({ error: 'Email is required' });
        return;
    }

    // Generate a unique request ID
    const requestId = uuidv4();

    // Generate a 6-digit verification code
    const code = generateVerificationCode();

    // Store the code with 10-minute expiration
    const expirationTime = new Date();
    expirationTime.setMinutes(expirationTime.getMinutes() + 10);

    verificationCodes.set(requestId, {
        code,
        expires: expirationTime
    });

    // In production, send this code via email
    console.log(`Verification code for ${email}: ${code}`);

    res.json({
        message: 'Verification code sent successfully',
        requestId
    });
};

export const verifyCodeController = (req: Request, res: Response): void => {
    const { requestId, code } = req.body;

    if (!requestId || !code) {
        res.status(400).json({ error: 'Request ID and code are required' });
        return;
    }

    const verificationData = verificationCodes.get(requestId);

    if (!verificationData) {
        res.status(404).json({ error: 'Invalid request ID' });
        return;
    }

    if (new Date() > verificationData.expires) {
        verificationCodes.delete(requestId);
        res.status(410).json({ error: 'Verification code has expired' });
        return;
    }

    if (verificationData.code !== code) {
        res.status(400).json({ error: 'Invalid verification code' });
        return;
    }

    // Code is valid - clean up
    verificationCodes.delete(requestId);

    res.json({
        message: 'Verification successful'
    });
};