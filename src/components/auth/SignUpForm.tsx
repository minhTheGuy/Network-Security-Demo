/**
 * SignUpForm Component
 * Registers users directly with WebAuthn/Passkey (no OTP fallback)
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaAngleLeft } from 'react-icons/fa6';
import { startRegistration } from '@simplewebauthn/browser';
import type {
	PublicKeyCredentialCreationOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/types';

interface SignUpFormState {
	name: string;
	email: string;
}

const createJsonRequest = (payload: Record<string, unknown>) => ({
	method: 'POST',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify(payload),
});

export const SignUpForm: React.FC = () => {
	const router = useRouter();
	const [form, setForm] = useState<SignUpFormState>({ name: '', email: '' });
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [isWebAuthnReady, setIsWebAuthnReady] = useState<boolean | null>(null);

	useEffect(() => {
		const checkSupport = async () => {
			try {
				if (typeof window === 'undefined' || typeof PublicKeyCredential === 'undefined') {
					setIsWebAuthnReady(false);
					return;
				}
				const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
				setIsWebAuthnReady(available);
			} catch {
				setIsWebAuthnReady(false);
			}
		};

		checkSupport();
	}, []);

	const requestRegistrationOptions = async (): Promise<PublicKeyCredentialCreationOptionsJSON> => {
		const response = await fetch(
			'/api/auth/register-challenge',
			createJsonRequest({ email: form.email.trim(), username: form.name.trim() })
		);
		const data = await response.json();
		if (!response.ok || !data?.options) {
			throw new Error(data?.error ?? 'Không tạo được challenge đăng ký');
		}
		return data.options as PublicKeyCredentialCreationOptionsJSON;
	};

	const verifyRegistration = async (credential: RegistrationResponseJSON) => {
		const response = await fetch(
			'/api/auth/register-verify',
			createJsonRequest({
				email: form.email.trim(),
				username: form.name.trim(),
				credential,
			})
		);
		const data = await response.json();
		if (!response.ok || !data?.success) {
			throw new Error(data?.error ?? 'Xác minh đăng ký thất bại');
		}
	};

	const onRegisterPasskey = async () => {
		try {
			setLoading(true);
			setErrorMessage('');
			setSuccessMessage('');

			const options = await requestRegistrationOptions();
			const registrationResponse = await startRegistration({ optionsJSON: options });
			await verifyRegistration(registrationResponse);

			setSuccessMessage('Đăng ký Passkey thành công! Đang chuyển hướng...');
			setTimeout(() => router.push('/login'), 2000);
		} catch (error) {
			const message = error instanceof Error ? error.message : 'Đăng ký Passkey thất bại';
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	};

	const buttonDisabled =
		loading || form.email.trim().length === 0 || isWebAuthnReady === false;

	if (isWebAuthnReady === false) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen py-2 text-center">
				<h1 className="py-10 mb-6 text-4xl font-semibold text-red-500">Thiết bị không hỗ trợ Passkey</h1>
				<p className="mb-6 text-gray-300 w-[360px]">
					Trình duyệt hoặc thiết bị của bạn không hỗ trợ WebAuthn. Hãy thử lại bằng một thiết bị mới hơn.
				</p>
				<Link href="/">
					<p className="opacity-50">
						<FaAngleLeft className="inline mr-1" /> Quay Về Trang Chủ
					</p>
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<h1 className="py-10 mb-10 text-5xl">
				{loading ? 'Đang xử lý...' : 'Đăng Ký Passkey'}
				<span className="italic text-sm absolute top-50 ml-4 text-green-600">
					cho đến tháng 11/2025
				</span>
			</h1>

			<input
				className="w-[350px] text-slate-800 p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600"
				id="name"
				type="text"
				value={form.name}
				onChange={(e) => setForm({ ...form, name: e.target.value })}
				placeholder="Tên Người Dùng (tuỳ chọn)"
			/>

			<input
				className="w-[350px] text-slate-800 p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600"
				id="email"
				type="email"
				value={form.email}
				onChange={(e) => setForm({ ...form, email: e.target.value })}
				placeholder="Email..."
			/>

			<button
				onClick={onRegisterPasskey}
				className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600 uppercase px-40 py-3 mt-10 font-bold disabled:opacity-50"
				disabled={buttonDisabled}>
				{buttonDisabled ? 'Nhập Email' : 'Đăng ký Passkey'}
			</button>

			{errorMessage && (
				<p className="mt-4 text-red-400 text-sm text-center w-[350px]">{errorMessage}</p>
			)}

			{successMessage && (
				<p className="mt-4 text-green-400 text-sm text-center w-[350px]">{successMessage}</p>
			)}

			<Link href="/sign-in">
				<p className="mt-10">
					Đã có tài khoản?{' '}
					<span className="font-bold text-white ml-2 cursor-pointer hover:underline">
						Đăng nhập ngay
					</span>
				</p>
			</Link>

			<Link href="/">
				<p className="mt-8 opacity-50">
					<FaAngleLeft className="inline mr-1" /> Quay Về Trang Chủ
				</p>
			</Link>
		</div>
	);
};

export default SignUpForm;

