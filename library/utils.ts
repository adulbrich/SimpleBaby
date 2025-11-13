import supabase from './supabase-client';

export function capitalize(text: string) {
    return text.charAt(0).toUpperCase() + text.slice(1);
}

export const getActiveChildId = async () => {
    // Get the current user
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: 'No authenticated user found' };
    }

    // Get the active child name from user metadata
    const activeChildName = user.user_metadata.activeChild;

    if (!activeChildName) {
        return {
            success: false,
            error: 'No active child set in user metadata',
        };
    }

    // Query the children table to get the child ID by name
    const { data, error } = await supabase
        .from('children')
        .select('id')
        .eq('name', activeChildName)
        .eq('user_id', user.id)
        .single();

    if (error) {
        console.error('Error getting active child:', error);
        return { success: false, error };
    }

    return { success: true, childId: data.id };
};
