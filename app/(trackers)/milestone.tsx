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
import supabase from "@/library/supabase-client";
import { router } from "expo-router";
import { getActiveChildId } from "@/library/utils";
import DateTimePicker, {
	DateTimePickerAndroid,
	DateTimePickerEvent,
} from "@react-native-community/datetimepicker";
import MilestoneCategory, {
	MilestoneCategoryList,
} from "@/components/milestone-category";
import { encryptData } from "@/library/crypto";
import { useAuth } from "@/library/auth-provider";
import {
	insertRow,
	getActiveChildId as getLocalActiveChildId,
} from "@/library/local-store";

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

	const uploadPhoto = async (childId: string, uri: string) => {
		setUploadingPhoto(true);
		try {
			const {
				data: { user },
				error: userError,
			} = await supabase.auth.getUser();

			if (userError || !user) {
				throw new Error("Not authenticated");
			}

			const extension = uri.split(".").pop()?.toLowerCase() ?? "jpg";
			const path = `${user.id}/${childId}/${Date.now()}.${extension}`;

			const res = await fetch(uri);
			const arrayBuffer = await res.arrayBuffer();
			const bytes = new Uint8Array(arrayBuffer);

			if (bytes.length === 0) {
				throw new Error(
					"Selected photo is empty (0 bytes). Check the URI source.",
				);
			}

			const contentType =
				extension === "png"
					? "image/png"
					: extension === "webp"
						? "image/webp"
						: "image/jpeg";

			const { data, error } = await supabase.storage
				.from("milestone-photos")
				.upload(path, bytes, {
					contentType,
					upsert: false,
				});

			if (error) {
				throw error;
			}

			return data.path;
		} finally {
			setUploadingPhoto(false);
		}
	};

	/**
	 * Inserts a new milestone log into either the local or remote database.
	 * Converts milestoneTime to ISO string before sending.
	 */
	const saveMilestoneLog = async (
		childId: string,
		category: MilestoneCategoryList,
		name: string,
		milestoneTime: Date,
		photoPath: string | null,
		note: string,
	) => {
		const encryptedName = await encryptData(name);
		const encryptedNote = note ? await encryptData(note) : null;

		if (isGuest) {
			try {
				const success = await insertRow("milestone_logs", {
					child_id: childId,
					category,
					title: encryptedName,
					achieved_at: milestoneTime.toISOString(),
					photo_url: photoPath,
					note: encryptedNote,
				});
				return success
					? { success: true }
					: { success: false, error: "Failed to save milestone log locally." };
			} catch (error) {
				console.error("Error creating milestone log (guest):", error);
				return { success: false, error };
			}
		} else {
			const { data, error } = await supabase.from("milestone_logs").insert([
				{
					child_id: childId,
					category,
					title: encryptedName,
					achieved_at: milestoneTime.toISOString(),
					photo_url: photoPath,
					note: encryptedNote,
				},
			]);

			if (error) {
				console.error("Error creating milestone log:", error);
				return { success: false, error };
			}

			return { success: true, data };
		}
	};

	/**
	 * Gets the currently active child ID and attempts to create the milestone log for database entry.
	 * Returns success/error object for handling in the UI.
	 */
	const createMilestoneLog = async () => {
		let childId: string | null = null;
		let photoPath: string | null = null;

		if (isGuest) {
			childId = await getLocalActiveChildId();
			if (!childId) {
				Alert.alert("Error", "No active child selected (Guest Mode).");
				return { success: false, error: "No active child in guest mode" };
			}
			if (photoUri) photoPath = photoUri; // in guest mode: store the local URI directly
		} else {
			const result = await getActiveChildId();
			if (!result?.success || !result.childId) {
				Alert.alert(`Error: ${result?.error}`);
				return { success: false, error: result?.error };
			}
			childId = String(result.childId);
			if (photoUri) {
				try {
					photoPath = await uploadPhoto(String(childId), photoUri); // logged-in: upload to Supabase storage
				} catch (e) {
					Alert.alert("Photo upload failed", String(e));
					return { success: false, error: e };
				}
			}
		}

		return await saveMilestoneLog(
			String(childId),
			category,
			name,
			milestoneDate,
			photoPath,
			note,
		);
	};

	/**
	 * Validates inputs and attempts to save the milestone log.
	 * Navigates back to the main tab screen on success.
	 */
	const handleSaveMilestoneLog = async () => {
		if (name && milestoneDate) {
			const result = await createMilestoneLog();
			if (result.success) {
				router.replace("/(tabs)");
				Alert.alert("Milestone log saved successfully!");
			} else {
				Alert.alert(`Failed to save milestone log: ${result.error}`);
			}
		} else {
			const missingFields = [];
			if (!name) missingFields.push("name");
			if (!milestoneDate) missingFields.push("date");
			const formattedMissing =
				missingFields.length > 1
					? `${missingFields.slice(0, -1).join(", ")} and ${missingFields.slice(-1)}`
					: missingFields[0];
			Alert.alert(
				"Missing Information",
				`Failed to save the Milestone log. You are missing the following fields: ${formattedMissing}.`,
			);
		}
	};

	// Handle the UI logic when resetting fields
	const handleResetFields = () => {
		setCategory("Motor");
		setName("");
		setMilestoneDate(new Date());
		setPhotoUri(null);
		setPhotoName(null);
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
					></View>

					<MilestoneCategory
						category={category}
						onCategoryUpdate={setCategory}
						testID="milestone-category-modal"
					/>

					{/* Name and Description inputs */}
					<View className="stopwatch-primary">
						<View className="items-start bottom-5 left-3">
							<Text className="bg-gray-200 p-3 rounded-xl font">
								⚖️ Add Details
							</Text>
						</View>

						<View className="flex-col gap-4 mb-6">
							<View className="ml-4 mr-4">
								<Text className="feeding-module-label">Milestone Name</Text>
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
								<Text className="feeding-module-label">Date</Text>
								<View className="flex-row items-center bg-red-100 rounded-full gap-2">
									<TouchableOpacity
										className="rounded-full bg-red-50 p-4"
										onPress={showDatePickerModal}
										testID="milestone-date-button"
									>
										<Text>{showDatePicker ? "Close" : "Choose"} 📅</Text>
									</TouchableOpacity>
									<Text className="mr-4">{formatDate(milestoneDate)}</Text>
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
								<Text className="feeding-module-label">Milestone Photo</Text>
								<TouchableOpacity
									className="rounded-full p-4 bg-red-100 items-center"
									onPress={pickPhoto}
									disabled={uploadingPhoto}
									testID="milestone-photo-button"
								>
									<Text>{photoUri ? "📷 Change Image" : "📷 Add Image"}</Text>
								</TouchableOpacity>
							</View>
							{photoName ? (
								<Text className="text-sm text-gray-500 mt-2 text-center">
									{photoName}
								</Text>
							) : null}
						</View>
					</View>

					{/* Note input section */}
					<View className="bottom-5 pt-4">
						<View
							className="items-start top-5 left-3 z-10"
							testID="milestone-note"
						>
							<Text className="bg-gray-200 p-3 rounded-xl font">
								Add a note
							</Text>
						</View>
						<View className="p-4 pt-9 bg-white rounded-xl z-0">
							<TextInput
								placeholderTextColor={"#aaa"}
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
							className="rounded-full p-4 bg-red-100 grow"
							onPress={handleSaveMilestoneLog}
							testID="milestone-save-log-button"
						>
							<Text>➕ Add to log</Text>
						</TouchableOpacity>
						<TouchableOpacity
							className="rounded-full p-4 bg-red-100 items-center"
							onPress={handleResetFields}
							testID="milestone-reset-form-button"
						>
							<Text>🗑️ Reset fields</Text>
						</TouchableOpacity>
					</View>
				</ScrollView>
			</View>
		</TouchableWithoutFeedback>
	);
}
