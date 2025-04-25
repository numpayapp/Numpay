import express from 'express';
import cors from 'cors';
import { generateVerificationCodeController, verifyCodeController } from './controllers/verification/verification.controller';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Verification routes
app.post('/api/verification/generate', generateVerificationCodeController);
app.post('/api/verification/verify', verifyCodeController);
app.post('/api/send-text', (req, res) => {
    const { phoneNumber, message } = req.body;
    // Here you would implement the logic to send a text message
    // For example, using Twilio or another SMS service
    console.log(`Sending message "${message}" to ${phoneNumber}`);
    res.status(200).json({ message: 'Text message sent successfully!' });
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});