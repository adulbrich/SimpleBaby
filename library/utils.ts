import supabase from './supabase-client';
import { encryptData, decryptData } from './crypto';

export function formatName(text: string) {
    const trimmed = text.trim();
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
}

export const getActiveChildData = async () => {
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
        .select('*')
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

    return { success: true, childId: data.id, childName, created_at: data.created_at };
};


async function getChildrenByUserId(userId: string): Promise<{ name: string; id: string }[]> {
    const { data, error } = await supabase
        .from("children")
        .select("name, id")
        .eq("user_id", userId);  // filter by userID
    if (error) {
        throw new Error("Failed to retrieve children.");
    }
    // decrypt names
    const decrypted = await Promise.all(data.map(async ({ name, id }) => {
        try {
            return { name: await decryptData(name), id };
        } catch {
            return { name, id };
        }
    }));

    return decrypted;
};


export const saveNewChild = async (childName: string) => {
    const formattedName = formatName(childName);
	if (!formattedName.trim()) {
		throw new Error("Child name is required.");
	}

    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
        throw new Error('User not found.');
    }

    // make sure that the user does not already have any other children with the new name
    try {
        const children = await getChildrenByUserId(userId);
        // check if user already has a child with this name
        if (children.find(({ name}) => name === formattedName)) {
            throw new Error("Child name already exists.");
        }
    } catch (error) {
        throw error;
    }

    // Insert child into the database
    const encryptedChildName = await encryptData(formattedName);
    const { data, error } = await supabase
        .from('children')
        .insert([{ user_id: userId, name: encryptedChildName }])
        .select('id')
        .single();

    if (error) {
        throw error;
    }

    // Update user session metadata with the active child ID
    await supabase.auth.updateUser({
        data: { activeChildId: data.id },
    });
};


export async function getChildren(): Promise<{ name: string; id: string }[]> {
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
        throw new Error('User not found.');
    }

    const children = await getChildrenByUserId(userId);

    return children.sort((child1, child2) => child1.name.localeCompare(child2.name));
};


export async function updateChildName(childId: string, newChildName: string) {
    const formattedName = formatName(newChildName);
	if (!formattedName.trim()) {
		throw new Error("Child name is required.");
	}

    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
        throw new Error('User not found.');
    }

    // make sure that the user does not already have any other children with the new name
    let children: { name: string; id: string }[];
    try {
        children = await getChildrenByUserId(userId);
    } catch {
        throw new Error("Unable to check name availability.");
    }
    const names = children.map(child => child.name);
    if (names.includes(formattedName)) {
        throw new Error("Child name already exists.");
    }

    const encryptedChildName = await encryptData(formattedName);

    const { error } = await supabase
        .from("children")
        .update({name: encryptedChildName})
        .eq("user_id", userId)  // filter by userID
        .eq("id", childId)  // and child id
        .single();  // this should only update one child
    if (error) {
        throw new Error("Failed to update child name.");
    }
};


export async function deleteChild(childId: string) {
    const user = await supabase.auth.getUser();
    const userId = user.data?.user?.id;

    if (!userId) {
        throw new Error('User not found.');
    }

    const { error } = await supabase
        .from("children")
        .delete()
        .eq("user_id", userId)  // filter by userID
        .eq("id", childId)  // and child id
        .single();  // this should only delete one child
    if (error) {
        throw new Error("Failed to delete child.");
    }
};
