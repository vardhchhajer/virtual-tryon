// Shared in-memory OTP store
// This module is imported by both send-otp and verify-otp routes

interface OtpEntry {
    otp: string;
    expiresAt: number;
}

const otpStore = new Map<string, OtpEntry>();

export function storeOtp(otp: string, ttlMs: number = 5 * 60 * 1000) {
    // Clean expired entries
    for (const [key, val] of otpStore.entries()) {
        if (val.expiresAt < Date.now()) otpStore.delete(key);
    }
    otpStore.set('current', { otp, expiresAt: Date.now() + ttlMs });
}

export function verifyOtp(otp: string): { valid: boolean; error?: string } {
    const stored = otpStore.get('current');

    if (!stored) {
        return { valid: false, error: 'No OTP has been sent. Please request a new one.' };
    }

    if (Date.now() > stored.expiresAt) {
        otpStore.delete('current');
        return { valid: false, error: 'OTP has expired. Please request a new one.' };
    }

    if (otp.trim() !== stored.otp) {
        return { valid: false, error: 'Invalid OTP. Please check and try again.' };
    }

    // OTP valid — clear it (one-time use)
    otpStore.delete('current');
    return { valid: true };
}
