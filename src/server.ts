import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import environment from './config/enviroment';
import { generateVerificationCodeController, verifyCodeController } from './controllers/verification/verification.controller';
import { sendSMSController } from './controllers/sms/sms.controller';
import userRoutes from './routes/user.route';
import transactionRoutes from './routes/transaction.route';
import requestRoute from './routes/request.route';
import { otpLimiter } from './middleware/ratelimiter';

const app = express();
const port = process.env.PORT || 3000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration with explicit allow-list
const corsOptions = {
  origin: environment.isProduction 
    ? [environment.BASE_URL || 'https://app.numpay.app', 'http://localhost:5173']
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

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