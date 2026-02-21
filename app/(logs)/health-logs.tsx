import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	FlatList,
	ActivityIndicator,
	Alert,
	Pressable,
	TextInput,
	Modal,
	TouchableOpacity,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { getActiveChildId } from "@/library/utils";
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

interface HealthLog {
	id: string;
	child_id: string;
	category: string;
	date: string;
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
	const { isGuest } = useAuth();
	const [activeChildName, setActiveChildName] = useState<string | null>(null);

	const safeDecrypt = async (value: string | null): Promise<string> => {
		if (!value || !value.includes("U2FsdGVkX1")) return "";
		try {
			return await decryptData(value);
		} catch {
			return "[Decryption Failed]";
		}
	};

	const fetchHealthLogs = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			if (isGuest) {
				const childId = await getLocalActiveChildId();
				if (!childId) {
					throw new Error("No active child selected (Guest Mode)");
				}

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
                } = await getActiveChildId();
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
                        note: await safeDecrypt(entry.note),
                    })),
                );

                setLogs(decrypted);
            }
		} catch (err) {
			console.error("❌ Fetch or decryption error:", err);
			setError(err instanceof Error ? err.message : "Unknown error");
		} finally {
			setLoading(false);
		}
	}, [isGuest]);

	useEffect(() => {
		fetchHealthLogs();
	}, [fetchHealthLogs]);

	const handleSaveEdit = async () => {
		if (!editingLog) return;
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
				note: editingLog.note ? await encryptData(editingLog.note) : null,
			};

			if (isGuest) {
				const success = await updateRow("health_logs", editingLog.id, updated);
				if (!success) {
					Alert.alert("Error updating log");
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
                    Alert.alert("Error updating log");
                    return;
                }
                await fetchHealthLogs();
                setEditModalVisible(false);
            }
		} catch (err) {
			console.error("❌ Encryption or update error:", err);
			Alert.alert("Encryption or update failed");
		}
	};

	const handleDelete = async (id: string) => {
		Alert.alert("Delete Entry", "Are you sure you want to delete this log?", [
			{ text: "Cancel", style: "cancel" },
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
				},
			},
		]);
	};

	const renderLog = ({ item }: { item: HealthLog }) => (
		<View className="bg-white rounded-xl p-4 mb-4 shadow">
			<Text className="text-lg font-bold mb-1">{item.category}</Text>
			<Text className="text-base">
				{format(new Date(item.date), "MMM dd, yyyy")}
			</Text>
			{item.growth_length && <Text>Length: {item.growth_length} cm</Text>}
			{item.growth_weight && <Text>Weight: {item.growth_weight} kg</Text>}
			{item.growth_head && <Text>Head: {item.growth_head} cm</Text>}
			{item.activity_type && <Text>Activity: {item.activity_type}</Text>}
			{item.activity_duration && (
				<Text>Duration: {item.activity_duration}</Text>
			)}
			{item.meds_name && <Text>Med: {item.meds_name}</Text>}
			{item.meds_amount && <Text>Amount: {item.meds_amount}</Text>}
			{item.vaccine_name && <Text>Vaccine: {item.vaccine_name}</Text>}
			{item.vaccine_location && <Text>Location: {item.vaccine_location}</Text>}
			{item.other_name && <Text>Name: {item.other_name}</Text>}
			{item.other_description && (
				<Text>Description: {item.other_description}</Text>
			)}
			{item.note && (
				<Text className="italic text-gray-500">📝 {item.note}</Text>
			)}
			<View className="flex-row justify-end mt-3 gap-3">
				<Pressable
					className="px-3 py-2 rounded-full bg-blue-100"
					onPress={() => {
						setEditingLog(item);
						setEditModalVisible(true);
					}}
				>
					<Text className="text-blue-700">✏️ Edit</Text>
				</Pressable>
				<Pressable
					className="px-3 py-2 rounded-full bg-red-100"
					onPress={() => handleDelete(item.id)}
				>
					<Text className="text-red-700">🗑️ Delete</Text>
				</Pressable>
			</View>
		</View>
	);

	return (
		<View className="flex-1 bg-gray-50 p-4">
			<Text className="text-2xl font-bold mb-4">🩺 Health Logs</Text>
			{loading ? (
				<ActivityIndicator size="large" color="#e11d48" />
			) : error ? (
				<Text className="text-red-600 text-center">Error: {error}</Text>
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
				/>
			)}

			<Modal
				visible={editModalVisible}
				animationType="slide"
				transparent={true}
				onRequestClose={() => setEditModalVisible(false)}
			>
				<KeyboardAvoidingView
					behavior={Platform.OS === "ios" ? "padding" : undefined}
					style={{ flex: 1 }}
				>
					<ScrollView
						contentContainerStyle={{
							flexGrow: 1,
							justifyContent: "center",
							alignItems: "center",
							padding: 16,
							backgroundColor: "#00000099",
						}}
					>
						<View className="bg-white w-full rounded-2xl p-6">
							<Text className="text-xl font-bold mb-4">
								Edit &apos;{editingLog?.category}&apos; Health Log
							</Text>
							{editingLog?.growth_length && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Length (cm)"
									value={editingLog?.growth_length || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, growth_length: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.growth_weight && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Weight (kg)"
									value={editingLog?.growth_weight || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, growth_weight: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.growth_head && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Head (cm)"
									value={editingLog?.growth_head || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, growth_head: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.activity_type && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Activity Type"
									value={editingLog?.activity_type || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, activity_type: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.activity_duration && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Activity Duration"
									value={editingLog?.activity_duration || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, activity_duration: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.meds_name && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Medication Name"
									value={editingLog?.meds_name || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, meds_name: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.meds_amount && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Medication Amount"
									value={editingLog?.meds_amount || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, meds_amount: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.vaccine_name && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Vaccine Name"
									value={editingLog?.vaccine_name || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, vaccine_name: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.vaccine_location && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Vaccine Location"
									value={editingLog?.vaccine_location || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, vaccine_location: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.other_name && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Other Event Name"
									value={editingLog?.other_name || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, other_name: text } : prev,
										)
									}
								/>
							)}
							{editingLog?.other_description && (
								<TextInput
									className="border mb-2 px-3 py-2"
									placeholder="Other Event Description"
									value={editingLog?.other_description || ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, other_description: text } : prev,
										)
									}
								/>
							)}
							<TextInput
								className="border mb-2 px-3 py-2"
								placeholder="Note"
								value={editingLog?.note || ""}
								onChangeText={(text) =>
									setEditingLog((prev) =>
										prev ? { ...prev, note: text } : prev,
									)
								}
							/>
							<View className="flex-row justify-end gap-3 mt-4">
								<TouchableOpacity
									className="bg-gray-200 rounded-full px-4 py-2"
									onPress={() => setEditModalVisible(false)}
								>
									<Text>Cancel</Text>
								</TouchableOpacity>
								<TouchableOpacity
									className="bg-green-500 rounded-full px-4 py-2"
									onPress={handleSaveEdit}
								>
									<Text className="text-white">Save</Text>
								</TouchableOpacity>
							</View>
						</View>
					</ScrollView>
				</KeyboardAvoidingView>
			</Modal>
		</View>
	);
};

export default HealthLogsView;
