import DateTimePicker, {
  DateTimePickerAndroid,
  DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import React, { useEffect, useState } from "react";
import {
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/**
 * HealthModule component lets users select a health category (Growth, Activity, Meds, Vaccine, or Other),
 * enter relevant details, and pick date and time for entries.
 * Supports iOS inline spinner pickers and Android native dialogs for date and time.
 * Calls provided callbacks when date, category, or input data changes.
 */

export type HealthCategory = "Growth" | "Activity" | "Meds" | "Vaccine" | "Other";

export interface HealthModuleProps {
  onDateUpdate?: (date: Date) => void;
  onCategoryUpdate?: (category: HealthCategory) => void;
  onGrowthUpdate?: (growth: GrowthData) => void;
  onActivityUpdate?: (activity: ActivityData) => void;
  onMedsUpdate?: (meds: MedsData) => void;
  onVaccineUpdate?: (vaccine: VaccineData) => void;
  onOtherUpdate?: (other: OtherData) => void;
  testID?: string;
}

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
  timeTaken: Date;
}

export interface VaccineData {
  name: string;
  location: string;
  date: Date;
}

export interface OtherData {
  name: string;
  description: string;
  date: Date;
}

export default function HealthModule({
  onDateUpdate,
  onCategoryUpdate,
  onGrowthUpdate,
  onActivityUpdate,
  onMedsUpdate,
  onVaccineUpdate,
  onOtherUpdate,
  testID,
}: HealthModuleProps) {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedCategory, setSelectedCategory] =
    useState<HealthCategory>("Growth");
  const [growth, setGrowth] = useState<GrowthData>({
    length: "",
    weight: "",
    head: "",
  });
  const [activity, setActivity] = useState<ActivityData>({
    type: "",
    duration: "",
  });
  const [meds, setMeds] = useState<MedsData>({
    name: "",
    amount: "",
    timeTaken: new Date(),
  });
  const [vaccine, setVaccine] = useState<VaccineData>({
    name: "",
    location: "",
    date: new Date()
  });
  const [other, setOther] = useState<OtherData>({
    name: "",
    description: "",
    date: new Date()
  });

  const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
    if (event.type === "set" && selectedDate) {
      setSelectedDate(selectedDate);
    }
    setShowDatePicker(false);
  };

  const onChangeTime = (event: DateTimePickerEvent, selectedTime?: Date) => {
    if (event.type === "set" && selectedTime) {
      setMeds((prevMeds) => ({ ...prevMeds, timeTaken: selectedTime }));
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
        value: selectedDate,
        onChange: (event, selectedDate) => {
          if (selectedDate) {
            setSelectedDate(selectedDate);
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
        value: meds.timeTaken,
        onChange: (event, selectedTime) => {
          if (selectedTime) {
            setMeds((prevMeds) => ({
              ...prevMeds,
              timeTaken: selectedTime,
            }));
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

  const handleCategoryPress = (category: HealthCategory) => {
    setSelectedCategory(category);
  };

  useEffect(() => {
    if (onDateUpdate) {
      onDateUpdate(selectedDate);
    }
  }, [selectedDate, onDateUpdate]);

  useEffect(() => {
    if (onCategoryUpdate) {
      onCategoryUpdate(selectedCategory);
    }
  }, [selectedCategory, onCategoryUpdate]);

  useEffect(() => {
    if (onGrowthUpdate && selectedCategory === "Growth") {
      onGrowthUpdate(growth);
    }
  }, [growth, selectedCategory, onGrowthUpdate]);

  useEffect(() => {
    if (onActivityUpdate && selectedCategory === "Activity") {
      onActivityUpdate(activity);
    }
  }, [activity, selectedCategory, onActivityUpdate]);

  useEffect(() => {
    if (onMedsUpdate && selectedCategory === "Meds") {
      onMedsUpdate(meds);
    }
  }, [meds, selectedCategory, onMedsUpdate]);

  useEffect(() => {
    if (onVaccineUpdate && selectedCategory === "Vaccine") {
      onVaccineUpdate(vaccine);
    }
  }, [vaccine, selectedCategory, onVaccineUpdate]);

    useEffect(() => {
    if (onOtherUpdate && selectedCategory === "Other") {
      onOtherUpdate(other);
    }
  }, [other, selectedCategory, onOtherUpdate]);

  return (
    <View className="flex-col gap-6" testID={testID}>
      <View className="stopwatch-primary">
        <View className="items-start bottom-5 left-3">
          <Text className="bg-gray-200 p-3 rounded-xl font">
            🩺 Choose Type
          </Text>
        </View>
        <View className="flex-row flex-wrap gap-4 justify-center mb-6">
          {["Growth", "Activity", "Meds", "Vaccine", "Other"].map((category) => (
            <TouchableOpacity
              key={category}
              className={`feeding-category-button h-[15%] ${
                selectedCategory === category
                  ? "feeding-category-button-active"
                  : ""
              }`}
              onPress={() => handleCategoryPress(category as HealthCategory)}
              testID={`health-category-${category.toLowerCase()}-button`}
            >
              <Text className="scale-100 text-2xl">
                {category === "Growth"
                  ? "📏"
                  : category === "Activity"
                  ? "🏃‍♂️"
                  : category === "Vaccine"
                  ? "💉"
                  : category === "Other"
                  ? "❓"
                  : "💊"}
              </Text>
              <Text className="feeding-category-text">{category}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <View className="stopwatch-primary">
        <View className="items-start bottom-5 left-3">
          <Text className="bg-gray-200 p-3 rounded-xl font">
            ✒️ Add Details
          </Text>
        </View>
        <View className="flex-col gap-4 mb-6">
          {selectedCategory === "Growth" && (
            <>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Length</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., 20 in"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={growth.length}
                  onChangeText={(text: string) =>
                    setGrowth((prevGrowth) => ({
                      ...prevGrowth,
                      length: text,
                    }))
                  }
                  testID="health-growth-length"
                />
              </View>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Weight</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., 8 lb"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={growth.weight}
                  onChangeText={(text: string) =>
                    setGrowth((prevGrowth) => ({
                      ...prevGrowth,
                      weight: text,
                    }))
                  }
                  testID="health-growth-weight"
                />
              </View>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Head</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., 14 in"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={growth.head}
                  onChangeText={(text: string) =>
                    setGrowth((prevGrowth) => ({
                      ...prevGrowth,
                      head: text,
                    }))
                  }
                  testID="health-growth-head"
                />
              </View>
            </>
          )}
          {selectedCategory === "Activity" && (
            <>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Type</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., tummy time"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={activity.type}
                  onChangeText={(text: string) =>
                    setActivity((prevActivity) => ({
                      ...prevActivity,
                      type: text,
                    }))
                  }
                  testID="health-activity-type"
                />
              </View>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Duration</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., 30 min"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={activity.duration}
                  onChangeText={(text: string) =>
                    setActivity((prevActivity) => ({
                      ...prevActivity,
                      duration: text,
                    }))
                  }
                  testID="health-activity-duration"
                />
              </View>
            </>
          )}
          {selectedCategory === "Meds" && (
            <>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Name</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., ibuprofen"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={meds.name}
                  onChangeText={(text: string) =>
                    setMeds((prevMeds) => ({
                      ...prevMeds,
                      name: text,
                    }))
                  }
                  testID="health-meds-name"
                />
              </View>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Amount</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., 1 capsule"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={meds.amount}
                  onChangeText={(text: string) =>
                    setMeds((prevMeds) => ({
                      ...prevMeds,
                      amount: text,
                    }))
                  }
                  testID="health-meds-amount"
                />
              </View>
              <View className="ml-4 mr-4 flex-row items-center justify-between">
                <Text className="feeding-module-label">Time Taken</Text>
                <View className="flex-row items-center bg-red-100 rounded-full gap-2">
                  <TouchableOpacity
                    className="rounded-full bg-red-50 p-4"
                    onPress={showTimePickerModal}
                    testID="health-meds-time"
                  >
                    <Text>Choose ⏰</Text>
                  </TouchableOpacity>
                  <Text className="mr-4">{formatTime(meds.timeTaken)}</Text>
                </View>
              </View>
              {showTimePicker && Platform.OS === "ios" && (
                <View className="items-center">
                  <DateTimePicker
                    testID="timeTimePicker"
                    value={meds.timeTaken}
                    mode="time"
                    is24Hour={false}
                    onChange={onChangeTime}
                    display="spinner"
                  />
                </View>
              )}
            </>
          )}
          {selectedCategory === "Vaccine" && (
            <>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Name</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., COVID-19 Vaccine"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={vaccine.name}
                  onChangeText={(text: string) =>
                    setVaccine((prevName) => ({
                      ...prevName,
                      name: text,
                    }))
                  }
                />
              </View>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Location</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., Kaiser Permanente NW"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={vaccine.location}
                  onChangeText={(text: string) =>
                    setVaccine((prevLocation) => ({
                      ...prevLocation,
                      location: text,
                    }))
                  }
                />
              </View>
            </>
          )}
          {selectedCategory === "Other" && (
            <>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Name</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., Elbow Surgery"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={other.name}
                  onChangeText={(text: string) =>
                    setOther((prevName) => ({
                      ...prevName,
                      name: text,
                    }))
                  }
                />
              </View>
              <View className="ml-4 mr-4">
                <Text className="feeding-module-label">Description</Text>
                <TextInput
                  className="text-input-internal"
                  placeholder="e.g., went to doctor's office for procedure"
                  autoCapitalize="none"
                  keyboardType="default"
                  value={other.description}
                  onChangeText={(text: string) =>
                    setOther((prevDescription) => ({
                      ...prevDescription,
                      description: text,
                    }))
                  }
                />
              </View>
            </>
          )}
          <View className="ml-4 mr-4 flex-row items-center justify-between">
            <Text className="feeding-module-label">Date</Text>
            <View className="flex-row items-center bg-red-100 rounded-full gap-2">
              <TouchableOpacity
                className="rounded-full bg-red-50 p-4"
                onPress={showDatePickerModal}
                testID="health-date-button"
              >
                <Text>{showDatePicker ? "Close" : "Choose"} 📅</Text>
              </TouchableOpacity>
              <Text className="mr-4">{formatDate(selectedDate)}</Text>
            </View>
          </View>
          {showDatePicker && Platform.OS === "ios" && (
            <View className="items-center">
              <DateTimePicker
                testID="dateTimePicker"
                value={selectedDate}
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
