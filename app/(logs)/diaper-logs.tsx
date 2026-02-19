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
    ScrollView,
} from 'react-native';
import { format } from 'date-fns';
import { getActiveChildId } from '@/library/utils';
import supabase from '@/library/supabase-client';
import { encryptData, decryptData } from '@/library/crypto';
import { useAuth } from '@/library/auth-provider';
import { listRows, updateRow, deleteRow, getActiveChildId as getLocalActiveChildId, LocalRow } from '@/library/local-store';

interface DiaperLog {
    id: string
    child_id: string
    consistency: string
    amount: string
    logged_at: string
    note: string | null
}

type LocalDiaperRow = LocalRow & {
    child_id: string;
    consistency: string;
    amount: string;
    logged_at: string;
    note: string | null;
    change_time: string;
}

const DiaperLogsView: React.FC = () => {
    const [diaperLogs, setDiaperLogs] = useState<DiaperLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeChildName, setActiveChildName] = useState<string | null>(null);
    const [editingLog, setEditingLog] = useState<DiaperLog | null>(null);
    const [editModalVisible, setEditModalVisible] = useState(false);
    const { isGuest } = useAuth();

    const safeDecrypt = async (value: string | null): Promise<string> => {
        if (!value || !value.includes('U2FsdGVkX1')) return '';
        try {
            return await decryptData(value);
        } catch (err) {
            console.warn('⚠️ Decryption failed for:', value);
            return `[Decryption Failed]: ${err}`;
        }
    };

    const fetchDiaperLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            if (isGuest) {
                const childId = await getLocalActiveChildId();
                if (!childId) throw new Error('No active child set (guest mode)');
                
                const rows = await listRows<LocalDiaperRow>('diaper_logs');
                const childRows = rows
                    .filter((r) => r.child_id === childId)
                    .sort((a, b) => new Date(b.change_time).getTime() - new Date(a.change_time).getTime());

                const decrypted = await Promise.all(
                childRows.map(async (entry) => ({
                        ...entry,
                        consistency: await safeDecrypt(entry.consistency),
                        amount: await safeDecrypt(entry.amount),
                        note: entry.note ? await safeDecrypt(entry.note) : '',
                    })),
                );

                setDiaperLogs(decrypted as DiaperLog[]);
                return;
            }

            const { success, childId, childName, error: childError } = await getActiveChildId();
            if (!success || !childId) {
                throw new Error(typeof childError === 'string' ? childError : childError?.message || 'Failed to get active child ID');
            }

            if (childName) setActiveChildName(childName);

            const { data, error } = await supabase
                .from('diaper_logs')
                .select('*')
                .eq('child_id', childId)
                .order('logged_at', { ascending: false });

            if (error) throw error;

            const decryptedLogs = await Promise.all(
                (data || []).map(async (entry) => ({
                    ...entry,
                    consistency: await safeDecrypt(entry.consistency),
                    amount: await safeDecrypt(entry.amount),
                    note: entry.note ? await safeDecrypt(entry.note) : '',
                }))
            );

            setDiaperLogs(decryptedLogs);
        } catch (err) {
            console.error('❌ Fetch or decryption error:', err);
            setError(err instanceof Error ? err.message : 'An unknown error occurred');
        } finally {
            setLoading(false);
        }
    }, [isGuest]);

    useEffect(() => {
        fetchDiaperLogs();
    }, [fetchDiaperLogs]);

    const handleDelete = async (id: string) => {
        Alert.alert('Delete Entry', 'Are you sure you want to delete this log?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    if (isGuest) {
                        const success = await deleteRow('diaper_logs', id);
                        if (!success) { 
                            Alert.alert('Error deleting log');
                        }
                        setDiaperLogs((prev) => prev.filter((log) => log.id !== id));
                        return;
                    }

                    const { error } = await supabase.from('diaper_logs').delete().eq('id', id);
                    if (error) {
                        Alert.alert('Error deleting log');
                        return;
                    }
                    setDiaperLogs((prev) => prev.filter((log) => log.id !== id));
                },
            },
        ]);
    };

    const handleSaveEdit = async () => {
        if (!editingLog) return;

        try {
            const { id, consistency, amount, note } = editingLog;

            const encryptedConsistency = await encryptData(consistency);
            const encryptedAmount = await encryptData(amount);
            const encryptedNote = note ? await encryptData(note) : null;

            if (isGuest) {
                const success = await updateRow('diaper_logs', id, {
                    consistency: encryptedConsistency,
                    amount: encryptedAmount,
                    note: encryptedNote,
                });
                if (!success) {
                    Alert.alert('Failed to update log');
                    return;
                }

                await fetchDiaperLogs();
                setEditModalVisible(false);
                return;
            }

            const { error } = await supabase
                .from('diaper_logs')
                .update({
                    consistency: encryptedConsistency,
                    amount: encryptedAmount,
                    note: encryptedNote,
                })
                .eq('id', id);

            if (error) {
                Alert.alert('Failed to update log');
                return;
            }

            await fetchDiaperLogs();
            setEditModalVisible(false);
        } catch (err) {
            console.error('❌ Encryption or update error:', err);
            Alert.alert('Something went wrong during save.');
        }
    };

    const renderDiaperLogItem = ({ item }: { item: DiaperLog }) => (
        <View className="bg-white rounded-xl p-4 mb-4 shadow">
            <Text className="text-lg font-bold mb-2">
                {format(new Date(item.logged_at), 'MMM dd, yyyy')}
            </Text>
            <Text className="text-base mb-1">
                {format(new Date(item.logged_at), 'h:mm a')}
            </Text>
            <Text className="text-base mb-1">Consistency: {item.consistency}</Text>
            <Text className="text-base mb-1">Size: {item.amount}</Text>
            {item.note && (
                <Text className="text-sm italic text-gray-500 mt-1">📝 {item.note}</Text>
            )}
            <View className="flex-row justify-end gap-3 mt-4">
                <Pressable className="px-3 py-2 rounded-full bg-blue-100" onPress={() => { setEditingLog(item); setEditModalVisible(true); }}>
                    <Text className="text-blue-700">✏️ Edit</Text>
                </Pressable>
                <Pressable className="px-3 py-2 rounded-full bg-red-100" onPress={() => handleDelete(item.id)}>
                    <Text className="text-red-700">🗑️ Delete</Text>
                </Pressable>
            </View>
        </View>
    );

    return (
        <View className="flex-1 bg-gray-50 p-4">
            <Text className="text-2xl font-bold mb-4">🧷 Diaper Logs</Text>
            {loading ? (
                <ActivityIndicator size="large" color="#e11d48" />
            ) : error ? (
                <Text className="text-red-600 text-center">Error: {error}</Text>
            ) : diaperLogs.length === 0 ? (
                <Text>You don&apos;t have any diaper logs{activeChildName ? ` for ${activeChildName}` : ""} yet!</Text>
            ) : (
                <FlatList
                    data={diaperLogs}
                    renderItem={renderDiaperLogItem}
                    keyExtractor={(item) => item.id}
                    contentContainerStyle={{ paddingBottom: 16 }}
                />
            )}

            {/* Edit Modal */}
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
                            <Text className="text-xl font-bold mb-4">Edit Diaper Log</Text>
                            <Text className="text-sm text-gray-500 mb-1">Consistency</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2 mb-3"
                                value={editingLog?.consistency}
                                onChangeText={(text) =>
                                    setEditingLog((prev) =>
                                        prev ? { ...prev, consistency: text } : prev,
                                    )
                                }
                            />
                            <Text className="text-sm text-gray-500 mb-1">Amount</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2 mb-3"
                                value={editingLog?.amount}
                                onChangeText={(text) =>
                                    setEditingLog((prev) =>
                                        prev ? { ...prev, amount: text } : prev,
                                    )
                                }
                            />
                            <Text className="text-sm text-gray-500 mb-1">Note</Text>
                            <TextInput
                                className="border border-gray-300 rounded-xl px-3 py-2 mb-6"
                                value={editingLog?.note || ''}
                                onChangeText={(text) =>
                                    setEditingLog((prev) =>
                                        prev ? { ...prev, note: text } : prev,
                                    )
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

export default DiaperLogsView;
