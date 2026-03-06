import { useState } from "react";
import {
    KeyboardAvoidingView,
    Modal,
	Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";
import { Dropdown } from 'react-native-element-dropdown';
import { format } from "date-fns";
import DateTimePicker, {
	DateTimePickerEvent,
} from "@react-native-community/datetimepicker";


type editFieldText = {
    title: string;
    type: "text";
    value: string | null;
};

type editFieldCategory = {
    title: string;
    type: "category";
    categories: string[];
    value: string | null;
};

type editFieldDateTime = {
    title: string;
    type: "date" | "time";
    value: Date;
};

type editFieldImage = {
    title: string;
    type: "image";
    value: string | null;
};

type editField =
    | editFieldText
    | editFieldCategory
    | editFieldDateTime
    | editFieldImage;


export default function EditLogPopup({
    popupVisible,
    hidePopup,
    title,
    editingLog,
    setLog,
    handleSubmit,
    testID,
} : {
    popupVisible: boolean;
    hidePopup: () => void;
    title: string;
    editingLog: Record<string, editField> | null;
    setLog: (updater: (prev: any) => any) => void;
    handleSubmit: () => void;
    testID?: string;
}) {

    const [showDatePicker, setShowDatePicker] = useState(false);
    const [datePickerField, setDatePickerField] = useState("");
    const [datePickerData, setDatePickerData] = useState<editFieldDateTime|null>(null);

    // renderCategoryInput - dropdown of specific categories that the user can choose from
    const renderCategoryInput = (fieldKey: string, fieldInfo: editFieldCategory) => (
        <View className="border border-gray-300 rounded-xl px-3 py-2 mb-3">
            <Dropdown
                value={fieldInfo.value}
                data={
                    !fieldInfo.categories ? []
                    : fieldInfo.categories.map((category) => ({ item: category }))
                }
                labelField={ "item" }
                valueField={ "item" }
                onChange={({ item }) =>
                    setLog((prev) => 
                        prev ? { ...prev, [fieldKey]: item } : prev,
                    )
                }
            />
        </View>
    );
    
    // renderTextInput - open text field for the user to type into
    const renderTextInput = (fieldKey: string, fieldInfo: editFieldText) => (
        <TextInput
            className="border border-gray-300 rounded-xl px-3 py-2 mb-3"
            value={fieldInfo.value ? fieldInfo.value : ""}
            onChangeText={(text) =>
                setLog((prev) => 
					prev ? { ...prev, [fieldKey]: text } : prev,
                )
            }
        />
    );
    
    // renderTextInput - open text field for the user to type into
    const renderDateInput = (fieldKey: string, fieldInfo: editFieldDateTime) => (
        <View className="mb-3">
            <TouchableOpacity
                className="border border-gray-300 rounded-xl px-3 py-3"
                onPress={() => {
                    setShowDatePicker(true);
                    setDatePickerField(fieldKey);
                    setDatePickerData(fieldInfo);
                }}
            >
                <Text>{format(fieldInfo.value, fieldInfo.type === "date" ? "MMM dd, yyyy" : "hh:mm a")}</Text>
            </TouchableOpacity>

            {showDatePicker && datePickerData && (
                <DateTimePicker
                    value={new Date(datePickerData.value)}
                    mode={datePickerData.type}
                    display={Platform.OS === "ios" ? "spinner" : "default"}
                    onChange={(event: DateTimePickerEvent, selected?: Date) => {
                            if (selected && event.type !== "dismissed") {
                                setLog((prev) => 
                                    prev ? { ...prev, [datePickerField]: selected } : prev,
                                );
                            }
                            setShowDatePicker(false);
                    }}
                />
            )}

            {Platform.OS === "ios" && showDatePicker && (
                <View className="mt-2 items-end">
                    <TouchableOpacity
                        className="bg-gray-200 rounded-full px-4 py-2"
                        onPress={() => setShowDatePicker(false)}
                    >
                        <Text>Done</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
    
    // renderTextInput - open text field for the user to type into
    const renderImageInput = (fieldKey: string, fieldInfo: editFieldImage) => (
        <Text className="text-xs text-gray-400 mt-1 mb-1">
            Photos cannot be edited/updated yet in this menu. This feature
            will be added in a later release. For now, please create a new
            log.
        </Text>
    );

    const renderInput = (fieldKey: string, fieldInfo: editField) => (
        <View key={fieldKey}>
            <Text className="text-sm text-gray-500 mb-1">{fieldInfo.title}</Text>
            {
                fieldInfo.type === "category" ? (
                    renderCategoryInput(fieldKey, fieldInfo)
                ) : fieldInfo.type === "text" ? (
                    renderTextInput(fieldKey, fieldInfo)
                ) : fieldInfo.type === "date" || fieldInfo.type === "time" ? (
                    renderDateInput(fieldKey, fieldInfo)
                ) : fieldInfo.type === "image" ? (
                    renderImageInput(fieldKey, fieldInfo)
                ) : undefined
            }
        </View>
    );


    return (
        <Modal
            visible={popupVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={hidePopup}
            testID={testID}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={{
                        flexGrow: 1,
                        justifyContent: "center",
                        alignItems: "center",
                        padding: 16,
                        backgroundColor: "#00000099",
                    }}
                >
                    <View className="bg-white w-full rounded-2xl p-6">
                        <Text className="text-xl font-bold mb-4">{title}</Text>

                        {/* User inputs */}
                        {
                            editingLog && Object.entries(editingLog).map(
                                ([key, fieldInfo]) => (
                                    renderInput(key, fieldInfo)
                                )
                            )
                        }

                        {/* Save and Cancel buttons */}
                        <View className="flex-row justify-end gap-3">
                            <TouchableOpacity
                                className="bg-gray-200 rounded-full px-4 py-2"
                                onPress={hidePopup}
                            >
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-green-500 rounded-full px-4 py-2"
                                onPress={handleSubmit}
                            >
                                <Text className="text-white">Save</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </Modal>
    );
}
