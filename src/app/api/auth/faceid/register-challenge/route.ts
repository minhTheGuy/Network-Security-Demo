import { NextRequest, NextResponse } from 'next/server';
import { getFaceIDRegistrationOptions } from '@lib/faceid-register';
import { getRpID, getOrigin } from '@lib/webauthn-helpers';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, username } = body as { email?: string; username?: string };

		const hostname = request.headers.get('host') || 'localhost';
		const originHeader = request.headers.get('origin') || undefined;
		const rpID = getRpID(hostname, originHeader);
		const expectedOrigin = getOrigin(originHeader, hostname);

		if (!email) {
			return NextResponse.json({ error: 'Email là bắt buộc' }, { status: 400 });
		}

		const options = await getFaceIDRegistrationOptions(
			email.toLowerCase().trim(),
			username ?? '',
			rpID,
			expectedOrigin
		);

		return NextResponse.json({ success: true, options });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
