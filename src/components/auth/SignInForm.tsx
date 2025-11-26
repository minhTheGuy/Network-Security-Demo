/**
 * SignInForm Component
 * Handles sign-in with email and password
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaAngleLeft } from 'react-icons/fa6';
import { supported } from '@github/webauthn-json';
import { startAuthentication } from '@simplewebauthn/browser';
import type {
	AuthenticationResponseJSON,
	PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/types';

export const SignInForm: React.FC = () => {
  const router = useRouter();

	const [email, setEmail] = useState('');
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [isSupported, setIsSupported] = useState<boolean | null>(null);

	useEffect(() => {
		const checkSupport = async () => {
			try {
				const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
				setIsSupported(available && supported());
			} catch {
				setIsSupported(false);
			}
		};

		void checkSupport();
	}, []);

	const requestChallenge = async (): Promise<PublicKeyCredentialRequestOptionsJSON> => {
		const response = await fetch('/api/auth/login-challenge', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ email: email.toLowerCase().trim() }),
		});

		if (!response.ok) {
			throw new Error((await response.json()).error ?? 'Không tạo được challenge');
		}

		const data = await response.json();
		return data.options as PublicKeyCredentialRequestOptionsJSON;
	};

	const verifyResponse = async (authenticationResponse: AuthenticationResponseJSON) => {
		const response = await fetch('/api/auth/login-verify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				email: email.toLowerCase().trim(),
				credential: authenticationResponse,
			}),
		});

		if (!response.ok) {
			throw new Error((await response.json()).error ?? 'Đăng nhập thất bại');
		}
	};

	const onLogin = async () => {
		if (!email.trim()) {
			setErrorMessage('Email là bắt buộc');
			return;
		}

		try {
			setLoading(true);
			setErrorMessage('');
			const options = await requestChallenge();
			const authenticationResponse = await startAuthentication({ optionsJSON: options });
			await verifyResponse(authenticationResponse);
			router.push('/profile');
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : 'Đăng nhập bằng Passkey thất bại';
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	};

	const buttonDisabled = loading || email.trim().length === 0 || isSupported === false;

	if (isSupported === null) {
		return <p className="text-center">Đang kiểm tra khả năng Passkey...</p>;
	}

	if (isSupported === false) {
		return (
			<div className="flex flex-col items-center justify-center min-h-screen py-2 text-center">
				<p className="text-lg mb-4">
					Thiết bị của bạn chưa hỗ trợ Passkey. Vui lòng thử trên thiết bị khác.
				</p>
				<Link href="/">
					<p className="mt-4 opacity-50">
						<FaAngleLeft className="inline mr-1" /> Quay Về Trang Chủ
					</p>
				</Link>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<h1 className="py-10 mb-10 text-5xl">
				{loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
			</h1>

			<input
				className="w-[350px] text-slate-800 p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600"
				id="email"
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Email..."
			/>

			<button
				onClick={onLogin}
				className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600 uppercase px-40 py-3 mt-10 font-bold disabled:opacity-50"
				disabled={buttonDisabled}>
				{loading ? 'Đang đăng nhập...' : 'Đăng nhập bằng Passkey'}
			</button>

			{errorMessage && (
				<p className="mt-4 text-red-400 text-sm text-center w-[350px]">{errorMessage}</p>
			)}

			<div className="mt-6 w-[350px]">
				<div className="relative flex items-center">
					<div className="flex-grow border-t border-gray-400"></div>
					<span className="flex-shrink mx-4 text-gray-400 text-sm">hoặc</span>
					<div className="flex-grow border-t border-gray-400"></div>
				</div>
			</div>

			<Link href="/faceid/login">
				<button
					type="button"
					className="w-[350px] p-2 border-2 border-blue-500 text-blue-500 rounded-lg focus:outline-none focus:border-blue-600 uppercase px-40 py-3 mt-6 font-bold hover:bg-blue-500 hover:text-white transition-colors">
					Đăng nhập bằng FaceID/TouchID
				</button>
			</Link>

			<Link href="/sign-up">
				<p className="mt-10">
					Bạn chưa có tài khoản?
					<span className="font-bold text-white ml-2 cursor-pointer hover:underline">
						Đăng ký tài khoản ngay
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

export default SignInForm;
