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
import { getActiveChildData } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { decryptData, encryptData } from "@/library/crypto";
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

interface NursingLog {
	id: string;
	child_id: string;
	left_duration: string | null;
	right_duration: string | null;
	logged_at: string;
	note: string | null;
	left_amount: string | null;
	right_amount: string | null;
}

type LocalNursingRow = LocalRow & Omit<NursingLog, "id">;

const NursingLogsView: React.FC = () => {
	const [nursingLogs, setNursingLogs] = useState<NursingLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<NursingLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const { isGuest } = useAuth();
	const [activeChildName, setActiveChildName] = useState<string | null>(null);

	const safeDecrypt = async (value: string | null): Promise<string> => {
		if (!value || !value.includes("U2FsdGVkX1")) return value || "";
		try {
			return await decryptData(value);
		} catch (err) {
			return `[Decryption Failed]: ${err}`;
		}
	};

	const fetchNursingLogs = useCallback(async () => {
		try {
			if (isGuest) {
				const childId = await getLocalActiveChildId();
				if (!childId) throw new Error("No active child selected (Guest Mode)");

                // get & sort nursing logs descendingly
				const rows = await listRows<LocalNursingRow>("nursing_logs");
				const childRows = rows
					.filter((r) => r.child_id === childId)
					.sort(
						(a, b) =>
							new Date(b.logged_at).getTime() - 
                            new Date(a.logged_at).getTime(),
					);

				const decrypted = await Promise.all(
					childRows.map(async (entry) => ({
						...entry,
						left_duration: await safeDecrypt(entry.left_duration),
						right_duration: await safeDecrypt(entry.right_duration),
						left_amount: await safeDecrypt(entry.left_amount),
						right_amount: await safeDecrypt(entry.right_amount),
						note: await safeDecrypt(entry.note),
					})),
				);

				setNursingLogs(decrypted as NursingLog[]);
				return;
			} else {
                const {
                    success,
                    childId,
                    childName,
                    error: childError,
                } = await getActiveChildData();

                if (!success || !childId) {
                    throw new Error(
                        typeof childError === "string"
                            ? childError
                            : childError?.message || "Failed to get child ID",
                    );
                }

                if (childName) setActiveChildName(childName);

                const { data, error } = await supabase
                    .from("nursing_logs")
                    .select("*")
                    .eq("child_id", childId)
                    .order("logged_at", { ascending: false });

                if (error) throw error;

                const decrypted = await Promise.all(
                    (data || []).map(async (entry) => ({
                        ...entry,
                        left_duration: await safeDecrypt(entry.left_duration),
                        right_duration: await safeDecrypt(entry.right_duration),
                        left_amount: await safeDecrypt(entry.left_amount),
                        right_amount: await safeDecrypt(entry.right_amount),
                        note: await safeDecrypt(entry.note),
                    })),
                );

                setNursingLogs(decrypted);
            }
		} catch (err) {
			setError(
				err instanceof Error ? err.message : "An unknown error occurred",
			);
		} finally {
			setLoading(false);
		}
	}, [isGuest]);

	useEffect(() => {
		fetchNursingLogs();
	}, [fetchNursingLogs]);

	const handleSaveEdit = async () => {
		if (!editingLog) return;

		const errorFields = [];
        const durationRegex = /^\d{2}:\d{2}:\d{2}$/;
        if (editingLog.left_duration && !durationRegex.test(editingLog.left_duration)) {
            errorFields.push("Left duration must be in HH:MM:SS format.");
        }
        if (editingLog.right_duration && !durationRegex.test(editingLog.right_duration)) {
            errorFields.push("Right duration must be in HH:MM:SS format.");
        }

		if (errorFields.length !== 0) {
			Alert.alert("Invalid Format", `Please fix the following errors:\n\n${errorFields.join("\n\n")}`);
			return;
		}

		try {
			const updated = {
				left_duration: editingLog.left_duration
					? await encryptData(editingLog.left_duration)
					: null,
				right_duration: editingLog.right_duration
					? await encryptData(editingLog.right_duration)
					: null,
				left_amount: editingLog.left_amount
					? await encryptData(editingLog.left_amount)
					: null,
				right_amount: editingLog.right_amount
					? await encryptData(editingLog.right_amount)
					: null,
				note: editingLog.note ? await encryptData(editingLog.note) : null,
			};

			if (isGuest) {
				const success = await updateRow("nursing_logs", editingLog.id, updated);
				if (!success) {
					Alert.alert(stringLib.errors.logUpdateFailure);
					return;
				}

				await fetchNursingLogs();
				setEditModalVisible(false);
				return;
			} else {
                const { error } = await supabase
                    .from("nursing_logs")
                    .update(updated)
                    .eq("id", editingLog.id);

                if (error) {
                    Alert.alert(stringLib.errors.logUpdateFailure);
                    return;
                }

                await fetchNursingLogs();
                setEditModalVisible(false);
            }
		} catch {
			Alert.alert("Something went wrong during save.");
		}
	};

	const handleDelete = async (id: string) => {
		setDeleteAlertVisible(true);
		Alert.alert("Delete Entry", stringLib.warnings.logDeletionConfirmation, [
			{ text: "Cancel", style: "cancel", onPress: () => { setDeleteAlertVisible(false); } },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					if (isGuest) {
						const success = await deleteRow("nursing_logs", id);
						if (!success) {
							Alert.alert("Error deleting log");
							return;
						}
						setNursingLogs((prev) => prev.filter((log) => log.id !== id));
						return;
					} else {
                        const { error } = await supabase
                            .from("nursing_logs")
                            .delete()
                            .eq("id", id);
                        if (error) {
                            Alert.alert("Error deleting log");
                            return;
                        }
                        setNursingLogs((prev) => prev.filter((log) => log.id !== id));
                    }
					setDeleteAlertVisible(false);
				},
			},
		]);
	};

	const renderNursingLogItem = ({ item }: { item: NursingLog }) => (
		<View className="bg-white rounded-xl p-4 mb-4 shadow">
			<Text className="text-lg font-bold mb-2">
				{format(new Date(item.logged_at), "MMM dd, yyyy")}
			</Text>
			<Text className="text-base mb-1">
				Time Logged: {format(new Date(item.logged_at), "h:mm a")}
			</Text>
			{item.left_duration !== "00:00:00" && (
				<Text className="text-base mb-1">
					Left Duration: {item.left_duration}
				</Text>
			)}
			{item.right_duration !== "00:00:00" && (
				<Text className="text-base mb-1">
					Right Duration: {item.right_duration}
				</Text>
			)}
			{item.left_amount !== "0" && (
				<Text className="text-base mb-1">Left Amount: {item.left_amount}</Text>
			)}
			{item.right_amount !== "0" && (
				<Text className="text-base mb-1">
					Right Amount: {item.right_amount}
				</Text>
			)}
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
					testID={`nursing-logs-edit-button-${item.id}`}
				>
					<Text className="text-blue-700">✏️ Edit</Text>
				</Pressable>
				<Pressable
					className="px-3 py-2 rounded-full bg-red-100"
					onPress={() => handleDelete(item.id)}
					disabled={editModalVisible}
					testID={`nursing-logs-delete-button-${item.id}`}
				>
					<Text className="text-red-700">🗑️ Delete</Text>
				</Pressable>
			</View>
		</View>
	);

	return (
		<View className="flex-1 bg-gray-50 p-4">
			<Text className="text-2xl font-bold mb-4">🍼 Nursing Logs</Text>
			{loading ? (
				<ActivityIndicator size="large" color="#e11d48" />
			) : error ? (
				<Text className="text-red-600 text-center" testID="nursing-logs-loading-error">Error: {error}</Text>
			) : nursingLogs.length === 0 ? (
				<Text>
					You don&apos;t have any nursing logs
					{activeChildName ? ` for ${activeChildName}` : ""} yet!
				</Text>
			) : (
				<FlatList
					data={nursingLogs}
					renderItem={renderNursingLogItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingBottom: 16 }}
					testID="nursing-logs"
				/>
			)}

			{/* Edit Modal */}
			<EditLogPopup
				popupVisible={editModalVisible}
				hidePopup={() => setEditModalVisible(false)}
				title="Edit Nursing Log"
				setLog={setEditingLog}
				handleSubmit={handleSaveEdit}
				editingLog={editingLog && {
					left_duration: {
						title: "Left Duration",
						type: "duration",
						value: editingLog?.left_duration,
					},
					right_duration: {
						title: "Right Duration",
						type: "duration",
						value: editingLog?.right_duration,
					},
					left_amount: {
						title: "Left Amount",
						type: "text",
						value: editingLog?.left_amount,
					},
					right_amount: {
						title: "Right Amount",
						type: "text",
						value: editingLog?.right_amount,
					},
					note:  {
						title: "Note",
						type: "text",
						value: editingLog?.note,
					},
				}}
				testID="nursing-logs-edit-popup"
			/>
		</View>
	);
};

export default NursingLogsView;
