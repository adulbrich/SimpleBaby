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
import Stopwatch from "@/components/stopwatch";
import ManualEntry from "@/components/manual-entry-sleep";
import { router } from "expo-router";
import { useAuth } from "@/library/auth-provider";
import { saveLog } from "@/library/log-functions";

import stringLib from "../../assets/stringLibrary.json";

// Sleep.tsx
// Screen for logging baby sleep sessions — includes stopwatch, manual entry, notes, and save logic
export default function Sleep() {
	const insets = useSafeAreaInsets();
	const [isTyping, setIsTyping] = useState(false);
	const [startTime, setStartTime] = useState<Date>(new Date());
	const [endTime, setEndTime] = useState<Date>(new Date());
	const [stopwatchTime, setStopwatchTime] = useState("00:00:00");
	const [note, setNote] = useState("");
	const [reset, setReset] = useState<number>(0);
	const [isSaving, setIsSaving] = useState(false);
	const { isGuest } = useAuth();

	// Update manual entry times
	const handleDatesUpdate = (start: Date, end: Date) => {
		setStartTime(start);
		setEndTime(end);
	};

	/**
	 * Gets start/stop times and duration to submit. Assumes that stopwatch or manual times are valid
	 */
	const getFinalTimes = () => {
		let finalStartTime: Date, finalEndTime: Date;

		if (stopwatchTime && stopwatchTime !== "00:00:00") {
			const [hours, minutes, seconds] = stopwatchTime.split(":").map(Number);
			const durationMs = (hours * 3600 + minutes * 60 + seconds) * 1000;

			finalEndTime = new Date();
			finalStartTime = new Date(finalEndTime.getTime() - durationMs);
		} else {
			finalStartTime = startTime;
			finalEndTime = endTime;
		}

		// compute duration (same format as your createSleepLog)
		const durationMs = finalEndTime.getTime() - finalStartTime.getTime();
		const durationSec = Math.floor(durationMs / 1000);
		const hours = Math.floor(durationSec / 3600);
		const minutes = Math.floor((durationSec % 3600) / 60);
		const seconds = durationSec % 60;

		const duration = `${hours.toString().padStart(2, "0")}:${minutes
			.toString()
			.padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

		return { start: finalStartTime, end: finalEndTime, duration };
	};

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
			!(stopwatchTime && stopwatchTime !== "00:00:00") &&
			!(startTime && endTime)
		) {
			const error = `Failed to save the Sleep log. Please provide either a stopwatch time or manual valid start and end times.`;
			return { success: false, error };
		}

		return { success: true };
	};

	// Handle UI logic for saving a sleep entry depending on method
	const handleSaveSleepLog = async () => {
		if (isSaving) return;
		setIsSaving(true);

		const validInputs = checkInputs();
		if (!validInputs.success) {
			Alert.alert(stringLib.errors.trackerMissingInfo, validInputs.error);
		}

		const times = getFinalTimes();
		const result = await saveLog({
			tableName: "sleep_logs",
			fields: [{
				dbFieldName: "start_time",
				value: times.start,
				type: "date",
			}, {
				dbFieldName: "end_time",
				value: times.end,
				type: "date",
			}, {
				dbFieldName: "duration",
				value: times.duration,
				type: "unencrypted",
			}, {
				dbFieldName: "note",
				value: note,
				type: "string",
			}],
		}, isGuest, "sleep");

		if (result.success) {
			router.replace("/(tabs)");
			Alert.alert("Sleep log saved successfully!");
		} else {
			Alert.alert(`Failed to save sleep log: ${result.error}`);
		}
		setIsSaving(false);
	};

	// Handle the UI logic when resetting fields
	const handleResetFields = () => {
		setStartTime(new Date());
		setEndTime(new Date());
		setStopwatchTime("00:00:00");
		setNote("");
		setReset((prev) => prev + 1);
	};

	return (
		// Dismiss keyboard when touching outside inputs
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			{/*ScrollView Prevents items from flowing off page on small devices*/}
			<View
				className="main-container justify-between"
				style={{ paddingBottom: insets.bottom }}
			>
				{/* Main form stack with stopwatch and manual entry */}
				<ScrollView>
					<View
						className={`gap-6 transition-all duration-300 ${
							isTyping ? "-translate-y-[40%]" : "translate-y-0"
						}`}
					>
						{/* Stopwatch component for tracking session duration */}
						<Stopwatch
							key={`stopwatch-${reset}`}
							onTimeUpdate={setStopwatchTime}
							testID="sleep-stopwatch"
						/>

						{/* Manual start/end time picker */}
						<ManualEntry
							key={`manual-entry-${reset}`}
							onDatesUpdate={handleDatesUpdate}
							testID="sleep-manual-time-entry"
						/>

						{/* Note input section */}
						<View className="bottom-5">
							<View className="items-start top-5 left-3 z-10">
								<Text className="bg-gray-200 p-3 rounded-xl font">
									{stringLib.uiLabels.noteLabel}
								</Text>
							</View>
							<View className="p-4 pt-9 bg-white rounded-xl z-0">
								<TextInput
									className=""
									placeholderTextColor={"#aaa"}
									placeholder="i.e. baby was squirming often"
									multiline={true}
									maxLength={200}
									onFocus={() => setIsTyping(true)}
									onBlur={() => setIsTyping(false)}
									value={note}
									onChangeText={setNote}
									testID="sleep-note-entry"
								/>
							</View>
						</View>
						{/* Action buttons */}
						<View className="flex-row gap-2 pb-5">
							<TouchableOpacity
								className="rounded-full p-4 bg-red-100 grow"
								onPress={handleSaveSleepLog}
								disabled={isSaving}
								testID="sleep-save-log-button"
							>
								<Text>➕ Add to log</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className="rounded-full p-4 bg-red-100 items-center"
								onPress={() => handleResetFields()}
								testID="sleep-reset-form-button"
							>
								<Text>🗑️ Reset fields</Text>
							</TouchableOpacity>
						</View>
					</View>
				</ScrollView>
			</View>
		</TouchableWithoutFeedback>
	);
}
