'use client';

import { auth } from '@/lib/firebase';
import { User as FirebaseUser, onAuthStateChanged, signOut } from 'firebase/auth';
import { create } from 'zustand';

interface AuthState {
    user: FirebaseUser | null;
    isLoading: boolean;
    error: Error | null;
    isAuthenticated: boolean;
    setUser: (user: FirebaseUser | null) => void;
    setLoading: (loading: boolean) => void;
    setError: (error: Error | null) => void;
    logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
    user: null,
    isLoading: true,
    error: null,
    isAuthenticated: false,
    setUser: (user) => {
        console.log('AuthStore: setUser called. User:', user ? user.uid : null, 'IsAuthenticated:', !!user);
        set({ user, isAuthenticated: !!user, isLoading: false });
    },
    setLoading: (loading) => {
        console.log('AuthStore: setLoading called. Loading:', loading);
        set({ isLoading: loading });
    },
    setError: (error) => {
        console.log('AuthStore: setError called. Error:', error);
        set({ error, isLoading: false });
    },
    logout: async () => {
        set({ isLoading: true });
        try {
            await signOut(auth);
            set({ user: null, isAuthenticated: false, isLoading: false });
        } catch (e) {
            set({ error: e as Error, isLoading: false });
        }
    },
}));

// Initialize auth state listener
// This will run once when the store is imported for the first time.
onAuthStateChanged(auth, (user) => {
    console.log('AuthStore: onAuthStateChanged - user:', user ? user.uid : null);
    useAuthStore.getState().setUser(user);
    // setLoading(false) is called within setUser, so it might be redundant here
    // but let's keep it for now to ensure isLoading is correctly updated.
    useAuthStore.getState().setLoading(false);
}, (error) => {
    console.error('AuthStore: onAuthStateChanged - error:', error);
    useAuthStore.getState().setError(error);
    useAuthStore.getState().setLoading(false);
});
