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
import LogItem from "@/components/log-item";

interface FeedingLog {
	id: string;
	child_id: string;
	category: string;
	item_name: string;
	amount: string;
	feeding_time: Date;
	note: string | null;
}

type LocalFeedingRow = LocalRow & Omit<FeedingLog, "id">;

const FeedingLogsView: React.FC = () => {
	const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<FeedingLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const { isGuest } = useAuth();
	const [activeChildName, setActiveChildName] = useState<string | null>(null);

	const safeDecrypt = async (value: string | null): Promise<string> => {
		if (!value || !value.includes("U2FsdGVkX1")) return "";
		try {
			return await decryptData(value);
		} catch (err) {
			console.warn("⚠️ Decryption failed for:", value);
			return `[Decryption Failed]: ${err}`;
		}
	};

	/**
	 * Fetches feeding logs from Supabase for the active child.
	 * Handles child ID resolution and fetch errors.
	 */
	const fetchFeedingLogs = useCallback(async () => {
		setLoading(true);
		setError(null);

		try {
			if (isGuest) {
				const childId = await getLocalActiveChildId();
				if (!childId) throw new Error("No active child selected (Guest Mode)");

                // get & sort feeding logs descendingly
				const rows = await listRows<LocalFeedingRow>("feeding_logs");
				const childRows = rows
					.filter((r) => r.child_id === childId)
					.sort(
						(a, b) =>
							new Date(b.feeding_time).getTime() -
							new Date(a.feeding_time).getTime(),
					);

				const decryptedLogs = await Promise.all(
					childRows.map(async (entry) => ({
						...entry,
						category: await safeDecrypt(entry.category),
						item_name: await safeDecrypt(entry.item_name),
						amount: await safeDecrypt(entry.amount),
						feeding_time: new Date(entry.feeding_time),
						note: entry.note ? await safeDecrypt(entry.note) : "",
					})),
				);

				setFeedingLogs(decryptedLogs as FeedingLog[]);
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

				// Query diaper logs from Supabase and sort by most recent change time
				const { data, error } = await supabase
					.from("feeding_logs")
					.select("*")
					.eq("child_id", childId)
					.order("feeding_time", { ascending: false });

				if (error) throw error;

				const decryptedLogs = await Promise.all(
					(data || []).map(async (entry) => ({
						...entry,
						category: await safeDecrypt(entry.category),
						item_name: await safeDecrypt(entry.item_name),
						amount: await safeDecrypt(entry.amount),
						feeding_time: new Date(entry.feeding_time),
						note: entry.note ? await safeDecrypt(entry.note) : "",
					})),
				);

				setFeedingLogs(decryptedLogs);
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
		fetchFeedingLogs();
	}, [fetchFeedingLogs]);

	const handleDelete = async (id: string) => {
		setDeleteAlertVisible(true);
		Alert.alert("Delete Entry", stringLib.warnings.logDeletionConfirmation, [
			{ text: "Cancel", style: "cancel", onPress: () => { setDeleteAlertVisible(false); } },
			{
				text: "Delete",
				style: "destructive",
				onPress: async () => {
					if (isGuest) {
						const success = await deleteRow("feeding_logs", id);
						if (!success) {
							Alert.alert("Error deleting log");
							return;
						}
						setFeedingLogs((prev) => prev.filter((log) => log.id !== id));
						return;
					} else {
						const { error } = await supabase
							.from("feeding_logs")
							.delete()
							.eq("id", id);

						if (error) {
							Alert.alert("Error deleting log");
							return;
						}

						setFeedingLogs((prev) => prev.filter((log) => log.id !== id));
					}
					setDeleteAlertVisible(false);
				},
			},
		]);
	};

	const handleSaveEdit = async () => {
		if (!editingLog) return;

		try {
			const { id, category, item_name, amount, feeding_time, note } = editingLog;

			if (!item_name.trim() || !amount.trim()) {
				Alert.alert("Failed to update log", "Please ensure the item name and amount are valid.");
				return;
			}

			const encryptedCategory = await encryptData(category);
			const encryptedItemName = await encryptData(item_name);
			const encryptedAmount = await encryptData(amount);
			const encryptedNote = note ? await encryptData(note) : null;

			if (isGuest) {
				const success = await updateRow("feeding_logs", id, {
					category: encryptedCategory,
					item_name: encryptedItemName,
					amount: encryptedAmount,
					feeding_time: feeding_time.toISOString(),
					note: encryptedNote,
				});
				if (!success) {
					Alert.alert(stringLib.errors.logUpdateFailure);
					return;
				}

				await fetchFeedingLogs();
				setEditModalVisible(false);
				return;
			} else {
				const { error } = await supabase
					.from("feeding_logs")
					.update({
						category: encryptedCategory,
						item_name: encryptedItemName,
						amount: encryptedAmount,
						feeding_time: feeding_time.toISOString(),
						note: encryptedNote,
					})
					.eq("id", id);

				if (error) {
					Alert.alert(stringLib.errors.logUpdateFailure);
					return;
				}

				await fetchFeedingLogs();
				setEditModalVisible(false);
			}
		} catch (err) {
			console.error("❌ Encryption or update error:", err);
			Alert.alert("Something went wrong during save.");
		}
	};

	/**
	 * Renders a single feeding log entry in the list.
	 * Conditionally includes consistency, amount, and note if available.
	 */
	const renderFeedingLogItem = ({ item }: { item: FeedingLog }) => (
		<LogItem
			id={item.id}
			onEdit={() => {
				setEditModalVisible(true);
				setEditingLog(item);
			}}
			onDelete={() => handleDelete(item.id)}
			buttonsDisabled={editModalVisible || deleteAlertVisible}
			logData={[
				{ type: "title", value: format(item.feeding_time, "MMM dd, yyyy") },
				{ type: "text", value: format(item.feeding_time, "h:mm a") },
				{ type: "item", label: "Category", value: item.category },
				{ type: "item", label: "Item", value: item.item_name },
				{ type: "item", label: "Amount", value: item.amount },
				{ type: "note", value: item.note},
			]}
		/>
	);

	return (
		<View className="flex-1 bg-gray-50 p-4">
			<Text className="text-2xl font-bold mb-4">🍽️ Feeding Logs</Text>
			{loading ? (
				<ActivityIndicator size="large" color="#e11d48" />
			) : error ? (
				<Text className="text-red-600 text-center" testID="feeding-logs-loading-error">Error: {error}</Text>
			) : feedingLogs.length === 0 ? (
				<Text>
					You don&apos;t have any feeding logs
					{activeChildName ? ` for ${activeChildName}` : ""} yet!
				</Text>
			) : (
				<FlatList
					data={feedingLogs}
					renderItem={renderFeedingLogItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingBottom: 16 }}
					testID="feeding-logs"
				/>
			)}

			{/* Edit Modal */}
			<EditLogPopup
				popupVisible={editModalVisible}
				handleCancel={() => setEditModalVisible(false)}
				title="Edit Feeding Log"
				setLog={setEditingLog}
				handleSubmit={handleSaveEdit}
				editingLog={editingLog && {
					category: {
						title: "Category",
						type: "category",
						categories: ["Liquid", "Solid", "Soft"],
						value: editingLog?.category,
					},
					item_name: {
						title: "Item",
						type: "text",
						value: editingLog?.item_name,
					},
					amount: {
						title: "Amount",
						type: "text",
						value: editingLog?.amount,
					},
					feeding_time: {
						title: "Meal Time",
						type: "time",
						value: editingLog?.feeding_time,
					},
					note:  {
						title: "Note",
						type: "text",
						value: editingLog?.note,
					},
				}}
				testID="feeding-logs-edit-popup"
			/>
		</View>
	);
};

export default FeedingLogsView;
