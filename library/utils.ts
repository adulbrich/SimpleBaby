import supabase from './supabase-client';
import { decryptData } from './crypto';

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
            childName = await decryptData(childName);
        } catch {
            console.error("Could not decrypt child name.");
            return { success: false };
        }
    }

    return { success: true, childId: data.id, childName };
};


export const saveNewChild = async (childName: string) => {
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
        throw new Error('User not found.');
    }

    const child = childName.charAt(0).toUpperCase() + childName.slice(1);

    // make sure that the user does not already have any other children with the new name
    const { data: nameData, error: getNameError } = await supabase
        .from("children")
        .select("id")
        .eq("user_id", userId)  // filter by userID
        .eq("name", child);  // and by new child name
    if (getNameError) {
        throw new Error("Unable to check name availability.");
    }
    if (nameData.length > 0) {
        throw new Error("Child name already exists.");
    }

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


export async function getChildNames(): Promise<{ names: string[] }> {
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

    return { names: data.map(({name}) => name) };  // extract name, since each row is returned as {columnName: value, ...}
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
    const { data: idData, error: getIdError } = await supabase
        .from("children")
        .select("id")
        .eq("user_id", userId)  // filter by userID
        .eq("name", oldChildName)  // and by child name
        .single();  // restrict to one row
    if (getIdError) {
        throw new Error("Failed to find child ID.");
    }
    const childID: string = String(idData.id);  // ensure id field is a string

    // make sure that the user does not already have any other children with the new name
    const { data: nameData, error: getNameError } = await supabase
        .from("children")
        .select("id")
        .eq("user_id", userId)  // filter by userID
        .eq("name", newChildName);  // and by new child name
    if (getNameError) {
        throw new Error("Unable to check name availability.");
    }
    if (nameData.length > 0) {
        throw new Error("Child name already exists.");
    }

    const { error } = await supabase
        .from("children")
        .update({name: newChildName})
        .eq("id", childID);
    if (error) {
        throw new Error("Failed to update child name.");
    }
};


export async function deleteChild(childName: string) {
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
        .eq("name", childName)  // and by child name
        .single();  // restrict to one row
    if (getError) {
        throw new Error("Failed to find child ID.");
    }
    const childID: string = String(data.id);  // ensure id field is a string

    const { error } = await supabase
        .from("children")
        .delete()
        .eq("id", childID);
    if (error) {
        throw new Error("Failed to delete child.");
    }
};
