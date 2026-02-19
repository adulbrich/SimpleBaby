import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	Image,
	FlatList,
	ActivityIndicator,
	Alert,
	TextInput,
	Modal,
	TouchableOpacity,
	Pressable,
	KeyboardAvoidingView,
	Platform,
	ScrollView,
} from "react-native";
import { format } from "date-fns";
import DateTimePicker, {
	DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import { getActiveChildId } from "@/library/utils";
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

type MilestoneCategory =
	| "Motor"
	| "Language"
	| "Social"
	| "Cognitive"
	| "Other";

interface MilestoneLog {
	id: string;
	child_id: string;
	title: string;
	category: MilestoneCategory | null;
	note: string | null;
	achieved_at: string;
	photo_url: string | null;
	source: string | null;
	created_at: string;
	updated_at: string;
}

type LocalMilestoneRow = LocalRow & {
	id: string;
	child_id: string;
	category: string;
	title: string;
	achieved_at: string;
	photo_url: string | null;
	note: string | null;
};

function isMilestoneCategory(val: string): val is MilestoneCategory {
    return ["Motor", "Language", "Social", "Cognitive", "Other"].includes(val as MilestoneCategory);
}

const MilestoneLogsView: React.FC = () => {
	const [milestoneLogs, setMilestoneLogs] = useState<MilestoneLog[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [activeChildName, setActiveChildName] = useState<string | null>(null);
	const [editingLog, setEditingLog] = useState<MilestoneLog | null>(null);
	const [editModalVisible, setEditModalVisible] = useState(false);
	const [photoSignedUrls, setPhotoSignedUrls] = useState<
		Record<string, string>
	>({});
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [editAchievedAt, setEditAchievedAt] = useState<Date>(new Date());
	const { isGuest } = useAuth();

    const safeDecrypt = async (value: string | null): Promise<string> => {
        if (!value || !value.includes("U2FsdGVkX1")) return "";
        try {
            return await decryptData(value);
        } catch (err) {
            console.warn("⚠️ Decryption failed for:", value);
            return `[Decryption Failed]: ${err}`;
        }
    };

	const getSignedPhotoUrl = useCallback(
		async (path: string): Promise<string | null> => {
			if (isGuest) {
                return path;
            }

			try {
				const { data, error } = await supabase.storage
					.from("milestone-photos")
					.createSignedUrl(path, 600);

				if (error) {
					console.warn("SIGN ERROR:", {
						message: error.message,
						name: error.name,
						status: (error as any).status,
					});
					return null;
				}

				return data?.signedUrl ?? null;
			} catch (e) {
				console.warn("⚠️ Signed URL error:", e);
				return null;
			}
		},
		[isGuest],
	);

	const fetchMilestoneLogs = useCallback(async () => {
		try {
			setLoading(true);
			setError(null);

			let data: any[] = [];

			if (isGuest) {
				const childId = await getLocalActiveChildId();
				if (!childId) throw new Error("No active child selected (Guest Mode)");

				// get & sort milestone logs descendingly
				const rows = await listRows<LocalMilestoneRow>("milestone_logs");
				data = rows
					.filter((r) => r.child_id === childId)
					.sort(
						(a, b) =>
							new Date(b.achieved_at).getTime() -
							new Date(a.achieved_at).getTime(),
					);

			} else {
				const result = await getActiveChildId();
				if (!result?.success || !result.childId) {
					throw new Error(
						result?.error
							? String(result.error)
							: "Failed to get active child ID",
					);
				}
				setActiveChildName(result.childName);
				const childId = String(result.childId);

				const res = await supabase
					.from("milestone_logs")
					.select("*")
					.eq("child_id", childId)
					.order("achieved_at", { ascending: false });

				if (res.error) throw res.error;
				data = res.data || [];
			}

			const decryptedLogs = await Promise.all(
				(data || []).map(async (entry) => ({
					...entry,
					title: await safeDecrypt(entry.title),
					note: entry.note ? await safeDecrypt(entry.note) : "",
				})),
			);

			const signedPairs = await Promise.all(
				decryptedLogs.map(async (log) => {
					if (!log.photo_url) {
                        return [log.id, null] as const;
                    }
					const signed = await getSignedPhotoUrl(log.photo_url);
					return [log.id, signed] as const;
				}),
			);

			const nextMap: Record<string, string> = {};
			for (const [id, signed] of signedPairs) {
				if (signed) nextMap[id] = signed;
			}

			setPhotoSignedUrls(nextMap);
			setMilestoneLogs(decryptedLogs);

		} catch (err) {
			setError(
				err instanceof Error ? err.message : "An unknown error occurred",
			);
		} finally {
			setLoading(false);
		}
	}, [getSignedPhotoUrl, isGuest]);

	useEffect(() => {
		fetchMilestoneLogs();
	}, [fetchMilestoneLogs]);

	const openEditModal = (log: MilestoneLog) => {
		setEditingLog(log);
		const parsed = new Date(log.achieved_at);
		setEditAchievedAt(isNaN(parsed.getTime()) ? new Date() : parsed);
		setShowDatePicker(false);
		setEditModalVisible(true);
	};

	const onChangeEditDate = (event: DateTimePickerEvent, selected?: Date) => {
		if (event.type === "dismissed") {
			setShowDatePicker(false);
			return;
		}
		if (selected) setEditAchievedAt(selected);
		if (Platform.OS === "android") setShowDatePicker(false);
	};

	const handleSaveEdit = async () => {
		if (!editingLog) return;

        // Validate that there is a milestone title present
		const titlePlain = editingLog.title?.trim();
		if (!titlePlain) {
			Alert.alert("Missing title", "Please enter a milestone title.");
			return;
		}

        // Validate that the category text input belongs to the MilestoneCategory type
        const milestoneCategory = editingLog.category ?? "Other";
        if (!isMilestoneCategory(milestoneCategory)) {
            Alert.alert("Invalid Category", "Please enter a valid milestone category.");
            return;
        }

		try {
			const encryptedTitle = await encryptData(titlePlain);
			const notePlain = editingLog.note?.trim();
			const encryptedNote = notePlain ? await encryptData(notePlain) : null;

			const patch = {
				title: encryptedTitle,
				category: editingLog.category ?? "Other",
				note: encryptedNote,
				achieved_at: editAchievedAt.toISOString(),
			};

			if (isGuest) {
				const success = await updateRow("milestone_logs", editingLog.id, patch);
				if (!success) {
					Alert.alert(
						"Update error",
						"Failed to update milestone (Guest Mode).",
					);
					return;
				}
				await fetchMilestoneLogs();
				setEditModalVisible(false);
				return;
			}

			const { error } = await supabase
				.from("milestone_logs")
				.update(patch)
				.eq("id", editingLog.id);

			if (error) {
				Alert.alert("Error updating milestone", error.message);
				return;
			}

			await fetchMilestoneLogs();
			setEditModalVisible(false);
		} catch (err) {
			Alert.alert("Update error", String(err));
		}
	};

	const handleDelete = async (id: string) => {
		Alert.alert(
			"Delete Entry",
			"Are you sure you want to delete this milestone?",
			[
				{ text: "Cancel", style: "cancel" },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						if (isGuest) {
							const success = await deleteRow("milestone_logs", id);
							if (!success) {
								Alert.alert("Error deleting milestone (Guest Mode)");
								return;
							}
							setMilestoneLogs((prev) => prev.filter((m) => m.id !== id));
							return;
						}

						const { error } = await supabase
							.from("milestone_logs")
							.delete()
							.eq("id", id);
						if (error) {
							Alert.alert("Error deleting milestone", error.message);
							return;
						}
						setMilestoneLogs((prev) => prev.filter((log) => log.id !== id));
					},
				},
			],
		);
	};

	const renderMilestoneItem = ({ item }: { item: MilestoneLog }) => {
		const achieved = new Date(item.achieved_at);
		const hasValidDate = !isNaN(achieved.getTime());

		return (
			<View className="bg-white rounded-xl p-4 mb-4 shadow">
				<Text className="text-lg font-bold mb-2">{item.title}</Text>

				<Text className="text-sm text-gray-500 mb-2">
					{item.category ?? "Other"}
				</Text>

				<Text className="text-base mb-1">
					Date:{" "}
					{hasValidDate ? format(achieved, "MMM dd, yyyy") : item.achieved_at}
				</Text>

				{item.note ? (
					<Text className="text-sm italic text-gray-500 mt-2">
						📝 {item.note}
					</Text>
				) : null}

				{photoSignedUrls[item.id] ? (
					<Image
						source={{ uri: photoSignedUrls[item.id] }}
						style={{
							width: "100%",
							height: 220,
							borderRadius: 12,
							marginTop: 12,
						}}
						resizeMode="cover"
						onError={(e) =>
							console.log("❌ Image Failed to Load:", item.id, e.nativeEvent)
						}
					/>
				) : null}

				<View className="flex-row justify-end gap-3 mt-4">
					<Pressable
						className="px-3 py-2 rounded-full bg-blue-100"
						onPress={() => openEditModal(item)}
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
	};

	return (
		<View className="flex-1 bg-gray-50 p-4">
			<Text className="text-2xl font-bold mb-4">✨ Milestone Logs</Text>

			{loading ? (
				<ActivityIndicator size="large" color="#e11d48" />
			) : error ? (
				<Text className="text-red-600 text-center">Error: {error}</Text>
			) : milestoneLogs.length === 0 ? (
				<Text>
					You don&apos;t have any milestone logs
					{activeChildName ? ` for ${activeChildName}` : ""} yet!
				</Text>
			) : (
				<FlatList
					data={milestoneLogs}
					renderItem={renderMilestoneItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ paddingBottom: 16 }}
					refreshing={loading}
					onRefresh={fetchMilestoneLogs}
				/>
			)}

			{/* Edit Modal */}
			<Modal
				visible={editModalVisible}
				animationType="slide"
				transparent
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
						keyboardShouldPersistTaps="handled"
					>
						<View className="bg-white w-full rounded-2xl p-6">
							<Text className="text-xl font-bold mb-4">Edit Milestone</Text>

							{/* Title */}
							<View className="mb-3">
								<Text className="text-sm text-gray-500 mb-1">Title</Text>
								<TextInput
									className="border border-gray-300 rounded-xl px-3 py-2"
									value={editingLog?.title ?? ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, title: text } : prev,
										)
									}
								/>
							</View>

							{/* Category */}
							<View className="mb-3">
								<Text className="text-sm text-gray-500 mb-1">Category</Text>
								<TextInput
									className="border border-gray-300 rounded-xl px-3 py-2"
									value={String(editingLog?.category ?? "Other")}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev
												? { ...prev, category: text as MilestoneCategory }
												: prev,
										)
									}
								/>
								<Text className="text-xs text-gray-400 mt-1">
									Must enter: Cognitive, Social, Motor, Language, or Other.
								</Text>
							</View>

							{/* Achieved date */}
							<View className="mb-3">
								<Text className="text-sm text-gray-500 mb-1">Date</Text>

								<TouchableOpacity
									className="border border-gray-300 rounded-xl px-3 py-3"
									onPress={() => setShowDatePicker(true)}
								>
									<Text>{format(editAchievedAt, "MMM dd, yyyy")}</Text>
								</TouchableOpacity>

								{showDatePicker && (
									<DateTimePicker
										value={editAchievedAt}
										mode="date"
										display={Platform.OS === "ios" ? "spinner" : "default"}
										onChange={onChangeEditDate}
									/>
								)}

								{Platform.OS === "ios" && showDatePicker && (
									<View className="mt-2 items-end">
										<TouchableOpacity
											className="bg-gray-200 rounded-full px-4 py-2"
											onPress={() => setShowDatePicker(false)}
										>
											<Text>Done</Text>
										</TouchableOpacity>
									</View>
								)}
							</View>

							{/* Note */}
							<View className="mb-3">
								<Text className="text-sm text-gray-500 mb-1">Note</Text>
								<TextInput
									className="border border-gray-300 rounded-xl px-3 py-2"
									value={editingLog?.note ?? ""}
									onChangeText={(text) =>
										setEditingLog((prev) =>
											prev ? { ...prev, note: text } : prev,
										)
									}
									multiline
								/>
							</View>

							{/* Photo */}
							<Text className="text-xs text-gray-400 mt-1">
								Photos cannot be edited/updated yet in this menu. This feature
								will be added in a later release. For now, please create a new
								log.
							</Text>

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

export default MilestoneLogsView;
