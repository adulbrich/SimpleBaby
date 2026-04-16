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
import LogItem from "@/components/log-item";
import { fetchLogs, handleDeleteLog } from "@/library/log-functions";

interface SleepLog {
	id: string;
	start_time: Date;
	end_time: Date;
	duration: string | null;
	note: string | null;
}

const SleepLogsView: React.FC = () => {
	const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<SleepLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const [activeChildName, setActiveChildName] = useState<string | null>(null);
	const { isGuest } = useAuth();

	const fetchSleepLogs = useCallback(async () => {
		setLoading(true);
		setError(null);
				
		const result = await fetchLogs<SleepLog>(
			"sleep_logs",
			isGuest,
			"start_time",
			[
				{ dbFieldName: "id", type: "unencrypted" },
				{ dbFieldName: "start_time", type: "date" },
				{ dbFieldName: "end_time", type: "date" },
				{ dbFieldName: "duration", type: "unencrypted" },
				{ dbFieldName: "note", type: "string" },
			]
		);
		if (result.success) {
			setSleepLogs(result.data);
			setActiveChildName(result.childName);
		} else {
			setError(result.error);
		}

		setLoading(false);
	}, [isGuest]);

	useEffect(() => {
		fetchSleepLogs();
	}, [fetchSleepLogs]);

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
			onDelete={() => handleDeleteLog<SleepLog>(
				"sleep_logs",
				item.id,
				isGuest,
				setDeleteAlertVisible,
				setSleepLogs,
			)}
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
