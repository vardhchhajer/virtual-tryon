import { NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/otpStore';

/**
 * POST /api/auth/verify-otp
 * Verifies the submitted OTP and returns a session token
 */

export async function POST(request: Request) {
    try {
        const { otp } = await request.json();

        if (!otp || typeof otp !== 'string') {
            return NextResponse.json(
                { error: 'OTP is required' },
                { status: 400 }
            );
        }

        const result = verifyOtp(otp);

        if (!result.valid) {
            return NextResponse.json(
                { error: result.error },
                { status: 401 }
            );
        }

        // OTP is valid — generate a session token
        const sessionToken = Buffer.from(
            JSON.stringify({
                authenticated: true,
                timestamp: Date.now(),
                expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
            })
        ).toString('base64');

        console.log('[Auth] OTP verified successfully');

        return NextResponse.json({
            success: true,
            token: sessionToken,
        });
    } catch (error) {
        console.error('[Auth] Verify OTP error:', error);
        return NextResponse.json(
            { error: 'Verification failed' },
            { status: 500 }
        );
    }
}
