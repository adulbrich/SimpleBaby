import DateTimePicker, {
    DateTimePickerAndroid,
    DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useState } from "react";
import {
    Platform,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import CategoryModule from "@/components/category-module";

/**
 * HealthModule component lets users select a health category (Growth, Activity, Meds, Vaccine, or Other),
 * enter relevant details, and pick date and time for entries.
 * Supports iOS inline spinner pickers and Android native dialogs for date and time.
 * Calls provided callbacks when date, category, or input data changes.
 */

export type HealthCategory = "Growth" | "Activity" | "Meds" | "Vaccine" | "Other";

export interface HealthModuleProps {
    healthFields: HealthFields;
    onDateUpdate?: (date: Date) => void;
    onCategoryUpdate?: (category: HealthCategory) => void;
    onGrowthUpdate?: (growth: GrowthData) => void;
    onActivityUpdate?: (activity: ActivityData) => void;
    onMedsUpdate?: (meds: MedsData) => void;
    onVaccineUpdate?: (vaccine: VaccineData) => void;
    onOtherUpdate?: (other: OtherData) => void;
    testID?: string;
}

// Define the shape of the health log data object with varying nested properties
export type HealthFields = {
	category: HealthCategory;
	date: Date;
} & ({
	category: "Growth";
	growth: GrowthData;
} | {
	category: "Activity";
	activity: ActivityData;
} | {
	category: "Meds";
	meds: MedsData;
} | {
	category: "Vaccine";
	vaccine: VaccineData;
} | {
	category: "Other";
	other: OtherData;
});

export interface GrowthData {
    length: string;
    weight: string;
    head: string;
}

export interface ActivityData {
    type: string;
    duration: string;
}

export interface MedsData {
    name: string;
    amount: string;
    time_taken: Date;
}

export interface VaccineData {
    name: string;
    location: string;
}

export interface OtherData {
    name: string;
    description: string;
}

export default function HealthModule({
    healthFields,
    onDateUpdate,
    onCategoryUpdate,
    onGrowthUpdate,
    onActivityUpdate,
    onMedsUpdate,
    onVaccineUpdate,
    onOtherUpdate,
    testID,
}: HealthModuleProps) {
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showTimePicker, setShowTimePicker] = useState(false);

    const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
        if (event.type === "set" && selectedDate) {
            onDateUpdate?.(selectedDate);
        }
        setShowDatePicker(false);
    };

    const onChangeMedsTime = (event: DateTimePickerEvent, selectedTime?: Date) => {
        if (event.type === "set" && selectedTime) {
            onMedsUpdate?.({ ...(healthFields as { meds: MedsData }).meds, time_taken: selectedTime });
        }
        setShowTimePicker(false);
    };

    const showDatePickerModal = () => {
        if (showDatePicker === true) {
            setShowDatePicker(false);
            return;
        }

        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value: healthFields.date,
                onChange: (event, selectedDate) => {
                    if (selectedDate) {
                        onDateUpdate?.(selectedDate);
                    }
                },
                mode: "date",
            });
        } else {
            setShowDatePicker(true);
        }
    };

    const showTimePickerModal = () => {
        if (Platform.OS === "android") {
            DateTimePickerAndroid.open({
                value: (healthFields as { meds: MedsData }).meds.time_taken,
                onChange: (event, selectedTime) => {
                    if (selectedTime) {
                        onMedsUpdate?.({
                            ...(healthFields as { meds: MedsData }).meds,
                            time_taken: selectedTime,
                        });
                    }
                },
                mode: "time",
            });
        } else {
            setShowTimePicker(true);
        }
    };

    const formatDate = (date: Date) => {
        return date.toLocaleDateString();
    };

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    return (
        <View className="flex-col gap-6" testID={testID}>

            <CategoryModule
                title="🩺 Choose Type"
                selectedCategory={healthFields.category}
                categoryList={[
                    { label: "Growth", icon: "📏" },
                    { label: "Activity", icon: "🏃‍♂️" },
                    { label: "Meds", icon: "💊" },
                    { label: "Vaccine", icon: "💉" },
                    { label: "Other", icon: "❓" }
                ]}
                onCategoryUpdate={onCategoryUpdate}
                testID="health-category-module"
            />

            <View className="tracker-section">
                <View className="tracker-section-label">
                    <Text className="tracker-section-label-text">
                        ✒️ Add Details
                    </Text>
                </View>
                <View className="flex-col gap-4 mb-6">
                    {healthFields.category === "Growth" && (
                        <>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Length</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., 20 in"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.growth.length}
                                    onChangeText={(text: string) =>
                                        onGrowthUpdate?.({
                                            ...healthFields.growth,
                                            length: text,
                                        })
                                    }
                                    testID="health-growth-length"
                                />
                            </View>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Weight</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., 8 lb"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.growth.weight}
                                    onChangeText={(text: string) =>
                                        onGrowthUpdate?.({
                                            ...healthFields.growth,
                                            weight: text,
                                        })
                                    }
                                    testID="health-growth-weight"
                                />
                            </View>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Head</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., 14 in"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.growth.head}
                                    onChangeText={(text: string) =>
                                        onGrowthUpdate?.({
                                            ...healthFields.growth,
                                            head: text,
                                        })
                                    }
                                    testID="health-growth-head"
                                />
                            </View>
                        </>
                    )}
                    {healthFields.category === "Activity" && (
                        <>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Type</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., tummy time"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.activity.type}
                                    onChangeText={(text: string) =>
                                        onActivityUpdate?.({
                                            ...healthFields.activity,
                                            type: text,
                                        })
                                    }
                                    testID="health-activity-type"
                                />
                            </View>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Duration</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., 30 min"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.activity.duration}
                                    onChangeText={(text: string) =>
                                        onActivityUpdate?.({
                                            ...healthFields.activity,
                                            duration: text,
                                        })
                                    }
                                    testID="health-activity-duration"
                                />
                            </View>
                        </>
                    )}
                    {healthFields.category === "Meds" && (
                        <>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Name</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., ibuprofen"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.meds.name}
                                    onChangeText={(text: string) =>
                                        onMedsUpdate?.({
                                            ...healthFields.meds,
                                            name: text,
                                        })
                                    }
                                    testID="health-meds-name"
                                />
                            </View>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Amount</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., 1 capsule"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.meds.amount}
                                    onChangeText={(text: string) =>
                                        onMedsUpdate?.({
                                            ...healthFields.meds,
                                            amount: text,
                                        })
                                    }
                                    testID="health-meds-amount"
                                />
                            </View>
                            <View className="ml-4 mr-4 flex-row items-center justify-between">
                                <Text className="tracker-input-label">Time Taken</Text>
                                <View className="flex-row items-center bg-red-100 rounded-full gap-2">
                                    <TouchableOpacity
                                        className="rounded-full bg-red-50 p-4"
                                        onPress={showTimePickerModal}
                                        testID="health-meds-time"
                                    >
                                        <Text>Choose ⏰</Text>
                                    </TouchableOpacity>
                                    <Text className="mr-4">{formatTime(healthFields.meds.time_taken)}</Text>
                                </View>
                            </View>
                            {showTimePicker && Platform.OS === "ios" && (
                                <View className="items-center">
                                    <DateTimePicker
                                        testID="timeTimePicker"
                                        value={healthFields.meds.time_taken}
                                        mode="time"
                                        is24Hour={false}
                                        onChange={onChangeMedsTime}
                                        display="spinner"
                                    />
                                </View>
                            )}
                        </>
                    )}
                    {healthFields.category === "Vaccine" && (
                        <>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Name</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., COVID-19 Vaccine"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.vaccine.name}
                                    onChangeText={(text: string) =>
                                        onVaccineUpdate?.({
                                            ...healthFields.vaccine,
                                            name: text,
                                        })
                                    }
                                    testID="health-vaccine-name"
                                />
                            </View>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Location</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., Kaiser Permanente NW"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.vaccine.location}
                                    onChangeText={(text: string) =>
                                        onVaccineUpdate?.({
                                            ...healthFields.vaccine,
                                            location: text,
                                        })
                                    }
                                    testID="health-vaccine-location"
                                />
                            </View>
                        </>
                    )}
                    {healthFields.category === "Other" && (
                        <>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Name</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., Elbow Surgery"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.other.name}
                                    onChangeText={(text: string) =>
                                        onOtherUpdate?.({
                                            ...healthFields.other,
                                            name: text,
                                        })
                                    }
                                    testID="health-other-name"
                                />
                            </View>
                            <View className="ml-4 mr-4">
                                <Text className="tracker-input-label">Description</Text>
                                <TextInput
                                    className="text-input-internal"
                                    placeholder="e.g., went to doctor's office for procedure"
                                    autoCapitalize="none"
                                    keyboardType="default"
                                    value={healthFields.other.description}
                                    onChangeText={(text: string) =>
                                        onOtherUpdate?.({
                                            ...healthFields.other,
                                            description: text,
                                        })
                                    }
                                    testID="health-other-description"
                                />
                            </View>
                        </>
                    )}
                    <View className="ml-4 mr-4 flex-row items-center justify-between">
                        <Text className="tracker-input-label">Date</Text>
                        <View className="tracker-input-button">
                            <TouchableOpacity
                                className="tracker-input-subbutton"
                                onPress={showDatePickerModal}
                                testID="health-date-button"
                            >
                                <Text className="tracker-input-text">{showDatePicker ? "Close" : "Choose"} 📅</Text>
                            </TouchableOpacity>
                            <Text className="tracker-input-text mr-4">{formatDate(healthFields.date)}</Text>
                        </View>
                    </View>
                    {showDatePicker && Platform.OS === "ios" && (
                        <View className="items-center">
                            <DateTimePicker
                                testID="dateTimePicker"
                                value={healthFields.date}
                                mode="date"
                                onChange={onChangeDate}
                                display="spinner"
                            />
                        </View>
                    )}
                </View>
            </View>
        </View>
    );
}
