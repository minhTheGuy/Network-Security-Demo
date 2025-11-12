import mongoose, {Schema, Document} from 'mongoose';

export interface IUser extends Document {
	email: string;
	name?: string;
	avatar?: string;
	emailVerified: boolean;         
	loginToken?: string;             // Token dùng 1 lần (magic link)
	loginTokenExpires?: Date;        // Hết hạn token
	otp?: string;                    // OTP (6 chữ số)
	otpExpires?: Date;               // Hết hạn OTP
  
	authMethods: ('magic-link' | 'otp')[];

	currentChallenge?: string;
	challengeExpires?: Date;
	challengeType?: 'registration' | 'authentication';
  
	createdAt: Date;
	updatedAt: Date;
  }
  
  const UserSchema = new Schema<IUser>(
	{
	  email: {
		type: String,
		required: true,
		unique: true,
		lowercase: true,
		trim: true,
	  },
	  name: { type: String, trim: true },
	  avatar: { type: String },
	  emailVerified: { type: Boolean, default: false },
	  loginToken: { type: String },
	  loginTokenExpires: { type: Date },
	  otp: { type: String },
	  otpExpires: { type: Date },

	  currentChallenge: { type: String },
	  challengeExpires: { type: Date },
	  challengeType: { type: String, enum: ['registration', 'authentication'] },
  
	  authMethods: {
		type: [String],
		enum: ['magic-link', 'otp'],
		default: ['magic-link'],
	  },
	},
	{ timestamps: true }
  );
  
  // Index để tìm nhanh token/OTP
  UserSchema.index({ loginToken: 1 }, { expireAfterSeconds: 600 }); // 10 phút
  UserSchema.index({ otp: 1 }, { expireAfterSeconds: 300 });       // 5 phút
  
  export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema)
