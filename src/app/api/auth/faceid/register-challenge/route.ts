import { NextRequest, NextResponse } from 'next/server';
import { getFaceIDRegistrationOptions } from '@lib/faceid-register';
import { getRpID, getOrigin } from '@lib/webauthn-helpers';
import { verifyCsrfToken } from '@lib/csrf';
import { validateEmail, sanitizeEmail, validateUsername, sanitizeUsername } from '@lib/input-validation';

export async function POST(request: NextRequest) {
	try {
		// CSRF Protection
		const csrfValid = await verifyCsrfToken(request);
		if (!csrfValid) {
			return NextResponse.json({ error: 'CSRF token không hợp lệ' }, { status: 403 });
		}

		const body = await request.json();
		const { email, username } = body as { email?: string; username?: string };

		// Input validation
		if (!email || !validateEmail(email)) {
			return NextResponse.json({ error: 'Email không hợp lệ' }, { status: 400 });
		}

		const sanitizedEmail = sanitizeEmail(email);
		const sanitizedUsername = username ? sanitizeUsername(username) : '';

		if (username && !validateUsername(username)) {
			return NextResponse.json({ error: 'Tên người dùng không hợp lệ' }, { status: 400 });
		}

		const hostname = request.headers.get('host') || 'localhost';
		const originHeader = request.headers.get('origin') || undefined;
		const rpID = getRpID(hostname, originHeader);
		const expectedOrigin = getOrigin(originHeader, hostname);

		const options = await getFaceIDRegistrationOptions(
			sanitizedEmail,
			sanitizedUsername,
			rpID,
			expectedOrigin
		);

		return NextResponse.json({ success: true, options });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
