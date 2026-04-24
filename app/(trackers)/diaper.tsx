import {
	Text,
	View,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Keyboard,
	Alert,
	ScrollView,
} from "react-native";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import DiaperModule from "@/components/diaper-module";
import { useAuth } from "@/library/auth-provider";
import { saveLog } from "@/library/log-functions";
import { formatStringList } from "@/library/utils";

import stringLib from "../../assets/stringLibrary.json";

// Diaper.tsx
// Screen for logging diaper changes — includes selecting consistency, amount, change time, notes, and save logic

export default function Diaper() {
	const insets = useSafeAreaInsets();
	const [isTyping, setIsTyping] = useState(false);
	const [consistency, setConsistency] = useState("");
	const [amount, setAmount] = useState("");
	const [changeTime, setChangeTime] = useState(new Date());
	const [note, setNote] = useState("");
	const [reset, setReset] = useState<number>(0);
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
		const missingFields = [];
		if (!consistency) missingFields.push("consistency");
		if (!amount) missingFields.push("amount");

		if (missingFields.length > 0) {
			const formattedMissing = formatStringList(missingFields);

			const error = `Failed to save the Diaper log. You are missing the following fields: ${formattedMissing}.`;
			return { success: false, error };
		}

		return { success: true };
	};

	// Validate and handle the save action with alerts based on the result
	const handleSaveDiaperLog = async () => {
		if (isSaving) return;
		setIsSaving(true);

		const validInputs = checkInputs();
		if (!validInputs.success) {
			Alert.alert(stringLib.errors.trackerMissingInfo, validInputs.error);
			setIsSaving(false);
			return;
		}

		const result = await saveLog({
			tableName: "diaper_logs",
			fields: [{
				dbFieldName: "consistency",
				value: consistency,
				type: "string",
			}, {
				dbFieldName: "amount",
				value: amount,
				type: "string",
			}, {
				dbFieldName: "note",
				value: note,
				type: "string",
			}, {
				dbFieldName: "change_time",
				value: changeTime,
				type: "date",
			}],
		}, isGuest, "diaper");

		if (result.success) {
			router.dismissTo("/(tabs)");
			Alert.alert("Diaper log saved successfully!");
		} else {
			Alert.alert(`Failed to save diaper log: ${result.error}`);
		}
		setIsSaving(false);
	};

	// Handle the UI logic when resetting fields
	const handleResetFields = () => {
		setConsistency("");
		setAmount("");
		setChangeTime(new Date());
		setNote("");
		setReset((prev) => prev + 1);
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			{/*ScrollView Prevents items from flowing off page on small devices*/}
			<View
				className="main-container justify-between"
				style={{
					paddingBottom: insets.bottom,
				}}
			>
				<ScrollView>
					{/* Main form stack with diaper inputs and note */}
					<View
						className={`gap-6 transition-all duration-300 ${
							isTyping ? "-translate-y-[40%]" : "translate-y-0"
						}`}
					>
						<DiaperModule
							key={`diaper-module-${reset}`}
							onConsistencyUpdate={setConsistency}
							onAmountUpdate={setAmount}
							onTimeUpdate={setChangeTime}
							testID={"diaper-main-inputs"}
						/>
						{/* Note input section */}
						<View className='tracker-section'>
							<View className='tracker-section-label'>
								<Text className='tracker-section-label-text'>
									{stringLib.uiLabels.noteLabel}
								</Text>
							</View>
							<View className='ml-4 mr-4 mb-6'>
								<TextInput
									className='text-input-note'
									placeholder="i.e. really messy"
									multiline={true}
									maxLength={200}
									onFocus={() => setIsTyping(true)}
									onBlur={() => setIsTyping(false)}
									value={note}
									onChangeText={setNote}
									testID="diaper-note-entry"
								/>
							</View>
						</View>
						{/* Action buttons row */}
						<View className="flex-row gap-2 pb-5">
							<TouchableOpacity
								className="tracker-button-save"
								onPress={handleSaveDiaperLog}
								testID="diaper-save-log-button"
								disabled={isSaving}
							>
								<Text className="tracker-form-button-text">➕ Add to log</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className="tracker-button-reset"
								onPress={() => handleResetFields()}
								testID="diaper-reset-form-button"
							>
								<Text className="tracker-form-button-text">🗑️ Reset fields</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</View>
		</TouchableWithoutFeedback>
	);
}
