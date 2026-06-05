import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * CategoryModule allows users to select a category from a list.
 * Calls corresponding callbacks whenever category updates.
 */

export default function CategoryModule<Category extends string>({
    title,
    titleIcon,
    categoryList,
    selectedCategory,
    onCategoryUpdate,
    testID,
}: {
    title: string
    titleIcon?: React.ReactNode,
    categoryList: { label: Category; icon?: React.ReactNode }[];
    selectedCategory: Category;
    onCategoryUpdate?: (category: Category) => void
    testID?: string
}) {
    return (
        <View className='tracker-section' testID={testID}>
            <View className='tracker-section-label'>
                <Text className='tracker-section-label-text'>{titleIcon} {title}</Text>
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
                            {icon}
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
