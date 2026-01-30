import React, { useState } from 'react';
import DateTimePicker, {
    DateTimePickerEvent,
    DateTimePickerAndroid,
} from '@react-native-community/datetimepicker';
import { View, Text, TouchableOpacity, Platform, TextInput } from 'react-native';

/**
 * FeedingCategory component allows users to select a feeding category,
 * input item name, amount, and pick a feeding time manually.
 * Supports iOS inline spinner picker and Android native time picker dialog.
 * Calls corresponding callbacks whenever feeding time, category,
 * item name, or amount updates.
 */

export type FeedingCategoryList = 'Liquid' | 'Soft' | 'Solid'

export default function FeedingCategory({
    category,
    itemName,
    amount,
    feedingTime,
    onTimeUpdate,
    onCategoryUpdate,
    onItemNameUpdate,
    onAmountUpdate,
    testID,
}: {
    category: FeedingCategoryList;
    itemName: string;
    amount: string;
    feedingTime: Date;
    onTimeUpdate?: (time: Date) => void
    onCategoryUpdate?: (category: FeedingCategoryList) => void
    onItemNameUpdate?: (itemName: string) => void
    onAmountUpdate?: (amount: string) => void
    testID?: string
}) {
    const [showIOSPicker, setShowIOSPicker] = useState(false);

    // Handles time picker change event, updates feedingTime
    const onChangeTime = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === 'set' && selectedDate) {
            onTimeUpdate?.(selectedDate);
        }
        // setShowIOSPicker(false)
    };

     // Shows or hides time picker, supports Android native dialog or iOS inline spinner
    const showTimePicker = () => {
        if (showIOSPicker) {
            return setShowIOSPicker(false);
        }

        if (Platform.OS === 'android') {
            DateTimePickerAndroid.open({
                value: feedingTime,
                onChange: (event, selectedDate) => {
                    if (selectedDate) {
                        onTimeUpdate?.(selectedDate);
                    }
                },
                mode: 'time',
                is24Hour: false,
            });
        } else {
            setShowIOSPicker(true);
        }
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const handleCategoryPress = (categoryValue: FeedingCategoryList) => {
        onCategoryUpdate?.(categoryValue);
    };

    return (
        <View className='flex-col gap-6' testID={testID}>
            <View className='stopwatch-primary'>
                <View className='items-start bottom-5 left-3'>
                    <Text className='bg-gray-200 p-3 rounded-xl font'>
                        🍽️ Choose Category
                    </Text>
                </View>
                <View className='flex-row gap-4 justify-center mb-6'>
                    <TouchableOpacity
                        className={`feeding-category-button ${
                            category === 'Liquid'
                                ? 'feeding-category-button-active'
                                : ''
                        }`}
                        onPress={() => handleCategoryPress('Liquid')}
                        testID='feeding-category-liquid-button'
                    >
                        <Text className='scale-100 text-2xl'>🍼</Text>
                        <Text className='feeding-category-text'>Liquid</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`feeding-category-button ${
                            category === 'Soft'
                                ? 'feeding-category-button-active'
                                : ''
                        }`}
                        onPress={() => handleCategoryPress('Soft')}
                        testID='feeding-category-soft-button'
                    >
                        <Text className='scale-100 text-2xl'>🥣</Text>
                        <Text className='feeding-category-text'>Soft</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        className={`feeding-category-button ${
                            category === 'Solid'
                                ? 'feeding-category-button-active'
                                : ''
                        }`}
                        onPress={() => handleCategoryPress('Solid')}
                        testID='feeding-category-solid-button'
                    >
                        <Text className='scale-100 text-2xl'>🥕</Text>
                        <Text className='feeding-category-text'>Solid</Text>
                    </TouchableOpacity>
                </View>
            </View>

            <View className='stopwatch-primary'>
                <View className='items-start bottom-5 left-3'>
                    <Text className='bg-gray-200 p-3 rounded-xl font'>
                        ⚖️ Add Details
                    </Text>
                </View>
                <View className='flex-col gap-4 mb-6'>
                    <View className='ml-4 mr-4'>
                        <Text className='feeding-module-label'>Item Name</Text>
                        <TextInput
                            className='text-input-internal'
                            placeholder='i.e. apple sauce'
                            autoCapitalize='none'
                            keyboardType='default'
                            value={itemName}
                            onChangeText={text => onItemNameUpdate?.(text)}
                            testID='feeding-item-name'
                        />
                    </View>

                    <View className='ml-4 mr-4'>
                        <Text className='feeding-module-label'>Amount</Text>
                        <TextInput
                            className='text-input-internal'
                            placeholder='i.e. 12 oz'
                            autoCapitalize='none'
                            keyboardType='default'
                            value={amount}
                            onChangeText={text => onAmountUpdate?.(text)}
                            testID='feeding-amount'
                        />
                    </View>

                    <View className='ml-4 mr-4 flex-row items-center justify-between'>
                        <Text className='feeding-module-label'>Meal Time</Text>
                        <View className='flex-row items-center bg-red-100 rounded-full gap-2'>
                            <TouchableOpacity
                                className='rounded-full bg-red-50 p-4'
                                onPress={showTimePicker}
                                testID='feeding-time-button'
                            >
                                <Text>
                                    {showIOSPicker ? 'Close' : 'Choose'} ⏰
                                </Text>
                            </TouchableOpacity>
                            <Text className='mr-4'>
                                {formatTime(feedingTime)}
                            </Text>
                        </View>
                    </View>

                    {showIOSPicker && Platform.OS === 'ios' && (
                        <View className='items-center'>
                            <DateTimePicker
                                testID='dateTimePicker'
                                value={feedingTime}
                                mode='time'
                                is24Hour={false}
                                onChange={onChangeTime}
                                display='spinner'
                            />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}
