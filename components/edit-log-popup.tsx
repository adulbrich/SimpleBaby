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

type editFieldDuration = {
    title: string;
    type: "duration";
    value: string | null;
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
    | editFieldDuration
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

    // a function to convert a string to (possibly partial, if input is insufficent) "HH:MM:SS" format
    const toDuration = (text: string) => {
        let val = text.replace(/[^0-9:]/g, "");
        if (val.length > 0 && val[0] === ":") val = `00${val}`;
        if (val.length > 1 && val[1] === ":") val = `0${val}`;
        if (val.length > 2 && val[2] !== ":") val = `${val.slice(0, 2)}:${val.slice(2)}`;
        if (val.length > 3 && val[3] === ":") val = `${val.slice(0, 3)}00${val.slice(3)}`;
        if (val.length > 3 && Number(val[3]) > 5) val = `${val.slice(0, 3)}0${val.slice(3)}`;
        if (val.length > 4 && val[4] === ":") val = `${val.slice(0, 3)}0${val.slice(3)}`;
        if (val.length > 5 && val[5] !== ":") val = `${val.slice(0, 5)}:${val.slice(5)}`;
        if (val.length > 6 && val[6] === ":") val = `${val.slice(0, 6)}00`;
        if (val.length > 6 && Number(val[6]) > 5) val = `${val.slice(0, 6)}0${val.slice(6)}`;
        if (val.length > 7 && val[7] === ":") val = `${val.slice(0, 6)}0`;
        val = val.slice(0, 8);
        return val;
    }

    // renderCategoryInput - dropdown of specific categories that the user can choose from
    const renderCategoryInput = (fieldKey: string, fieldInfo: editFieldCategory) => (
        <View className="border border-gray-300 rounded-xl px-3 py-2 mb-3">
            <Dropdown
                value={fieldInfo.value}
                data={
                    !fieldInfo.categories ? []
                    : fieldInfo.categories.map((category: string) => ({ item: category }))
                }
                labelField={ "item" }
                valueField={ "item" }
                onChange={({ item }: { item: string }) =>
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
    const renderDurationInput = (fieldKey: string, fieldInfo: editFieldDuration) => (
        <TextInput
            className="border border-gray-300 rounded-xl px-3 py-2 mb-3"
            value={fieldInfo.value ? fieldInfo.value : ""}
            inputMode="numeric"
            onChangeText={(text) =>
                setLog((prev) =>
					prev ? { ...prev, [fieldKey]: toDuration(text) } : prev,
                )
            }
            onEndEditing={(e) => {
                // when the user finishes editing this input, add trailing 0's to fully convert to "HH:MM:SS"
                // fetch this <TextInput/>'s current value as a duration:
                const duration = toDuration((e.target as any).__internalInstanceHandle.pendingProps.value);
                setLog((prev) =>
					prev ? { ...prev, [fieldKey]: duration + "00:00:00".slice(duration.length) } : prev,
                );
            }}
            onFocus={(e) => {
                // when the user selects this input, sanitize the existing input. If there was a decryption error, start with an empty input
                const initial = (e.target as any).__internalInstanceHandle.pendingProps.value;  // fetch this <TextInput/>'s current value
                const updated = initial === "[Decryption Failed]: Error: ❌ Decryption failed" ? "" : toDuration(initial);
                setLog((prev) =>
					prev ? { ...prev, [fieldKey]: updated } : prev,
                );
            }}
        />
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
                ) : fieldInfo.type === "duration" ? (
                    renderDurationInput(fieldKey, fieldInfo)
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
