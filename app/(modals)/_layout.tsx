import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, TouchableOpacity, Text } from 'react-native';

export default function ModalsLayout() {
    return (
        <>
            <StatusBar style={Platform.OS === 'android' ? 'dark' : 'auto'} />
            <Stack screenOptions={{
                presentation: 'modal',
                headerLeft: () => (
                    <TouchableOpacity
                        onPress={() => {
                            router.back();
                        }}
                        className='dark:bg-slate-700 bg-blue-200 p-2 rounded-xl border-[1px] border-blue-300 dark:border-slate-600 android:mr-4'
                    >
                        <Text className='dark:color-[#fff] font-bold'>
                            ⬅️ Back
                        </Text>
                    </TouchableOpacity>
                ),
             }}>
                <Stack.Screen
                    name='calendar'
                    options={{
                        presentation: 'modal',
                        headerTitle: "Calendar"
                    }}
                />
                <Stack.Screen
                    name='profile'
                    options={{
                        headerTitle: 'Profile',
                    }}
                />
                <Stack.Screen
                    name='active-child'
                    options={{
                        headerTitle: 'Active Child',
                    }}
                />
            </Stack>
        </>
    );
}
