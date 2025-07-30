import rateLimit from 'express-rate-limit';

export const rateLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: "Too many requests, please try again later."
});

// app.post('/api/verification/generate', otpLimiter, generateVerificationCodeController);
// app.post('/api/verification/verify', otpLimiter, verifyCodeController);
// app.post('/api/send-text', otpLimiter, sendSMSController);