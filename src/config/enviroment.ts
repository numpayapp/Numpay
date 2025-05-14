// import * as dotenv from 'dotenv';
import { config } from 'dotenv';

config();

const isProduction = process.env.NODE_ENV === 'production';
const requiredEnvVars = [
    'DATABASE_URL',
    'TWILIO_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_SERVICE_SID',

];
const testEnvVars = [
    'DATABASE_URL',
    'TWILIO_SID',
    'TWILIO_AUTH_TOKEN',
    'TWILIO_SERVICE_SID',
];

(isProduction ? requiredEnvVars : testEnvVars).forEach((envVar) => {
    if (!process.env) {
        throw new Error(`Environment variable ${envVar} is not set`);
    }
});
interface Environment {
    DATABASE_URL: string;
    TWILIO_SID: string;
    TWILIO_AUTH_TOKEN: string;
    TWILIO_SERVICE_SID: string;
    PORT: string | number;
    TWILIO_PHONE_NUMBER: string;
    isProduction: boolean;
    BASE_URL: string;
}
const environment = {
    DATABASE_URL: isProduction ? process.env.DATABASE_URL : process.env.DATABASE_URL_TEST,
    TWILIO_SID: isProduction ? process.env.TWILIO_SID : process.env.TWILIO_SID,
    TWILIO_AUTH_TOKEN: isProduction ? process.env.TWILIO_AUTH_TOKEN : process.env.TWILIO_AUTH_TOKEN,
    TWILIO_SERVICE_SID: isProduction ? process.env.TWILIO_SERVICE_SID : process.env.TWILIO_SERVICE_SID,
    PORT: process.env.PORT || 3000,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    BASE_URL: isProduction ? process.env.BASE_URL : "http://localhost:5173",
    isProduction,
    // Export other environment variables here
};

if (isProduction) {
    console.log('Running in production mode');
} else {
    console.log('Running in development mode');
}
export default environment;