import { NextRequest, NextResponse } from 'next/server';
import { loginUser } from '@lib/login';
import {
	authenticatedUserIdToCookieStorage,
	consumeChallengeFromCookieStorage,
} from '@lib/cookieActions';

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { email, credential } = body as {
			email?: string;
			credential?: unknown;
		};

		if (!email || !credential) {
			return NextResponse.json({ error: 'Thiếu thông tin đăng nhập' }, { status: 400 });
		}

		const challenge = await consumeChallengeFromCookieStorage();
		if (!challenge) {
			return NextResponse.json({ error: 'Challenge không tồn tại hoặc đã hết hạn' }, { status: 400 });
		}

		const user = await loginUser(challenge, email.toLowerCase().trim(), credential as any);
		await authenticatedUserIdToCookieStorage(user);

		return NextResponse.json({ success: true });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}
