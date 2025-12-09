import Link from 'next/link';
import { FaShieldAlt, FaFingerprint, FaLock, FaUserShield } from 'react-icons/fa';

export default function Home() {
	const currentDate = new Date().toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
			{/* Header */}
			<header className="w-full py-6 px-4">
				<div className="max-w-7xl mx-auto flex items-center justify-between">
					<div className="flex items-center space-x-3">
						<div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
							<FaShieldAlt className="w-6 h-6 text-white" />
						</div>
						<div>
							<h2 className="text-xl font-bold text-gray-900">Network Security</h2>
							<p className="text-sm text-gray-600">Web Application</p>
						</div>
					</div>
				</div>
			</header>

			{/* Main Content */}
			<main className="flex-1 flex flex-col justify-center items-center px-4 py-12">
				<div className="max-w-4xl mx-auto text-center">
					{/* Main Title */}
					<div className="mb-8">
						<h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-4 leading-tight">
							Bảo Mật Mạng Máy Tính
						</h1>
						<p className="text-2xl md:text-3xl text-gray-600 font-medium">
							Web Application
						</p>
					</div>

					{/* Date & Location */}
					<div className="mb-12">
						<p className="text-lg text-gray-500 flex items-center justify-center space-x-2">
							<span>📍</span>
							<span>TP.HCM, {currentDate}</span>
						</p>
					</div>

					{/* Features Grid */}
					<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 max-w-3xl mx-auto">
						<div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
							<div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<FaFingerprint className="w-8 h-8 text-blue-600" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Passkey Authentication</h3>
							<p className="text-sm text-gray-600">Đăng nhập an toàn với Passkey</p>
						</div>

						<div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
							<div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<FaLock className="w-8 h-8 text-purple-600" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Bảo Mật Cao</h3>
							<p className="text-sm text-gray-600">Mã hóa và bảo vệ dữ liệu</p>
						</div>

						<div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow border border-gray-100">
							<div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
								<FaUserShield className="w-8 h-8 text-green-600" />
							</div>
							<h3 className="text-lg font-semibold text-gray-900 mb-2">Dễ Sử Dụng</h3>
							<p className="text-sm text-gray-600">Giao diện thân thiện, đơn giản</p>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
						<Link href="/sign-up" className="w-full sm:w-auto">
							<button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 text-white px-12 py-4 rounded-full font-bold text-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2">
								<span>Đăng Ký</span>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
								</svg>
							</button>
						</Link>

						<Link href="/sign-in" className="w-full sm:w-auto">
							<button className="w-full sm:w-auto bg-white text-gray-900 px-12 py-4 rounded-full font-bold text-xl border-2 border-gray-300 shadow-lg hover:shadow-xl hover:border-blue-500 hover:text-blue-600 transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center space-x-2">
								<span>Đăng Nhập</span>
								<svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
								</svg>
							</button>
						</Link>
					</div>
				</div>
			</main>

			{/* Footer */}
			<footer className="w-full py-6 px-4 border-t border-gray-200 bg-white/50">
				<div className="max-w-7xl mx-auto text-center">
					<p className="text-sm text-gray-500">
						© {new Date().getFullYear()} Network Security Demo. Bảo mật và an toàn.
					</p>
				</div>
			</footer>
		</div>
	);
}
