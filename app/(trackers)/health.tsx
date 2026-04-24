import HealthModule, {
	HealthCategory,
	GrowthData,
	ActivityData,
	MedsData,
	VaccineData,
	OtherData,
} from "@/components/health-module";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
	Alert,
	Keyboard,
	ScrollView,
	Text,
	TouchableOpacity,
	TouchableWithoutFeedback,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/library/auth-provider";
import { field, saveLog } from "@/library/log-functions";
import { formatStringList } from "@/library/utils";
import stringLib from "@/assets/stringLibrary.json";
import NoteEntry from "@/components/note-entry";

// Define the shape of the health log data object with varying nested properties
type HealthLog = {
	child_id: string;
	category: HealthCategory;
	date: Date;
	note: string;
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

export default function Health() {
	const insets = useSafeAreaInsets();
	const [isTyping, setIsTyping] = useState(false);
	const [healthLog, setHealthLog] = useState<HealthLog>({
		child_id: "",
		category: "Growth",
		growth: { length: "", weight: "", head: "" },
		date: new Date(),
		note: "",
	});
	const [reset, setReset] = useState(0);
	const [isSaving, setIsSaving] = useState(false);
	const { isGuest } = useAuth();

	/**
	 * Validates form inputs
	 */
	const checkInputs = (): {
		success: true
	} | {
		success: false;
		error: string
	} => {
		if (!healthLog.category) {
			return { success: false, error: "Please provide a category" };
		}

		const missingFields = [];
		if (healthLog.category === "Growth") {
			if (!healthLog.growth?.length?.trim()) missingFields.push("length");
			if (!healthLog.growth?.weight?.trim()) missingFields.push("weight");
			if (!healthLog.growth?.head?.trim()) missingFields.push("head");
		} else if (healthLog.category === "Activity") {
			if (!healthLog.activity?.type?.trim()) missingFields.push("type");
			if (!healthLog.activity?.duration?.trim()) missingFields.push("duration");
		} else if (healthLog.category === "Meds") {
			if (!healthLog.meds?.name?.trim()) missingFields.push("name");
			if (!healthLog.meds?.amount?.trim()) missingFields.push("amount");
			if (!healthLog.meds?.time_taken) missingFields.push("time taken");
		} else if (healthLog.category === "Vaccine") {
			if (!healthLog.vaccine?.name?.trim()) missingFields.push("vaccine name");
		} else if (healthLog.category === "Other") {
			if (!healthLog.other?.name?.trim()) missingFields.push("health event name");
		}

		if (missingFields.length > 0) {
			const formattedMissing = formatStringList(missingFields);

			const categoryName =
				healthLog.category === "Growth" ? "Growth" :
				healthLog.category === "Activity" ? "Activity" :
				healthLog.category === "Meds" ? "Medicine" :
				healthLog.category === "Vaccine" ? "Vaccine" :
				"'Other'";

			const error = `Failed to save the ${categoryName} Health log. You are missing the following fields: ${formattedMissing}.`;
			return { success: false, error };
		}

		return { success: true };
	};

	/**
	 * Handles UI submit action for saving the health log.
	 */
	const handleSaveHealthLog = async () => {
		if (isSaving) return;
		setIsSaving(true);

		const validInputs = checkInputs();
		if (!validInputs.success) {
			Alert.alert(stringLib.errors.trackerMissingInfo, validInputs.error);
			setIsSaving(false);
			return;
		}

		const logFields =
			healthLog.category === "Growth" ? healthLog.growth :
			healthLog.category === "Activity" ? healthLog.activity :
			healthLog.category === "Meds" ? healthLog.meds :
			healthLog.category === "Vaccine" ? healthLog.vaccine :
			healthLog.category === "Other" ? healthLog.other : {};

		const result = await saveLog({
			tableName: "health_logs",
			fields: [{
				dbFieldName: "category",
				value: healthLog.category,
				type: "unencrypted",
			}, {
				dbFieldName: "date",
				value: healthLog.date,
				type: "date",
			}, {
				dbFieldName: "note",
				value: healthLog.note,
				type: "string",
			},
			...Object.entries(logFields).map(([key, value]): field => (
				value instanceof Date ? {
					dbFieldName: `${healthLog.category.toLowerCase()}_${key}`,
					value: value,
					type: "date",
				} : {
					dbFieldName: `${healthLog.category.toLowerCase()}_${key}`,
					value: value as string,
					type: "string",
				}
			))],
		}, isGuest, "health");

		if (result.success) {
			router.dismissTo("/(tabs)");
			Alert.alert("Success", "Health log saved successfully!");
		} else if (result.error) {
			const errorMessage = String(result.error);
			if (errorMessage.startsWith("Failed to ")) {
				Alert.alert("Error", errorMessage);
			} else {
				Alert.alert("Error", `Failed to save health log: ${errorMessage}`);
			}
		}
		setIsSaving(false);
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
					? { name: "", amount: "", time_taken: new Date() }
					: undefined,
			vaccine: category === "Vaccine" ? { name: "", location: "" } : undefined,
			other: category === "Other" ? { name: "", description: "" } : undefined,
		} as HealthLog));
	}, []);

	// Update growth-related fields in state with partial updates
	const handleGrowthUpdate = useCallback(
		(growth: { length: string; weight: string; head: string }) => {
			setHealthLog((prev) => ({
				...prev,
				growth,
			}));
		},
		[],
	);

	// Update activity-related fields in state with partial updates
	const handleActivityUpdate = useCallback(
		(activity: ActivityData) => {
			setHealthLog((prev) => ({
				...prev,
				activity,
			}));
		},
		[],
	);

	// Update medication-related fields in state with partial updates
	const handleMedsUpdate = useCallback(
		(meds: MedsData) => {
			setHealthLog((prev: any) => ({
				...prev,
				meds,
			}));
		},
		[],
	);

	const handleVaccineUpdate = useCallback(
		(vaccine: VaccineData) => {
			setHealthLog((prev) => ({
				...prev,
				vaccine,
			}));
		},
		[],
	);

	const handleOtherUpdate = useCallback(
		(other: OtherData) => {
			setHealthLog((prev) => ({
				...prev,
				other,
			}));
		},
		[],
	);

	// handle the reset logic for the health screen UI
	const handleResetFields = () => {
		setHealthLog({
			child_id: "",
			category: "Growth",
			date: new Date(),
			growth: { length: "", weight: "", head: "" },
			note: "",
		});
		setReset((prev) => prev + 1);
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			{/*ScrollView Prevents items from flowing off page on small devices*/}
			<ScrollView>
				<View
					className={`main-container justify-between gap-6 transition-all duration-300 transition-all ${
						isTyping ? "-translate-y-[40%]" : "translate-y-0"
					}`}
					style={{ paddingBottom: insets.bottom }}
				>
					{/* Render the health input form module with update handlers */}
					<HealthModule
						key={`health-module-${reset}`}
						onDateUpdate={handleDateUpdate}
						onCategoryUpdate={handleCategoryUpdate}
						onGrowthUpdate={handleGrowthUpdate}
						onActivityUpdate={handleActivityUpdate}
						onMedsUpdate={handleMedsUpdate}
						onVaccineUpdate={handleVaccineUpdate}
						onOtherUpdate={handleOtherUpdate}
						testID="health-main-inputs"
					/>
					{/* Multiline input for additional notes */}
					<NoteEntry
						note={healthLog.note}
						setNote={(note) =>
							setHealthLog((prev) => ({
								...prev,
								note,
							}))
						}
						setIsTyping={setIsTyping}
						placeholder={`e.g. ${
							healthLog.category === "Growth" ? "growth is steady" :
							healthLog.category === "Activity" ? "enjoyed tummy time" :
							healthLog.category === "Meds" ? "took medicine without fuss" :
							healthLog.category === "Vaccine" ? "was fussier for a day" :
							"realignment surgery for fracture"
						}`}
						testID="health-note-entry"
					/>

					{/* Action buttons to save or reset form */}
					<View className="flex-row gap-2 pb-5 pt-3">
						<TouchableOpacity
							className="tracker-button-save"
							onPress={handleSaveHealthLog}
							disabled={isSaving}
							testID="health-save-log-button"
						>
							<Text className="tracker-form-button-text">➕ Add to log</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className="tracker-button-reset"
							onPress={() => handleResetFields()}
							testID="health-reset-form-button"
						>
							<Text className="tracker-form-button-text">🗑️ Reset fields</Text>
						</TouchableOpacity>
					</View>
				</View>
			</ScrollView>
		</TouchableWithoutFeedback>
	);
}
