import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	Alert,
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
import LogItem from "@/components/log-item";

interface SleepLog {
	id: string;
	child_id: string;
	start_time: Date;
	end_time: Date;
	duration: string | null;
	note: string | null;
}

type LocalSleepRow = LocalRow & Omit<SleepLog, "id">;

const SleepLogsView: React.FC = () => {
	const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<SleepLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const [activeChildName, setActiveChildName] = useState<string | null>(null);
	const { isGuest } = useAuth();

	const safeDecrypt = async (value: string | null): Promise<string> => {
		if (!value || !value.includes("U2FsdGVkX1")) return value || "";
		try {
			return await decryptData(value);
		} catch (err) {
			console.warn("⚠️ Decryption failed for:", value);
			return `[Decryption Failed]: ${err}`;
		}
	};

	const fetchSleepLogs = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			if (isGuest) {
				const childId = await getLocalActiveChildId();
				if (!childId) throw new Error("No active child selected (Guest Mode)");

                // get & sort sleep logs descendingly
				const rows = await listRows<LocalSleepRow>("sleep_logs");
				const childRows = rows
					.filter((r) => r.child_id === childId)
					.sort(
						(a, b) =>
							new Date(b.start_time).getTime() -
							new Date(a.start_time).getTime(),
					);

				const decrypted = await Promise.all(
					childRows.map(async (entry) => ({
						...entry,
						start_time: new Date(entry.start_time),
						end_time: new Date(entry.end_time),
						note: await safeDecrypt(entry.note),
					})),
				);

				setSleepLogs(decrypted as SleepLog[]);
				return;
			} else {
				const {
					success,
					childId,
					childName,
					error: childError,
				} = await getActiveChildData();
				if (!success || !childId) {
					throw new Error(childError);
				}

				if (childName) setActiveChildName(childName);

				const { data, error } = await supabase
					.from("sleep_logs")
					.select("*")
					.eq("child_id", childId)
					.order("start_time", { ascending: false });

				if (error) throw error;

				const decrypted = await Promise.all(
					(data || []).map(async (entry) => ({
						...entry,
						start_time: new Date(entry.start_time),
						end_time: new Date(entry.end_time),
						note: await safeDecrypt(entry.note),
					})),
				);

				setSleepLogs(decrypted);
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
		fetchSleepLogs();
	}, [fetchSleepLogs]);

	const handleDelete = async (id: string) => {
		setDeleteAlertVisible(true);
		Alert.alert("Delete Entry", stringLib.warnings.logDeletionConfirmation, [
			{ text: "Cancel", style: "cancel", onPress: () => { setDeleteAlertVisible(false); } },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					if (isGuest) {
						const success = await deleteRow("sleep_logs", id);
						if (!success) {
							Alert.alert("Error deleting log");
							return;
						}
						setSleepLogs((prev) => prev.filter((log) => log.id !== id));
						return;
					} else {
						const { error } = await supabase
							.from("sleep_logs")
							.delete()
							.eq("id", id);
						if (error) {
							Alert.alert("Error deleting log");
							return;
						}
						setSleepLogs((prev) => prev.filter((log) => log.id !== id));
					}
					setDeleteAlertVisible(false);
				},
			},
		]);
	};

	const handleSaveEdit = async () => {
		if (!editingLog) return;

		if (!editingLog.duration!.trim()) {
			Alert.alert("Failed to update log",
						 "Please ensure that the duration is valid.");
			return;
		}

		try {
			const encryptedNote = editingLog.note
				? await encryptData(editingLog.note)
				: null;

			if (isGuest) {
				const success = await updateRow("sleep_logs", editingLog.id, {
					start_time: editingLog.start_time.toISOString(),
					end_time: editingLog.end_time.toISOString(),
					duration: editingLog.duration,
					note: encryptedNote,
				});

				if (!success) {
					Alert.alert("Failed to update log",
						 "Please ensure that sleep start time is before sleep end time.");
					return;
				}

				await fetchSleepLogs();
				setEditModalVisible(false);
				return;
			} else {
				const { error } = await supabase
					.from("sleep_logs")
					.update({
						start_time: editingLog.start_time.toISOString(),
						end_time: editingLog.end_time.toISOString(),
						duration: editingLog.duration,
						note: encryptedNote,
					})
					.eq("id", editingLog.id);

				if (error) {
					Alert.alert("Failed to update log",
						 "Please ensure that sleep start time is before sleep end time.");
					return;
				}

				await fetchSleepLogs();
				setEditModalVisible(false);
			}
		} catch (err) {
			console.error("❌ Encryption or update error:", err);
			Alert.alert("Something went wrong during save.");
		}
	};

	const renderSleepLogItem = ({ item }: { item: SleepLog }) => (
		<LogItem
			id={item.id}
			onEdit={() => {
				setEditModalVisible(true);
				setEditingLog(item);
			}}
			onDelete={() => handleDelete(item.id)}
			buttonsDisabled={editModalVisible || deleteAlertVisible}
			logData={[
				{ type: "title", value: format(item.start_time, "MMM dd, yyyy") },
				{ type: "item", label: "Start", value: format(item.start_time, "h:mm a") },
				{ type: "item", label: "End", value: format(item.end_time, "h:mm a") },
				{ type: "item", label: "Duration", value: item.duration || "N/A" },
				{ type: "note", value: item.note},
			]}
		/>
	);

	return (
		<View className="flex-1 bg-gray-50 p-4">
			<Text className="text-2xl font-bold mb-4">🛏️ Sleep Logs</Text>
			{loading ? (
				<ActivityIndicator size="large" color="#e11d48" />
			) : error ? (
				<Text className="text-red-600 text-center" testID="sleep-logs-loading-error">Error: {error}</Text>
			) : sleepLogs.length === 0 ? (
				<Text>
					You don&apos;t have any sleep logs
					{activeChildName ? ` for ${activeChildName}` : ""} yet!
				</Text>
			) : (
				<FlatList
					data={sleepLogs}
					renderItem={renderSleepLogItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingBottom: 16 }}
					testID="sleep-logs"
				/>
			)}
			
			{/* Edit Modal */}
			<EditLogPopup
				popupVisible={editModalVisible}
				handleCancel={() => setEditModalVisible(false)}
				title="Edit Sleep Log"
				setLog={setEditingLog}
				handleSubmit={handleSaveEdit}
				editingLog={editingLog && {
					start_time: {
						title: "Start Time",
						type: "time",
						value: editingLog?.start_time,
					},
					end_time: {
						title: "End Time",
						type: "time",
						value: editingLog?.end_time,
					},
					duration: {
						title: "Duration",
						type: "duration",
						value: editingLog?.duration,
					},
					note:  {
						title: "Note",
						type: "text",
						value: editingLog?.note,
					},
				}}
				testID="sleep-logs-edit-popup"
			/>
		</View>
	);
};

export default SleepLogsView;
