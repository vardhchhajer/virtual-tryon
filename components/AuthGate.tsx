'use client';

import { useState, useEffect, useCallback } from 'react';

type AuthState = 'idle' | 'sending' | 'otp-sent' | 'verifying' | 'authenticated';

export default function AuthGate({ children }: { children: React.ReactNode }) {
    const [authState, setAuthState] = useState<AuthState>('idle');
    const [otp, setOtp] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [countdown, setCountdown] = useState(0);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Check if already authenticated (from localStorage)
    useEffect(() => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            try {
                const decoded = JSON.parse(atob(token));
                if (decoded.authenticated && decoded.expiresAt > Date.now()) {
                    setAuthState('authenticated');
                    return;
                }
            } catch {
                // Invalid token, clear it
            }
            localStorage.removeItem('auth_token');
        }
    }, []);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown <= 0) return;
        const timer = setInterval(() => setCountdown(c => c - 1), 1000);
        return () => clearInterval(timer);
    }, [countdown]);

    const sendOtp = useCallback(async () => {
        setAuthState('sending');
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await fetch('/api/auth/send-otp', { method: 'POST' });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to send OTP');
            }

            setAuthState('otp-sent');
            setSuccessMessage('OTP sent to chhajerabhay@gmail.com — check inbox!');
            setCountdown(60); // 60 second cooldown before resend
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to send OTP');
            setAuthState('idle');
        }
    }, []);

    const verifyOtp = useCallback(async () => {
        if (otp.length !== 6) {
            setError('Please enter the 6-digit OTP');
            return;
        }

        setAuthState('verifying');
        setError(null);

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ otp }),
            });
            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Verification failed');
            }

            // Store token
            localStorage.setItem('auth_token', data.token);
            setAuthState('authenticated');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Verification failed');
            setAuthState('otp-sent');
        }
    }, [otp]);

    // Handle Enter key in OTP input
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && otp.length === 6) {
            verifyOtp();
        }
    }, [otp, verifyOtp]);

    // If authenticated, render the app
    if (authState === 'authenticated') {
        return <>{children}</>;
    }

    // Otherwise, render the auth gate
    return (
        <div className="auth-gate-overlay">
            <div className="auth-gate-backdrop" />
            <div className="auth-gate-content">
                {/* Decorative elements */}
                <div className="auth-gate-orb auth-gate-orb-1" />
                <div className="auth-gate-orb auth-gate-orb-2" />
                <div className="auth-gate-orb auth-gate-orb-3" />

                <div className="auth-gate-card">
                    {/* Logo & Header */}
                    <div className="auth-gate-header">
                        <div className="auth-gate-logo">
                            <div className="auth-gate-logo-icon">
                                <span>V</span>
                            </div>
                            <h1 className="auth-gate-title">Virtual Try-On</h1>
                            <p className="auth-gate-subtitle">AI Fabric Design Studio</p>
                        </div>

                        <div className="auth-gate-divider" />

                        <div className="auth-gate-lock-icon">
                            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                            </svg>
                        </div>
                        <h2 className="auth-gate-heading">Authentication Required</h2>
                        <p className="auth-gate-description">
                            Verify your identity to access the studio. An OTP will be sent to the authorized email.
                        </p>
                    </div>

                    {/* Error message */}
                    {error && (
                        <div className="auth-gate-error">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <line x1="15" y1="9" x2="9" y2="15" />
                                <line x1="9" y1="9" x2="15" y2="15" />
                            </svg>
                            {error}
                        </div>
                    )}

                    {/* Success message */}
                    {successMessage && !error && (
                        <div className="auth-gate-success">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                <polyline points="22 4 12 14.01 9 11.01" />
                            </svg>
                            {successMessage}
                        </div>
                    )}

                    {/* Auth Actions */}
                    <div className="auth-gate-actions">
                        {authState === 'idle' && (
                            <button
                                id="auth-send-otp-btn"
                                onClick={sendOtp}
                                className="auth-gate-btn-primary"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                                    <polyline points="22,6 12,13 2,6" />
                                </svg>
                                Send Authentication Code
                            </button>
                        )}

                        {authState === 'sending' && (
                            <button className="auth-gate-btn-primary auth-gate-btn-loading" disabled>
                                <div className="auth-gate-spinner" />
                                Sending OTP...
                            </button>
                        )}

                        {(authState === 'otp-sent' || authState === 'verifying') && (
                            <>
                                <div className="auth-gate-otp-group">
                                    <label className="auth-gate-label">Enter 6-digit OTP</label>
                                    <input
                                        id="auth-otp-input"
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        value={otp}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            setOtp(val);
                                            setError(null);
                                        }}
                                        onKeyDown={handleKeyDown}
                                        placeholder="● ● ● ● ● ●"
                                        className="auth-gate-otp-input"
                                        autoFocus
                                        disabled={authState === 'verifying'}
                                    />
                                </div>

                                <button
                                    id="auth-verify-btn"
                                    onClick={verifyOtp}
                                    disabled={otp.length !== 6 || authState === 'verifying'}
                                    className="auth-gate-btn-primary"
                                >
                                    {authState === 'verifying' ? (
                                        <>
                                            <div className="auth-gate-spinner" />
                                            Verifying...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                                <polyline points="22 4 12 14.01 9 11.01" />
                                            </svg>
                                            Verify & Access
                                        </>
                                    )}
                                </button>

                                <button
                                    onClick={sendOtp}
                                    disabled={countdown > 0}
                                    className="auth-gate-btn-resend"
                                >
                                    {countdown > 0
                                        ? `Resend code in ${countdown}s`
                                        : 'Resend OTP'
                                    }
                                </button>
                            </>
                        )}
                    </div>

                    {/* Footer info */}
                    <div className="auth-gate-footer">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                        Secured with email OTP verification
                    </div>
                </div>
            </div>
        </div>
    );
}
