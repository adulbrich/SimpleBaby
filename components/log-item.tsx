import {
    Image,
	Pressable,
	Text,
	View,
} from "react-native";
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.logItem;


type logTitle = {
    type: "title";
    value: string;
};

type logItem = {
    type: "item";
    label: string;
    value: string;
};

type logText = {
    type: "text";
    value: string;
};

type logNote = {
    type: "note";
    value: string | null;
};

type logImage = {
    type: "image";
    uri: string;
};

export type logRenderData =
    | logTitle
    | logItem
    | logText
    | logNote
    | logImage
    | ""
    | false
    | null;

export default function LogItem({
    id,
    onEdit,
    onDelete,
    buttonsDisabled,
    logData,
}: {
    id?: string;
    onEdit: () => void;
    onDelete: () => void;
    buttonsDisabled?: boolean;
    logData: logRenderData[];
}) {
    const renderItem = (item: logRenderData, key: number) => (
        !item ? (
            undefined
        ) : item.type === "title" ? (
            <Text className="text-lg font-bold mb-2" key={key}>{item.value}</Text>
        ) : item.type === "text" ? (
            <Text className="text-base mb-1" key={key}>{item.value}</Text>
        ) : item.type === "item" ? (
            <Text className="text-base mb-1" key={key}>{item.label}: {item.value}</Text>
        ) : item.type === "note" ? (
            item.value && <Text className="text-sm italic text-gray-500 mt-1" key={key}>📝 {item.value}</Text>
        ) : item.type === "image" ? (
            item.uri && <Image
                source={{ uri: item.uri }}
                style={{
                    width: "100%",
                    height: 220,
                    borderRadius: 12,
                    marginTop: 12,
                }}
                resizeMode="cover"
                onError={(e) =>
                    console.log("❌ Image Failed to Load:", id, e.nativeEvent)
                }
                key={key}
                testID={testIDs.image}
            />
        ) : undefined
    );

    return (
        <View className="bg-white rounded-xl p-4 mb-4 shadow">
            {logData.map((item, index) => renderItem(item, index))}

            <View className="flex-row justify-end gap-3 mt-4">
                <Pressable
                    className="px-3 py-2 rounded-full bg-blue-100"
                    onPress={onEdit}
                    disabled={buttonsDisabled}
                    testID={testIDs.editButton}
                >
                    <Text className="text-blue-700">✏️ Edit</Text>
                </Pressable>
                <Pressable
                    className="px-3 py-2 rounded-full bg-red-100"
                    onPress={onDelete}
                    disabled={buttonsDisabled}
                    testID={testIDs.deleteButton}
                >
                    <Text className="text-red-700">🗑️ Delete</Text>
                </Pressable>
            </View>
        </View>
    );
}
