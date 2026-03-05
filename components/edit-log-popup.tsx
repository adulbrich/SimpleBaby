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


type editFieldText = {
    title: string;
    type: "text";
    value: string | null;
};

type editFieldCategory = {
    title: string;
    type: "category";
    categories: string[];
    value: string;
};

type editField =
    | editFieldText
    | editFieldCategory;


export default function EditLogPopup({
    popupVisible,
    hidePopup,
    title,
    editingLog,
    setLog,
    handleSubmit,
} : {
    popupVisible: boolean;
    hidePopup: () => void;
    title: string;
    editingLog: Record<string, editField> | null;
    setLog: (updater: (prev: any) => any) => void;
    handleSubmit: () => void;
}) {

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
                    setLog((prev) => {
                        if (!prev) return prev;
                        const updatedLog = { ...prev };
                        (updatedLog as Record<string, any>)[fieldKey] = item;
                        return updatedLog;
                    })
                }
            />
        </View>
    );
    
    // renderTextInput - open text field for the user to type into
    const renderTextInput = (fieldKey: string, fieldInfo: editField) => (
        <TextInput
            className="border border-gray-300 rounded-xl px-3 py-2 mb-3"
            value={fieldInfo.value ? fieldInfo.value : ""}
            onChangeText={(text) =>
                setLog((prev) => {
                    if (!prev) return prev;
                    const updatedLog = { ...prev };
                    (updatedLog as Record<string, any>)[fieldKey] = text;
                    return updatedLog;
                })
            }
        />
    );

    const renderInput = (fieldKey: string, fieldInfo: editField) => (
        <View key={fieldKey}>
            <Text className="text-sm text-gray-500 mb-1">{fieldInfo.title}</Text>
            {
                fieldInfo.type === "category" ? (
                    renderCategoryInput(fieldKey, fieldInfo)
                ) : fieldInfo.type === "text" ? (
                    renderTextInput(fieldKey, fieldInfo)
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
