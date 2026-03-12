import React, { useCallback, useEffect, useState } from "react";
import {
	View,
	Text,
	Image,
	FlatList,
	ActivityIndicator,
	Alert,
	Pressable,
} from "react-native";
import { format } from "date-fns";
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
import EditLogPopup from "@/components/edit-log-popup";

import stringLib from "../../assets/stringLibrary.json";

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
	achieved_at: Date;
	photo_url: string | null;
	source: string | null;
	created_at: string;
	updated_at: string;
}

type LocalMilestoneRow = LocalRow & Omit<MilestoneLog, "id"> & { child_id: string; };

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
	const [deleteAlertVisible, setDeleteAlertVisible] = useState(false);
	const [photoSignedUrls, setPhotoSignedUrls] = useState<
		Record<string, string>
	>({});
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
            } else {
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
					achieved_at: new Date(entry.achieved_at),
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
		setEditModalVisible(true);
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
				achieved_at: editingLog.achieved_at.toISOString(),
			};

			if (isGuest) {
				const success = await updateRow("milestone_logs", editingLog.id, patch);
				if (!success) {
					Alert.alert(stringLib.errors.logUpdateFailure);
					return;
				}
				await fetchMilestoneLogs();
				setEditModalVisible(false);
				return;
			} else {
                const { error } = await supabase
                    .from("milestone_logs")
                    .update(patch)
                    .eq("id", editingLog.id);

                if (error) {
					Alert.alert(stringLib.errors.logUpdateFailure);
                    return;
                }

                await fetchMilestoneLogs();
                setEditModalVisible(false);
            }
		} catch (err) {
			console.error("❌ Encryption or update error:", err);
			Alert.alert("Something went wrong during save.");
		}
	};

	const handleDelete = async (id: string) => {
		setDeleteAlertVisible(true);
		Alert.alert(
			"Delete Entry",
			stringLib.warnings.logDeletionConfirmation,
			[
				{ text: "Cancel", style: "cancel", onPress: () => { setDeleteAlertVisible(false); } },
				{
					text: "Delete",
					style: "destructive",
					onPress: async () => {
						if (isGuest) {
							const success = await deleteRow("milestone_logs", id);
							if (!success) {
								Alert.alert("Error deleting log");
								return;
							}
							setMilestoneLogs((prev) => prev.filter((m) => m.id !== id));
							return;
						} else {
                            const { error } = await supabase
                                .from("milestone_logs")
                                .delete()
                                .eq("id", id);
                            if (error) {
                                Alert.alert("Error deleting log");
                                return;
                            }
                            setMilestoneLogs((prev) => prev.filter((log) => log.id !== id));
                        }
						setDeleteAlertVisible(false);
					},
				},
			],
		);
	};

	const renderMilestoneItem = ({ item }: { item: MilestoneLog }) => {
		const hasValidDate = !isNaN(item.achieved_at.getTime());

		return (
			<View className="bg-white rounded-xl p-4 mb-4 shadow">
				<Text className="text-lg font-bold mb-2">{item.title}</Text>

				<Text className="text-sm text-gray-500 mb-2">
					{item.category ?? "Other"}
				</Text>

				<Text className="text-base mb-1">
					Date:{" "}
					{hasValidDate ? format(item.achieved_at, "MMM dd, yyyy") : "[unable to retrieve date]"}
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
						onPress={() => {
							setEditModalVisible(true); 
							openEditModal(item);
						}}
						disabled={deleteAlertVisible}
						testID={`milestone-logs-edit-button-${item.id}`}
					>
						<Text className="text-blue-700">✏️ Edit</Text>
					</Pressable>

					<Pressable
						className="px-3 py-2 rounded-full bg-red-100"
						onPress={() => handleDelete(item.id)}
						disabled={editModalVisible}
						testID={`milestone-logs-delete-button-${item.id}`}
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
				<Text className="text-red-600 text-center" testID="milestone-logs-loading-error">Error: {error}</Text>
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
					testID="milestone-logs"
				/>
			)}

			{/* Edit Modal */}
			<EditLogPopup
				popupVisible={editModalVisible}
				hidePopup={() => setEditModalVisible(false)}
				title="Edit Milestone Log"
				setLog={setEditingLog}
				handleSubmit={handleSaveEdit}
				editingLog={editingLog && {
					title: {
						title: "Title",
						type: "text",
						value: editingLog?.title,
					},
					category: {
						title: "Category",
						type: "category",
						categories: ["Motor", "Language", "Social", "Cognitive", "Other"],
						value: editingLog?.category,
					},
					achieved_at: {
						title: "Date",
						type: "date",
						value: editingLog?.achieved_at,
					},
					note:  {
						title: "Note",
						type: "text",
						value: editingLog?.note,
					},
					photo_url:  {
						title: "Photo",
						type: "image",
						value: editingLog?.photo_url,
					},
				}}
				testID="milestone-logs-edit-popup"
			/>
		</View>
	);
};

export default MilestoneLogsView;
