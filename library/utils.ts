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

    return { success: true, childId: data.id, childName: activeChildName };
};


export const saveNewChild = async (childName: string) => {
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
        throw new Error('User not found.');
    }

    let child = childName.charAt(0).toUpperCase() + childName.slice(1);

    // Insert child into the database
    const { error } = await supabase
        .from('children')
        .insert([{ user_id: userId, name: child }])
        .select('id')
        .single();

    if (error) {
        throw error;
    }

    // Update user session metadata with the active child
    await supabase.auth.updateUser({
        data: { activeChild: child },
    });
};


export async function getChildNames(): Promise<{success: boolean; names: string[]}> {
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
        throw new Error('User not found.');
    }

    const { data, error } = await supabase
        .from("children")
        .select("name")  // select only the child's name column
        .eq("user_id", userId)  // filter by userID
        .order("name");
    if (error) {
        throw new Error("Failed to retrieve children.");
    }

    return { success: true, names: data.map(({name}) => name) };  // extract name, since each row is returned as {columnName: value, ...}
};


export async function getChildCreatedDate(childName: string): Promise<{success: boolean; date: string}> {
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
        throw new Error('User not found.');
    }

    const { data, error } = await supabase
        .from("children")
        .select("created_at")
        .eq("user_id", userId)  // filter by userID
        .eq("name", childName)  // and by child name
        .single();  // restrict to one row
    if (error) {
        throw new Error("Failed to retrieve created at date.");
    }

    return { success: true, date: String(data.created_at) };
};


export async function updateChildName(oldChildName: string, newChildName: string) {
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
        throw new Error('User not found.');
    }

    // get child id
    const { data, error: getError } = await supabase
        .from("children")
        .select("id")
        .eq("user_id", userId)  // filter by userID
        .eq("name", oldChildName)  // and by child name
        .single();  // restrict to one row
    if (getError) {
        throw new Error("Failed to find child ID.");
    }
    const childID: string = String(data.id);  // extract id field as a string

    const { error } = await supabase
        .from("children")
        .update({name: newChildName})
        .eq("id", childID)
    if (error) {
        throw new Error("Failed to update child name.");
    }
};
