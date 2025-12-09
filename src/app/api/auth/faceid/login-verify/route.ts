import { NextRequest, NextResponse } from 'next/server';
import { loginFaceIDUser } from '@lib/faceid-login';
import {
	authenticatedUserIdToCookieStorage,
	consumeChallengeFromCookieStorage,
} from '@lib/cookieActions';
import { getRpID, getOrigin } from '@lib/webauthn-helpers';
import { verifyCsrfToken } from '@lib/csrf';
import { isLocked, recordFailedAttempt, clearFailedAttempts, getLockoutStatus } from '@lib/account-lockout';
import { getClientIp } from '@lib/rateLimit';
import { sanitizeEmail } from '@lib/input-validation';

const LOCKOUT_DURATION_MINUTES = 15;

export async function POST(request: NextRequest) {
	try {
		// CSRF Protection
		const csrfValid = await verifyCsrfToken(request);
		if (!csrfValid) {
			return NextResponse.json({ error: 'CSRF token không hợp lệ' }, { status: 403 });
		}

		const body = await request.json();
		const { email, credential } = body as {
			email?: string;
			credential?: unknown;
		};

		if (!email || !credential) {
			return NextResponse.json({ error: 'Thiếu thông tin đăng nhập' }, { status: 400 });
		}

		const sanitizedEmail = sanitizeEmail(email);
		const clientIp = getClientIp(request.headers);

		// Check account lockout
		const emailLocked = await isLocked(sanitizedEmail, 'email');
		const ipLocked = await isLocked(clientIp, 'ip');

		if (emailLocked || ipLocked) {
			const status = emailLocked
				? await getLockoutStatus(sanitizedEmail, 'email')
				: await getLockoutStatus(clientIp, 'ip');
			
			const minutesLeft = status.lockedUntil
				? Math.ceil((status.lockedUntil.getTime() - Date.now()) / 60000)
				: LOCKOUT_DURATION_MINUTES;
			
			return NextResponse.json(
				{ error: `Tài khoản/IP đã bị khóa. Vui lòng thử lại sau ${minutesLeft} phút.` },
				{ status: 429 }
			);
		}

		const hostname = request.headers.get('host') || 'localhost';
		const originHeader = request.headers.get('origin') || undefined;
		const rpID = getRpID(hostname, originHeader);
		const expectedOrigin = getOrigin(originHeader, hostname);

		const challenge = await consumeChallengeFromCookieStorage();
		if (!challenge) {
			await recordFailedAttempt(sanitizedEmail, 'email');
			await recordFailedAttempt(clientIp, 'ip');
			return NextResponse.json({ error: 'Challenge không tồn tại hoặc đã hết hạn' }, { status: 400 });
		}

		try {
			const user = await loginFaceIDUser(challenge, sanitizedEmail, credential as any, rpID, expectedOrigin);
			
			// Clear failed attempts on success
			await clearFailedAttempts(sanitizedEmail, 'email');
			await clearFailedAttempts(clientIp, 'ip');

			await authenticatedUserIdToCookieStorage(user);

			return NextResponse.json({ success: true });
		} catch (error) {
			// Record failed attempt
			await recordFailedAttempt(sanitizedEmail, 'email');
			await recordFailedAttempt(clientIp, 'ip');
			throw error;
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
