import Twilio from "twilio";
import environment from "../../config/enviroment"
const TwilioClient = Twilio(environment.TWILIO_SID, environment.TWILIO_AUTH_TOKEN);

const generateOTP = async (phone: string, channel: string) => {
    const sendOTP = await TwilioClient.verify.v2.services(environment.TWILIO_SERVICE_SID as string).verifications.create({
        // to: "+2347065400423",
        // channel: "sms",
        to: phone,
        channel: channel,
    });
    console.log(sendOTP);
    return sendOTP;
}

const verifyOTP = async (otp: string, phone: string) => {
    const verificationCheck = await TwilioClient.verify.v2.services(environment.TWILIO_SERVICE_SID as string).verificationChecks.create({
        to: phone,
        code: otp,
    });
    console.log(verificationCheck);
    return verificationCheck;
}

async function listService() {
    const services = await TwilioClient.verify.v2.services.list({ limit: 20 });

    services.forEach((s) => console.log(s.sid));
}