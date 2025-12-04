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
import Stopwatch from '@/components/stopwatch';
import ManualEntry from '@/components/manual-entry-sleep';
import supabase from '@/library/supabase-client';
import { router } from 'expo-router';
import { getActiveChildId } from '@/library/utils';
import { encryptData } from '@/library/crypto';

// Sleep.tsx
// Screen for logging baby sleep sessions — includes stopwatch, manual entry, notes, and save logic
export default function Sleep() {
    const insets = useSafeAreaInsets();
    const [isTyping, setIsTyping] = useState(false);
    const [startTime, setStartTime] = useState<Date | null>(null);
    const [endTime, setEndTime] = useState<Date | null>(null);
    const [stopwatchTime, setStopwatchTime] = useState('00:00:00');
    const [note, setNote] = useState('');
    const [reset, setReset] = useState<number>(0);

    // Update manual entry times
    const handleDatesUpdate = (start: Date, end: Date) => {
        setStartTime(start);
        setEndTime(end);
    };

     // Create a sleep log entry for Supabase
    const createSleepLog = async (
        childId: string,
        startTime: Date,
        endTime: Date,
        note = '',
    ) => {
        const durationMs = endTime.getTime() - startTime.getTime();
        const durationSec = Math.floor(durationMs / 1000);

        const hours = Math.floor(durationSec / 3600);
        const minutes = Math.floor((durationSec % 3600) / 60);
        const seconds = durationSec % 60;

        const duration = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

        const encryptedNote = note ? await encryptData(note) : null;

        const { data, error } = await supabase.from('sleep_logs').insert([
            {
                child_id: childId,
                start_time: startTime.toISOString(),
                end_time: endTime.toISOString(),
                duration: duration,
                note: encryptedNote,
            },
        ]);

        if (error) {
            console.error('Error creating sleep log:', error);
            return { success: false, error };
        }

        return { success: true, data };
    };

    // Prepare and validate sleep log data before saving
    const saveSleepLog = async (
        stopwatchTime: string | null = null,
        startTime: Date | null = null,
        endTime: Date | null = null,
        note = '',
    ) => {
        const { success, childId, error } = await getActiveChildId();

        if (!success) {
            Alert.alert(`Error: ${error}`);
            return { success: false, error };
        }

        let finalStartTime, finalEndTime;

        if (stopwatchTime) {
            const [hours, minutes, seconds] = stopwatchTime
                .split(':')
                .map(Number);
            const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

            finalEndTime = new Date();
            finalStartTime = new Date(finalEndTime.getTime() - durationMs);
        } else if (startTime && endTime) {
            finalStartTime = startTime;
            finalEndTime = endTime;
        } else {
            Alert.alert(
                'Error: Either stopwatch time or start/end times must be provided',
            );
            return { success: false, error: 'Missing time data' };
        }

        return await createSleepLog(childId, finalStartTime, finalEndTime, note);
    };

    // Handle UI logic for saving a sleep entry depending on method
    const handleSaveSleepLog = async () => {
        if (stopwatchTime && stopwatchTime !== '00:00:00') {
            const result = await saveSleepLog(stopwatchTime, null, null, note);
            if (result.success) {
                router.replace('/(tabs)');
                Alert.alert('Sleep log saved successfully!');
            } else {
                Alert.alert(`Failed to save sleep log: ${result.error}`);
            }
        } else if (startTime && endTime) {
            const result = await saveSleepLog(null, startTime, endTime, note);
            if (result.success) {
                router.replace('/(tabs)');
                Alert.alert('Sleep log saved successfully!');
            } else {
                Alert.alert(`Failed to save sleep log: ${result.error}`);
            }
        } else {
            Alert.alert(
                'Please provide either stopwatch time or start/end times',
            );
        }
    };

    // Handle the UI logic when resetting fields
    const handleResetFields = () => {
        setStartTime(null);
        setEndTime(null);
        setStopwatchTime('00:00:00');
        setNote('');
        setReset((prev) => prev + 1);
    };

    return (
        // Dismiss keyboard when touching outside inputs
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
            {/*ScrollView Prevents items from flowing off page on small devices*/}
            <ScrollView>
                <View
                    className='main-container justify-between'
                    style={{ paddingBottom: insets.bottom }}
                >
                    {/* Main form stack with stopwatch and manual entry */}
                    <View
                        className={`gap-6 transition-all duration-300 ${
                            isTyping ? '-translate-y-[40%]' : 'translate-y-0'
                        }`}
                    >
                        {/* Stopwatch component for tracking session duration */}
                        <Stopwatch
                            key={`stopwatch-${reset}`} 
                            onTimeUpdate={setStopwatchTime}
                            testID='sleep-stopwatch' 
                        />

                        {/* Manual start/end time picker */}
                        <ManualEntry
                            key={`manual-entry-${reset}`} 
                            onDatesUpdate={handleDatesUpdate}
                            testID='sleep-manual-time-entry'
                        />

                        {/* Note input section */}
                        <View className='bottom-5' testID='sleep-note-entry'>
                            <View className='items-start top-5 left-3 z-10'>
                                <Text className='bg-gray-200 p-3 rounded-xl font'>
                                    Add a note
                                </Text>
                            </View>
                            <View className='p-4 pt-9 bg-white rounded-xl z-0'>
                                <TextInput
                                    className=''
                                    placeholderTextColor={'#aaa'}
                                    placeholder='i.e. baby was squirming often'
                                    multiline={true}
                                    maxLength={200}
                                    onFocus={() => setIsTyping(true)}
                                    onBlur={() => setIsTyping(false)}
                                    value={note}
                                    onChangeText={setNote}
                                />
                            </View>
                        </View>
                    </View>
                    {/* Action buttons */}
                    <View className='flex-row gap-2'>
                        <TouchableOpacity
                            className='rounded-full p-4 bg-red-100 grow'
                            onPress={handleSaveSleepLog}
                            testID='sleep-save-log-button'
                        >
                            <Text>➕ Add to log</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            className='rounded-full p-4 bg-red-100 items-center'
                            onPress={() => handleResetFields()}
                            testID='sleep-reset-form-button'
                        >
                            <Text>🗑️ Reset fields</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </ScrollView>
        </TouchableWithoutFeedback>
    );
}
