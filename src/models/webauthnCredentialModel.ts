import mongoose, { Schema, Document, Types } from 'mongoose';

export interface IWebAuthnCredential extends Document {
	userId: Types.ObjectId;
	credentialId: string;
	publicKey: string;
	signCount: number;
	aaguid?: string;
	deviceMetadata?: Record<string, unknown>;
	revoked: boolean;
	createdAt: Date;
	lastUsedAt?: Date;
}

const WebAuthnCredentialSchema = new Schema<IWebAuthnCredential>(
	{
		userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
		credentialId: { type: String, required: true, unique: true },
		publicKey: { type: String, required: true },
		signCount: { type: Number, default: 0 },
		aaguid: { type: String },
		deviceMetadata: { type: Schema.Types.Mixed },
		revoked: { type: Boolean, default: false },
		lastUsedAt: { type: Date },
	},
	{
		timestamps: { createdAt: true, updatedAt: false },
	}
);

WebAuthnCredentialSchema.index({ userId: 1, credentialId: 1 }, { unique: true });

export default
	mongoose.models.WebAuthnCredential ||
	mongoose.model<IWebAuthnCredential>('WebAuthnCredential', WebAuthnCredentialSchema);

