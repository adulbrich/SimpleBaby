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

interface FeedingLog {
	id: string;
	child_id: string;
	category: string;
	item_name: string;
	amount: string;
	feeding_time: string;
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
				} = await getActiveChildId();
				if (!success || !childId) {
					throw new Error(
						typeof childError === "string"
							? childError
							: childError?.message || "Failed to get active child ID",
					);
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
			const { id, category, item_name, amount, note } = editingLog;

			const encryptedCategory = await encryptData(category);
			const encryptedItemName = await encryptData(item_name);
			const encryptedAmount = await encryptData(amount);
			const encryptedNote = note ? await encryptData(note) : null;

			if (isGuest) {
				const success = await updateRow("feeding_logs", id, {
					category: encryptedCategory,
					item_name: encryptedItemName,
					amount: encryptedAmount,
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
		<View className="bg-white rounded-xl p-4 mb-4 shadow">
			<Text className="text-lg font-bold mb-2">
				{format(new Date(item.feeding_time), "MMM dd, yyyy")}
			</Text>
			<Text className="text-base mb-1">
				{format(new Date(item.feeding_time), "h:mm a")}
			</Text>
			<Text className="text-base mb-1">Category: {item.category}</Text>
			<Text className="text-base mb-1">Item: {item.item_name}</Text>
			<Text className="text-base mb-1">Amount: {item.amount}</Text>
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
					testID={`feeding-logs-edit-button-${item.id}`}
				>
					<Text className="text-blue-700">✏️ Edit</Text>
				</Pressable>
				<Pressable
					className="px-3 py-2 rounded-full bg-red-100"
					onPress={() => handleDelete(item.id)}
					disabled={editModalVisible}
					testID={`feeding-logs-delete-button-${item.id}`}
				>
					<Text className="text-red-700">🗑️ Delete</Text>
				</Pressable>
			</View>
		</View>
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
				hidePopup={() => setEditModalVisible(false)}
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
