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
import {
	updateRow,
	deleteRow,
} from "@/library/local-store";
import EditLogPopup from "@/components/edit-log-popup";
import stringLib from "../../assets/stringLibrary.json";
import LogItem from "@/components/log-item";
import { fetchLogs } from "@/library/log-functions";

interface DiaperLog {
	id: string;
	consistency: string;
	amount: string;
	change_time: Date;
	note: string | null;
}

const DiaperLogsView: React.FC = () => {
	const [diaperLogs, setDiaperLogs] = useState<DiaperLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeChildName, setActiveChildName] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<DiaperLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const { isGuest } = useAuth();

	// Fetches diaper logs from Supabase or local storage for the active child.
	const fetchDiaperLogs = useCallback(async () => {
		setLoading(true);
		setError(null);

		const result = await fetchLogs<DiaperLog>(
			"diaper_logs",
			isGuest,
			"change_time",
			[
				{ dbFieldName: "id", type: "unencrypted" },
				{ dbFieldName: "consistency", type: "string" },
				{ dbFieldName: "amount", type: "string" },
				{ dbFieldName: "change_time", type: "date" },
				{ dbFieldName: "note", type: "string" },
			]
		);
		if (result.success) {
			setDiaperLogs(result.data);
			setActiveChildName(result.childName);
		} else {
			setError(result.error);
		}

		setLoading(false);
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
			const encryptedConsistency = await encryptData(editingLog.consistency);
			const encryptedAmount = await encryptData(editingLog.amount);
			const encryptedNote = editingLog.note ? await encryptData(editingLog.note) : null;

			if (isGuest) {
				const success = await updateRow("diaper_logs", editingLog.id, {
					consistency: encryptedConsistency,
					amount: encryptedAmount,
					change_time: editingLog.change_time.toISOString(),
					note: encryptedNote,
				});
				if (!success) {
					Alert.alert(stringLib.errors.logUpdateFailure);
					return;
				}

				await fetchDiaperLogs();
				setEditModalVisible(false);
			} else {
                const { error } = await supabase
                    .from("diaper_logs")
                    .update({
                        consistency: encryptedConsistency,
                        amount: encryptedAmount,
						change_time: editingLog.change_time.toISOString(),
                        note: encryptedNote,
                    })
                    .eq("id", editingLog.id);

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
		<LogItem
			id={item.id}
			onEdit={() => {
				setEditModalVisible(true);
				setEditingLog(item);
			}}
			onDelete={() => handleDelete(item.id)}
			buttonsDisabled={editModalVisible || deleteAlertVisible}
			logData={[
				{ type: "title", value: format(item.change_time, "MMM dd, yyyy") },
				{ type: "text", value: format(item.change_time, "h:mm a") },
				{ type: "item", label: "Consistency", value: item.consistency },
				{ type: "item", label: "Size", value: item.amount },
				{ type: "note", value: item.note},
			]}
		/>
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
				handleCancel={() => setEditModalVisible(false)}
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
					change_time: {
						title: "Change Time",
						type: "time",
						value: editingLog?.change_time,
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
