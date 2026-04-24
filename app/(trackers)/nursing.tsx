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
import NursingStopwatch from "@/components/nursing-stopwatch";
import { useAuth } from "@/library/auth-provider";
import { saveLog } from "@/library/log-functions";
import stringLib from "@/assets/stringLibrary.json";
import NoteEntry from "@/components/note-entry";

// nursing.tsx
// Screen for logging breastfeeding sessions — includes stopwatch, volume input, and notes

export default function Nursing() {
	const insets = useSafeAreaInsets();
	const [isTyping, setIsTyping] = useState(false);
	const [leftDuration, setLeftDuration] = useState("00:00:00");
	const [rightDuration, setRightDuration] = useState("00:00:00");
	const [leftAmount, setLeftAmount] = useState("");
	const [rightAmount, setRightAmount] = useState("");
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
		if (
			leftDuration === "00:00:00" &&
			rightDuration === "00:00:00" &&
			leftAmount.trim() === "" &&
			rightAmount.trim() === ""
		) {
			const error = `Failed to save the Nursing log. You are missing the following fields: left or right duration or left or right amount.`;
			return { success: false, error };
		}

		return { success: true };
	};

	// Validate input, then call save
	const handleSaveNursingLog = async () => {
		if (isSaving) return;
		setIsSaving(true);

		const validInputs = checkInputs();
		if (!validInputs.success) {
			Alert.alert(stringLib.errors.trackerMissingInfo, validInputs.error);
			setIsSaving(false);
			return;
		}

		const result = await saveLog({
			tableName: "nursing_logs",
			fields: [{
				dbFieldName: "left_duration",
				value: leftDuration === "00:00:00" ? "" : leftDuration,
				type: "string",
			}, {
				dbFieldName: "right_duration",
				value: rightDuration === "00:00:00" ? "" : rightDuration,
				type: "string",
			}, {
				dbFieldName: "left_amount",
				value: leftAmount.trim(),
				type: "string",
			}, {
				dbFieldName: "right_amount",
				value: rightAmount.trim(),
				type: "string",
			}, {
				dbFieldName: "note",
				value: note,
				type: "string",
			}, {
				dbFieldName: "logged_at",
				value: new Date(),
				type: "date",
			}],
		}, isGuest, "nursing");

		if (result.success) {
			router.dismissTo("/(tabs)");
			Alert.alert("Nursing log saved successfully!");
		} else {
			Alert.alert(`Failed to save nursing log: ${result.error}`);
		}
		setIsSaving(false);
	};

	// Handle the UI logic when resetting fields
	const handleResetFields = () => {
		setLeftDuration("00:00:00");
		setRightDuration("00:00:00");
		setLeftAmount("");
		setRightAmount("");
		setNote("");
		setReset((prev) => prev + 1);
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			<View
				className="main-container justify-between"
				style={{ paddingBottom: insets.bottom }}
			>
				<ScrollView>
					<View
						className={`gap-6 transition-all duration-300 ${
							isTyping ? "-translate-y-[40%]" : "translate-y-0"
						}`}
					>
						{/* Stopwatch component controls left/right timer states */}
						<NursingStopwatch
							key={`nursing-stopwatch-${reset}`}
							onTimeUpdateLeft={setLeftDuration}
							onTimeUpdateRight={setRightDuration}
							testID={"nursing-stopwatch"}
						/>
						{/* Volume Input Section */}
						<View className="tracker-section">
							<View className="tracker-section-label">
								<Text className="tracker-section-label-text">
									⚖️ Add Volume
								</Text>
							</View>
							<View className="flex-row mb-6">
								{/* Left Amount Input */}
								<View className="ml-4 mr-2 grow">
									<Text className="tracker-input-label">Left Amount</Text>
									<TextInput
										className="text-input-internal"
										placeholder="i.e. 6 oz"
										autoCapitalize="none"
										keyboardType="default"
										value={leftAmount}
										onChangeText={setLeftAmount}
										onFocus={() => setIsTyping(true)}
										onBlur={() => setIsTyping(false)}
										testID="nursing-left-amount"
									/>
								</View>
								{/* Right Amount Input */}
								<View className="ml-2 mr-4 grow">
									<Text className="tracker-input-label">Right Amount</Text>
									<TextInput
										className="text-input-internal"
										placeholder="i.e. 12 oz"
										autoCapitalize="none"
										keyboardType="default"
										value={rightAmount}
										onChangeText={setRightAmount}
										onFocus={() => setIsTyping(true)}
										onBlur={() => setIsTyping(false)}
										testID="nursing-right-amount"
									/>
								</View>
							</View>
						</View>
						{/* Note Input Section */}
						<NoteEntry
							note={note}
							setNote={setNote}
							setIsTyping={setIsTyping}
							placeholder="e.g. difficulties with latching or signs of poor latching"
							testID="nursing-note-entry"
						/>
						{/* Bottom Buttons */}
						<View className="flex-row gap-2 pb-5">
							<TouchableOpacity
								className="tracker-button-save"
								onPress={handleSaveNursingLog}
								disabled={isSaving}
								testID="nursing-save-log-button"
							>
								<Text className="tracker-form-button-text">➕ Add to log</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className="tracker-button-reset"
								onPress={() => handleResetFields()}
								testID="nursing-reset-form-button"
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
