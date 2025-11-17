import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWebAuthnCredential extends Document {
	_id: Types.ObjectId;
	userId: Types.ObjectId;
	credentialId: string;
	publicKey: string;
	counter: number;
	deviceType: 'singleDevice' | 'multiDevice';
	backedUp: boolean;
	aaguid?: string;
	transports?: string[];
	createdAt: Date;
	updatedAt: Date;
}

const WebAuthnCredentialSchema = new Schema<IWebAuthnCredential>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		credentialId: { type: String, required: true, unique: true },
		publicKey: { type: String, required: true },
		counter: { type: Number, default: 0 },
		deviceType: { type: String, enum: ['singleDevice', 'multiDevice'], default: 'singleDevice' },
		backedUp: { type: Boolean, default: false },
		aaguid: { type: String },
		transports: [{ type: String }],
	},
	{ timestamps: true, versionKey: false }
);

WebAuthnCredentialSchema.index({ userId: 1, credentialId: 1 }, { unique: true });

export default
	mongoose.models.WebAuthnCredential ||
	mongoose.model<IWebAuthnCredential>('WebAuthnCredential', WebAuthnCredentialSchema);