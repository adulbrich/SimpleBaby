import HealthModule, { HealthCategory } from "@/components/health-module";
import supabase from "@/library/supabase-client";
import { getActiveChildId } from "@/library/utils";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Keyboard,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { encryptData } from "@/library/crypto";

// Define the shape of the health log data object with optional nested properties
interface HealthLog {
  child_id: string;
  category: HealthCategory;
  date: Date;
  growth?: {
    length: string;
    weight: string;
    head: string;
  };
  activity?: {
    type: string;
    duration: string;
  };
  meds?: {
    name: string;
    amount: string;
    timeTaken: Date;
  };
  note: string;
}

export default function Health() {
  const insets = useSafeAreaInsets();
  const [isTyping, setIsTyping] = useState(false);
  const [healthLog, setHealthLog] = useState<HealthLog>({
    child_id: "",
    category: "Growth",
    date: new Date(),
    note: "",
  });
  const [reset, setReset] = useState(0);

    // Create a new health log entry into the database using Supabase client
  const createHealthLog = async (log: any) => {
    const { data, error } = await supabase.from("health_logs").insert([log]);

    if (error) {
      console.error("Error creating health log:", error);
      return { success: false, error };
    }

    return { success: true, data };
  };

    // Validate input fields and save the health log entry
  const handleSaveHealthLog = async () => {
    if (!healthLog.category) {
      Alert.alert("Error", "Please provide a category");
      return;
    }

    if (healthLog.category === "Growth") {
      if (
        !healthLog.growth?.length &&
        !healthLog.growth?.weight &&
        !healthLog.growth?.head
      ) {
        Alert.alert("Error", "Please provide at least one growth measurement");
        return;
      }
    } else if (healthLog.category === "Activity") {
      if (!healthLog.activity?.type || !healthLog.activity?.duration) {
        Alert.alert("Error", "Please provide both activity type and duration");
        return;
      }
    } else if (healthLog.category === "Meds") {
      if (
        !healthLog.meds?.name ||
        !healthLog.meds?.amount ||
        !healthLog.meds?.timeTaken
      ) {
        Alert.alert(
          "Error",
          "Please provide medication name, amount, and time taken"
        );
        return;
      }
    }

    const { success, childId, error } = await getActiveChildId();

    if (!success) {
      Alert.alert("Error", `Failed to get active child: ${error}`);
      return;
    }


    // Prepare data shape for insertion matching DB schemas
    try {
      const encryptedLog = {
        child_id: childId,
        category: healthLog.category,
        date: healthLog.date,
        growth_length: healthLog.growth?.length
          ? await encryptData(healthLog.growth.length)
          : null,
        growth_weight: healthLog.growth?.weight
          ? await encryptData(healthLog.growth.weight)
          : null,
        growth_head: healthLog.growth?.head
          ? await encryptData(healthLog.growth.head)
          : null,
        activity_type: healthLog.activity?.type
          ? await encryptData(healthLog.activity.type)
          : null,
        activity_duration: healthLog.activity?.duration
          ? await encryptData(healthLog.activity.duration)
          : null,
        meds_name: healthLog.meds?.name
          ? await encryptData(healthLog.meds.name)
          : null,
        meds_amount: healthLog.meds?.amount
          ? await encryptData(healthLog.meds.amount)
          : null,
        meds_time_taken: healthLog.meds?.timeTaken || null,
        note: healthLog.note ? await encryptData(healthLog.note) : null,
      };

      const result = await createHealthLog(encryptedLog);

      if (result.success) {
        router.replace("/(tabs)");
        Alert.alert("Success", "Health log saved successfully!");
      } else {
        Alert.alert("Error", `Failed to save health log: ${result.error}`);
      }
    } catch (err) {
      console.error("❌ Encryption failed:", err);
      Alert.alert("Error", "Failed to encrypt and save health log.");
    }
  };

    // Update date in state when changed
  const handleDateUpdate = useCallback((date: Date) => {
    setHealthLog((prev) => ({
      ...prev,
      date,
    }));
  }, []);

   // Update category and reset nested fields based on selected category
  const handleCategoryUpdate = useCallback((category: HealthCategory) => {
    setHealthLog((prev) => ({
      ...prev,
      category,
      growth:
        category === "Growth"
          ? { length: "", weight: "", head: "" }
          : undefined,
      activity:
        category === "Activity" ? { type: "", duration: "" } : undefined,
      meds:
        category === "Meds"
          ? { name: "", amount: "", timeTaken: new Date() }
          : undefined,
    }));
  }, []);

// Update growth-related fields in state with partial updates
  const handleGrowthUpdate = useCallback((growth: {
    length?: string;
    weight?: string;
    head?: string;
  }) => {
    setHealthLog((prev) => ({
      ...prev,
      growth: {
        length:
          growth.length !== undefined
            ? growth.length
            : prev.growth
            ? prev.growth.length
            : "",
        weight:
          growth.weight !== undefined
            ? growth.weight
            : prev.growth
            ? prev.growth.weight
            : "",
        head:
          growth.head !== undefined
            ? growth.head
            : prev.growth
            ? prev.growth.head
            : "",
      },
    }));
  }, []);

 // Update activity-related fields in state with partial updates
  const handleActivityUpdate = useCallback((activity: {
    type?: string;
    duration?: string;
  }) => {
    setHealthLog((prev) => ({
      ...prev,
      activity: {
        type:
          activity.type !== undefined
            ? activity.type
            : prev.activity
            ? prev.activity.type
            : "",
        duration:
          activity.duration !== undefined
            ? activity.duration
            : prev.activity
            ? prev.activity.duration
            : "",
      },
    }));
  }, []);

  // Update medication-related fields in state with partial updates
  const handleMedsUpdate = useCallback((meds: {
    name?: string;
    amount?: string;
    timeTaken?: Date;
  }) => {
    setHealthLog((prev) => ({
      ...prev,
      meds: {
        name: prev.meds?.name || "",
        amount: prev.meds?.amount || "",
        timeTaken: prev.meds?.timeTaken || new Date(),
        ...meds,
      },
    }));
  }, []);

  // handle the reset logic for the health screen UI
  const handleResetFields = () => {
    setHealthLog({
      child_id: "",
      category: "Growth",      
      date: new Date(),
      growth: { length: "", weight: "", head: "" },
      activity: undefined,
      meds: undefined,
      note: "",
    });
    setReset(prev => prev + 1);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      {/*ScrollView Prevents items from flowing off page on small devices*/}

      <View
        className={`main-container justify-between transition-all ${
          isTyping ? "-translate-y-[40%]" : "translate-y-0"
        }`}
        style={{ paddingBottom: insets.bottom }}
      >
        <ScrollView>
          {/* Render the health input form module with update handlers */}
          <HealthModule
            key={`health-module-${reset}`}
            onDateUpdate={handleDateUpdate}
            onCategoryUpdate={handleCategoryUpdate}
            onGrowthUpdate={handleGrowthUpdate}
            onActivityUpdate={handleActivityUpdate}
            onMedsUpdate={handleMedsUpdate}
            testID="health-main-inputs"
          />
           {/* Multiline input for additional notes */}
          <View className="bottom-5 pt-5">
            <View className="items-start top-5 left-3 z-10">
              <Text className="bg-gray-200 p-3 rounded-xl font">
                Add a note
              </Text>
            </View>
            <View className="p-4 pt-9 bg-white rounded-xl z-0">
              <TextInput
                className=""
                placeholderTextColor={"#aaa"}
                placeholder={`i.e. ${
                  healthLog.category === "Growth"
                    ? "growth is steady"
                    : healthLog.category === "Activity"
                    ? "enjoyed tummy time"
                    : "took medicine without fuss"
                }`}
                multiline={true}
                maxLength={200}
                onFocus={() => setIsTyping(true)}
                onBlur={() => setIsTyping(false)}
                value={healthLog.note}
                onChangeText={(note) =>
                  setHealthLog((prev) => ({
                    ...prev,
                    note,
                  }))
                }
                testID="health-note-entry"
              />
            </View>
          
            {/* Action buttons to save or reset form */}
            <View className="flex-row gap-2">
              <TouchableOpacity
                className="rounded-full p-4 bg-red-100 grow"
                onPress={handleSaveHealthLog}
              >
                <Text>➕ Add to log</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="rounded-full p-4 bg-red-100 items-center"
                onPress={() => handleResetFields()}
              >
                <Text>🗑️ Reset fields</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
        {/* Action buttons to save or reset form */}
        <View className="flex-row gap-2">
          <TouchableOpacity
            className="rounded-full p-4 bg-red-100 grow"
            onPress={handleSaveHealthLog}
            testID="health-save-log-button"
          >
            <Text>➕ Add to log</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="rounded-full p-4 bg-red-100 items-center"
            onPress={() => handleResetFields()}
            testID="health-reset-form-button"
          >
            <Text>🗑️ Reset fields</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableWithoutFeedback>
  );
}
