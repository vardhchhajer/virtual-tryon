import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { storeOtp } from '@/lib/otpStore';

/**
 * POST /api/auth/send-otp
 * Generates a 6-digit OTP and sends it via Gmail SMTP
 */

const RECIPIENT_EMAIL = 'chhajerabhay@gmail.com';

export async function POST() {
    try {
        const gmailUser = process.env.GMAIL_USER;
        const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

        if (!gmailUser || !gmailAppPassword) {
            console.error('[Auth] Missing GMAIL_USER or GMAIL_APP_PASSWORD env vars');
            return NextResponse.json(
                { error: 'Email service not configured. Set GMAIL_USER and GMAIL_APP_PASSWORD.' },
                { status: 500 }
            );
        }

        // Generate a 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Store in shared OTP store (5 min TTL)
        storeOtp(otp);

        // Create Gmail SMTP transporter
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: gmailUser,
                pass: gmailAppPassword,
            },
        });

        // Send email
        await transporter.sendMail({
            from: `"Virtual Try-On Auth" <${gmailUser}>`,
            to: RECIPIENT_EMAIL,
            subject: '🔐 Your Virtual Try-On Access Code',
            html: `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 16px;">
          <div style="background: white; border-radius: 12px; padding: 32px; text-align: center;">
            <div style="font-size: 40px; margin-bottom: 16px;">🎨</div>
            <h1 style="color: #1a1a2e; font-size: 22px; margin: 0 0 8px;">Virtual Try-On Studio</h1>
            <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Access Verification Code</p>
            <div style="background: #f3f4f6; border-radius: 12px; padding: 20px; margin: 0 0 24px;">
              <span style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4c6ef5;">${otp}</span>
            </div>
            <p style="color: #9ca3af; font-size: 12px; margin: 0;">This code expires in <strong>5 minutes</strong></p>
            <p style="color: #d1d5db; font-size: 11px; margin: 16px 0 0;">If you didn't request this, please ignore this email.</p>
          </div>
        </div>
      `,
        });

        console.log(`[Auth] OTP sent to ${RECIPIENT_EMAIL}`);

        return NextResponse.json({
            success: true,
            message: `OTP sent to ${RECIPIENT_EMAIL}`,
            expiresIn: '5 minutes',
        });
    } catch (error) {
        console.error('[Auth] Failed to send OTP:', error);
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json(
            { error: `Failed to send OTP: ${message}` },
            { status: 500 }
        );
    }
}
