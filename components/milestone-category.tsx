import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * CategoryModule allows users to select a category from a list.
 * Calls corresponding callbacks whenever category updates.
 * ['Motor', "🏃", 'Language', "🗣️", 'Social', "🧍‍♂️", 'Cognitive', "🧠", 'Other', "❓"]
 * 'Motor' | 'Language' | 'Social' | 'Cognitive' | 'Other'
 * 🌐 Choose Category
 */

export default function CategoryModule<Category extends string>({
    title,
    categoryList,
    selectedCategory,
    onCategoryUpdate,
    testID,
}: {
    title: string
    categoryList: { label: Category; icon?: string }[];
    selectedCategory: Category;
    onCategoryUpdate?: (category: Category) => void
    testID?: string
}) {
    return (
        <View className='stopwatch-primary' testID={testID}>
            <View className='items-start bottom-5 left-3'>
                <Text className='bg-gray-200 p-3 rounded-xl font'>{title}</Text>
            </View>
            <View className="flex-row flex-wrap gap-4 justify-center mb-6">
                {categoryList.map(({ label, icon }) => (
                    <TouchableOpacity
                        key={label}
                        className={`category-button w-[110px] h-[110px] px-4 items-center ${
                            selectedCategory === label ? 'category-button-active' : ''
                        }`}
                        onPress={() => onCategoryUpdate?.(label as Category)}
                        testID={`category-${label.toLowerCase()}-button`}
                    >
                        { icon ? (<>
                            <Text className="scale-100 text-xl">{icon}</Text>
                            <Text className="category-button-text">{label}</Text>
                        </>) : (
                            <Text className="category-button-text-lg">{label}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};
