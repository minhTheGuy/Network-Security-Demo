/**
 * Authentication-related types and interfaces
 */

export interface AuthUser {
	id: string;
	email: string;
	name?: string;
	avatar?: string;
}
