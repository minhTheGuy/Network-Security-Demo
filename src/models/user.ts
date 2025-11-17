import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IUser extends Document {
	_id: Types.ObjectId;
	email: string;
	name?: string;
	credentials: Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
	{
		email: { type: String, required: true, unique: true, lowercase: true, trim: true },
		name: { type: String, trim: true },
		credentials: [{ type: Schema.Types.ObjectId, ref: 'WebAuthnCredential', default: [] }],
	},
	{ timestamps: true, versionKey: false }
);

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);