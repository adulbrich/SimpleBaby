import React, { useEffect, useState } from 'react';
import DateTimePicker, {
    DateTimePickerEvent,
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { View, Text, TouchableOpacity, Platform } from 'react-native';


/**
 * ManualEntry component allows users to pick start and end times manually.
 * Supports both iOS (inline spinner picker) and Android (native time picker dialog).
 * Calls onDatesUpdate callback whenever start or end time changes.
 */
export default function ManualEntry({
    onDatesUpdate,
    resetSignal,
    testID
}: {
    onDatesUpdate?: (startDate: Date, endDate: Date) => void,
    resetSignal?: number
    testID?: string
}) {
    const [startDate, setStartDate] = useState(new Date());
    const [endDate, setEndDate] = useState(new Date());
    const [showIOSPicker, setShowIOSPicker] = useState(false);
    const [currentPickerMode, setCurrentPickerMode] = useState<'start' | 'end'>(
        'start',
    );

    useEffect(() => {
        onDatesUpdate?.(startDate, endDate);
    }, [startDate, endDate, onDatesUpdate]);

    // reset the date when the reset button is pressed
    useEffect(() => {
        if (resetSignal === undefined) {
            return;
        }

        const now = new Date();
        setStartDate(now);
        setEndDate(now);

        onDatesUpdate?.(now, now);
    }, [onDatesUpdate, resetSignal]);

    // Handles date change from picker, updates corresponding time, hides iOS picker
    const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'set' && selectedDate) {
            if (currentPickerMode === 'start') {
                setStartDate(selectedDate);
            } else {
                setEndDate(selectedDate);
            }
        }
        setShowIOSPicker(false);
    };

    // Opens Android time picker dialog for selected mode (start or end)
    const showTimePicker = (mode: 'start' | 'end') => {
        setCurrentPickerMode(mode);

        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: mode === 'start' ? startDate : endDate,
                onChange: (event, selectedDate) => {
                    if (selectedDate) {
                        if (mode === 'start') {
                            setStartDate(selectedDate);
                        } else {
                            setEndDate(selectedDate);
                        }
                    }
                    setShowIOSPicker(false);
                },
                mode: 'time',
                is24Hour: false,
            });
        } else {
            setShowIOSPicker(true);
        }
    };

    // Format Date object to hh:mm AM/PM string
    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <View className='manual-primary' testID={testID}>
            <View className='items-start relative bottom-5 left-3'>
                <Text className='bg-gray-200 p-3 rounded-xl font'>
                    Manual Entry
                </Text>
            </View>
            <View className='manual-secondary p-4 pt-0 flex-col gap-4'>
                <View className='flex-row gap-2 items-center w-full justify-between'>
                    <Text className='manual-foregound-text'>Start Time</Text>
                    <View className='flex-row items-center bg-red-100 rounded-full gap-2'>
                        <TouchableOpacity
                            className='rounded-full bg-red-50 p-4'
                            testID='sleep-manual-start-time'
                            onPress={() => {
                                if (
                                    showIOSPicker &&
                                    currentPickerMode === 'start'
                                ) {
                                    setShowIOSPicker(false);
                                } else {
                                    setCurrentPickerMode('start');
                                    setShowIOSPicker(true);
                                    if (Platform.OS === 'android') {
                                        showTimePicker('start');
                                    }
                                }
                            }}
                        >
                            <Text>
                                {showIOSPicker && currentPickerMode === 'start'
                                    ? 'Close'
                                    : 'Choose'}{' '}
                                ⏰
                            </Text>
                        </TouchableOpacity>
                        <Text className='mr-4'>{formatTime(startDate)}</Text>
                    </View>
                </View>
                <View className='flex-row gap-2 items-center w-full justify-between'>
                    <Text className='manual-foregound-text'>End Time</Text>
                    <View className='flex-row items-center bg-red-100 rounded-full gap-2'>
                        <TouchableOpacity
                            className='rounded-full bg-red-50 p-4'
                            testID='sleep-manual-end-time'
                            onPress={() => {
                                if (
                                    showIOSPicker &&
                                    currentPickerMode === 'end'
                                ) {
                                    setShowIOSPicker(false);
                                } else {
                                    setCurrentPickerMode('end');
                                    setShowIOSPicker(true);
                                    if (Platform.OS === 'android') {
                                        showTimePicker('end');
                                    }
                                }
                            }}
                        >
                            <Text>
                                {showIOSPicker && currentPickerMode === 'end'
                                    ? 'Close'
                                    : 'Choose'}{' '}
                                ⏰
                            </Text>
                        </TouchableOpacity>
                        <Text className='mr-4'>{formatTime(endDate)}</Text>
                    </View>
                </View>

                {showIOSPicker && Platform.OS === 'ios' && (
                    <View className='items-center'>
                        <DateTimePicker
                            testID='dateTimePicker'
                            value={
                                currentPickerMode === 'start'
                                    ? startDate
                                    : endDate
                            }
                            mode='time'
                            is24Hour={false}
                            onChange={onChangeDate}
                            display='spinner'
                        />
                    </View>
                )}
            </View>
        </View>
    );
}
