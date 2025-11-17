/**
 * Central export for lib utilities
 */

export { connectToMongoDB } from './db';
export { clean, generateChallenge, binaryToBase64url } from './auth';
export {
	generateRegistrationOptionsForUser,
	generateAuthenticationOptionsForUser,
	verifyRegistrationResponseForUser,
	verifyAuthenticationResponseForUser,
	bufferToBase64URL,
	base64URLToBuffer,
	type StoredCredential,
} from './webauthn';
export {
	authenticatedUserIdToCookieStorage,
	getRegisteredUserIdFromCookieStorage,
	setChallengeToCookieStorage,
	consumeChallengeFromCookieStorage,
	clearCookies,
} from './cookieActions';
export {
	registerUser,
	getUserFromEmail,
	getCredentialsOfUser,
	updateCredentialSignCount,
	getCredentialForResponse,
} from './database';
export { getAuthenticationOptionsJSON, loginUser } from './login';
export { getRegistrationOptions, verifyRegistration } from './register';
export { default as getServerActionSession } from './session';
