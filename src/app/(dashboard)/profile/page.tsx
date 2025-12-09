import { redirect } from 'next/navigation';
import { connectToMongoDB } from '@lib/db';
import { getRegisteredUserIdFromCookieStorage } from '@lib/cookieActions';
import User, { type IUser } from '@/models/user';
import WebAuthnCredential, { type IWebAuthnCredential } from '@/models/webauthnCredential';
import LogoutButton from '@/components/LogoutButton';
import { Types, type Document } from 'mongoose';

// Force dynamic rendering since we use cookies
export const dynamic = 'force-dynamic';

// Type cho lean user document
type LeanUser = Omit<IUser, keyof Document> & {
	_id: Types.ObjectId;
};

// Type cho lean credential document
type LeanCredential = Omit<IWebAuthnCredential, keyof Document> & {
	_id: Types.ObjectId;
};

export default async function ProfilePage() {
	try {
		// Lấy userId từ session
		const userId = await getRegisteredUserIdFromCookieStorage();
		if (!userId) {
			redirect('/sign-in');
		}

		// Kết nối database và lấy thông tin user
		await connectToMongoDB();
		const user = await User.findById(userId).lean<LeanUser>();
		if (!user) {
			redirect('/sign-in');
		}

	// Lấy danh sách credentials
	const credentials = await WebAuthnCredential.find({ userId: user._id })
		.lean<LeanCredential[]>()
		.sort({ createdAt: -1 });

	// Format dates
	const createdAt = new Date(user.createdAt).toLocaleDateString('vi-VN', {
		year: 'numeric',
		month: 'long',
		day: 'numeric',
		hour: '2-digit',
		minute: '2-digit',
	});

	const getDeviceTypeLabel = (type: string) => {
		return type === 'multiDevice' ? 'Đa thiết bị' : 'Một thiết bị';
	};

	const getTransportLabel = (transports?: string[]) => {
		if (!transports || transports.length === 0) return 'Không xác định';
		return transports.join(', ').toUpperCase();
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-8 px-4">
			<div className="max-w-4xl mx-auto">
				{/* Header */}
				<div className="mb-8">
					<h1 className="text-4xl font-bold text-gray-900 mb-2">Hồ Sơ Cá Nhân</h1>
					<p className="text-gray-600">Quản lý thông tin tài khoản và bảo mật của bạn</p>
				</div>

				{/* Main Profile Card */}
				<div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
					{/* Profile Header with Gradient */}
					<div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-12">
						<div className="flex items-center space-x-6">
							{/* Avatar */}
							<div className="w-24 h-24 bg-white rounded-full flex items-center justify-center text-3xl font-bold text-blue-600 shadow-lg">
								{user.name ? user.name.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
							</div>
							{/* User Info */}
							<div className="flex-1 text-white">
								<h2 className="text-3xl font-bold mb-2">{user.name || 'Chưa có tên'}</h2>
								<p className="text-blue-100 text-lg">{user.email}</p>
								<p className="text-blue-200 text-sm mt-1">Thành viên từ {createdAt}</p>
							</div>
						</div>
					</div>

					{/* Profile Content */}
					<div className="p-8">
						{/* Stats Grid */}
						<div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
							<div className="bg-blue-50 rounded-xl p-6 border border-blue-100">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-blue-600 text-sm font-medium mb-1">Tổng Passkeys</p>
										<p className="text-3xl font-bold text-blue-900">{credentials.length}</p>
									</div>
									<div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
										<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
										</svg>
									</div>
								</div>
							</div>

							<div className="bg-green-50 rounded-xl p-6 border border-green-100">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-green-600 text-sm font-medium mb-1">Loại Tài Khoản</p>
										<p className="text-xl font-bold text-green-900">WebAuthn</p>
									</div>
									<div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
										<svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
										</svg>
									</div>
								</div>
							</div>

							<div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
								<div className="flex items-center justify-between">
									<div>
										<p className="text-purple-600 text-sm font-medium mb-1">Mã Người Dùng</p>
										<p className="text-xs font-mono text-purple-900 break-all">{user._id.toString()}</p>
									</div>
									<div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
										<svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
											<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" />
										</svg>
									</div>
								</div>
							</div>
						</div>

						{/* User Details */}
						<div className="border-t border-gray-200 pt-8">
							<h3 className="text-xl font-semibold text-gray-900 mb-4">Thông Tin Chi Tiết</h3>
							<div className="space-y-4">
								<div className="flex items-center justify-between py-3 border-b border-gray-100">
									<span className="text-gray-600 font-medium">Họ và Tên</span>
									<span className="text-gray-900 font-semibold">{user.name || 'Chưa cập nhật'}</span>
								</div>
								<div className="flex items-center justify-between py-3 border-b border-gray-100">
									<span className="text-gray-600 font-medium">Email</span>
									<span className="text-gray-900 font-semibold">{user.email}</span>
								</div>
								<div className="flex items-center justify-between py-3 border-b border-gray-100">
									<span className="text-gray-600 font-medium">Ngày Tạo Tài Khoản</span>
									<span className="text-gray-900 font-semibold">{createdAt}</span>
								</div>
								<div className="flex items-center justify-between py-3">
									<span className="text-gray-600 font-medium">Số Lượng Passkeys</span>
									<span className="text-gray-900 font-semibold">{credentials.length} thiết bị</span>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Passkeys List */}
				<div className="bg-white rounded-2xl shadow-lg overflow-hidden mb-6">
					<div className="px-8 py-6 border-b border-gray-200">
						<h3 className="text-2xl font-bold text-gray-900">Thiết Bị Đã Đăng Ký</h3>
						<p className="text-gray-600 text-sm mt-1">Danh sách các passkey đã được đăng ký trên tài khoản của bạn</p>
					</div>
					<div className="p-8">
						{credentials.length === 0 ? (
							<div className="text-center py-12">
								<svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
									<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
								</svg>
								<p className="text-gray-500 text-lg">Chưa có passkey nào được đăng ký</p>
								<p className="text-gray-400 text-sm mt-2">Đăng ký passkey để bảo mật tài khoản của bạn</p>
							</div>
						) : (
							<div className="space-y-4">
								{credentials.map((cred, index) => (
									<div
										key={cred._id.toString()}
										className="border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
									>
										<div className="flex items-start justify-between">
											<div className="flex items-start space-x-4 flex-1">
												<div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
													<svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
														<path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
													</svg>
												</div>
												<div className="flex-1">
													<div className="flex items-center space-x-3 mb-2">
														<h4 className="text-lg font-semibold text-gray-900">Passkey #{index + 1}</h4>
														<span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
															{getDeviceTypeLabel(cred.deviceType)}
														</span>
														{cred.backedUp && (
															<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
																Đã sao lưu
															</span>
														)}
													</div>
													<div className="space-y-1 text-sm text-gray-600">
														<p>
															<span className="font-medium">Loại vận chuyển:</span> {getTransportLabel(cred.transports)}
														</p>
														<p>
															<span className="font-medium">Số lần sử dụng:</span> {cred.counter}
														</p>
														<p>
															<span className="font-medium">Đăng ký lúc:</span>{' '}
															{new Date(cred.createdAt).toLocaleDateString('vi-VN', {
																year: 'numeric',
																month: 'long',
																day: 'numeric',
																hour: '2-digit',
																minute: '2-digit',
															})}
														</p>
														<p className="font-mono text-xs text-gray-400 break-all mt-2">
															ID: {cred.credentialId.substring(0, 32)}...
														</p>
													</div>
												</div>
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>
				</div>

				{/* Actions */}
				<div className="flex justify-end space-x-4">
					<LogoutButton />
				</div>
			</div>
		</div>
	);
	} catch (error) {
		console.error('Error in ProfilePage:', error);
		// Redirect to sign-in on any error
		redirect('/sign-in');
	}
}
