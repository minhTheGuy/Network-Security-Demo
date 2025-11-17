/**
 * Not Found page
 * Displays when a route doesn't exist
 */

import Link from 'next/link';
import { FaAngleLeft } from 'react-icons/fa6';

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen py-2">
			<h1 className="text-6xl font-bold mb-4">404</h1>
			<p className="text-2xl text-gray-300 mb-4">Không Tìm Thấy</p>
			<p className="text-center text-gray-400 mb-8 max-w-md">
				Trang bạn đang tìm kiếm không tồn tại. Vui lòng kiểm tra URL hoặc quay về trang chủ.
			</p>

			<Link href="/">
				<button className="px-8 py-3 border border-gray-300 rounded-lg font-semibold hover:bg-gray-900">
					Quay Về Trang Chủ
				</button>
			</Link>

			<Link href="/">
				<p className="mt-8 opacity-50 hover:opacity-100">
					<FaAngleLeft className="inline mr-1" /> Trang Chủ
				</p>
			</Link>
		</div>
	);
}
