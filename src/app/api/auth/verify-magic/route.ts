import { NextRequest, NextResponse } from 'next/server';
import { Magic } from '@magic-sdk/admin';
import { connectToMongoDB } from '@/util/dbConfig';
import User from '@/models/userModel';

export const runtime = 'nodejs';

const magic = process.env.MAGIC_SECRET_KEY
	? new Magic(process.env.MAGIC_SECRET_KEY)
	: null;

export async function POST(request: NextRequest) {
	try {
		await connectToMongoDB();
		
		if (!magic) {
			return NextResponse.json(
				{ error: 'Magic Admin SDK chưa được cấu hình' },
				{ status: 500 }
			);
		}

		const body = await request.json();
		const { didToken, name } = body as {
			didToken?: string;
			name?: string;
		};

		if (!didToken) {
			return NextResponse.json({ error: 'DID token là bắt buộc' }, { status: 400 });
		}

		magic.token.validate(didToken);

		const metadata = await magic.users.getMetadataByToken(didToken);

		if (!metadata.email) {
			return NextResponse.json({ error: 'Không thể lấy email từ token' }, { status: 400 });
		}

		const email = metadata.email.toLowerCase().trim();

		let user = await User.findOne({ email });

		if (user) {
			user.emailVerified = true;
			if (name && name.trim()) {
				user.name = name.trim();
			}
			if (!user.authMethods.includes('magic-link')) {
				user.authMethods.push('magic-link');
			}
			await user.save();
		} else {
			user = await User.create({
				email,
				name: name?.trim() || undefined,
				emailVerified: true,
				authMethods: ['magic-link'],
			});
		}

		return NextResponse.json({
			success: true,
			user: {
				id: user._id,
				email: user.email,
				name: user.name,
				emailVerified: user.emailVerified,
			},
		});
	} catch (error: any) {
		console.error('Error verifying magic token:', error);
		const message = error?.message || 'Xác minh token thất bại';
		
		if (message.includes('expired') || message.includes('hết hạn')) {
			return NextResponse.json({ error: 'Token đã hết hạn' }, { status: 401 });
		}
		if (message.includes('invalid') || message.includes('không hợp lệ')) {
			return NextResponse.json({ error: 'Token không hợp lệ' }, { status: 401 });
		}

		return NextResponse.json({ error: message }, { status: 500 });
	}
}
