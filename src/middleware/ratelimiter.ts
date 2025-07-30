import rateLimit from 'express-rate-limit';

export const otpLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // limit each IP to 5 requests per windowMs
    message: "Too many requests, please try again later."
});

// app.post('/api/verification/generate', otpLimiter, generateVerificationCodeController);
// app.post('/api/verification/verify', otpLimiter, verifyCodeController);
// app.post('/api/send-text', otpLimiter, sendSMSController);