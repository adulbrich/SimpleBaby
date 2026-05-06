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

const NursingLogsView: React.FC = () => {
	const [nursingLogs, setNursingLogs] = useState<NursingLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<NursingLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const { isGuest } = useAuth();
	const [activeChildName, setActiveChildName] = useState<string | null>(null);

	const fetchNursingLogs = useCallback(async () => {
		setLoading(true);
		setError(null);
			
		const result = await fetchLogs<NursingLog>(
			"nursing_logs",
			isGuest,
			"logged_at",
			[
				{ dbFieldName: "id", type: "unencrypted" },
				{ dbFieldName: "left_duration", type: "string" },
				{ dbFieldName: "right_duration", type: "string" },
				{ dbFieldName: "left_amount", type: "string" },
				{ dbFieldName: "right_amount", type: "string" },
				{ dbFieldName: "logged_at", type: "date" },
				{ dbFieldName: "note", type: "string" },
			]
		);
		if (result.success) {
			setNursingLogs(result.data);
			setActiveChildName(result.childName);
		} else {
			setError(result.error);
		}

		setLoading(false);
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
		if (!editingLog.left_amount?.trim() && !editingLog.right_amount?.trim()
			&& editingLog.left_duration === "00:00:00" && editingLog.right_duration === "00:00:00") {
			errorFields.push("At least one of the following is required: left duration, right duration, left amount, and right amount.");
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
				left_amount: editingLog.left_amount?.trim()
					? await encryptData(editingLog.left_amount.trim())
					: null,
				right_amount: editingLog.right_amount?.trim()
					? await encryptData(editingLog.right_amount.trim())
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
		} catch (err) {
			console.error("❌ Encryption or update error:", err);
			Alert.alert("Something went wrong during save.");
		}
	};

	const renderNursingLogItem = ({ item }: { item: NursingLog }) => (
		<LogItem
			id={item.id}
			onEdit={() => {
				setEditModalVisible(true);
				setEditingLog(item);
			}}
			onDelete={() => handleDeleteLog<NursingLog>(
				"nursing_logs",
				item.id,
				isGuest,
				setDeleteAlertVisible,
				setNursingLogs,
			)}
			buttonsDisabled={editModalVisible || deleteAlertVisible}
			logData={[
				{ type: "title", value: format(new Date(item.logged_at), "MMM dd, yyyy") },
				{ type: "item", label: "Time Logged", value: format(new Date(item.logged_at), "h:mm a") },
				(item.left_duration !== "00:00:00") && item.left_duration &&
					{ type: "item", label: "Left Duration", value: item.left_duration },
				(item.right_duration !== "00:00:00") && item.right_duration &&
					{ type: "item", label: "Right Duration", value: item.right_duration },
				(item.left_amount !== "0") && item.left_amount &&
					{ type: "item", label: "Left Amount", value: item.left_amount },
				(item.right_amount !== "0") && item.right_amount &&
					{ type: "item", label: "Right Amount", value: item.right_amount },
				{ type: "note", value: item.note},
			]}
		/>
	);

	return (
		<View className="main-container">
			<Text className="logs-heading">🍼 Nursing Logs</Text>
			{loading ? (
				<ActivityIndicator size="large" color="#e11d48" />
			) : error ? (
				<Text className="logs-error" testID="nursing-logs-loading-error">Error: {error}</Text>
			) : nursingLogs.length === 0 ? (
				<Text className="aside-text">
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
				handleCancel={() => setEditModalVisible(false)}
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
