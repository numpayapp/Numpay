// Example usage in a controller or route handler
import { smsValidationSchema } from '../../schemas/smsValidationSchema';
import { sendSMS } from '../../services/twilio';
import { Request, Response } from "express";

export const sendSMSController = async (req: Request, res: Response) => {
    try {
        const { phoneNumber, message } = req.body;
        const validatedData = smsValidationSchema.safeParse(req.body);
        if (!validatedData.success) {
            res.status(400).json({ message: "Invalid input", errors: validatedData.error.errors });
            return
        }
        const response = await sendSMS(phoneNumber, message);
        res.status(200).json({ message: 'SMS sent successfully', response });
    } catch (error) {
        console.error('Error sending SMS:', error);
        res.status(500).json({ message: 'Failed to send SMS', error });
    }
}