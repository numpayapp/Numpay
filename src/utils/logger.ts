/**
 * Utility logger with sensitive data redaction
 */

// Redact sensitive information from logs
const redactPhoneNumber = (phone: string): string => {
  if (!phone || phone.length < 5) return '***';
  return phone.substring(0, 3) + '***' + phone.substring(phone.length - 2);
};

const redactWalletAddress = (address: string): string => {
  if (!address || address.length < 10) return '***';
  return address.substring(0, 6) + '...' + address.substring(address.length - 4);
};

const redactEmail = (email: string): string => {
  if (!email || !email.includes('@')) return '***';
  const [local, domain] = email.split('@');
  if (local.length <= 2) return '***@' + domain;
  return local.substring(0, 2) + '***@' + domain;
};

// Structured logging levels
export const logger = {
  info: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.log(`[INFO] ${timestamp} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },

  error: (message: string, error?: any) => {
    const timestamp = new Date().toISOString();
    console.error(`[ERROR] ${timestamp} - ${message}`, error ? error.message || error : '');
  },

  warn: (message: string, data?: any) => {
    const timestamp = new Date().toISOString();
    console.warn(`[WARN] ${timestamp} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },

  debug: (message: string, data?: any) => {
    if (process.env.NODE_ENV !== 'production') {
      const timestamp = new Date().toISOString();
      console.log(`[DEBUG] ${timestamp} - ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },

  // Safe logging for sensitive data
  logUserAction: (action: string, userId: string, additionalData?: any) => {
    const timestamp = new Date().toISOString();
    const safeData = additionalData ? { ...additionalData } : {};
    
    // Redact sensitive fields if they exist
    if (safeData.phoneNumber) {
      safeData.phoneNumber = redactPhoneNumber(safeData.phoneNumber);
    }
    if (safeData.walletAddress) {
      safeData.walletAddress = redactWalletAddress(safeData.walletAddress);
    }
    if (safeData.email) {
      safeData.email = redactEmail(safeData.email);
    }
    
    console.log(`[USER_ACTION] ${timestamp} - ${action} for user: ${userId}`, 
      Object.keys(safeData).length > 0 ? JSON.stringify(safeData, null, 2) : '');
  },

  logPhoneOperation: (operation: string, phone: string, additionalData?: any) => {
    const timestamp = new Date().toISOString();
    const redactedPhone = redactPhoneNumber(phone);
    console.log(`[PHONE_OP] ${timestamp} - ${operation} for: ${redactedPhone}`, 
      additionalData ? JSON.stringify(additionalData, null, 2) : '');
  },

  logTransaction: (action: string, transactionId: string, amount?: number, additionalData?: any) => {
    const timestamp = new Date().toISOString();
    const safeData = {
      transactionId,
      amount: amount ? `$${amount}` : undefined,
      ...additionalData
    };
    console.log(`[TRANSACTION] ${timestamp} - ${action}`, JSON.stringify(safeData, null, 2));
  }
};

// Export redaction utilities for use in other files
export { redactPhoneNumber, redactWalletAddress, redactEmail }; 