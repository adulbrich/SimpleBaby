import { encryptData } from "./crypto";
import { getActiveChildData } from "@/library/utils";
import {
	insertRow,
	getActiveChildId as getLocalActiveChildId,
    TableName,
} from "@/library/local-store";
import supabase from "./supabase-client";


export type field = {
    dbFieldName: string;  // the name of the field to store in the appropriate database
} & ({
    type: "string" | "unencrypted"
    value: string;
} | {
    type: "date"
    value: Date;
} | {
    type: "photo"
    value: string;
});


type logData = {
    tableName: TableName;
    fields: field[];
};


// uploads a user's photo to a remote database
async function uploadPhoto(
    childId: string,
    uri: string,
): Promise<
    { success: false, error: string } |
    { success: true, path: string }
> {
    try {
        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            throw new Error("User not authenticated");
        }

        const extension = uri.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${user.id}/${childId}/${Date.now()}.${extension}`;

        const res = await fetch(uri);
        const arrayBuffer = await res.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        if (bytes.length === 0) {
            throw new Error(
                "Selected photo is empty (0 bytes). Check the URI source.",
            );
        }

        const contentType =
            extension === "png"
                ? "image/png"
                : extension === "webp"
                    ? "image/webp"
                    : "image/jpeg";

        const { data, error } = await supabase.storage
            .from("milestone-photos")
            .upload(path, bytes, {
                contentType,
                upsert: false,
            });

        if (error) throw error;

        return { success: true, path: data.path };
    } catch (err) {
        return { success: false, error: (err as Error).message };
    }
};


// Saves and inserts a new log into the local database.
async function createGuestLog(
    fields: Record<string, string>,
    tableName: TableName,
    logType: string,
) {
    const childId = await getLocalActiveChildId();
    if (!childId) {
        return { success: false, error: "No active child set (guest mode)" };
    }
    fields.child_id = childId;

    const success = await insertRow(tableName, fields);

    return success
        ? { success: true }
        : { success: false, error: `Failed to save ${logType} log locally.` };
};


// Saves and inserts a new log into the remote database.
async function createRemoteLog(
    fields: Record<string, string>,
    tableName: TableName,
    logType: string,
    imageFields: string[],
    setUploadingPhotos?: (state: boolean) => void,
) {
    const { success, childId, error } = await getActiveChildData();
    if (!success) {
        return { success: false, error };
    }
    fields.child_id = childId;

    if (imageFields.length > 0) {
        setUploadingPhotos?.(true);
        const uploadPaths = await Promise.all(imageFields.map(async fieldName => ({
            fieldName: fieldName,
            result: await uploadPhoto(childId, fields[fieldName]),
        })));

        for (const image of uploadPaths) {
            if (image.result.success) {
                fields[image.fieldName] = image.result.path;
            } else {
                console.error("Photo upload failed", image.result.error);
                return { success: false, error: "Photo upload failed" };
            }
        }
        setUploadingPhotos?.(false);
    }

    const { error: insertError } = await supabase.from(tableName).insert([fields]);

    if (insertError) {
        console.error(`Error creating ${logType} log:`, insertError);
        return { success: false, error: insertError.message };
    }

    return { success: true };
};


// formats or encrypts field if necessary
async function encryptField(field: field): Promise<string | null> {
    if (field.type === "date") {
        return field.value.toISOString();
    } else if (field.type === "unencrypted") {
        return field.value;
    } else if (field.type === "photo") {
        return field.value;
    }  // else: field.type === "string"
    return field.value ? await encryptData(field.value) : null;
}



// Get active child ID, determine save location, and begin to create the diaper log
export async function saveLog(
    logData: logData,
    isGuest: boolean,
    logType: string,
    setUploadingPhotos?: (state: boolean) => void,
): Promise<{
    success: boolean;
    error?: string;
}> {
    let encryptedFields: Record<string, string>;

    try {
        const encryptedEntries = await Promise.all(
            logData.fields.map(async field =>
                [field.dbFieldName, await encryptField(field)]
        ));
        encryptedFields = Object.fromEntries(encryptedEntries);
    } catch (err) {
		console.error("❌ Encryption or insert failed:", err);
        return { success: false, error: "Encryption error" };
    }
    
    if (isGuest) {
        return await createGuestLog(encryptedFields, logData.tableName, logType);
    } else {
        const imageFields = logData.fields.filter(field => field.type === "photo")
            .map(field => field.dbFieldName);
        return await createRemoteLog(encryptedFields, logData.tableName, logType, imageFields, setUploadingPhotos);
    }
};


export function formatStringList(strings: string[]): string {
    return strings.length > 1
            ? `${strings.slice(0, -1).join(", ")} and ${strings.slice(-1)}`
            : strings[0];
}
