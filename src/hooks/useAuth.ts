/**
 * useAuth Hook
 * Manages authentication state (placeholder for future expansion)
 */

import { useState } from 'react';
import { AuthUser } from '@/types';

export interface UseAuthReturn {
	user: AuthUser | null;
	isLoading: boolean;
	error: string | null;
	setUser: (user: AuthUser | null) => void;
	setError: (error: string | null) => void;
	logout: () => void;
}

export function useAuth(): UseAuthReturn {
	const [user, setUser] = useState<AuthUser | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const logout = () => {
		setUser(null);
		setError(null);
	};

	return {
		user,
		isLoading,
		error,
		setUser,
		setError,
		logout,
	};
}
