import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * MilestoneCategory allows users to select a milestone category.
 * Supports iOS inline spinner picker and Android native time picker dialog.
 * Calls corresponding callbacks whenever milestone time or category updates.
 */

export type MilestoneCategoryList = 'Motor' | 'Language' | 'Social' | 'Cognitive' | 'Other'

export default function MilestoneCategory({
    category,
    onCategoryUpdate,
    testID,
}: {
    category: MilestoneCategoryList;
    onCategoryUpdate?: (category: MilestoneCategoryList) => void
    testID?: string
}) {
    const handleCategoryPress = (categoryValue: MilestoneCategoryList) => {
        onCategoryUpdate?.(categoryValue);
    };

    return (
        <View className='flex-col gap-6 mb-6' testID={testID}>
            <View className='stopwatch-primary'>
                <View className='items-start bottom-5 left-3'>
                    <Text className='bg-gray-200 p-3 rounded-xl font'>
                        🌐 Choose Category
                    </Text>
                </View>
                <View className="flex-row flex-wrap gap-4 justify-center mb-6">
                          {['Motor', 'Language', 'Social', 'Cognitive', 'Other'].map((option) => (
                            <TouchableOpacity
                              key={option}
                              className={`feeding-category-button w-[110px] h-[110px] px-4 items-center ${
                                category === option ? 'feeding-category-button-active' : ''
                              }`}
                              onPress={() => handleCategoryPress(option as MilestoneCategoryList)}
                              testID={`milestone-category-${option.toLowerCase()}-button`}
                            >
                              <Text className="scale-100 text-xl">
                                {option === 'Motor'
                                  ? "🏃"
                                  : option === 'Language'
                                  ? "🗣️"
                                  : option === 'Social'
                                  ? "🧍‍♂️"
                                  : option === 'Cognitive'
                                  ? "🧠"
                                  : "❓"}
                              </Text>
                              <Text className="feeding-category-text text-sm">{option}</Text>
                            </TouchableOpacity>
                          ))}
                </View>
            </View>
        </View>
    );
}
