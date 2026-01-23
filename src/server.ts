import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import environment from './config/enviroment';

import apiRouter from './routes/router'
import { rateLimiter } from './middleware/ratelimiter';

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
    ? ['https://app.numpay.app', 'https://numpay.app', environment.BASE_URL].filter(Boolean)
    : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
};

// Middleware
app.use(express.json());
app.use(cors(corsOptions));

app.use('/api', rateLimiter, apiRouter);

// Start server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});