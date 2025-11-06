import { router, Stack } from 'expo-router'
import {
    Text,
    TouchableOpacity,
} from 'react-native'

export default function LogsLayout() {
    return (
        <Stack
            screenOptions={{
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => {
                            router.dismissTo('/(tabs)/trends')
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
                name='sleep-log'
                options={{
                    headerTitle: 'Sleep Log 🌙',
                }}
            />
        </Stack>
    )
}
