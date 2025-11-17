import { NextResponse } from 'next/server';
import { clearCookies } from '@lib/cookieActions';

export async function POST() {
	await clearCookies();
	return NextResponse.json({ success: true });
}
