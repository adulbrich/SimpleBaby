import React, { useEffect, useState } from 'react';
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
  ScrollView
} from 'react-native';
import { getActiveChildId } from '@/library/utils';
import supabase from '@/library/supabase-client';
import { decryptData, encryptData } from '@/library/crypto';
import { format } from 'date-fns';

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
  note: string | null;
}

const HealthLogsView: React.FC = () => {
  const [logs, setLogs] = useState<HealthLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingLog, setEditingLog] = useState<HealthLog | null>(null);
  const [editModalVisible, setEditModalVisible] = useState(false);

  useEffect(() => {
    fetchHealthLogs();
  });

  const safeDecrypt = async (value: string | null): Promise<string> => {
    if (!value || !value.includes('U2FsdGVkX1')) return '';
    try {
      return await decryptData(value);
    } catch {
      return '[Decryption Failed]';
    }
  };

  const fetchHealthLogs = async () => {
    try {
      const { success, childId, error: childError } = await getActiveChildId();
      if (!success || !childId) {
        throw new Error(typeof childError === 'string' ? childError : childError?.message || 'Failed to get child ID');
      }

      const { data, error } = await supabase
        .from('health_logs')
        .select('*')
        .eq('child_id', childId)
        .order('date', { ascending: false });

      if (error) throw error;

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
          note: await safeDecrypt(entry.note),
        }))
      );

      setLogs(decrypted);
    } catch (err) {
      console.error('❌ Fetch or decryption error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editingLog) return;
    try {
      const updated = {
        growth_length: editingLog.growth_length ? await encryptData(editingLog.growth_length) : null,
        growth_weight: editingLog.growth_weight ? await encryptData(editingLog.growth_weight) : null,
        growth_head: editingLog.growth_head ? await encryptData(editingLog.growth_head) : null,
        activity_type: editingLog.activity_type ? await encryptData(editingLog.activity_type) : null,
        activity_duration: editingLog.activity_duration ? await encryptData(editingLog.activity_duration) : null,
        meds_name: editingLog.meds_name ? await encryptData(editingLog.meds_name) : null,
        meds_amount: editingLog.meds_amount ? await encryptData(editingLog.meds_amount) : null,
        note: editingLog.note ? await encryptData(editingLog.note) : null,
      };

      const { error } = await supabase
        .from('health_logs')
        .update(updated)
        .eq('id', editingLog.id);

      if (error) {
        Alert.alert('Error updating log');
        return;
      }

      await fetchHealthLogs();
      setEditModalVisible(false);
    } catch (err) {
      console.error('❌ Encryption or update error:', err);
      Alert.alert('Encryption or update failed');
    }
  };

  const handleDelete = async (id: string) => {
    Alert.alert('Delete Entry', 'Are you sure you want to delete this log?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('health_logs').delete().eq('id', id);
          if (error) {
            Alert.alert('Error deleting log');
            return;
          }
          setLogs((prev) => prev.filter((log) => log.id !== id));
        },
      },
    ]);
  };

  const renderLog = ({ item }: { item: HealthLog }) => (
    <View className="bg-white rounded-xl p-4 mb-4 shadow">
      <Text className="text-lg font-bold mb-1">{item.category}</Text>
      <Text className="text-base">{format(new Date(item.date), 'MMM dd, yyyy')}</Text>
      {item.growth_length && <Text>Length: {item.growth_length} cm</Text>}
      {item.growth_weight && <Text>Weight: {item.growth_weight} kg</Text>}
      {item.growth_head && <Text>Head: {item.growth_head} cm</Text>}
      {item.activity_type && <Text>Activity: {item.activity_type}</Text>}
      {item.activity_duration && <Text>Duration: {item.activity_duration}</Text>}
      {item.meds_name && <Text>Med: {item.meds_name}</Text>}
      {item.meds_amount && <Text>Amount: {item.meds_amount}</Text>}
      {item.note && <Text className="italic text-gray-500">📝 {item.note}</Text>}
      <View className="flex-row justify-end mt-3 gap-3">
        <Pressable className="px-3 py-2 rounded-full bg-blue-100" onPress={() => { setEditingLog(item); setEditModalVisible(true); }}>
          <Text className="text-blue-700">✏️ Edit</Text>
        </Pressable>
        <Pressable className="px-3 py-2 rounded-full bg-red-100" onPress={() => handleDelete(item.id)}>
          <Text className="text-red-700">🗑️ Delete</Text>
        </Pressable>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color="#e11d48" />
        <Text className="mt-2 text-gray-500">Loading health logs...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50 p-4">
        <Text className="text-red-600 text-center">Error: {error}</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50 p-4">
      <Text className="text-2xl font-bold mb-4">🩺 Health Logs</Text>
      <FlatList
        data={logs}
        renderItem={renderLog}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingBottom: 16 }}
      />

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
              <Text className="text-xl font-bold mb-4">Edit Health Log</Text>
              <TextInput className="border mb-2 px-3 py-2" placeholder="Length (cm)" value={editingLog?.growth_length || ''} onChangeText={(text) => setEditingLog((prev) => prev ? { ...prev, growth_length: text } : prev)} />
              <TextInput className="border mb-2 px-3 py-2" placeholder="Weight (kg)" value={editingLog?.growth_weight || ''} onChangeText={(text) => setEditingLog((prev) => prev ? { ...prev, growth_weight: text } : prev)} />
              <TextInput className="border mb-2 px-3 py-2" placeholder="Head (cm)" value={editingLog?.growth_head || ''} onChangeText={(text) => setEditingLog((prev) => prev ? { ...prev, growth_head: text } : prev)} />
              <TextInput className="border mb-2 px-3 py-2" placeholder="Activity Type" value={editingLog?.activity_type || ''} onChangeText={(text) => setEditingLog((prev) => prev ? { ...prev, activity_type: text } : prev)} />
              <TextInput className="border mb-2 px-3 py-2" placeholder="Activity Duration" value={editingLog?.activity_duration || ''} onChangeText={(text) => setEditingLog((prev) => prev ? { ...prev, activity_duration: text } : prev)} />
              <TextInput className="border mb-2 px-3 py-2" placeholder="Medication Name" value={editingLog?.meds_name || ''} onChangeText={(text) => setEditingLog((prev) => prev ? { ...prev, meds_name: text } : prev)} />
              <TextInput className="border mb-2 px-3 py-2" placeholder="Medication Amount" value={editingLog?.meds_amount || ''} onChangeText={(text) => setEditingLog((prev) => prev ? { ...prev, meds_amount: text } : prev)} />
              <TextInput className="border mb-2 px-3 py-2" placeholder="Note" value={editingLog?.note || ''} onChangeText={(text) => setEditingLog((prev) => prev ? { ...prev, note: text } : prev)} />
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

export default HealthLogsView;
