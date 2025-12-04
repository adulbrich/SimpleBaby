import supabase from '@/library/supabase-client';

export interface AuthResponse {
    user: any
    session: any
    error: any
}

export const signOut = async (): Promise<{ error: any }> => {
    const { error } = await supabase.auth.signOut();
    return { error };
};
