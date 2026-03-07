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

    // Retrieve active child ID and name from metadata
    const activeChildId = user.user_metadata?.activeChildId;
    const activeChildName = user.user_metadata?.activeChild;

    if (!activeChildId && !activeChildName) {
        return {
            success: false,
            error: 'No active child set in user metadata',
        };
    }

    const query = supabase
        .from('children')
        .select('id, name')
        .eq('user_id', user.id);

    const { data, error } = activeChildId
        ? await query.eq('id', activeChildId).single()
        : await query.eq('name', activeChildName).single();

    if (error) {
        console.error('Error getting active child:', error);
        return { success: false, error };
    }

    let childName = data?.name;
    if (childName?.includes('U2FsdGVkX1')) {
        try {
            const { decryptData } = await import('./crypto');
            childName = await decryptData(childName);
        } catch {
            console.log("Could not decrypt child name.");
        }
    }

    return { success: true, childId: data.id, childName };
};
