import {
    Text,
    View,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    Keyboard,
    Alert,
    ScrollView
} from 'react-native';
import { useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import supabase from '@/library/supabase-client';
import { router } from 'expo-router';
import { getActiveChildId } from '@/library/utils';
import DiaperModule from '@/components/diaper-module';
import { encryptData } from '@/library/crypto';
import { useAuth } from '@/library/auth-provider';
import { insertRow, getActiveChildId as getLocalActiveChildId } from '@/library/local-store';

// Diaper.tsx
// Screen for logging diaper changes — includes selecting consistency, amount, change time, notes, and save logic

export default function Diaper() {
    const insets = useSafeAreaInsets();
    const [isTyping, setIsTyping] = useState(false);
    const [consistency, setConsistency] = useState('');
    const [amount, setAmount] = useState('');
    const [changeTime, setChangeTime] = useState(new Date());
    const [note, setNote] = useState('');
    const [reset, setReset] = useState<number>(0);
    const { isGuest } = useAuth();

    // Create a new diaper log into the database
    const createDiaperLog = async (
        childId: string,
        consistency: string,
        amount: string,
        changeTime: Date,
        note = '',
    ) => {
        try {
            const encryptedConsistency = await encryptData(consistency);
            const encryptedAmount = await encryptData(amount);
            const encryptedNote = note ? await encryptData(note) : null;

            const { data, error } = await supabase.from('diaper_logs').insert([
                {
                    child_id: childId,
                    consistency: encryptedConsistency,
                    amount: encryptedAmount,
                    change_time: changeTime.toISOString(),
                    note: encryptedNote,
                },
            ]);

            if (error) {
                console.error('Error creating diaper log:', error);
                return { success: false, error };
            }

            return { success: true, data };
        } catch (err) {
            console.error('❌ Encryption or insert failed:', err);
            return { success: false, error: 'Encryption or database error' };
        }
    };

    const createDiaperLogGuest = async (
        childId: string,
        consistency: string,
        amount: string,
        changeTime: Date,
        note = '',
    ) => {
        try {
            const encryptedConsistency = await encryptData(consistency);
            const encryptedAmount = await encryptData(amount);
            const encryptedNote = note ? await encryptData(note) : null;

            const row = await insertRow('diaper_logs', {
                child_id: childId,
                consistency: encryptedConsistency,
                amount: encryptedAmount,
                note: encryptedNote,
                change_time: changeTime.toISOString(),
                logged_at: new Date().toISOString()
            });

            return { success: true, data: row };

            } catch {
                return { success: false, error: 'Encryption or local save error' };
            }
  };

    // Get active child ID and save diaper log
    const saveDiaperLog = async () => {
        if (isGuest) {
            const childId = await getLocalActiveChildId();
            if (!childId) {
                Alert.alert('No active child set (guest mode)');
                return { success: false, error: 'No active child set' };
            }
            return await createDiaperLogGuest(childId, consistency, amount, changeTime, note);
        }
        
        const { success, childId, error } = await getActiveChildId();

        if (!success) {
            Alert.alert(`Error: ${error}`);
            return { success: false, error };
        }

        return await createDiaperLog(
            childId,
            consistency,
            amount,
            changeTime,
            note,
        );
    };

    // Validate and handle save action with alerts
    const handleSaveDiaperLog = async () => {
        if (consistency && amount) {
            const result = await saveDiaperLog();
            if (result.success) {
                router.replace('/(tabs)');
                Alert.alert('Diaper log saved successfully!');
            } else {
                Alert.alert(`Failed to save diaper log: ${result.error}`);
            }
        } else {
            const missingFields = [];
            if (!consistency) missingFields.push("consistency");
            if (!amount) missingFields.push("amount");
            const formattedMissing = missingFields.length > 1
                ? `${missingFields.slice(0, -1).join(', ')} and ${missingFields.slice(-1)}`
                : missingFields[0];
            Alert.alert("Missing Information", `Failed to save the Diaper log. You are missing the following fields: ${formattedMissing}.`);
        }
    };

    // Handle the UI logic when resetting fields
    const handleResetFields = () => {
        setConsistency("");
        setAmount("");
        setChangeTime(new Date());
        setNote("");
        setReset(prev => prev + 1);
    };

    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            {/*ScrollView Prevents items from flowing off page on small devices*/}
            <View
                className='main-container justify-between'
                style={{ 
                    paddingBottom: insets.bottom,
                 }}
            >
        <ScrollView>
                {/* Main form stack with diaper inputs and note */}
                <View
                    className={`gap-6 transition-all duration-300 ${
                        isTyping ? '-translate-y-[40%]' : 'translate-y-0'
                    }`}
                >
                    <DiaperModule
                        key={`diaper-module-${reset}`}
                        onConsistencyUpdate={setConsistency}
                        onAmountUpdate={setAmount}
                        onTimeUpdate={setChangeTime}
                        testID={"diaper-main-inputs"}
                    />
                    {/* Note input section */}
                    <View className='bottom-5'>
                        <View className='items-start top-5 left-3 z-10'>
                            <Text className='bg-gray-200 p-3 rounded-xl font'>
                                Add a note
                            </Text>
                        </View>
                        <View className='p-4 pt-9 bg-white rounded-xl z-0'>
                            <TextInput
                                className=''
                                placeholderTextColor={'#aaa'}
                                placeholder='i.e. really messy'
                                multiline={true}
                                maxLength={200}
                                onFocus={() => setIsTyping(true)}
                                onBlur={() => setIsTyping(false)}
                                value={note}
                                onChangeText={setNote}
                                testID='diaper-note-entry'
                            />
                        </View>
                    </View>
                </View>
                {/* Action buttons row */}
                <View className='flex-row gap-2 pb-5'>
                    <TouchableOpacity
                        className='rounded-full p-4 bg-red-100 grow'
                        onPress={handleSaveDiaperLog}
                        testID='diaper-save-log-button'
                    >
                        <Text>➕ Add to log</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        className='rounded-full p-4 bg-red-100 items-center'
                        onPress={() => handleResetFields()}
                        testID='diaper-reset-form-button'
                    >
                        <Text>🗑️ Reset fields</Text>
                    </TouchableOpacity>
                </View>
        </ScrollView>
            </View>
        </TouchableWithoutFeedback>
    );
}
