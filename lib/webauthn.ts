/**
 * WebAuthn utility functions and helpers
 * Wraps @simplewebauthn for simplified usage
 */

import {
	generateRegistrationOptions,
	generateAuthenticationOptions,
	verifyRegistrationResponse,
	verifyAuthenticationResponse,
	type GenerateRegistrationOptionsOpts,
	type VerifiedRegistrationResponse,
	type GenerateAuthenticationOptionsOpts,
	type VerifiedAuthenticationResponse,
} from '@simplewebauthn/server';

import type {
	RegistrationResponseJSON,
	AuthenticationResponseJSON,
} from '@simplewebauthn/browser';

const rpID = process.env.WEBAUTHN_RP_ID ?? 'localhost';
const rpName = process.env.WEBAUTHN_RP_NAME ?? 'MyApp';
const expectedOrigin = process.env.WEBAUTHN_ORIGIN ?? `http://${rpID}:3000`;

export function generateRegistrationOptionsForUser(
	opts: Omit<GenerateRegistrationOptionsOpts, 'rpID' | 'rpName'>
) {
	return generateRegistrationOptions({
		rpID,
		rpName,
		...opts,
	});
}

export function generateAuthenticationOptionsForUser(
	opts: Omit<GenerateAuthenticationOptionsOpts, 'rpID'>
) {
	return generateAuthenticationOptions({
		rpID,
		...opts,
	});
}

export async function verifyRegistrationResponseForUser(
	payload: RegistrationResponseJSON,
	expectedChallenge: string
): Promise<VerifiedRegistrationResponse> {
	return verifyRegistrationResponse({
		response: payload,
		expectedChallenge,
		expectedOrigin,
		expectedRPID: rpID,
		requireUserVerification: true,
	});
}

type VerifyAuthOptions = Parameters<typeof verifyAuthenticationResponse>[0];
export type StoredCredential = NonNullable<VerifyAuthOptions['credential']>;

export async function verifyAuthenticationResponseForUser(
	payload: AuthenticationResponseJSON,
	expectedChallenge: string,
	credential: StoredCredential
): Promise<VerifiedAuthenticationResponse> {
	return verifyAuthenticationResponse({
		response: payload,
		expectedChallenge,
		expectedOrigin,
		expectedRPID: rpID,
		requireUserVerification: true,
		credential,
	});
}

export function bufferToBase64URL(buffer: ArrayBuffer | Uint8Array): string {
	const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
	return Buffer.from(bytes).toString('base64url');
}

export function base64URLToBuffer(data: string): Uint8Array {
	const buffer = Buffer.from(data, 'base64url');
	return new Uint8Array(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength));
}
