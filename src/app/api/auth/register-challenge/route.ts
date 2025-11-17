import { NextRequest, NextResponse } from 'next/server';
import { getRegistrationOptions } from '@lib/register';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, username } = body as { email?: string; username?: string };

		if (!email) {
			return NextResponse.json({ error: 'Email là bắt buộc' }, { status: 400 });
		}

		const options = await getRegistrationOptions(email.toLowerCase().trim(), username ?? '');

		return NextResponse.json({ success: true, options });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
