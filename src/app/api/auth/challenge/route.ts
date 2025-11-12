import { NextRequest, NextResponse } from 'next/server';

import { connectToMongoDB } from '@/util/dbConfig';
import User from '@/models/userModel';
import WebAuthnCredential from '@/models/webauthnCredentialModel';
import { generateRegistrationOptionsForUser, generateAuthenticationOptionsForUser } from '@/util/webauthn';

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 minutes

type ChallengeType = 'registration' | 'authentication';

export async function POST(request: NextRequest) {
	try {
		await connectToMongoDB();
		const body = await request.json();
		const { email, type } = body as { email?: string; type?: ChallengeType };

		if (!email || !type) {
			return NextResponse.json({ error: 'Email và loại challenge là bắt buộc' }, { status: 400 });
		}

		if (!['registration', 'authentication'].includes(type)) {
			return NextResponse.json({ error: 'Loại challenge không hợp lệ' }, { status: 400 });
		}

		const user = await User.findOne({ email });

		if (!user) {
			return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 });
		}

		if (!user.emailVerified) {
			return NextResponse.json(
				{ error: 'Email chưa được xác minh. Vui lòng hoàn tất xác thực magic link trước.' },
				{ status: 409 }
			);
		}

		const existingCredentials = await WebAuthnCredential.find({
			userId: user._id,
			revoked: false,
		});

		const challengeExpires = new Date(Date.now() + CHALLENGE_TTL_MS);
		let options: unknown;

		if (type === 'registration') {
			options = await generateRegistrationOptionsForUser({
				userID: user._id.toString(),
				userName: user.email,
				userDisplayName: user.name ?? user.email,
				excludeCredentials: existingCredentials.map((credential) => ({
					id: Buffer.from(credential.credentialId, 'base64url'),
					type: 'public-key' as const,
				})),
			});
		} else {
			if (existingCredentials.length === 0) {
				return NextResponse.json(
					{ error: 'Người dùng chưa đăng ký WebAuthn credential nào.' },
					{ status: 404 }
				);
			}

			options = await generateAuthenticationOptionsForUser({
				userVerification: 'preferred',
				allowCredentials: existingCredentials.map((credential) => ({
					id: Buffer.from(credential.credentialId, 'base64url'),
					type: 'public-key' as const,
				})),
			});
		}

		const { challenge } = options as { challenge: string };

		user.currentChallenge = challenge;
		user.challengeExpires = challengeExpires;
		user.challengeType = type;
		await user.save();

		return NextResponse.json({ options });
	} catch (error) {
		const message = error instanceof Error ? error.message : 'Unknown error';
		return NextResponse.json({ error: message }, { status: 500 });
	}
}

