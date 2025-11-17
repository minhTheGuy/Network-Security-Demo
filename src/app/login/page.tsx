import LoginPage from '@/components/LoginPage';

const Login = () => (
	<div className="flex flex-col items-center gap-6 py-12">
		<h1 className="text-3xl font-semibold">Đăng nhập bằng Passkey</h1>
		<LoginPage />
	</div>
);

export default Login;
