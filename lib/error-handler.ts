/**
 * Error handler utility for sanitizing error messages
 * Removes sensitive information like project IDs, credentials, and internal details
 */

interface SanitizedError {
    title: string;
    message: string;
    isNetworkError: boolean;
}

const SENSITIVE_PATTERNS = [
    /project_id[=:]\s*["']?[\w-]+["']?/gi,
    /https?:\/\/[\w-]+\.supabase\.co/gi,
    /api_key[=:]\s*["']?[\w-]+["']?/gi,
    /authorization[=:]\s*["']?[^"']+["']?/gi,
    /x-api-key[=:]\s*["']?[^"']+["']?/gi,
    /user_id[=:]\s*["']?[\w-]+["']?/gi,
    /session_id[=:]\s*["']?[\w-]+["']?/gi,
];

/**
 * Sanitize error message by removing sensitive information
 */
const sanitizeErrorMessage = (message: string): string => {
    let sanitized = message;
    SENSITIVE_PATTERNS.forEach((pattern) => {
        sanitized = sanitized.replace(pattern, "[REDACTED]");
    });
    return sanitized;
};

/**
 * Get HTTP status code from error
 */
const getStatusCode = (error: any): number | null => {
    if (error?.status) return error.status;
    if (error?.statusCode) return error.statusCode;
    if (error?.code && !isNaN(error.code)) return parseInt(error.code);
    return null;
};

/**
 * Map HTTP status codes to user-friendly messages
 */
const getNetworkErrorMessage = (statusCode: number): string => {
    const statusMessages: { [key: number]: string } = {
        400: "Invalid request. Please check your information and try again.",
        401: "Authentication failed. Please try again.",
        403: "Access denied. Please try again.",
        404: "Service not found. Please try again.",
        408: "Request timeout. Please check your internet connection and try again.",
        429: "Too many attempts. Please wait a moment and try again.",
        500: "Server error. Please try again later.",
        502: "Service temporarily unavailable. Please try again later.",
        503: "Service temporarily unavailable. Please try again later.",
        504: "Service timeout. Please check your internet connection and try again.",
    };

    return (
        statusMessages[statusCode] || "Network error occurred. Please try again."
    );
};

/**
 * Check if error is a network/connectivity issue
 */
const isNetworkError = (error: any): boolean => {
    if (!error) return false;

    const networkErrorIndicators = [
        "network",
        "timeout",
        "ECONNREFUSED",
        "ENOTFOUND",
        "ERR_INTERNET_DISCONNECTED",
        "503",
        "504",
        "502",
        "Connection refused",
        "Failed to fetch",
    ];

    const errorString = JSON.stringify(error).toLowerCase();
    return networkErrorIndicators.some((indicator) =>
        errorString.includes(indicator.toLowerCase())
    );
};

/**
 * Handle and sanitize Supabase auth errors
 */
const handleSupabaseAuthError = (error: any): SanitizedError => {
    const statusCode = getStatusCode(error);
    const rawMessage = error?.message || JSON.stringify(error);

    // Network errors
    if (statusCode && statusCode >= 500) {
        return {
            title: "Network Error",
            message: getNetworkErrorMessage(statusCode),
            isNetworkError: true,
        };
    }

    if (isNetworkError(error)) {
        return {
            title: "Connection Error",
            message:
                "Unable to connect to server. Please check your internet connection and try again.",
            isNetworkError: true,
        };
    }

    // Authentication/validation errors
    const lowerMessage = rawMessage.toLowerCase();

    if (
        (lowerMessage.includes("email") && lowerMessage.includes("already")) ||
        lowerMessage.includes("already registered") ||
        lowerMessage.includes("already exists")
    ) {
        return {
            title: "Invalid Details",
            message: "Invalid details, please try again.",
            isNetworkError: false,
        };
    }

    if (lowerMessage.includes("password")) {
        return {
            title: "Password Error",
            message:
                "Password does not meet security requirements. Please ensure it's at least 13 characters.",
            isNetworkError: false,
        };
    }

    if (lowerMessage.includes("email")) {
        return {
            title: "Email Error",
            message: "Please enter a valid email address.",
            isNetworkError: false,
        };
    }

    // Generic error with sanitization
    return {
        title: "Sign Up Failed",
        message: sanitizeErrorMessage(rawMessage),
        isNetworkError: false,
    };
};

/**
 * Handle unexpected errors
 */
const handleUnexpectedError = (error: any): SanitizedError => {
    if (isNetworkError(error)) {
        return {
            title: "Connection Error",
            message:
                "Unable to connect to server. Please check your internet connection and try again.",
            isNetworkError: true,
        };
    }

    return {
        title: "Unexpected Error",
        message: "An unexpected error occurred. Please try again.",
        isNetworkError: false,
    };
};

export {
    SanitizedError,
    sanitizeErrorMessage,
    handleSupabaseAuthError,
    handleUnexpectedError,
    isNetworkError,
    getNetworkErrorMessage,
};
