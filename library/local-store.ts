import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

// KEYS
// holds common keys necessary for interacting with the local db
const KEYS = {
	isGuest: "sb:isGuest",
	guestId: "sb:guestId",
	activeChildId: "sb:activeChildId",
	children: "sb:children",
	table: (name: string) => `sb:table:${name}`,
};

// Child Type
// id: childID necessary for linking a child to a db row
// name: name ofthe child
// created_at: date of when the child object was made
type Child = {
	id: string;
	name: string;
	created_at: string;
};

// uuidv4()
// creates a random 128-bit identifier
// used for creating a guest ID
function uuidv4(): string {
	return Crypto.randomUUID();
}

// getJson()
// retrieves a given row from the local db
async function getJson<T>(key: string, fallback: T): Promise<T> {
	const raw = await AsyncStorage.getItem(key);
	if (!raw) return fallback;
	try {
		return JSON.parse(raw) as T;
	} catch {
		return fallback;
	}
}

// setJson()
// sets/updates a row in the local db
async function setJson<T>(key: string, value: T) {
	await AsyncStorage.setItem(key, JSON.stringify(value));
}

// enterGuestMode()
// updates KEYS in async storage to turn on guest mode
export async function enterGuestMode() {
	await AsyncStorage.setItem(KEYS.isGuest, "1");
	let guestId = await AsyncStorage.getItem(KEYS.guestId);
	if (!guestId) {
		guestId = uuidv4();
		await AsyncStorage.setItem(KEYS.guestId, guestId);
	}
	return;
}

// exitGuestMode()
// removes the 'isGuest' key to exit guest mode properly
export async function exitGuestMode() {
	await AsyncStorage.removeItem(KEYS.isGuest);
}

// isGuestMode()
// checks async storage for isGuest key
// verifies that isGuest key is true (i.e. === "1")
export async function isGuestMode(): Promise<boolean> {
	return (await AsyncStorage.getItem(KEYS.isGuest)) === "1";
}

// getGuestId()
// retrieves the guestId key from storage
export async function getGuestId(): Promise<string | null> {
	return await AsyncStorage.getItem(KEYS.guestId);
}

// listChildren()
// retrieves a list of children from local db in current guest account
export async function listChildren(): Promise<Child[]> {
	return await getJson<Child[]>(KEYS.children, []);
}

// createChild()
// creates a child object and adds it to the local db
export async function createChild(name: string): Promise<Child> {
	const children = await listChildren();
	const child: Child = {
		id: uuidv4(),
		name,
		created_at: new Date().toISOString(),
	};
	children.push(child);
	await setJson(KEYS.children, children);
	const active = await getActiveChildId(); // if this is the first child, set it active automatically
	if (!active) {
		await setActiveChildId(child.id);
	}
	return child;
}

// getActiveChildId()
// retrieves the childId of the active child
export async function getActiveChildId(): Promise<string | null> {
	return await AsyncStorage.getItem(KEYS.activeChildId);
}

// setActiveChildId
// sets the active child in the guest local db
export async function setActiveChildId(childId: string) {
	await AsyncStorage.setItem(KEYS.activeChildId, childId);
}

// LocalRow
// generic table type for local data logs:
export type LocalRow = { id: string; created_at: string; [k: string]: any };

// insertRow()
// inserts a row into the local db
export async function insertRow<T extends object>(
	tableName: string,
	row: T,
): Promise<LocalRow & T> {
	const tableKey = KEYS.table(tableName);
	const rows = await getJson<(LocalRow & T)[]>(tableKey, []);

	const newRow = {
		id: uuidv4(),
		created_at: new Date().toISOString(),
		...row,
	} as LocalRow & T;

	rows.push(newRow);
	await setJson(tableKey, rows);
	return newRow;
}

// listRows()
// lists rows from a specific table in the local db
export async function listRows<T extends object>(
	tableName: string,
): Promise<(LocalRow & T)[]> {
	return await getJson<(LocalRow & T)[]>(KEYS.table(tableName), []);
}

// updateRow()
// updates a row in the local db
export async function updateRow<T extends object>(
	tableName: string,
	id: string,
	patch: Partial<T>,
): Promise<boolean> {
	const tableKey = KEYS.table(tableName);
	const rows = await getJson<(LocalRow & T)[]>(tableKey, []);
	const index = rows.findIndex((r) => r.id === id);
	if (index === -1) {
		return false;
	}
	rows[index] = { ...rows[index], ...patch };
	await setJson(tableKey, rows);
	return true;
}

// deleteRow()
// deletes a row from a specific table in the local db
export async function deleteRow(
	tableName: string,
	id: string,
): Promise<boolean> {
	const tableKey = KEYS.table(tableName);
	const rows = await getJson<any[]>(tableKey, []);
	const next = rows.filter((r) => r.id !== id);
	if (next.length === rows.length) {
        return false;
    }
	await setJson(tableKey, next);
	return true;
}
