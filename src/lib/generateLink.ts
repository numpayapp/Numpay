import environment from "../config/enviroment";
const BASE_URL = environment.BASE_URL;
export const generateRequestLink = (requestId: string, requesterId: any, payerId: any) => {
    return `${BASE_URL}/send?requestId=${requestId}`;
}