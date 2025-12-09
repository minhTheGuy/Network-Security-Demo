import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticationOptionsJSON } from '@lib/login';
import { getRpID } from '@lib/webauthn-helpers';
import { validateEmail, sanitizeEmail } from '@lib/input-validation';
import { verifyCsrfToken } from '@lib/csrf';

export async function POST(request: NextRequest) {
	try {
		// CSRF Protection
		const csrfValid = await verifyCsrfToken(request);
		if (!csrfValid) {
			return NextResponse.json({ error: 'CSRF token không hợp lệ' }, { status: 403 });
		}
		const body = await request.json();
		const { email } = body as { email?: string };

		// Input validation
		if (!email || !validateEmail(email)) {
			// Prevent user enumeration - return same error for invalid email and non-existent user
			return NextResponse.json({ error: 'Email hoặc thông tin đăng nhập không hợp lệ' }, { status: 400 });
		}

		const sanitizedEmail = sanitizeEmail(email);

		const hostname = request.headers.get('host') || 'localhost';
		const originHeader = request.headers.get('origin') || undefined;
		const rpID = getRpID(hostname, originHeader);

		try {
			const options = await getAuthenticationOptionsJSON(sanitizedEmail, rpID);

			return NextResponse.json({ success: true, options });
		} catch (error) {
			// Prevent user enumeration - return same error message
			return NextResponse.json({ error: 'Email hoặc thông tin đăng nhập không hợp lệ' }, { status: 400 });
		}
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
