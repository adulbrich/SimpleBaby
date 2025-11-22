import { ExternalPathString, router } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

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

const buttonSound = require('../assets/sounds/ui-pop.mp3')
const player = useAudioPlayer(buttonSound);

export default function TrackerButton({ button, testID }: { button: Button, testID?: string }) {
    return (


        
        <TouchableOpacity
            className='tracker-button'
            onPress={() => {
                router.push(button.link);
                player.seekTo(0);
                player.play();
            }}
            testID={testID}
        >
            <Text className='tracker-icon'>{button.icon}</Text>
            <Text className='tracker-label'>{button.label}</Text>
        </TouchableOpacity>
    );
}
