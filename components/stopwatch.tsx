import { Entypo } from '@expo/vector-icons';
import { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * Stopwatch component that tracks elapsed time in seconds.
 * Users can start, stop, and reset the timer.
 * Elapsed time is formatted as hh:mm:ss and reported to parent via callback.
 */
export default function Stopwatch({
    time,
    onTimeUpdate,
    testID,
}: {
    time: number;
    onTimeUpdate?: (updater: number | ((time: number) => number)) => void;
    testID?: string;
}) {
    const [running, setRunning] = useState(false);
    const intervalRef = useRef<any>(null);

    const formatTime = (t: number) => t.toString().padStart(2, '0');

    // Start or stop the timer based on `running` state
    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                onTimeUpdate?.(prevTime => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [running, onTimeUpdate]);

     // Reset timer and stop running
    const reset = () => {
        setRunning(false);
        onTimeUpdate?.(0);
    };

    return (
        <View className='tracker-section' testID={testID}>
            <View className='tracker-section-label'>
                <Text className='tracker-section-label-text'>
                    <Entypo name="stopwatch" size={14}/> Stopwatch
                </Text>
            </View>
            <View className='items-center mb-10'>
                <View className='flex-row items-center'>
                    <View className='flex-row items-end'>
                        <Text className='stopwatch-clock'>
                            {formatTime(Math.floor(time / 3600))}
                        </Text>
                        <View className='items-center'>
                            <Text className='stopwatch-divider'>:</Text>
                            <Text className='stopwatch-mini'>h</Text>
                        </View>
                    </View>
                    <View className='flex-row items-end'>
                        <Text className='stopwatch-clock'>
                            {formatTime(Math.floor((time % 3600) / 60))}
                        </Text>
                        <View className='items-center'>
                            <Text className='stopwatch-divider'>:</Text>
                            <Text className='stopwatch-mini'>m</Text>
                        </View>
                    </View>
                    <View className='flex-row items-end'>
                        <Text className='stopwatch-clock'>
                            {formatTime(time % 60)}
                        </Text>
                        <View className='items-center'>
                            <Text className='stopwatch-divider'> </Text>
                            <Text className='stopwatch-mini'>s</Text>
                        </View>
                    </View>
                </View>
            </View>
            <View className='stopwatch-secondary'>
                { running ? (
                    <TouchableOpacity
                        className='stopwatch-button-stop dark:bg-[#f1efd2]'
                        onPress={() => setRunning(false)}
                        testID='sleep-stopwatch-stop'
                    >
                        <Text className='stopwatch-button-text'>Stop</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        className='stopwatch-button-start dark:bg-[#d2f1e0]'
                        onPress={() => setRunning(true)}
                        testID='sleep-stopwatch-start'
                    >
                        <Text className='stopwatch-button-text'>Start</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity
                    className='stopwatch-button-reset dark:bg-[#f1d2d2]'
                    onPress={reset}
                    testID='sleep-stopwatch-reset'
                >
                    <Text className='stopwatch-button-text'>Reset</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
