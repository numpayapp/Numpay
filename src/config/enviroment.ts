// import * as dotenv from 'dotenv';
import { config } from 'dotenv';

config();

const isProduction = process.env.NODE_ENV === 'production';
const requiredEnvVars = [
    'DATABASE_URL',
    'NODE_ENV'
];
const testEnvVars = [
    'DATABASE_URL',

];

(isProduction ? requiredEnvVars : testEnvVars).forEach((envVar) => {
    if (!process.env) {
        throw new Error(`Environment variable ${envVar} is not set`);
    }
});
interface Environment {
    DATABASE_URL: string;
    PORT: string | number;
    isProduction: boolean;
    BASE_URL: string;
}
requiredEnvVars.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Environment variable ${envVar} is not set`);
    }
});
const environment = {
    DATABASE_URL: isProduction ? process.env.DATABASE_URL : process.env.DATABASE_URL_TEST,
    PORT: process.env.PORT || 3001,
    BASE_URL: isProduction ? process.env.BASE_URL : "http://localhost:5173",
    isProduction,
} as Environment;

if (isProduction) {
    console.log('Running in production mode');
} else {
    console.log('Running in development mode');
}
export default environment;