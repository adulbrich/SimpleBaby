import React, { useState, useEffect, useCallback } from 'react';
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
    ScrollView
} from 'react-native';
import { format } from 'date-fns';
import { getActiveChildId } from '@/library/utils';
import supabase from '@/library/supabase-client';
import { decryptData, encryptData } from '@/library/crypto';
import { useAuth } from '@/library/auth-provider';
import {
    listRows,
    updateRow,
    deleteRow,
    getActiveChildId as getLocalActiveChildId,
    LocalRow,
} from '@/library/local-store';

interface SleepLog {
    id: string
    start_time: string
    end_time: string
    duration: string | null
    note: string | null
}

type LocalSleepRow = LocalRow & {
    child_id: string;
    start_time: string;
    end_time: string;
    duration: string | null;
    note: string | null;
}

const SleepLogsView: React.FC = () => {
    const [sleepLogs, setSleepLogs] = useState<SleepLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editingLog, setEditingLog] = useState<SleepLog | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const { isGuest } = useAuth();

    const safeDecrypt = async (value: string | null): Promise<string> => {
        if (!value || !value.includes('U2FsdGVkX1')) return value || '';
        try {
            return await decryptData(value);
        } catch (err) {
            console.warn('⚠️ Decryption failed for:', value);
            return `[Decryption Failed]: ${err}`;
        }
    };

    const fetchSleepLogs = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            if (isGuest) {
                const childId = await getLocalActiveChildId();
                if (!childId) throw new Error('No active child selected (Guest Mode)');

                const rows = await listRows<LocalSleepRow>('sleep_logs');

                const childRows = rows
                    .filter((r) => r.child_id === childId)
                    .sort(
                    (a, b) =>
                        new Date(b.start_time).getTime() - new Date(a.start_time).getTime(),
                    );

                const decrypted = await Promise.all(
                    childRows.map(async (entry) => ({
                    ...entry,
                    note: await safeDecrypt(entry.note),
                    })),
                );

                setSleepLogs(decrypted as SleepLog[]);
                return;
            }

            const { success, childId, error: childError } = await getActiveChildId();
            if (!success || !childId) {
                throw new Error(
                    typeof childError === 'string'
                        ? childError
                        : childError?.message || 'Failed to get active child ID'
                );
            }

            const { data, error } = await supabase
                .from('sleep_logs')
                .select('*')
                .eq('child_id', childId)
                .order('start_time', { ascending: false });

            if (error) throw error;

            const decrypted = await Promise.all(
                (data || []).map(async (entry) => ({
                    ...entry,
                    note: await safeDecrypt(entry.note),
                }))
            );

            setSleepLogs(decrypted);
        } catch (err) {
            console.error('❌ Fetch or decryption error:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, [isGuest]);

    useEffect(() => {
        fetchSleepLogs();
    }, [fetchSleepLogs]);

    const handleDelete = async (id: string) => {
        Alert.alert('Delete Entry', 'Are you sure you want to delete this log?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (isGuest) {
                        const ok = await deleteRow('sleep_logs', id);
                        if (!ok) {
                            Alert.alert('Error deleting log');
                            return;
                        }
                        setSleepLogs((prev) => prev.filter((log) => log.id !== id));
                        return;
                    }

                    const { error } = await supabase
                        .from('sleep_logs')
                        .delete()
                        .eq('id', id);
                    if (error) {
                        Alert.alert('Error deleting log');
                        return;
                    }
                    setSleepLogs((prev) => prev.filter((log) => log.id !== id));
                },
            },
        ]);
    };

    const handleSaveEdit = async () => {
        if (!editingLog) return;

        try {
            const encryptedNote = editingLog.note ? await encryptData(editingLog.note) : null;

            if (isGuest) {
                const ok = await updateRow('sleep_logs', editingLog.id, {
                    start_time: editingLog.start_time,
                    end_time: editingLog.end_time,
                    duration: editingLog.duration,
                    note: encryptedNote,
                });

                if (!ok) {
                    Alert.alert('Failed to update log');
                    return;
                }

                await fetchSleepLogs();
                setEditModalVisible(false);
                return;
            }

            const { error } = await supabase
                .from('sleep_logs')
                .update({
                    start_time: editingLog.start_time,
                    end_time: editingLog.end_time,
                    duration: editingLog.duration,
                    note: encryptedNote,
                })
                .eq('id', editingLog.id);

            if (error) {
                Alert.alert('Failed to update log');
                return;
            }

            await fetchSleepLogs();
            setEditModalVisible(false);
        } catch (err) {
            console.error('❌ Encryption or update error:', err);
            Alert.alert('Something went wrong during save.');
        }
    };

    const renderSleepLogItem = ({ item }: { item: SleepLog }) => (
        <View className="bg-white rounded-xl p-4 mb-4 shadow">
            <Text className="text-lg font-bold mb-2">
                {format(new Date(item.start_time), 'MMM dd, yyyy')}
            </Text>
            <Text className="text-base mb-1">
                Start: {format(new Date(item.start_time), 'h:mm a')}
            </Text>
            <Text className="text-base mb-1">
                End: {format(new Date(item.end_time), 'h:mm a')}
            </Text>
            <Text className="text-base mb-1">
                Duration: {item.duration || 'N/A'}
            </Text>
            {item.note && (
                <Text className="text-sm italic text-gray-500 mt-1">📝 {item.note}</Text>
            )}
            <View className="flex-row justify-end gap-3 mt-4">
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
            <Text className="text-2xl font-bold mb-4">🛏️ Sleep Logs</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#e11d48" />
            ) : error ? (
                <Text className="text-red-600 text-center">Error: {error}</Text>
            ) : (
                <FlatList
                    data={sleepLogs}
                    renderItem={renderSleepLogItem}
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
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={{ flex: 1 }}
                >
                    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 16, backgroundColor: '#00000099' }}>
                        <View className="bg-white w-full rounded-2xl p-6">
                            <Text className="text-xl font-bold mb-4">Edit Sleep Log</Text>
                            <Text className="text-sm text-gray-500 mb-1">Start Time</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2 mb-3"
                                value={editingLog?.start_time || ''}
                                onChangeText={(text) =>
                                    setEditingLog((prev) => prev ? { ...prev, start_time: text } : prev)
                                }
                            />
                            <Text className="text-sm text-gray-500 mb-1">End Time</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2 mb-3"
                                value={editingLog?.end_time || ''}
                                onChangeText={(text) =>
                                    setEditingLog((prev) => prev ? { ...prev, end_time: text } : prev)
                                }
                            />
                            <Text className="text-sm text-gray-500 mb-1">Duration</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2 mb-3"
                                value={editingLog?.duration || ''}
                                onChangeText={(text) =>
                                    setEditingLog((prev) => prev ? { ...prev, duration: text } : prev)
                                }
                            />
                            <Text className="text-sm text-gray-500 mb-1">Note</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2 mb-6"
                                value={editingLog?.note || ''}
                                onChangeText={(text) =>
                                    setEditingLog((prev) => prev ? { ...prev, note: text } : prev)
                                }
                            />
                            <View className="flex-row justify-end gap-3">
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

export default SleepLogsView;
