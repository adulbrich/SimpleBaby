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
import FeedingCategory, {
	FeedingCategoryList,
} from "@/components/feeding-category";
import { useAuth } from "@/library/auth-provider";
import { formatStringList, saveLog } from "@/library/log-functions";

import stringLib from "../../assets/stringLibrary.json";

// Feeding.tsx
// Screen for logging baby feeding sessions — includes category, item name, amount, feeding time, optional notes, and save logic

export default function Feeding() {
	const insets = useSafeAreaInsets();
	const [isTyping, setIsTyping] = useState(false);
	const [category, setCategory] = useState<FeedingCategoryList>("Liquid");
	const [itemName, setItemName] = useState("");
	const [amount, setAmount] = useState("");
	const [feedingTime, setFeedingTime] = useState(new Date());
	const [note, setNote] = useState("");
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
		if (!category) missingFields.push("category");
		if (!itemName.trim()) missingFields.push("item name");
		if (!amount.trim()) missingFields.push("amount");

		if (missingFields.length > 0) {
			const formattedMissing = formatStringList(missingFields);

			const error = `Failed to save the Feeding log. You are missing the following fields: ${formattedMissing}.`;
			return { success: false, error };
		}

		return { success: true };
	};

	// Validate input fields and trigger save action
	const handleSaveFeedingLog = async () => {
		if (isSaving) return;
		setIsSaving(true);

		const validInputs = checkInputs();
		if (!validInputs.success) {
			Alert.alert(stringLib.errors.trackerMissingInfo, validInputs.error);
		}

		const result = await saveLog({
			tableName: "feeding_logs",
			fields: [{
				dbFieldName: "category",
				value: category,
				type: "string",
			}, {
				dbFieldName: "item_name",
				value: itemName,
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
				dbFieldName: "feeding_time",
				value: feedingTime,
				type: "date",
			}],
		}, isGuest, "feeding");

		if (result.success) {
			router.replace("/(tabs)");
			Alert.alert("Feeding log saved successfully!");
		} else {
			Alert.alert(`Failed to save feeding log: ${result.error}`);
		}
		setIsSaving(false);
	};

	// Handle the UI logic when resetting fields
	const handleResetFields = () => {
		setCategory("Liquid");
		setItemName("");
		setAmount("");
		setFeedingTime(new Date());
		setNote("");
	};

	return (
		<TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
			{/*ScrollView Prevents items from flowing off page on small devices*/}
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
						{/* FeedingCategory component handles category/item/amount/time inputs */}
						<FeedingCategory
							category={category}
							itemName={itemName}
							amount={amount}
							feedingTime={feedingTime}
							onCategoryUpdate={setCategory}
							onItemNameUpdate={setItemName}
							onAmountUpdate={setAmount}
							onTimeUpdate={setFeedingTime}
							testID="feeding-data-entry"
						/>
						{/* Note input section */}
						<View className="bottom-5">
							<View
								className="items-start top-5 left-3 z-10"
								testID="feeding-note"
							>
								<Text className="bg-gray-200 p-3 rounded-xl font">
									{stringLib.uiLabels.noteLabel}
								</Text>
							</View>
							<View className="p-4 pt-9 bg-white rounded-xl z-0">
								<TextInput
									placeholderTextColor={"#aaa"}
									placeholder="i.e. does not like pureed carrots"
									multiline={true}
									maxLength={200}
									onFocus={() => setIsTyping(true)}
									onBlur={() => setIsTyping(false)}
									value={note}
									onChangeText={setNote}
									testID="feeding-note-entry"
								/>
							</View>
						</View>
						{/* Action buttons for saving and resetting form */}
						<View className="flex-row gap-2 pb-5">
							<TouchableOpacity
								className="rounded-full p-4 bg-red-100 grow"
								onPress={handleSaveFeedingLog}
								testID="feeding-save-log-button"
								disabled={isSaving}
							>
								<Text>➕ Add to log</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className="rounded-full p-4 bg-red-100 items-center"
								onPress={() => handleResetFields()}
								testID="feeding-reset-form-button"
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
