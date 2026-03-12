import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	Alert,
	Pressable,
} from "react-native";
import { format } from "date-fns";
import { getActiveChildId } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { encryptData, decryptData } from "@/library/crypto";
import { useAuth } from "@/library/auth-provider";
import {
	listRows,
	updateRow,
	deleteRow,
	getActiveChildId as getLocalActiveChildId,
	LocalRow,
} from "@/library/local-store";
import EditLogPopup from "@/components/edit-log-popup";

import stringLib from "../../assets/stringLibrary.json";

interface DiaperLog {
	id: string;
	child_id: string;
	consistency: string;
	amount: string;
	change_time: string;
	note: string | null;
}

type LocalDiaperRow = LocalRow & Omit<DiaperLog, "id">;

const DiaperLogsView: React.FC = () => {
	const [diaperLogs, setDiaperLogs] = useState<DiaperLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeChildName, setActiveChildName] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<DiaperLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const { isGuest } = useAuth();

	const safeDecrypt = async (value: string | null): Promise<string> => {
		if (!value || !value.includes("U2FsdGVkX1")) return "";
		try {
			return await decryptData(value);
		} catch (err) {
			console.warn("⚠️ Decryption failed for:", value);
			return `[Decryption Failed]: ${err}`;
		}
	};

	const fetchDiaperLogs = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			if (isGuest) {
				const childId = await getLocalActiveChildId();
				if (!childId) throw new Error("No active child selected (guest mode)");

                // get & sort diaper logs descendingly
				const rows = await listRows<LocalDiaperRow>("diaper_logs");
				const childRows = rows
					.filter((r) => r.child_id === childId)
					.sort(
						(a, b) =>
							new Date(b.change_time).getTime() -
							new Date(a.change_time).getTime(),
					);

				const decrypted = await Promise.all(
					childRows.map(async (entry) => ({
						...entry,
						consistency: await safeDecrypt(entry.consistency),
						amount: await safeDecrypt(entry.amount),
						note: entry.note ? await safeDecrypt(entry.note) : "",
					})),
				);

				setDiaperLogs(decrypted as DiaperLog[]);
				return;
			} else {
                const {
				    success,
				    childId,
				    childName,
				    error: childError,
			    } = await getActiveChildId();
                if (!success || !childId) {
                    throw new Error(
                        typeof childError === "string"
                            ? childError
                            : childError?.message || "Failed to get active child ID",
                    );
                }

                if (childName) setActiveChildName(childName);

                const { data, error } = await supabase
                    .from("diaper_logs")
                    .select("*")
                    .eq("child_id", childId)
                    .order("change_time", { ascending: false });

                if (error) throw error;

                const decryptedLogs = await Promise.all(
                    (data || []).map(async (entry) => ({
                        ...entry,
                        consistency: await safeDecrypt(entry.consistency),
                        amount: await safeDecrypt(entry.amount),
                        note: entry.note ? await safeDecrypt(entry.note) : "",
                    })),
                );

                setDiaperLogs(decryptedLogs);
            }
		} catch (err) {
			console.error("❌ Fetch or decryption error:", err);
			setError(
				err instanceof Error ? err.message : "An unknown error occurred",
			);
		} finally {
			setLoading(false);
		}
	}, [isGuest]);

	useEffect(() => {
		fetchDiaperLogs();
	}, [fetchDiaperLogs]);

	const handleDelete = async (id: string) => {
		setDeleteAlertVisible(true);
		Alert.alert("Delete Entry", stringLib.warnings.logDeletionConfirmation, [
			{ text: "Cancel", style: "cancel", onPress: () => { setDeleteAlertVisible(false); } },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					if (isGuest) {
						const success = await deleteRow("diaper_logs", id);
						if (!success) {
							Alert.alert("Error deleting log");
						}
						setDiaperLogs((prev) => prev.filter((log) => log.id !== id));
						return;
					} else {
                        const { error } = await supabase
                            .from("diaper_logs")
                            .delete()
                            .eq("id", id);

                        if (error) {
                            Alert.alert("Error deleting log");
                            return;
                        }
                        setDiaperLogs((prev) => prev.filter((log) => log.id !== id));
                    }
					setDeleteAlertVisible(false);
				},
			},
		]);
	};

	const handleSaveEdit = async () => {
		if (!editingLog) return;

		try {
			const { id, consistency, amount, note } = editingLog;

			const encryptedConsistency = await encryptData(consistency);
			const encryptedAmount = await encryptData(amount);
			const encryptedNote = note ? await encryptData(note) : null;

			if (isGuest) {
				const success = await updateRow("diaper_logs", id, {
					consistency: encryptedConsistency,
					amount: encryptedAmount,
					note: encryptedNote,
				});
				if (!success) {
					Alert.alert(stringLib.errors.logUpdateFailure);
					return;
				}

				await fetchDiaperLogs();
				setEditModalVisible(false);
				return;
			} else {
                const { error } = await supabase
                    .from("diaper_logs")
                    .update({
                        consistency: encryptedConsistency,
                        amount: encryptedAmount,
                        note: encryptedNote,
                    })
                    .eq("id", id);

                if (error) {
                    Alert.alert(stringLib.errors.logUpdateFailure);
                    return;
                }

                await fetchDiaperLogs();
                setEditModalVisible(false);
            }
		} catch (err) {
			console.error("❌ Encryption or update error:", err);
			Alert.alert("Something went wrong during save.");
		}
	};

	const renderDiaperLogItem = ({ item }: { item: DiaperLog }) => (
		<View className="bg-white rounded-xl p-4 mb-4 shadow">
			<Text className="text-lg font-bold mb-2">
				{format(new Date(item.change_time), "MMM dd, yyyy")}
			</Text>
			<Text className="text-base mb-1">
				{format(new Date(item.change_time), "h:mm a")}
			</Text>
			<Text className="text-base mb-1">Consistency: {item.consistency}</Text>
			<Text className="text-base mb-1">Size: {item.amount}</Text>
			{item.note && (
				<Text className="text-sm italic text-gray-500 mt-1">
					📝 {item.note}
				</Text>
			)}
			<View className="flex-row justify-end gap-3 mt-4">
				<Pressable
					className="px-3 py-2 rounded-full bg-blue-100"
					onPress={() => {
						setEditModalVisible(true);
						setEditingLog(item);
					}}
					disabled={deleteAlertVisible}
					testID={`diaper-logs-edit-button-${item.id}`}
				>
					<Text className="text-blue-700">✏️ Edit</Text>
				</Pressable>
				<Pressable
					className="px-3 py-2 rounded-full bg-red-100"
					onPress={() => handleDelete(item.id)}
					disabled={editModalVisible}
					testID={`diaper-logs-delete-button-${item.id}`}
				>
					<Text className="text-red-700">🗑️ Delete</Text>
				</Pressable>
			</View>
		</View>
	);

	return (
		<View className="flex-1 bg-gray-50 p-4">
			<Text className="text-2xl font-bold mb-4">🧷 Diaper Logs</Text>
			{loading ? (
				<ActivityIndicator size="large" color="#e11d48" />
			) : error ? (
				<Text className="text-red-600 text-center" testID="diaper-logs-loading-error">Error: {error}</Text>
			) : diaperLogs.length === 0 ? (
				<Text>
					You don&apos;t have any diaper logs
					{activeChildName ? ` for ${activeChildName}` : ""} yet!
				</Text>
			) : (
				<FlatList
					data={diaperLogs}
					renderItem={renderDiaperLogItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingBottom: 16 }}
					testID="diaper-logs"
				/>
			)}

			{/* Edit Modal */}
			<EditLogPopup
				popupVisible={editModalVisible}
				hidePopup={() => setEditModalVisible(false)}
				title="Edit Diaper Log"
				setLog={setEditingLog}
				handleSubmit={handleSaveEdit}
				editingLog={editingLog && {
					consistency: {
						title: "Consistency",
						type: "category",
						categories: ["Wet", "Dry", "Mixed"],
						value: editingLog?.consistency,
					},
					amount: {
						title: "Amount",
						type: "category",
						categories: ["SM", "MD", "LG"],
						value: editingLog?.amount,
					},
					note:  {
						title: "Note",
						type: "text",
						value: editingLog?.note,
					},
				}}
				testID="diaper-logs-edit-popup"
			/>
		</View>
	);
};

export default DiaperLogsView;
