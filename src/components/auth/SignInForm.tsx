/**
 * SignInForm Component
 * Handles sign-in with email and password
 */

'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FaAngleLeft } from 'react-icons/fa6';
import axios from 'axios';

interface SignInFormState {
	email: string;
	password: string;
}

export const SignInForm: React.FC = () => {
  const router = useRouter();

  const [user, setUser] = React.useState<SignInFormState>({
    email: '',
    password: '',
  });

	const [buttonDisabled, setButtonDisabled] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [errorMessage, setErrorMessage] = React.useState('');

	const onLogin = async () => {
		try {
			setLoading(true);
			setErrorMessage('');
			const response = await axios.post('api/users/login', user);
			router.push('/profile');
		} catch (error: any) {
			const message = error?.response?.data?.error || error?.message || 'Đăng nhập thất bại';
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (user.email.length > 0 && user.password.length > 0) {
			setButtonDisabled(false);
		} else {
			setButtonDisabled(true);
		}
	}, [user]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<h1 className="py-10 mb-10 text-5xl">
				{loading ? 'Đang đăng nhập...' : 'Đăng Nhập'}
			</h1>

			<input
				className="w-[350px] text-slate-800 p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600"
				id="email"
				type="text"
				value={user.email}
				onChange={(e) => setUser({ ...user, email: e.target.value })}
				placeholder="Email..."
			/>

			<input
				className="w-[350px] text-slate-800 p-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:border-gray-600"
				id="password"
				type="password"
				value={user.password}
				onChange={(e) => setUser({ ...user, password: e.target.value })}
				placeholder="Mật Khẩu..."
			/>

			<button
				onClick={onLogin}
				className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600 uppercase px-40 py-3 mt-10 font-bold disabled:opacity-50"
				disabled={buttonDisabled || loading}>
				Đăng Nhập
			</button>

			{errorMessage && (
				<p className="mt-4 text-red-400 text-sm text-center w-[350px]">{errorMessage}</p>
			)}

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
