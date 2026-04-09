import React, { useCallback, useEffect, useState } from "react";
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

type MilestoneCategory =
	| "Motor"
	| "Language"
	| "Social"
	| "Cognitive"
	| "Other";

interface MilestoneLog {
	id: string;
	title: string;
	category: MilestoneCategory | null;
	note: string | null;
	achieved_at: Date;
	photo_url: string | null;
}

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
		setLoading(true);
		setError(null);
			
		const result = await fetchLogs<MilestoneLog>(
			"milestone_logs",
			isGuest,
			"achieved_at",
			[
				{ dbFieldName: "id", type: "unencrypted" },
				{ dbFieldName: "category", type: "unencrypted" },
				{ dbFieldName: "title", type: "string" },
				{ dbFieldName: "photo_url", type: "unencrypted" },
				{ dbFieldName: "achieved_at", type: "date" },
				{ dbFieldName: "note", type: "string" },
			]
		);
		if (!result.success) {
			setError(result.error || "An unknown error occurred");
			return;
		}
		setActiveChildName(result.childName);
		setMilestoneLogs(result.data);

		const signedPairs = await Promise.all(
			result.data.map(async (log) => {
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
		setLoading(false);
	}, [getSignedPhotoUrl, isGuest]);

	useEffect(() => {
		fetchMilestoneLogs();
	}, [fetchMilestoneLogs]);

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
			<LogItem
				id={item.id}
				onEdit={() => {
					setEditModalVisible(true);
					setEditingLog(item);
				}}
				onDelete={() => handleDelete(item.id)}
				buttonsDisabled={editModalVisible || deleteAlertVisible}
				logData={[
					{ type: "title", value: item.title },
					{ type: "text", value: item.category ?? "Other" },
					{ type: "item", label: "Date", value:
						hasValidDate ? format(item.achieved_at, "MMM dd, yyyy") : "[unable to retrieve date]"
					},
					{ type: "note", value: item.note},
					{ type: "image", uri: photoSignedUrls[item.id] },
				]}
			/>
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
				handleCancel={() => setEditModalVisible(false)}
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
