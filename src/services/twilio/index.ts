import Twilio from "twilio";
import environment from "../../config/enviroment"
import { logger } from "../../utils/logger";
const TwilioClient = Twilio(environment.TWILIO_SID, environment.TWILIO_AUTH_TOKEN);

const generateOTP = async (phone: string, channel: string) => {
    const sendOTP = await TwilioClient.verify.v2.services(environment.TWILIO_SERVICE_SID as string).verifications.create({
        // to: "+2347065400423",
        // channel: "sms",
        to: phone,
        channel: channel,
    });
    logger.logPhoneOperation("OTP sent successfully", phone);
    return sendOTP;
}

const verifyOTP = async (otp: string, phone: string) => {
    const verificationCheck = await TwilioClient.verify.v2.services(environment.TWILIO_SID as string).verificationChecks.create({
        to: phone,
        code: otp,
    });
    logger.logPhoneOperation("OTP verification completed", phone);
    return verificationCheck;
}

async function listService() {
    const services = await TwilioClient.verify.v2.services.list({ limit: 20 });

    services.forEach((s) => console.log(s.sid));
}

/**
 * Send SMS message to a phone number
 * @param to - Recipient phone number (E.164 format)
 * @param message - Message content
 * @returns Promise with message details
 */
const sendSMS = async (to: string, message: string) => {
    // try {
    //     const messageResponse = await TwilioClient.messages.create({
    //         body: message,
    //         to: to,
    //         from: environment.TWILIO_PHONE_NUMBER, // Your Twilio phone number
    //     });

    //     console.log(`Message sent successfully. SID: ${messageResponse.sid}`);
    //     return messageResponse;
    // } catch (error) {
    //     console.error('Error sending SMS:', error);
    //     throw error;
    // }
}

// Export all functions
export {
    generateOTP,
    verifyOTP,
    listService,
    sendSMS
};