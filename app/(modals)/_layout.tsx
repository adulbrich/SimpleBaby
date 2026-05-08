import { router, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, TouchableOpacity, Text } from 'react-native';

export default function ModalsLayout() {

    const isAndroid = Platform.OS === 'android';

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
                        className={isAndroid ? 'modal-back-button' : 'p-2'}
                    >
                        <Text className='dark:color-[#fff] color:-[#000] font-bold'>
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
                <Stack.Screen
                    name='tos'
                    options={{
                        headerTitle: 'Terms of Service',
                    }}
                />
                <Stack.Screen
                    name='privacypolicy'
                    options={{
                        headerTitle: 'Privacy Policy',
                    }}
                />

            </Stack>
        </>
    );
}
