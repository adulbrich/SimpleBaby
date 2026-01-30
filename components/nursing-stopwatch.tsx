import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';

/**
 * A double side nursing stopwatch that tracks elapsed time separately for the left and right sides. 
 * Users can toggle between sides and control the timers independently.
 * Time updates are passed to parent via callbacks.
 */

export default function NursingStopwatch({
    onTimeUpdateLeft,
    onTimeUpdateRight,
    testID,
}: {
    onTimeUpdateLeft: any,
    onTimeUpdateRight: any,
    testID?: string,
}) {
    const [leftTime, setLeftTime] = useState(0);
    const [rightTime, setRightTime] = useState(0);
    const [leftRunning, setLeftRunning] = useState(false);
    const [rightRunning, setRightRunning] = useState(false);
    const [activeSide, setActiveSide] = useState('left');
    const leftIntervalRef = useRef<any>(null);
    const rightIntervalRef = useRef<any>(null);

    const formatTime = (t: number) => t.toString().padStart(2, '0');
    const formatElapsedTime = useCallback((t: number) => {
        const h = Math.floor(t / 3600);
        const m = Math.floor((t % 3600) / 60);
        const s = t % 60;
        return `${formatTime(h)}:${formatTime(m)}:${formatTime(s)}`;
    }, []);

     // Start/stop the left timer
    useEffect(() => {
        if (leftRunning) {
            leftIntervalRef.current = setInterval(() => {
                setLeftTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(leftIntervalRef.current);
        }
        return () => clearInterval(leftIntervalRef.current);
    }, [leftRunning]);

    // Start/stop the right timer
    useEffect(() => {
        if (rightRunning) {
            rightIntervalRef.current = setInterval(() => {
                setRightTime((prevTime) => prevTime + 1);
            }, 1000);
        } else {
            clearInterval(rightIntervalRef.current);
        }
        return () => clearInterval(rightIntervalRef.current);
    }, [rightRunning]);

    useEffect(() => {
        onTimeUpdateLeft?.(formatElapsedTime(leftTime));
    }, [leftTime, onTimeUpdateLeft, formatElapsedTime]);

    useEffect(() => {
        onTimeUpdateRight?.(formatElapsedTime(rightTime));
    }, [rightTime, onTimeUpdateRight, formatElapsedTime]);

    // Resets the currently active side
    const reset = () => {
        if (activeSide === 'left') {
            setLeftTime(0);
            setLeftRunning(false);
            onTimeUpdateLeft?.('00:00:00');
        } else {
            setRightTime(0);
            setRightRunning(false);
            onTimeUpdateRight?.('00:00:00');
        }
    };

    const toggleRunning = (start: boolean) => {
        if (activeSide === 'left') {
            setLeftRunning(start);
        } else {
            setRightRunning(start);
        }
    };

    // Render the elapsed time for the active side
    const activeTime = activeSide === 'left' ? leftTime : rightTime;

    return (
        <View className='stopwatch-primary' testID={testID} >
            <View className='items-start bottom-5 left-3'>
                <Text className='bg-gray-200 p-3 rounded-xl font'>
                    ⏱️ Nursing Stopwatch
                </Text>
            </View>
            <View className='flex-row justify-center mb-6'>
                <TouchableOpacity
                    className={`${
                        activeSide === 'left'
                            ? 'nursing-side-button-active'
                            : 'nursing-side-button'
                    } rounded-l-full`}
                    onPress={() => setActiveSide('left')}
                    testID='nursing-stopwatch-left'
                >
                    <Text className='nursing-side-text'>Left</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className={`${
                        activeSide === 'right'
                            ? 'nursing-side-button-active'
                            : 'nursing-side-button'
                    } rounded-r-full`}
                    onPress={() => setActiveSide('right')}
                    testID='nursing-stopwatch-right'
                >
                    <Text className='nursing-side-text'>Right</Text>
                </TouchableOpacity>
            </View>
            <View className='items-center mb-10'>
                <View className='flex-row items-center'>
                    <View className='flex-row items-end'>
                        <Text className='stopwatch-clock'>
                            {formatTime(Math.floor(activeTime / 3600))}
                        </Text>
                        <View className='items-center'>
                            <Text className='stopwatch-divider'>:</Text>
                            <Text className='stopwatch-mini'>h</Text>
                        </View>
                    </View>
                    <View className='flex-row items-end'>
                        <Text className='stopwatch-clock'>
                            {formatTime(Math.floor((activeTime % 3600) / 60))}
                        </Text>
                        <View className='items-center'>
                            <Text className='stopwatch-divider'>:</Text>
                            <Text className='stopwatch-mini'>m</Text>
                        </View>
                    </View>
                    <View className='flex-row items-end'>
                        <Text className='stopwatch-clock'>
                            {formatTime(activeTime % 60)}
                        </Text>
                        <View className='items-center'>
                            <Text className='stopwatch-divider'> </Text>
                            <Text className='stopwatch-mini'>s</Text>
                        </View>
                    </View>
                </View>
            </View>
            <View className='stopwatch-secondary'>
                <TouchableOpacity
                    className='stopwatch-button dark:bg-[#d2f1e0]'
                    onPress={() => toggleRunning(true)}
                    testID='nursing-stopwatch-start'
                >
                    <Text className='stopwatch-button-text'>Start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className='stopwatch-button dark:bg-[#f1efd2]'
                    onPress={() => toggleRunning(false)}
                    testID='nursing-stopwatch-stop'
                >
                    <Text className='stopwatch-button-text'>Stop</Text>
                </TouchableOpacity>
                <TouchableOpacity
                    className='stopwatch-button dark:bg-[#f1d2d2]'
                    onPress={reset}
                    testID='nursing-stopwatch-reset'
                >
                    <Text className='stopwatch-button-text'>Reset</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}
