import React, { useState, useEffect, useCallback } from "react";
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	Alert,
} from "react-native";
import { format } from "date-fns";
import supabase from "@/library/supabase-client";
import { encryptData } from "@/library/crypto";
import { useAuth } from "@/library/auth-provider";
import { updateRow } from "@/library/local-store";
import EditLogPopup from "@/components/edit-log-popup";
import stringLib from "../../assets/stringLibrary.json";
import LogItem from "@/components/log-item";
import { fetchLogs, handleDeleteLog } from "@/library/log-functions";

interface FeedingLog {
	id: string;
	child_id: string;
	category: string;
	item_name: string;
	amount: string;
	feeding_time: Date;
	note: string | null;
}

const FeedingLogsView: React.FC = () => {
	const [feedingLogs, setFeedingLogs] = useState<FeedingLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<FeedingLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const { isGuest } = useAuth();
	const [activeChildName, setActiveChildName] = useState<string | null>(null);

	// Fetches feeding logs from Supabase or local storage for the active child.
	const fetchFeedingLogs = useCallback(async () => {
		setLoading(true);
		setError(null);
		
		const result = await fetchLogs<FeedingLog>(
			"feeding_logs",
			isGuest,
			"feeding_time",
			[
				{ dbFieldName: "id", type: "unencrypted" },
				{ dbFieldName: "category", type: "string" },
				{ dbFieldName: "item_name", type: "string" },
				{ dbFieldName: "amount", type: "string" },
				{ dbFieldName: "feeding_time", type: "date" },
				{ dbFieldName: "note", type: "string" },
			]
		);
		if (result.success) {
			setFeedingLogs(result.data);
			setActiveChildName(result.childName);
		} else {
			setError(result.error);
		}

		setLoading(false);
	}, [isGuest]);

	useEffect(() => {
		fetchFeedingLogs();
	}, [fetchFeedingLogs]);

	const handleSaveEdit = async () => {
		if (!editingLog) return;

		try {
			if (!editingLog.item_name.trim() || !editingLog.amount.trim()) {
				Alert.alert("Failed to update log", "Please ensure the item name and amount are valid.");
				return;
			}

			const encryptedCategory = await encryptData(editingLog.category);
			const encryptedItemName = await encryptData(editingLog.item_name);
			const encryptedAmount = await encryptData(editingLog.amount);
			const encryptedNote = editingLog.note ? await encryptData(editingLog.note) : null;

			if (isGuest) {
				const success = await updateRow("feeding_logs", editingLog.id, {
					category: encryptedCategory,
					item_name: encryptedItemName,
					amount: encryptedAmount,
					feeding_time: editingLog.feeding_time.toISOString(),
					note: encryptedNote,
				});
				if (!success) {
					Alert.alert(stringLib.errors.logUpdateFailure);
					return;
				}

				await fetchFeedingLogs();
				setEditModalVisible(false);
			} else {
				const { error } = await supabase
					.from("feeding_logs")
					.update({
						category: encryptedCategory,
						item_name: encryptedItemName,
						amount: encryptedAmount,
						feeding_time: editingLog.feeding_time.toISOString(),
						note: encryptedNote,
					})
					.eq("id", editingLog.id);

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
			onDelete={() => handleDeleteLog<FeedingLog>(
				"feeding_logs",
				item.id,
				isGuest,
				setDeleteAlertVisible,
				setFeedingLogs,
			)}
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
		<View className="main-container">
			<Text className="logs-heading">🍽️ Feeding Logs</Text>
			{loading ? (
				<ActivityIndicator size="large" color="#e11d48" />
			) : error ? (
				<Text className="logs-error" testID="feeding-logs-loading-error">Error: {error}</Text>
			) : feedingLogs.length === 0 ? (
				<Text className="aside-text">
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
