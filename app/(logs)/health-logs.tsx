import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	Alert,
} from "react-native";
import { getActiveChildData } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { decryptData, encryptData } from "@/library/crypto";
import { format } from "date-fns";
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

interface HealthLog {
	id: string;
	child_id: string;
	category: string;
	date: Date;
	growth_length: string | null;
	growth_weight: string | null;
	growth_head: string | null;
	activity_type: string | null;
	activity_duration: string | null;
	meds_name: string | null;
	meds_amount: string | null;
	meds_time_taken: string | null;
	vaccine_name: string | null;
	vaccine_location: string | null;
	other_name: string | null;
	other_description: string | null;
	note: string | null;
}

type LocalHealthRow = LocalRow & Omit<HealthLog, "id">;

const HealthLogsView: React.FC = () => {
	const [logs, setLogs] = useState<HealthLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<HealthLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const { isGuest } = useAuth();
	const [activeChildName, setActiveChildName] = useState<string | null>(null);

	const safeDecrypt = async (value: string | null): Promise<string> => {
		if (!value || !value.includes("U2FsdGVkX1")) return "";
		try {
			return await decryptData(value);
		} catch (err) {
			return `[Decryption Failed]: ${err}`;
		}
	};

	const fetchHealthLogs = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			if (isGuest) {
				const childId = await getLocalActiveChildId();
				if (!childId) throw new Error("No active child selected (Guest Mode)");

                // get & sort health logs descendingly
				const rows = await listRows<LocalHealthRow>("health_logs");
				const childRows = rows
					.filter((r) => r.child_id === childId)
					.sort(
						(a, b) => 
                            new Date(b.date).getTime() - 
                            new Date(a.date).getTime(),
					);

				const decrypted = await Promise.all(
					childRows.map(async (entry) => ({
						...entry,
						growth_length: await safeDecrypt(entry.growth_length),
						growth_weight: await safeDecrypt(entry.growth_weight),
						growth_head: await safeDecrypt(entry.growth_head),
						activity_type: await safeDecrypt(entry.activity_type),
						activity_duration: await safeDecrypt(entry.activity_duration),
						meds_name: await safeDecrypt(entry.meds_name),
						meds_amount: await safeDecrypt(entry.meds_amount),
						vaccine_name: await safeDecrypt(entry.vaccine_name),
						vaccine_location: await safeDecrypt(entry.vaccine_location),
						other_name: await safeDecrypt(entry.other_name),
						other_description: await safeDecrypt(entry.other_description),
						date: new Date(entry.date),
						note: await safeDecrypt(entry.note),
					})),
				);
				setLogs(decrypted);
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
                    .from("health_logs")
                    .select("*")
                    .eq("child_id", childId)
                    .order("date", { ascending: false });

                if (error) {
                    throw error;
                }

                const decrypted = await Promise.all(
                    (data || []).map(async (entry) => ({
                        ...entry,
                        growth_length: await safeDecrypt(entry.growth_length),
                        growth_weight: await safeDecrypt(entry.growth_weight),
                        growth_head: await safeDecrypt(entry.growth_head),
                        activity_type: await safeDecrypt(entry.activity_type),
                        activity_duration: await safeDecrypt(entry.activity_duration),
                        meds_name: await safeDecrypt(entry.meds_name),
                        meds_amount: await safeDecrypt(entry.meds_amount),
                        vaccine_name: await safeDecrypt(entry.vaccine_name),
                        vaccine_location: await safeDecrypt(entry.vaccine_location),
                        other_name: await safeDecrypt(entry.other_name),
                        other_description: await safeDecrypt(entry.other_description),
						date: new Date(entry.date),
                        note: await safeDecrypt(entry.note),
                    })),
                );

                setLogs(decrypted);
            }
		} catch (err) {
			console.error("❌ Fetch or decryption error:", err);
			setError(err instanceof Error ? err.message : "An unknown error occurred");
		} finally {
			setLoading(false);
		}
	}, [isGuest]);

	useEffect(() => {
		fetchHealthLogs();
	}, [fetchHealthLogs]);

	const handleSaveEdit = async () => {
		if (!editingLog) return;

		const isBlank = (val: string | null) => val !== null && !val.trim();

		const invalidByCategory =
			(editingLog.category === "Growth" && (
				isBlank(editingLog.growth_length) ||
				isBlank(editingLog.growth_weight) ||
				isBlank(editingLog.growth_head)
			)) ||
			(editingLog.category === "Activity" && (
				isBlank(editingLog.activity_type) ||
				isBlank(editingLog.activity_duration)
			)) ||
			(editingLog.category === "Meds" && (
				isBlank(editingLog.meds_name) ||
				isBlank(editingLog.meds_amount)
			)) ||
			(editingLog.category === "Vaccine" && isBlank(editingLog.vaccine_name)) ||
			(editingLog.category === "Other" && isBlank(editingLog.other_name));

		if (invalidByCategory) {
			Alert.alert("Failed to Update Log", "One or more of your required fields is blank. Please try again.");
			return;
		}

		try {
			const updated = {
				growth_length: editingLog.growth_length
					? await encryptData(editingLog.growth_length)
					: null,
				growth_weight: editingLog.growth_weight
					? await encryptData(editingLog.growth_weight)
					: null,
				growth_head: editingLog.growth_head
					? await encryptData(editingLog.growth_head)
					: null,
				activity_type: editingLog.activity_type
					? await encryptData(editingLog.activity_type)
					: null,
				activity_duration: editingLog.activity_duration
					? await encryptData(editingLog.activity_duration)
					: null,
				meds_name: editingLog.meds_name
					? await encryptData(editingLog.meds_name)
					: null,
				meds_amount: editingLog.meds_amount
					? await encryptData(editingLog.meds_amount)
					: null,
				vaccine_name: editingLog.vaccine_name
					? await encryptData(editingLog.vaccine_name)
					: null,
				vaccine_location: editingLog.vaccine_location
					? await encryptData(editingLog.vaccine_location)
					: null,
				other_name: editingLog.other_name
					? await encryptData(editingLog.other_name)
					: null,
				other_description: editingLog.other_description
					? await encryptData(editingLog.other_description)
					: null,
				date: editingLog.date.toISOString(),
				note: editingLog.note ? await encryptData(editingLog.note) : null,
			};

			if (isGuest) {
				const success = await updateRow("health_logs", editingLog.id, updated);
				if (!success) {
					Alert.alert(stringLib.errors.logUpdateFailure);
					return;
				}
				await fetchHealthLogs();
				setEditModalVisible(false);
			} else {
                const { error } = await supabase
				.from("health_logs")
				.update(updated)
				.eq("id", editingLog.id);

                if (error) {
                    Alert.alert(stringLib.errors.logUpdateFailure);
                    return;
                }
                await fetchHealthLogs();
                setEditModalVisible(false);
            }
		} catch (err) {
			console.error("❌ Encryption or update error:", err);
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
						const success = await deleteRow("health_logs", id);
						if (!success) {
							Alert.alert("Error deleting log");
							return;
						}
						setLogs((prev) => prev.filter((log) => log.id !== id));
					} else {
                        const { error } = await supabase
                            .from("health_logs")
                            .delete()
                            .eq("id", id);
                        if (error) {
                            Alert.alert("Error deleting log");
                            return;
                        }
                        setLogs((prev) => prev.filter((log) => log.id !== id));
                    }
					setDeleteAlertVisible(false);
				},
			},
		]);
	};

	const renderLog = ({ item }: { item: HealthLog }) => (
		<LogItem
			id={item.id}
			onEdit={() => {
				setEditModalVisible(true);
				setEditingLog(item);
			}}
			onDelete={() => handleDelete(item.id)}
			buttonsDisabled={editModalVisible || deleteAlertVisible}
			logData={[
				{ type: "title", value: item.category },
				{ type: "text", value: format(item.date, "MMM dd, yyyy") },
				item.growth_length && { type: "item", label: "Length", value: item.growth_length },
				item.growth_weight && { type: "item", label: "Weight", value: item.growth_weight },
				item.growth_head && { type: "item", label: "Head", value: item.growth_head },
				item.activity_type && { type: "item", label: "Activity", value: item.activity_type },
				item.activity_duration && { type: "item", label: "Duration", value: item.activity_duration },
				item.meds_name && { type: "item", label: "Med", value: item.meds_name },
				item.meds_amount && { type: "item", label: "Amount", value: item.meds_amount },
				item.vaccine_name && { type: "item", label: "Vaccine", value: item.vaccine_name },
				item.vaccine_location && { type: "item", label: "Location", value: item.vaccine_location },
				item.other_name && { type: "item", label: "Name", value: item.other_name },
				item.other_description && { type: "item", label: "Description", value: item.other_description },
				{ type: "note", value: item.note},
			]}
		/>
	);

	return (
		<View className="flex-1 bg-gray-50 p-4">
			<Text className="text-2xl font-bold mb-4">🩺 Health Logs</Text>
			{loading ? (
				<ActivityIndicator size="large" color="#e11d48" />
			) : error ? (
				<Text className="text-red-600 text-center" testID="health-logs-loading-error">Error: {error}</Text>
			) : logs.length === 0 ? (
				<Text>
					You don&apos;t have any health logs
					{activeChildName ? ` for ${activeChildName}` : ""} yet!
				</Text>
			) : (
				<FlatList
					data={logs}
					renderItem={renderLog}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingBottom: 16 }}
					testID="health-logs"
				/>
			)}
			
			{/* Edit Modal */}
			<EditLogPopup
				popupVisible={editModalVisible}
				hidePopup={() => setEditModalVisible(false)}
				title={`Edit '${editingLog?.category}' Health Log`}
				setLog={setEditingLog}
				handleSubmit={handleSaveEdit}
				editingLog={editingLog && {

					// Growth category inputs
					...(editingLog?.category === "Growth") && {growth_length: {
						title: "Length",
						type: "text",
						value: editingLog?.growth_length,
					}},
					...(editingLog?.category === "Growth") && {growth_weight: {
						title: "Weight",
						type: "text",
						value: editingLog?.growth_weight,
					}},
					...(editingLog?.category === "Growth") && {growth_head: {
						title: "Head",
						type: "text",
						value: editingLog?.growth_head,
					}},

					// Activity category inputs
					...(editingLog?.category === "Activity") && {activity_type: {
						title: "Type",
						type: "text",
						value: editingLog?.activity_type,
					}},
					...(editingLog?.category === "Activity") && {activity_duration: {
						title: "Duration",
						type: "text",
						value: editingLog?.activity_duration,
					}},

					// Meds category inputs
					...(editingLog?.category === "Meds") && {meds_name: {
						title: "Name",
						type: "text",
						value: editingLog?.meds_name,
					}},
					...(editingLog?.category === "Meds") && {meds_amount: {
						title: "Amount",
						type: "text",
						value: editingLog?.meds_amount,
					}},

					// Vaccine category inputs
					...(editingLog?.category === "Vaccine") && {vaccine_name: {
						title: "Name",
						type: "text",
						value: editingLog?.vaccine_name,
					}},
					...(editingLog?.category === "Vaccine") && {vaccine_location: {
						title: "Location",
						type: "text",
						value: editingLog?.vaccine_location,
					}},

					// Other category inputs
					...(editingLog?.category === "Other") && {other_name: {
						title: "Name",
						type: "text",
						value: editingLog?.other_name,
					}},
					...(editingLog?.category === "Other") && {other_description: {
						title: "Description",
						type: "text",
						value: editingLog?.other_description,
					}},

					// Date & note input displayed for all categories
					date:  {
						title: "Date",
						type: "date",
						value: editingLog?.date,
					},
					note:  {
						title: "Note",
						type: "text",
						value: editingLog?.note,
					},
					category:  {
						title: undefined,
						type: "insert",
						value: (
							<Text className="text-xs text-gray-400 mt-1">
								Health log categories may not be updated after the log is created. Please delete this log and create a new one if you wish to update the category.
							</Text>
						),
					},
				}}
				testID="health-logs-edit-popup"
			/>
		</View>
	);
};

export default HealthLogsView;
