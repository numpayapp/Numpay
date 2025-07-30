export const sendSMS = async (phoneNumber: string, message: string) => {
    try {
        // Validate phone number format
        const phoneNumberPattern = /^\+\d{1,3}\d{10}$/; // Example pattern for international format
        if (!phoneNumberPattern.test(phoneNumber)) {
            throw new Error("Invalid phone number format");
        }

        // TODO: Implement the actual SMS sending logic here

    } catch (error) {
        console.error("Error sending SMS:", error);
        throw error;
    }
}