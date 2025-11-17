/**
 * User model and database types
 */

import { Document, Types } from 'mongoose';

export interface IUser extends Document {
	_id: Types.ObjectId;
	email: string;
	name?: string;
	credentials: Types.ObjectId[];
	createdAt: Date;
	updatedAt: Date;
}

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

export interface UserProfile {
	id: string;
	email: string;
	name?: string;
	createdAt: string;
}
