import React, { useEffect, useMemo, useState } from "react";
import {
    View,
    Text,
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
import DateTimePicker, { DateTimePickerEvent } from "@react-native-community/datetimepicker";
import { getActiveChildId } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { decryptData } from "@/library/crypto";

type MilestoneCategory = 'Motor' | 'Language' | 'Social' | 'Cognitive' | 'Other'

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

const MilestoneLogsView: React.FC = () => {
    const [milestoneLogs, setMilestoneLogs] = useState<MilestoneLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    const [editingLog, setEditingLog] = useState<MilestoneLog | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [editAchievedAt, setEditAchievedAt] = useState<Date>(new Date());
    
    useEffect(() => {
        fetchMilestoneLogs();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
    
    const fetchMilestoneLogs = async () => {
        try {
            setLoading(true);
            setError(null);
            
            const result = await getActiveChildId();
            if (!result?.success || !result.childId) {
                throw new Error(result?.error ? String(result.error) : "Failed to get active child ID");
            }
            
            const childId = String(result.childId);
            
            const { data, error } = await supabase
            .from("milestone_logs")
            .select("*")
            .eq("child_id", childId)
            .order("achieved_at", { ascending: false });
            
            if (error) throw error;
            
            const safeDecrypt = async (value: string | null): Promise<string> => {
                if (!value || !value.includes('U2FsdGVkX1')) return '';
                try {
                    return await decryptData(value);
                } catch (err) {
                    console.warn('⚠️ Decryption failed for:', value);
                    return `[Decryption Failed]: ${err}`;
                }
            };
            
            const decryptedLogs = await Promise.all(
                (data || []).map(async (entry) => ({
                    ...entry,
                    title: await safeDecrypt(entry.title),
                    note: entry.note ? await safeDecrypt(entry.note) : '',
                }))
            );
            
            setMilestoneLogs(decryptedLogs);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };
    
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
        
        const title = editingLog.title?.trim();
        if (!title) {
            Alert.alert("Missing title", "Please enter a milestone title.");
            return;
        }
        
        try {
            const patch = {
                title,
                category: editingLog.category ?? "Other",
                note: editingLog.note?.trim() ? editingLog.note.trim() : null,
                achieved_at: editAchievedAt.toISOString(),
            };
            
            const { error } = await supabase.from("milestone_logs").update(patch).eq("id", editingLog.id);
            
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
        Alert.alert("Delete Entry", "Are you sure you want to delete this milestone?", [
            { text: "Cancel", style: "cancel" },
            {
                text: "Delete",
                style: "destructive",
                onPress: async () => {
                    const { error } = await supabase.from("milestone_logs").delete().eq("id", id);
                    if (error) {
                        Alert.alert("Error deleting milestone", error.message);
                        return;
                    }
                    setMilestoneLogs((prev) => prev.filter((log) => log.id !== id));
                },
            },
        ]);
    };
    
    const renderMilestoneItem = ({ item }: { item: MilestoneLog }) => {
        const achieved = new Date(item.achieved_at);
        const hasValidDate = !isNaN(achieved.getTime());
        
        return (
            <View className="bg-white rounded-xl p-4 mb-4 shadow">
            <Text className="text-lg font-bold mb-2">
            {item.title}
            </Text>
            
            <Text className="text-sm text-gray-500 mb-2">
            {item.category ?? "Other"}
            </Text>
            
            <Text className="text-base mb-1">
            Date: {hasValidDate ? format(achieved, "MMM dd, yyyy") : item.achieved_at}
            </Text>
            
            {item.note ? (
                <Text className="text-sm italic text-gray-500 mt-2">📝 {item.note}</Text>
            ) : null}
            
            <View className="flex-row justify-end gap-3 mt-4">
            <Pressable className="px-3 py-2 rounded-full bg-blue-100" onPress={() => openEditModal(item)}>
            <Text className="text-blue-700">✏️ Edit</Text>
            </Pressable>
            
            <Pressable className="px-3 py-2 rounded-full bg-red-100" onPress={() => handleDelete(item.id)}>
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
            <Text className="text-red-600">{error}</Text>
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
            <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
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
                                onChangeText={(text) => setEditingLog((prev) => (prev ? { ...prev, title: text } : prev))}
                                />
                        </View>
        
                        {/* Category */}
                        <View className="mb-3">
                            <Text className="text-sm text-gray-500 mb-1">Category</Text>
                                <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2"
                                value={String(editingLog?.category ?? "Other")}
                                onChangeText={(text) =>
                                    setEditingLog((prev) => (prev ? { ...prev, category: text as MilestoneCategory } : prev))
                                }
                            />
                            <Text className="text-xs text-gray-400 mt-1">
                            Must match your milestone_category enum values (or keep “Other”).
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
                                onChangeText={(text) => setEditingLog((prev) => (prev ? { ...prev, note: text } : prev))}
                                multiline
                                />
                        </View>
        
        <View className="flex-row justify-end gap-3 mt-4">
                            <TouchableOpacity className="bg-gray-200 rounded-full px-4 py-2" onPress={() => setEditModalVisible(false)}>
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                                <TouchableOpacity className="bg-green-500 rounded-full px-4 py-2" onPress={handleSaveEdit}>
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
