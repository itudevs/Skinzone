/**
 * Password recovery and deep-link handling utilities.
 * These are pure functions designed to be testable and isolated from React/Supabase specifics.
 */

/**
 * Safely decode a URL parameter that may be percent-encoded
 * @param value - the raw parameter value
 * @returns decoded value, or original if decoding fails
 */
export const decodeParam = (value?: string | null): string => {
  if (!value) return "";
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/**
 * Parse all URL parameters from both query string and fragment (hash)
 * Supabase can send reset links with params in either location
 * @param url - full URL string from deep link
 * @returns object with all extracted parameters
 */
export const parseDeepLinkUrl = (url: string): Record<string, string> => {
  const params: Record<string, string> = {};

  if (!url || typeof url !== "string") {
    return params;
  }

  // Extract query parameters if URL contains ?
  const queryIndex = url.indexOf("?");
  if (queryIndex !== -1) {
    const queryString = url.substring(queryIndex + 1);
    const beforeHash = queryString.split("#")[0];
    beforeHash.split("&").forEach((pair) => {
      const [rawKey, ...rawValueParts] = pair.split("=");
      if (rawKey) {
        const rawValue = rawValueParts.join("=");
        params[decodeParam(rawKey)] = decodeParam(rawValue);
      }
    });
  }

  // Extract fragment parameters (hash)
  const hashIndex = url.indexOf("#");
  if (hashIndex !== -1) {
    const fragment = url.substring(hashIndex + 1);
    fragment.split("&").forEach((pair) => {
      const [rawKey, ...rawValueParts] = pair.split("=");
      if (rawKey) {
        const rawValue = rawValueParts.join("=");
        params[decodeParam(rawKey)] = decodeParam(rawValue);
      }
    });
  }

  return params;
};

/**
 * Extract recovery session tokens from parsed URL parameters
 * Supabase sends recovery links with different token formats:
 * - access_token + refresh_token (for setSession)
 * - code (for exchangeCodeForSession)
 * - token_hash + type (for verifyOtp)
 * @param params - parsed URL parameters
 * @returns object with recovery tokens and type info
 */
export interface RecoveryTokens {
  accessToken?: string;
  refreshToken?: string;
  code?: string;
  tokenHash?: string;
  type?: string;
  hasRecoveryTokens: boolean;
  method: "setSession" | "exchangeCode" | "verifyOtp" | "none";
}

export const extractRecoveryTokens = (
  params: Record<string, string>
): RecoveryTokens => {
  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  const code = params.code;
  const tokenHash = params.token_hash;
  const type = params.type;

  // Determine which recovery method to use (in priority order)
  if (code) {
    return {
      code,
      type,
      hasRecoveryTokens: true,
      method: "exchangeCode",
    };
  }

  if (accessToken && refreshToken) {
    return {
      accessToken,
      refreshToken,
      type,
      hasRecoveryTokens: true,
      method: "setSession",
    };
  }

  if (tokenHash && type === "recovery") {
    return {
      tokenHash,
      type,
      hasRecoveryTokens: true,
      method: "verifyOtp",
    };
  }

  return {
    type,
    hasRecoveryTokens: false,
    method: "none",
  };
};

/**
 * Validate email format
 * @param email - email string to validate
 * @returns true if valid email format
 */
export const validateEmail = (email: string): boolean => {
  if (!email || typeof email !== "string") {
    return false;
  }
  // Simple regex for email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate password requirements
 * @param password - password string
 * @param minLength - minimum password length (default 6)
 * @returns validation result with error message if invalid
 */
export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

export const validatePassword = (
  password: string,
  minLength: number = 6
): PasswordValidationResult => {
  if (!password || typeof password !== "string") {
    return {
      valid: false,
      error: "Password is required",
    };
  }

  if (password.length < minLength) {
    return {
      valid: false,
      error: `Password must be at least ${minLength} characters`,
    };
  }

  return { valid: true };
};

/**
 * Validate password confirmation matches
 * @param password - password
 * @param confirmPassword - confirmation password
 * @returns validation result with error message if mismatch
 */
export const validatePasswordMatch = (
  password: string,
  confirmPassword: string
): PasswordValidationResult => {
  if (password !== confirmPassword) {
    return {
      valid: false,
      error: "Passwords do not match",
    };
  }

  return { valid: true };
};

/**
 * Validate password reset link is complete and has recovery tokens
 * Used to determine if deep link can establish a recovery session
 * @param url - the deep link URL
 * @returns validation result
 */
export const validateRecoveryLink = (url: string): PasswordValidationResult => {
  if (!url) {
    return {
      valid: false,
      error: "No recovery link provided",
    };
  }

  const params = parseDeepLinkUrl(url);
  const tokens = extractRecoveryTokens(params);

  if (!tokens.hasRecoveryTokens) {
    return {
      valid: false,
      error: "Recovery link missing required tokens",
    };
  }

  return { valid: true };
};

/**
 * Combine and validate both password fields for reset attempt
 * @param password - new password
 * @param confirmPassword - password confirmation
 * @param minLength - minimum password length
 * @returns combined validation result
 */
export const validatePasswordReset = (
  password: string,
  confirmPassword: string,
  minLength: number = 6
): PasswordValidationResult => {
  // Check password first
  const passwordCheck = validatePassword(password, minLength);
  if (!passwordCheck.valid) {
    return passwordCheck;
  }

  // Check confirmation match
  const matchCheck = validatePasswordMatch(password, confirmPassword);
  if (!matchCheck.valid) {
    return matchCheck;
  }

  return { valid: true };
};
