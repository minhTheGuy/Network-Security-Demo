import { NextRequest, NextResponse } from 'next/server';
import { verifyRegistration } from '@lib/register';
import { registerUser } from '@lib/database';
import {
	authenticatedUserIdToCookieStorage,
	consumeChallengeFromCookieStorage,
} from '@lib/cookieActions';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, username, credential } = body as {
			email?: string;
			username?: string;
			credential?: unknown;
		};

		if (!email || !credential) {
			return NextResponse.json({ error: 'Thiếu thông tin đăng ký' }, { status: 400 });
		}

		const challenge = await consumeChallengeFromCookieStorage();
		if (!challenge) {
			return NextResponse.json({ error: 'Challenge không tồn tại hoặc đã hết hạn' }, { status: 400 });
		}

		const verification = await verifyRegistration(credential as any, challenge);
		const user = await registerUser(email.toLowerCase().trim(), username ?? '', verification);

		await authenticatedUserIdToCookieStorage(user);

		return NextResponse.json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
