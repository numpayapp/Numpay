import { z } from 'zod';
export const smsValidationSchema = z.object({
    phoneNumber: z.string().min(10, "Phone number must be at least 10 characters long").max(15, "Phone number must not exceed 15 characters"),
    message: z.string().min(1, "Message cannot be empty").max(160, "Message must not exceed 160 characters"),
});