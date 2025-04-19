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

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});