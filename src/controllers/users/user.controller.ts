import { userService } from "../../db/services/userService"
import { CreateUserInput } from "../../types";
export async function createUser(data: CreateUserInput) {
    try {
        const result = await userService.createUser(data);
        return result
    } catch (error) {
        console.log("Create User Error", error);
        return null;
    }
}