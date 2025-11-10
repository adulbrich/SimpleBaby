import { ExternalPathString, router } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';

/**
 * TrackerButton component renders a stylized button with an icon and label.
 * Navigates to the specified external path when pressed using expo-router.
 * Designed for consistent use across tracker-related UI elements.
 */

type Button = {
    label: string
    icon: string
    link: ExternalPathString
}

export default function TrackerButton({ button }: { button: Button }) {
    return (
        <TouchableOpacity
            className='tracker-button'
            onPress={() => router.push(button.link)}
        >
            <Text className='tracker-icon'>{button.icon}</Text>
            <Text className='tracker-label'>{button.label}</Text>
        </TouchableOpacity>
    );
}
