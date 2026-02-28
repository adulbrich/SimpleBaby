import { router, Stack } from 'expo-router';
import { Text, TouchableOpacity } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

export default function LogsLayout() {

    //These const variables get the sound file and an AudioPlayer isntance to play it
    const buttonSound = require('../../assets/sounds/ui-back.mp3');
    const player = useAudioPlayer(buttonSound);

    return (
        <Stack
            screenOptions={{
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => {

                            //Resets the position of the sound effect to the beginning of the audio file and plays
                            player.seekTo(0);
                            player.play();
                            router.dismissTo('/(tabs)/trends');
                        }}
                        className='dark:bg-slate-700 bg-blue-200 p-2 rounded-xl border-[1px] border-blue-300 dark:border-slate-600 android:mr-4'
                    >
                        <Text className='dark:color-[#fff] font-bold'>
                            ⬅️ Back
                        </Text>
                    </TouchableOpacity>
                ),
            }}
        >
            <Stack.Screen
                name='sleep-logs'
                options={{
                    headerTitle: 'Sleep',
                }}
            />
            <Stack.Screen
                name='feeding-logs'
                options={{
                    headerTitle: 'Feeding',
                }}
            />
            <Stack.Screen
                name='nursing-logs'
                options={{
                    headerTitle: 'Nursing',
                }}
            />
            <Stack.Screen
                name='diaper-logs'
                options={{
                    headerTitle: 'Diapers',
                }}
            />
            <Stack.Screen
                name='milestone-logs'
                options={{
                    headerTitle: 'Milestones',
                }}
            />
            <Stack.Screen
                name='health-logs'
                options={{
                    headerTitle: 'Health',
                }}
            />
        </Stack>
    );
}
