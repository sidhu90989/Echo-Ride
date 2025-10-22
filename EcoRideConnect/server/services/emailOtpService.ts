// Simple in-memory email OTP service for development/local use
// DO NOT use in production. Replace with a proper provider (e.g., SendGrid) and persistent store.

type OtpRecord = {
  code: string;
  expiresAt: number; // epoch ms
  attempts: number;
};

const store = new Map<string, OtpRecord>(); // key: email (lowercased)

function generateCode(): string {
  // 6-digit numeric code
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function requestEmailOtp(emailRaw: string, ttlMs = 5 * 60 * 1000): { success: true; debugCode?: string } {
  const email = (emailRaw || '').trim().toLowerCase();
  if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    throw new Error('Invalid email');
  }
  const code = generateCode();
  const expiresAt = Date.now() + ttlMs;
  store.set(email, { code, expiresAt, attempts: 0 });
  // In development, log code to server console for convenience
  // eslint-disable-next-line no-console
  console.log(`[email-otp] OTP for ${email}: ${code} (expires in ${Math.round(ttlMs / 1000)}s)`);
  return { success: true, debugCode: process.env.NODE_ENV !== 'production' ? code : undefined };
}

export function verifyEmailOtp(emailRaw: string, code: string): boolean {
  const email = (emailRaw || '').trim().toLowerCase();
  const rec = store.get(email);
  if (!rec) return false;
  rec.attempts += 1;
  if (rec.attempts > 5) {
    store.delete(email);
    return false;
  }
  if (Date.now() > rec.expiresAt) {
    store.delete(email);
    return false;
  }
  if (rec.code !== String(code).trim()) return false;
  // Success: one-time use
  store.delete(email);
  return true;
}
