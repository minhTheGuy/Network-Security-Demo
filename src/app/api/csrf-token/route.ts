/**
 * API endpoint to get CSRF token
 */

import { NextResponse } from 'next/server';
import { getCsrfToken } from '@lib/csrf';

export async function GET() {
	try {
		const token = await getCsrfToken();
		return NextResponse.json({ token });
	} catch (error) {
		return NextResponse.json({ error: 'Không thể tạo CSRF token' }, { status: 500 });
	}
}

