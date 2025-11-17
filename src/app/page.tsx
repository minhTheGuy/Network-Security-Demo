import Link from 'next/link';

export default function Home() {
	return (
		<div className="h-screen flex flex-col justify-center items-center">
			<h1 className="text-7xl break-words">
				Bảo Mật Mạng Máy Tính
				<span className="text-4xl text-slate-400 ml-4">
					Web Application
				</span>
			</h1>

			<h3 className="my-10 text-2xl font-bold">
				TP.HCM, {new Date().toLocaleDateString('vi-VN')}
			</h3>

			<Link href="/sign-up">
				<button className="bg-white text-black px-20 py-5 rounded-full font-bold text-2xl cursor-pointer hover:opacity-80 border border-black">
					Đăng Ký
				</button>
			</Link>

			<Link href="/sign-in">
				<button className="bg-white text-black px-20 py-5 mt-4 rounded-full font-bold text-2xl cursor-pointer hover:opacity-80 border border-black">
					Đăng Nhập
				</button>
			</Link>
		</div>
	);
}
