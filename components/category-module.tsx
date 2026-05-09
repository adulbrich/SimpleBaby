import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * CategoryModule allows users to select a category from a list.
 * Calls corresponding callbacks whenever category updates.
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
        <View className='tracker-section' testID={testID}>
            <View className='tracker-section-label'>
                <Text className='tracker-section-label-text'>{title}</Text>
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
                            <Text className="category-button-text-sm">{label}</Text>
                        </>) : (
                            <Text className="category-button-text-lg">{label}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </View>
        </View>
    );
};
