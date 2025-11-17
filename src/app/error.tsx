"use client";

import Link from 'next/link';
import { useEffect } from 'react';
import { FaAngleLeft } from 'react-icons/fa6';

export default function Error({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		// Log the error for debugging
		console.error('Application Error:', error);
	}, [error]);

	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<h1 className="text-5xl mb-4 text-red-500">Lỗi !</h1>
			<p className="text-lg text-gray-300 mb-4">Có điều gì đó không ổn</p>

			{error?.message && (
				<p className="text-center text-gray-400 mb-6 max-w-md">{error.message}</p>
			)}

			{error?.digest && (
				<p className="text-xs text-gray-500 mb-6">Error ID: {error.digest}</p>
			)}

			<div className="flex gap-4">
				<button
					onClick={reset}
					className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">
					Thử lại
				</button>

				<Link href="/">
					<button className="px-6 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-900">
						Quay Về Trang Chủ
					</button>
				</Link>
			</div>

			<Link href="/">
				<p className="mt-8 opacity-50 hover:opacity-100">
					<FaAngleLeft className="inline mr-1" /> Trang Chủ
				</p>
			</Link>
		</div>
	);
}
