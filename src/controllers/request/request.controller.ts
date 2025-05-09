import { Request, Response } from "express";
import prisma from "../../db/prisma";
import { sendSMS } from "../../services/twilio";
import environment from "../../config/enviroment";
import { requestService } from "../../db/services/requestService";
import { generateRequestLink } from "../../lib/generateLink";
// POST /api/request-money

export const getRequestById = async (req: Request, res: Response) => {
    const { id } = req.params;
    const request = await requestService.getRequestById(id);
    if (!request) {
        res.status(404).json({ error: "Request not found." });
        return;
    }
    res.status(200).json(request);
};
export const getUserRequests = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const requests = await requestService.getUserRequests(userId);
    if (!requests) {
        res.status(404).json({ error: "Requests not found." });
        return;
    }
    res.status(200).json(requests);
};
export const getPendingRequests = async (req: Request, res: Response) => {
    const { userId } = req.params;
    const requests = await requestService.getPendingRequests(userId);
    if (!requests) {
        res.status(404).json({ error: "Requests not found." });
        return;
    }
    res.status(200).json(requests);
};

export const requestMoney = async (req: Request, res: Response) => {
    try {
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

        let generatedLink;
        if (receiver) {
            // Send in-app notification or push/SMS
            generatedLink = generateRequestLink(newRequest.id, requesterId, payerId);
            await sendSMS(payerPhone, `You have a new money request from ${requesterId}. Amount: $${amount}.\nLink:${generatedLink}
                &to=${payerId}`);
        }

        // Update Request with the generated link
        await prisma.request.update({
            where: { id: newRequest.id },
            data: {
                requestLink: generatedLink
            }
        });

        res.status(201).json({ success: true, requestId: newRequest.id, link: generatedLink });
    } catch (error) {
        console.error("Request Money Error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

export const cancelRequest = async (req: Request, res: Response) => {
    const { requestId } = req.params;

    if (!requestId) {
        res.status(400).json({ error: "Request ID is required." });
        return;
    }

    const request = await prisma.request.findUnique({
        where: { id: requestId }
    });

    if (!request) {
        res.status(404).json({ error: "Request not found." });
        return;
    }

    if (request.requestStatus !== "PENDING") {
        res.status(400).json({ error: "Only pending requests can be canceled." });
        return;
    }

    await prisma.request.update({
        where: { id: requestId },
        data: { requestStatus: "CANCELED" }
    });

    res.status(200).json({ success: true, message: "Request canceled successfully." });
}