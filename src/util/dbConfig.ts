import mongoose from 'mongoose';

export async function connectToMongoDB() {
	try {
		if (mongoose.connection.readyState >= 1) {
			return;
		}
		await mongoose.connect(process.env.MONGO_URI!);

		const connection = mongoose.connection;

		connection.on('connected', () => {
			console.log('Kết nối MongoDB thành công!');
		});

		connection.on('error', (err: Error) => { 
			console.error('Lỗi kết nối MongoDB:', err);
			process.exit(1);
		});
	} catch (error: any) {
		console.error('Lỗi kết nối MongoDB:', error);
		throw error;
	}
}
