/**
 * SignUpForm Component
 * Registers users directly with WebAuthn/Passkey (no OTP fallback)
 */

'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaAngleLeft, FaLock, FaUser, FaEnvelope, FaFingerprint } from 'react-icons/fa6';
import { startRegistration } from '@simplewebauthn/browser';
import type {
	PublicKeyCredentialCreationOptionsJSON,
	RegistrationResponseJSON,
} from '@simplewebauthn/types';

interface SignUpFormState {
	name: string;
	email: string;
}

const createJsonRequest = (payload: Record<string, unknown>, csrfToken: string) => ({
	method: 'POST',
	headers: {
		'Content-Type': 'application/json',
		'X-CSRF-Token': csrfToken,
	},
	body: JSON.stringify(payload),
});

export const SignUpForm: React.FC = () => {
	const router = useRouter();
	const [form, setForm] = useState<SignUpFormState>({ name: '', email: '' });
	const [loading, setLoading] = useState(false);
	const [errorMessage, setErrorMessage] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [isWebAuthnReady, setIsWebAuthnReady] = useState<boolean | null>(null);
	const [csrfToken, setCsrfToken] = useState<string>('');

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

		const fetchCsrfToken = async () => {
			try {
				const response = await fetch('/api/csrf-token');
				const data = await response.json();
				if (data.token) {
					setCsrfToken(data.token);
				}
			} catch (error) {
				console.error('Failed to fetch CSRF token:', error);
			}
		};

		checkSupport();
		fetchCsrfToken();
	}, []);

	const requestRegistrationOptions = async (): Promise<PublicKeyCredentialCreationOptionsJSON> => {
		if (!csrfToken) {
			throw new Error('CSRF token chưa sẵn sàng');
		}
		const response = await fetch(
			'/api/auth/register-challenge',
			createJsonRequest({ email: form.email.trim(), username: form.name.trim() }, csrfToken)
		);
		
		// Kiểm tra Content-Type trước khi parse JSON
		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			const text = await response.text();
			throw new Error(`Server trả về lỗi: ${text.substring(0, 100)}`);
		}

		const data = await response.json();
		if (!response.ok || !data?.options) {
			throw new Error(data?.error ?? 'Không tạo được challenge đăng ký');
		}
		return data.options as PublicKeyCredentialCreationOptionsJSON;
	};

	const verifyRegistration = async (credential: RegistrationResponseJSON) => {
		if (!csrfToken) {
			throw new Error('CSRF token chưa sẵn sàng');
		}
		const response = await fetch(
			'/api/auth/register-verify',
			createJsonRequest(
				{
					email: form.email.trim(),
					username: form.name.trim(),
					credential,
				},
				csrfToken
			)
		);

		// Kiểm tra Content-Type trước khi parse JSON
		const contentType = response.headers.get('content-type');
		if (!contentType || !contentType.includes('application/json')) {
			const text = await response.text();
			throw new Error(`Server trả về lỗi: ${text.substring(0, 100)}`);
		}

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
			setTimeout(() => router.push('/profile'), 2000);
		} catch (error) {
			console.error('Registration error:', error);
			let message = 'Đăng ký Passkey thất bại';
			
			if (error instanceof Error) {
				message = error.message;
				// Nếu là lỗi JSON parse, hiển thị thông báo dễ hiểu hơn
				if (error.message.includes('JSON.parse') || error.message.includes('Unexpected token')) {
					message = 'Lỗi kết nối server. Vui lòng kiểm tra kết nối MongoDB và thử lại.';
				}
			}
			
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	};

	const buttonDisabled =
		loading || form.email.trim().length === 0 || isWebAuthnReady === false;

	if (isWebAuthnReady === false) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
				<div className="max-w-md w-full bg-white rounded-2xl shadow-2xl p-8 text-center">
					<div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
						<svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
							<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
						</svg>
					</div>
					<h1 className="text-2xl font-bold text-gray-900 mb-2">Thiết bị không hỗ trợ Passkey</h1>
					<p className="text-gray-600 mb-6">
						Trình duyệt hoặc thiết bị của bạn không hỗ trợ WebAuthn. Hãy thử lại bằng một thiết bị mới hơn.
					</p>
					<Link href="/" className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium">
						<FaAngleLeft className="mr-2" /> Quay Về Trang Chủ
					</Link>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center px-4 py-12">
			<div className="max-w-md w-full">
				{/* Header Card */}
				<div className="text-center mb-8">
					<div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl shadow-lg mb-4">
						<FaLock className="w-8 h-8 text-white" />
					</div>
					<h1 className="text-4xl font-bold text-gray-900 mb-2">Tạo Tài Khoản</h1>
					<p className="text-gray-600">Đăng ký với Passkey để bảo mật tối đa</p>
				</div>

				{/* Form Card */}
				<div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
					<form
						onSubmit={(e) => {
							e.preventDefault();
							onRegisterPasskey();
						}}
						className="space-y-6">
						{/* Name Input */}
						<div>
							<label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
								Tên Người Dùng <span className="text-gray-400">(tùy chọn)</span>
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaUser className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="name"
									type="text"
									value={form.name}
									onChange={(e) => setForm({ ...form, name: e.target.value })}
									placeholder="Nhập tên của bạn"
									className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-colors"
								/>
							</div>
						</div>

						{/* Email Input */}
						<div>
							<label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
								Email <span className="text-red-500">*</span>
							</label>
							<div className="relative">
								<div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
									<FaEnvelope className="h-5 w-5 text-gray-400" />
								</div>
								<input
									id="email"
									type="email"
									required
									value={form.email}
									onChange={(e) => setForm({ ...form, email: e.target.value })}
									placeholder="your.email@example.com"
									className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-400 transition-colors"
								/>
							</div>
						</div>

						{/* Error Message */}
						{errorMessage && (
							<div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start">
								<svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
								</svg>
								<p className="text-sm text-red-800">{errorMessage}</p>
							</div>
						)}

						{/* Success Message */}
						{successMessage && (
							<div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start">
								<svg className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
									<path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
								</svg>
								<p className="text-sm text-green-800">{successMessage}</p>
							</div>
						)}

						{/* Submit Button */}
						<button
							type="submit"
							disabled={buttonDisabled}
							className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 px-4 rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2">
							{loading ? (
								<>
									<svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
										<circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
										<path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
									</svg>
									<span>Đang xử lý...</span>
								</>
							) : (
								<>
									<FaFingerprint className="w-5 h-5" />
									<span>Đăng ký với Passkey</span>
								</>
							)}
						</button>
					</form>

					{/* Divider */}
					<div className="relative my-6">
						<div className="absolute inset-0 flex items-center">
							<div className="w-full border-t border-gray-300"></div>
						</div>
						<div className="relative flex justify-center text-sm">
							<span className="px-4 bg-white text-gray-500">hoặc</span>
						</div>
					</div>

					{/* FaceID Button */}
					<Link href="/faceid/register">
						<button
							type="button"
							className="w-full border-2 border-blue-500 text-blue-600 py-3 px-4 rounded-lg font-semibold hover:bg-blue-50 transition-colors flex items-center justify-center space-x-2">
							<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
							</svg>
							<span>Đăng ký bằng FaceID/TouchID</span>
						</button>
					</Link>
				</div>

				{/* Footer Links */}
				<div className="text-center space-y-4">
					<p className="text-gray-600">
						Đã có tài khoản?{' '}
						<Link href="/sign-in" className="text-blue-600 hover:text-blue-700 font-semibold hover:underline">
							Đăng nhập ngay
						</Link>
					</p>
					<Link href="/" className="inline-flex items-center text-gray-500 hover:text-gray-700 text-sm">
						<FaAngleLeft className="mr-1" /> Quay Về Trang Chủ
					</Link>
				</div>
			</div>
		</div>
	);
};

export default SignUpForm;
