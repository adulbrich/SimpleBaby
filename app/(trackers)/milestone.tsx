import {
	Text,
	View,
	TextInput,
	TouchableOpacity,
	TouchableWithoutFeedback,
	Keyboard,
	Alert,
	ScrollView,
	Platform,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { useState } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import DateTimePicker, {
	DateTimePickerAndroid,
	DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import CategoryModule from "@/components/category-module";
import { useAuth } from "@/library/auth-provider";
import { field, saveLog } from "@/library/log-functions";
import { formatStringList } from "@/library/utils";

import stringLib from "../../assets/stringLibrary.json";

type MilestoneCategoryList = 'Motor' | 'Language' | 'Social' | 'Cognitive' | 'Other';

export default function Milestone() {
	const insets = useSafeAreaInsets();
	const [showDatePicker, setShowDatePicker] = useState(false);
	const [isTyping, setIsTyping] = useState(false);
	const [category, setCategory] = useState<MilestoneCategoryList>("Motor");
	const [name, setName] = useState("");
	const [milestoneDate, setMilestoneDate] = useState(new Date());
	const [photoUri, setPhotoUri] = useState<string | null>(null);
	const [photoName, setPhotoName] = useState<string | null>(null);
	const [uploadingPhoto, setUploadingPhoto] = useState(false);
	const [note, setNote] = useState("");
	const [isSaving, setIsSaving] = useState(false);
	const { isGuest } = useAuth();

	const showDatePickerModal = () => {
		if (showDatePicker === true) {
			setShowDatePicker(false);
			return;
		}

		if (Platform.OS === "android") {
			DateTimePickerAndroid.open({
				value: milestoneDate,
				onChange: (event, selectedDate) => {
					if (selectedDate) {
						setMilestoneDate(selectedDate);
					}
				},
				mode: "date",
			});
		} else {
			setShowDatePicker(true);
		}
	};

	const onChangeDate = (event: DateTimePickerEvent, selectedDate?: Date) => {
		if (event.type === "set" && selectedDate) {
			setMilestoneDate(selectedDate);
		}
		setShowDatePicker(false);
	};

	const formatDate = (date: Date) => {
		return date.toLocaleDateString();
	};

	const pickPhoto = async () => {
		const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
		if (status !== "granted") {
			Alert.alert(
				"Permission needed",
				"Please allow photo library access to attach a milestone photo.",
			);
			return;
		}

		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ["images"],
			allowsEditing: Platform.OS === "ios" ? true : false,
			quality: 0.85,
		});

		if (!result.canceled) {
			const asset = result.assets[0];
			setPhotoUri(asset.uri);

			if (asset.fileName) {
				setPhotoName(asset.fileName);
			} else {
				const derivedName =
					asset.uri.split("/").pop() ?? "An image has been selected.";
				setPhotoName(derivedName);
			}
		}
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
		const missingFields = [];
		if (!name.trim()) missingFields.push("name");
		if (!milestoneDate) missingFields.push("date");

		if (missingFields.length > 0) {
			const formattedMissing = formatStringList(missingFields);

			const error = `Failed to save the Milestone log. You are missing the following fields: ${formattedMissing}.`;
			return { success: false, error };
		}

		return { success: true };
	};

	/**
	 * Validates inputs and attempts to save the milestone log.
	 * Navigates back to the main tab screen on success.
	 */
	const handleSaveMilestoneLog = async () => {
		if (isSaving) return;
		setIsSaving(true);

		const validInputs = checkInputs();
		if (!validInputs.success) {
			Alert.alert(stringLib.errors.trackerMissingInfo, validInputs.error);
			setIsSaving(false);
			return;
		}

		const result = await saveLog({
			tableName: "milestone_logs",
			fields: [{
				dbFieldName: "category",
				value: category,
				type: "unencrypted",
			}, {
				dbFieldName: "title",
				value: name,
				type: "string",
			}, {
				dbFieldName: "note",
				value: note,
				type: "string",
			}, {
				dbFieldName: "achieved_at",
				value: milestoneDate,
				type: "date",
			}].concat( photoUri ? [{  // include the photo only if the user added one
				dbFieldName: "photo_url",
				value: photoUri,
				type: "photo",
			}] : []) as field[],
		}, isGuest, "milestone", setUploadingPhoto);

		if (result.success) {
			router.dismissTo("/(tabs)");
			Alert.alert("Milestone log saved successfully!");
		} else {
			Alert.alert(`Failed to save milestone log: ${result.error}`);
		}
		setIsSaving(false);
	};

    // Handle the UI logic when resetting fields
    const handleResetFields = () => {
        setCategory('Motor');
        setName("");
        setMilestoneDate(new Date());
        setPhotoUri(null);
        setPhotoName(null);
        setNote("");
    };

	// Show a confirmation alert when attempting to remove a photo
	const handleRemovePhoto = () => {
		Alert.alert(
			"Confirm", 
			"Are you sure you want to remove this photo?",
			[
				{ text: "Confirm", onPress: () => {
					setPhotoName(null);
					setPhotoUri(null); }
				},
				{ text: "Cancel" }
			]
		);
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

						<CategoryModule
							title="🌐 Choose Category"
							selectedCategory={category}
							categoryList={[
								{ label: "Motor", icon: "🏃" },
								{ label: "Language", icon: "🗣️" },
								{ label: "Social", icon: "🧍‍♂️" },
								{ label: "Cognitive", icon: "🧠" },
								{ label: "Other", icon: "❓" }
							]}
							onCategoryUpdate={setCategory}
							testID="milestone-category-modal"
						/>

						{/* Name and Description inputs */}
						<View className="tracker-section">
							<View className="tracker-section-label">
								<Text className="tracker-section-label-text">
									⚖️ Add Details
								</Text>
							</View>

							<View className="flex-col gap-4 mb-6">
								<View className="ml-4 mr-4">
									<Text className="tracker-input-label">Milestone Name</Text>
									<TextInput
										className="text-input-internal"
										placeholder="e.g., First Steps"
										autoCapitalize="none"
										keyboardType="default"
										value={name}
										onChangeText={setName}
										testID="milestone-item-name"
									/>
								</View>

								<View className="ml-4 mr-4 flex-row items-center justify-between">
									<Text className="tracker-input-label">Date</Text>
									<View className="tracker-input-button">
										<TouchableOpacity
											className="tracker-input-subbutton"
											onPress={showDatePickerModal}
											testID="milestone-date-button"
										>
											<Text className="tracker-input-text">{showDatePicker ? "Close" : "Choose"} 📅</Text>
										</TouchableOpacity>
										<Text className="tracker-input-text mr-4">{formatDate(milestoneDate)}</Text>
									</View>
								</View>

								{showDatePicker && Platform.OS === "ios" && (
									<View className="items-center">
										<DateTimePicker
											testID="dateTimePicker"
											value={milestoneDate}
											mode="date"
											onChange={onChangeDate}
											display="spinner"
										/>
									</View>
								)}

								<View className="ml-4 mr-4 flex-row items-center justify-between">
									<Text className="tracker-input-label">Milestone Photo</Text>
									<TouchableOpacity
										className="tracker-input-button"
										onPress={pickPhoto}
										disabled={uploadingPhoto}
										testID='milestone-photo-button'
									>
										<Text className="tracker-input-text m-4">{photoUri ? "📷 Change Image" : "📷 Add Image"}</Text>
									</TouchableOpacity>
								</View>
								{(photoName || photoUri) && (
									<View className="flex flex-col" accessible>
										<Text className="photo-indicator mt-2">
											({photoName})
										</Text>
										<TouchableOpacity
											onPress={handleRemovePhoto}
											testID="remove-milestone-photo-button"
										>
											<Text className="photo-indicator underline">Remove Photo</Text>
										</TouchableOpacity>
									</View>
								)}
							</View>
						</View>

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
									placeholder="e.g., took first steps from the table"
									multiline={true}
									maxLength={200}
									onFocus={() => setIsTyping(true)}
									onBlur={() => setIsTyping(false)}
									value={note}
									onChangeText={setNote}
									testID="milestone-note-entry"
								/>
							</View>
						</View>

						<View className="flex-row gap-2">
							<TouchableOpacity
								className="tracker-button-save"
								onPress={handleSaveMilestoneLog}
								disabled={isSaving}
								testID="milestone-save-log-button"
							>
								<Text className="tracker-form-button-text">➕ Add to log</Text>
							</TouchableOpacity>
							<TouchableOpacity
								className="tracker-button-reset"
								onPress={handleResetFields}
								testID="milestone-reset-form-button"
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
