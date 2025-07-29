import express from 'express';
import cors from 'cors';
import { generateVerificationCodeController, verifyCodeController } from './controllers/verification/verification.controller';
import { sendSMSController } from './controllers/sms/sms.controller';
import userRoutes from './routes/user.route';
import transactionRoutes from './routes/transaction.route';
import requestRoute from './routes/request.route';
import { otpLimiter } from './middleware/ratelimiter';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors());

// Verification routes
app.post('/api/verification/generate', generateVerificationCodeController);
app.post('/api/verification/verify', otpLimiter, verifyCodeController);
app.post('/api/send-text', sendSMSController);
app.use('/api/user', userRoutes);
app.use('/api/transaction', transactionRoutes);
app.use('/api/request', requestRoute);

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});