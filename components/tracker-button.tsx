import React from 'react';
import { ExternalPathString, router } from 'expo-router';
import { TouchableOpacity, Text } from 'react-native';
import { useAudioPlayer } from 'expo-audio';

type Button = {
    label: string
    icon: React.ReactNode
    link: ExternalPathString
}


export default function TrackerButton({ button, testID }: { button: Button, testID?: string }) {

    //These const variables get the sound file and an AudioPlayer isntance to play it
    const buttonSound = require('../assets/sounds/ui-pop.mp3');
    const player = useAudioPlayer(buttonSound);

    return (

        <TouchableOpacity
            className='tracker-button'
            onPress={() => {

                //Resets the position of the sound effect to the beginning of the audio file and plays
                player.seekTo(0);
                player.play();

                //Navigates to the page using router
                router.push(button.link);
            }}
            testID={testID}
        >
            {button.icon}
            <Text className='tracker-label'>{button.label}</Text>
        </TouchableOpacity>
    );
}
