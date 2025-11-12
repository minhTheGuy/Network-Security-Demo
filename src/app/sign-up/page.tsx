'use client';

import Link from 'next/link';
import React, { useEffect } from 'react';
import axios from 'axios';
import { FaAngleLeft } from 'react-icons/fa6';
import { magicClient } from '@/util/magic';

export default function SignUpPage() {
	const [form, setForm] = React.useState({
		name: '',
		email: '',
	});

	const [buttonDisabled, setButtonDisabled] = React.useState(false);
	const [loading, setLoading] = React.useState(false);
	const [errorMessage, setErrorMessage] = React.useState('');
	const [successMessage, setSuccessMessage] = React.useState('');

	const onSignUp = async () => {
		try {
			setLoading(true);
			setErrorMessage('');
			setSuccessMessage('');

			if (!magicClient) {
				throw new Error('Magic client không khả dụng');
			}

			const didToken = await magicClient.auth.loginWithMagicLink({ email: form.email });

			if (didToken) {
				try {
					const response = await axios.post('/api/auth/verify-magic', {
						didToken,
						name: form.name || undefined,
					});

					if (response.data.success) {
						const msg = 'Đăng ký thành công! Tài khoản đã được tạo.';
						setSuccessMessage(msg);
					}
				} catch (verifyError: any) {
					const verifyMessage =
						verifyError?.response?.data?.error ||
						verifyError?.message ||
						'Xác minh thất bại';
					setErrorMessage(verifyMessage);
				}
			}

		} catch (error: any) {
			const message = 'Đăng ký thất bại';
			setErrorMessage(message);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		if (form.email.length > 0) {
			setButtonDisabled(false);
		} else {
			setButtonDisabled(true);
		}
	}, [form.email]);

	return (
		<>
			<div className="flex flex-col items-center justify-center min-h-screen py-2">
				<h1 className="py-10 mb-10 text-5xl">
					{loading ? 'Đang xử lý...' : 'Đăng Ký'}
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
					type="text"
					value={form.email}
					onChange={(e) => setForm({ ...form, email: e.target.value })}
					placeholder="Email..."
				/>

				<button
					onClick={onSignUp}
					className="p-2 border border-gray-300 rounded-lg focus:outline-none focus:border-gray-600 uppercase px-40 py-3 mt-10 font-bold disabled:opacity-50"
					disabled={buttonDisabled || loading}>
					{buttonDisabled ? 'Đăng Ký' : 'Gửi yêu cầu đăng ký'}
				</button>

				{/* Hiển thị thông báo lỗi/thành công */}
				{errorMessage && (
					<p className="mt-4 text-red-400 text-sm text-center w-[350px]">{errorMessage}</p>
				)}

				{successMessage && (
					<p className="mt-4 text-green-400 text-sm text-center w-[350px]">{successMessage}</p>
				)}

				<Link href="/login">
					<p className="mt-10">
						Bạn đã có tài khoản?{' '}
						<span className="font-bold text-white ml-2 cursor-pointer hover:underline">
							Đăng nhập vào tài khoản
						</span>
					</p>
				</Link>

				<Link href="/">
					<p className="mt-8 opacity-50">
						<FaAngleLeft className="inline mr-1" /> Quay Về Trang Chủ
					</p>
				</Link>
			</div>
		</>
	);
}
