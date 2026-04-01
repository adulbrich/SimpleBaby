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
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.editLog;


export type editFieldText = {
    title: string;
    type: "text";
    value: string | null;
    testID?: string;
};

export type editFieldCategory = {
    title: string;
    type: "category";
    categories: string[];
    value: string | null;
    testID?: string;
};

export type editFieldDateTime = {
    title: string;
    type: "date" | "time";
    value: Date;
    buttonTestID?: string;
    pickerTestID?: string;
    doneButtonTestID?: string;
};

export type editFieldDuration = {
    title: string;
    type: "duration";
    value: string | null;
    testID?: string;
};

export type editFieldImage = {
    title: string;
    type: "image";
    value: string | null;
    testID?: string;
};

export type insert = {
    title: string | undefined;
    type: "insert";
    value: React.JSX.Element;
};

type editField =
    | editFieldText
    | editFieldCategory
    | editFieldDateTime
    | editFieldDuration
    | editFieldImage
    | insert;


export default function EditLogPopup({
    popupVisible,
    handleCancel,
    title,
    editingLog,
    setLog,
    handleSubmit,
    testID,
} : {
    popupVisible: boolean;
    handleCancel: () => void;
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
    };

    // renderCategoryInput - dropdown of specific categories that the user can choose from
    const renderCategoryInput = (fieldKey: string, fieldInfo: editFieldCategory) => (
        <View className="border border-gray-300 rounded-xl px-3 py-2 mb-3">
            <Dropdown
                value={fieldInfo.value}
                data={
                    !fieldInfo.categories ? []
                    : fieldInfo.categories.map((category: string) => ({ item: category }))
                }
                labelField={"item"}
                valueField={"item"}
                onChange={({ item }: { item: string }) =>
                    setLog((prev) => 
                        prev ? { ...prev, [fieldKey]: item } : prev,
                    )
                }
                testID={fieldInfo.testID}
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
            testID={fieldInfo.testID}
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
                testID={fieldInfo.buttonTestID}
            >
                <Text>{format(fieldInfo.value, fieldInfo.type === "date" ? "MMM dd, yyyy" : "hh:mm a")}</Text>
            </TouchableOpacity>

            {showDatePicker && datePickerData && (
                <DateTimePicker
                    value={datePickerData.value}
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
                    testID={fieldInfo.pickerTestID}
                />
            )}

            {Platform.OS === "ios" && showDatePicker && (
                <View className="mt-2 items-end">
                    <TouchableOpacity
                        className="bg-gray-200 rounded-full px-4 py-2"
                        onPress={() => setShowDatePicker(false)}
                        testID={fieldInfo.doneButtonTestID}
                    >
                        <Text>{stringLib.uiLabels.iosCloseDateTimePicker}</Text>
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
            onEndEditing={() => {
                // when the user finishes editing this input, add trailing 0's to fully convert to "HH:MM:SS"
                // get this <TextInput/>'s current value as a duration:
                const duration = toDuration(fieldInfo.value || "");
                setLog((prev) =>
					prev ? { ...prev, [fieldKey]: duration + "00:00:00".slice(duration.length) } : prev,
                );
            }}
            onFocus={() => {
                // when the user selects this input, sanitize the existing input. If there was a decryption error, start with an empty input
                const initial = fieldInfo.value || "";  // this <TextInput/>'s current displayed value
                const updated = initial === "[Decryption Failed]: Error: ❌ Decryption failed" ? "" : toDuration(initial);
                if (updated !== initial) {
                    setLog((prev) =>
                        prev ? { ...prev, [fieldKey]: updated } : prev,
                    );
                }
            }}
            testID={fieldInfo.testID}
        />
    );
    
    // renderTextInput - open text field for the user to type into
    const renderImageInput = (fieldKey: string, fieldInfo: editFieldImage) => (
        <Text className="text-xs text-gray-400 mt-1 mb-1" testID={fieldInfo.testID}>
            {stringLib.uiLabels.editPhotoMessage}
        </Text>
    );
    
    // renderTextInput - open text field for the user to type into
    const renderInsert = (fieldInfo: insert) => fieldInfo.value;

    const renderInput = (fieldKey: string, fieldInfo: editField) => (
        <View key={fieldKey}>
            {fieldInfo.title && <Text className="text-sm text-gray-500 mb-1">{fieldInfo.title}</Text>}
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
                ) : fieldInfo.type === "insert" ? (
                    renderInsert(fieldInfo)
                ) : undefined
            }
        </View>
    );


    return (
        <Modal
            visible={popupVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleCancel}
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
                                onPress={handleCancel}
                                testID={testIDs.cancelButton}
                            >
                                <Text>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                className="bg-green-500 rounded-full px-4 py-2"
                                onPress={handleSubmit}
                                testID={testIDs.saveButton}
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
