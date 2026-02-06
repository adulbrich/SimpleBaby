import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { Calendar } from "react-native-calendars";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { fetchLogsForDay, CalendarLog } from "@/library/calendar";
import { getActiveChildId } from '@/library/utils';
import { useAuth } from '@/library/auth-provider';

function toYMD(d: Date) {
    return format(d, "yyyy-MM-dd");
}

export default function CalendarModal() {
    const [selectedDate, setSelectedDate] = useState<Date>(new Date());
    const [logs, setLogs] = useState<CalendarLog[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { isGuest } = useAuth();

    const markedDates = useMemo(() => {
        const ymd = toYMD(selectedDate);
        return {
            [ymd]: { selected: true }
        };
    }, [selectedDate]);

    const loadDay = useCallback(async (date: Date) => {
        setLoading(true);
        setError(null);

        try {
            const result = await getActiveChildId();
            if (!result?.success || !result.childId) {
                throw new Error(result?.error ? String(result.error) : "Failed to get active child ID");
            }
            const childId = String(result.childId);
            const items = await fetchLogsForDay(childId, date);
            setLogs(items);
        } catch (e: any) {
            setError(e?.message ?? "Failed to load logs.");
            setLogs([]);
        } finally {
            setLoading(false);
        }

    }, []);

    useEffect(() => {
        loadDay(selectedDate);
    }, [loadDay, selectedDate]);

    if (isGuest) {
            return (
                <>
                    <View className='flex-1 bg-gray-50 p-4'>
                        <Text className="text-base font-bold mt-1">⚠️ This feature is not supported in Guest Mode.</Text>
                        <Text className="text-base mt-1">Please create an account or sign in to access this feature.</Text>
                    </View>
                </>
            );
        }
    
    return (
        <>
            <View className='flex-1 bg-gray-50 p-4'>
                <Calendar
                    markedDates={markedDates}
                    onDayPress={(day) => {
                        const d = new Date(day.dateString + "T00:00:00");
                        setSelectedDate(d);
                        loadDay(d);
                    }}
                />

                <Text className="text-xl font-bold mt-4 mb-2">
                    {format(selectedDate, "MMMM d, yyyy")}
                </Text>

                {loading ? (<ActivityIndicator size="large"/>)
                : error ? (<Text className="text-red-600">{error}</Text>)
                : logs.length === 0 ? (<Text className="text-gray-600 pb-5">No logs found for this day.</Text>)
                : (
                    <FlatList
                        data={logs}
                        keyExtractor={(item) => `${item.type}-${item.id}`}
                        renderItem={({ item }) => (
                        <View className="bg-white rounded-xl p-4 mb-3 shadow">
                            <Text className="text-xs text-gray-500">
                            {format(new Date(item.at), "h:mm a")}
                            </Text>

                            <Text className="text-base font-bold mt-1">{item.title}</Text>

                            {!!item.details && (
                            <Text className="text-sm text-gray-700 mt-1">{item.details}</Text>
                            )}
                        </View>
                        )}
                    ></FlatList>
                )
            }
            </View>
        </>
    );
}
