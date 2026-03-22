/**
 * Forgot Password Flow Utilities
 *
 * This module handles password reset initiation for unauthenticated users.
 * It provides functions to:
 * - Send a reset-password email link
 * - Validate inputs throughout the flow
 */

import { supabase } from './supabase';

/**
 * Send reset-password email link
 * @param email - User's email address
 * @returns Result with success status and message
 */
export async function sendPasswordResetOTP(email: string): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const normalizedEmail = email.trim().toLowerCase();

    const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail);

    if (error) {
      console.error('Error sending reset password email:', error);
      return {
        success: false,
        error: error.message || 'Failed to send reset password email',
      };
    }

    return {
      success: true,
      message: 'Reset password email sent',
    };
  } catch (error) {
    console.error('Unexpected error sending reset email:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Verify reset token and update password
 * @param email - User's email
 * @param token - Verification token from email
 * @param newPassword - New password
 * @returns Result with success status
 */
export async function verifyResetTokenAndUpdatePassword(
  email: string,
  token: string,
  newPassword: string
): Promise<{
  success: boolean;
  error?: string;
  message?: string;
}> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedToken = token.trim();

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: normalizedToken,
      type: 'recovery',
    });

    if (verifyError) {
      return {
        success: false,
        error: verifyError.message || 'Invalid or expired verification token.',
      };
    }

    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      return {
        success: false,
        error: updateError.message || 'Failed to reset password',
      };
    }

    await supabase.auth.signOut();

    return {
      success: true,
      message: 'Password reset successful',
    };
  } catch (error) {
    console.error('Unexpected error verifying reset token:', error);
    return {
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    };
  }
}

/**
 * Validation result type
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email format
 * @param email - Email to validate
 * @returns Validation result
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

/**
 * Validate OTP format (supports 6 or 8 digits)
 * @param otp - OTP to validate
 * @returns Validation result
 */
export function validateOTP(otp: string): ValidationResult {
  if (!otp || typeof otp !== 'string') {
    return { valid: false, error: 'Verification code is required' };
  }

  if (!/^\d{6}(\d{2})?$/.test(otp.trim())) {
    return { valid: false, error: 'Verification code must be 6 or 8 digits' };
  }

  return { valid: true };
}

/**
 * Validate password meets minimum requirements
 * @param password - Password to validate
 * @param minLength - Minimum length (default 6)
 * @returns Validation result
 */
export function validatePassword(
  password: string,
  minLength: number = 6
): ValidationResult {
  if (!password || typeof password !== 'string') {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < minLength) {
    return {
      valid: false,
      error: `Password must be at least ${minLength} characters`,
    };
  }

  return { valid: true };
}

/**
 * Validate password confirmation matches
 * @param password - Password
 * @param confirmPassword - Confirmation password
 * @returns Validation result
 */
export function validatePasswordMatch(
  password: string,
  confirmPassword: string
): ValidationResult {
  if (password !== confirmPassword) {
    return {
      valid: false,
      error: 'Passwords do not match',
    };
  }

  return { valid: true };
}

/**
 * Validate all password reset fields together
 * @param otp - Verification code
 * @param password - New password
 * @param confirmPassword - Password confirmation
 * @param minLength - Minimum password length
 * @returns Validation result
 */
export function validatePasswordReset(
  otp: string,
  password: string,
  confirmPassword: string,
  minLength: number = 6
): ValidationResult {
  // Check OTP first
  const otpCheck = validateOTP(otp);
  if (!otpCheck.valid) {
    return otpCheck;
  }

  // Check password
  const passwordCheck = validatePassword(password, minLength);
  if (!passwordCheck.valid) {
    return passwordCheck;
  }

  // Check match
  const matchCheck = validatePasswordMatch(password, confirmPassword);
  if (!matchCheck.valid) {
    return matchCheck;
  }

  return { valid: true };
}
