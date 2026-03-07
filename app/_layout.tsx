import "@/global.css";
import { AuthProvider } from "@/library/auth-provider";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import {
    configureReanimatedLogger,
    ReanimatedLogLevel,
} from "react-native-reanimated";

// RootLayout.tsx
// Root app layout wrapping authentication provider and main navigation stack — configures status bar and reanimated logging

configureReanimatedLogger({
    level: ReanimatedLogLevel.warn,
    strict: false,
});

export default function RootLayout() {
    return (
        <AuthProvider>
            <StatusBar style="auto" />
            <Stack
                screenOptions={{
                    navigationBarTranslucent: true,
                }}
            >
                 {/* Main app screens with headers hidden */}
                <Stack.Screen name="index" options={{ headerShown: false }} />
                <Stack.Screen name="(trackers)" options={{ headerShown: false }} />
                <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
                <Stack.Screen name="(logs)" options={{ headerShown: false }} />

                {/* Modal presentation screen */}
                <Stack.Screen
                    name="(modals)"
                    options={{
                        headerShown: false,
                        presentation: "modal",
                    }}
                />
                {/* Authentication flow screens with header hidden */}
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
            </Stack>
        </AuthProvider>
    );
}
