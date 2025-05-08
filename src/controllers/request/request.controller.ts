import { Request, Response } from "express";
import prisma from "../../db/prisma";
import { sendSMS } from "../../services/twilio";
import environment from "../../config/enviroment";
// POST /api/request-money

export const requestMoney = async (req: Request, res: Response) => {
    const { requesterId, payerPhone, amount, message, requestType } = req.body;

    if (!payerPhone || !amount) {
        res.status(400).json({ error: "Phone and amount are required." });
        return;
    }

    if (amount <= 0) {
        res.status(400).json({ error: "Amount must be greater than zero." });
        return;
    }

    const payerExists = await prisma.user.findUnique({
        where: { phoneNumber: payerPhone }
    });
    if (!payerExists) {
        res.status(404).json({ error: "Payer not found." });
        return;
    }
    const payerId = payerExists.id;

    // Optional: Prevent duplicate pending requests
    const existingRequest = await prisma.request.findFirst({
        where: {
            requesterId,
            payerPhone,
            requestStatus: "PENDING"
        }
    });

    if (existingRequest) {
        res.status(409).json({ error: "You already have a pending request to this user." });
    }

    // Store the request
    const newRequest = await prisma.request.create({
        data: {
            requesterId,
            payerId,
            payerPhone,
            amountRequested: amount,
            requestMessage: message,
            requestType,
            requestStatus: "PENDING"
        }
    });

    // Notify the receiver if they're a registered user
    const receiver = await prisma.user.findUnique({
        where: { phoneNumber: payerPhone }
    });

    if (receiver) {
        // Send in-app notification or push/SMS
        await sendSMS(payerPhone, `You have a new money request from ${requesterId}. Amount: $${amount}.\nLink:${environment.BASE_URL}/request?id=${newRequest.id}&from=${requesterId}
            &to=${payerId}`);
    }

    res.status(201).json({ success: true, requestId: newRequest.id });
};
