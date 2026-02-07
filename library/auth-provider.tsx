import { Session } from '@supabase/supabase-js';
import {
    createContext,
    PropsWithChildren,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';
import supabase from '@/library/supabase-client';
import { capitalize } from './utils';
import { enterGuestMode, exitGuestMode, isGuestMode } from '@/library/local-store';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

type AuthContextType = {
    session: Session | null
    loading: boolean
    error: string | null
    isGuest: boolean;
    enterGuest: () => Promise<void>
    exitGuest: () => Promise<void>
    signIn: (
        email: string,
        password: string,
    ) => Promise<{ session?: Session | null; error?: any }>
    signUp: (
        email: string,
        password: string,
        firstName: string,
        lastName: string,
    ) => Promise<{ session?: Session | null; error?: any }>
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export function AuthProvider({ children }: PropsWithChildren) {
    const [session, setSession] = useState<Session | null>(null);
    const [isGuest, setIsGuest] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const enterGuest = async () => {
        await enterGuestMode();
        setIsGuest(true);
    };

    const exitGuest = async () => {
        await exitGuestMode();
        setIsGuest(false);
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
            setSession(data.session);
            setIsGuest(false);
            return { session: data.session };
        } catch (err: any) {
            setError(err.message);
            return { error: err };
        }
    };

    const signUp = async (
        email: string,
        password: string,
        firstName: string,
        lastName: string,
    ) => {
        firstName = capitalize(firstName);
        lastName = capitalize(lastName);
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: { data: { firstName, lastName } },
            });
            if (error) throw error;
            setSession(data.session);
            setIsGuest(false);
            return { session: data.session };
        } catch (err: any) {
            setError(err.message);
            return { error: err };
        }
    };

    useEffect(() => {
        // 1) Check for an existing session when the provider mounts
        const init = async () => {
        try {
            const { data, error } = await supabase.auth.getSession();
            if (error) throw error;

            if (data.session) {
                setSession(data.session);
                setIsGuest(false);
            } else {
                setSession(null);
                setIsGuest(await isGuestMode());
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
        };

        init();

        // 2) Listen for future auth changes
        const { data: authListener } = supabase.auth.onAuthStateChange((_event, newSession) => {
            setSession(newSession);
            if (newSession) setIsGuest(false);
        });

        // Cleanup subscription on unmount
        return () => {
            authListener.subscription?.unsubscribe();
        };
    }, []);

    const value = useMemo(
        () => ({
            session,
            loading,
            error,
            isGuest,
            enterGuest,
            exitGuest,
            signIn,
            signUp,
        }),
        [session, loading, error, isGuest],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
