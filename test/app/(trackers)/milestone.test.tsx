import Milestone from "@/app/(trackers)/milestone";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import { Alert, Platform } from "react-native";
import { router } from "expo-router";
import CategoryModule from "@/components/category-module";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from "expo-image-picker";
import { field, saveLog } from "@/library/log-functions";
import { formatStringList } from "@/library/utils";


jest.mock("@react-native-community/datetimepicker", () => {
    const View = jest.requireActual("react-native").View;
    return {
        __esModule: true,
        default: jest.fn(({testID}: {testID: string}) => <View testID={testID}/>),
        DateTimePickerAndroid: { open: jest.fn() },
    };
});

jest.mock("@/components/category-module", () => {
    const Text = jest.requireActual("react-native").Text;
    const CategoryModuleMock = jest.fn(
        ({testID, selectedCategory}: {testID?: string; selectedCategory: string}) =>
            (<Text testID={testID}>{selectedCategory}</Text>)
    );
    return CategoryModuleMock;
});

jest.mock("expo-image-picker", () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(() => ({ status: "granted" })),
    launchImageLibraryAsync: jest.fn(),
}));

jest.mock("expo-router", () => ({
    router: {
        dismissTo: jest.fn(),
    },
}));

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

jest.mock("@/library/auth-provider", () => ({
    useAuth: () => ({ isGuest: false }),
}));

jest.mock("@/library/log-functions", () => ({
    saveLog: jest.fn(async () => ({ success: true })),
}));

jest.mock("@/library/utils", () => ({
    formatStringList: jest.fn(),
}));

/*
 *  setmilestoneInputs:
 *      Reads update handlers from first call to CategoryModule mock
 *      Calls update handlers with provided inputs
 *      Sets other inputs by component testIDs
*/
async function setMilestoneInputs({
    category,
    name,
    time,
    photo,
    note,
} : {
    category?: string;
    name?: string;
    time?: Date;
    photo?: {
        uri: string;
        fileName?: string;
    };
    note?: string;
}) {
    // read parameters to first call of CategoryModule
    const {
        onCategoryUpdate,
    } = (CategoryModule as jest.Mock).mock.calls[0][0];

    if (category) {
        await act(() => onCategoryUpdate?.(category));
    }

    // fill other inputs by testID
    if (name) {
        await userEvent.type(
            screen.getByTestId("milestone-item-name"),
            name
        );
    }
    if (time) {
        await act(() => userEvent.press(screen.getByTestId("milestone-date-button")));  // open time picker
        if (Platform.OS === "ios") {
            const onTimeChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
            await act(() => onTimeChange({ type: "set" }, time));
        } else if (Platform.OS === "android") {
            const onTimeChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
            await act(() => onTimeChange(undefined, time));
        }
    }
    if (photo) {
        (launchImageLibraryAsync as jest.Mock).mockImplementationOnce(
            async () => ({ assets: [photo] })
        );
        await userEvent.press(screen.getByTestId("milestone-photo-button"));  // open photo picker
    }
    if (note) {
        await userEvent.type(
            screen.getByTestId("milestone-note-entry"),
            note
        );
    }
}


describe("Track milestone screen", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (Alert.alert as jest.Mock).mockClear();
        jest.spyOn(console, "error").mockClear();
        (CategoryModule as jest.Mock).mockClear();
        (DateTimePicker as jest.Mock).mockClear();
        (DateTimePickerAndroid.open as jest.Mock).mockClear();
        (router.dismissTo as jest.Mock).mockClear();
        (saveLog as jest.Mock).mockClear();
    });

    test("Renders milestone tracking inputs", () => {
        render(<Milestone/>);

        expect(screen.getByTestId("milestone-category-modal")).toBeTruthy();
        expect(screen.getByTestId("milestone-item-name")).toBeTruthy();
        expect(screen.getByTestId("milestone-date-button")).toBeTruthy();
        expect(screen.getByTestId("milestone-photo-button")).toBeTruthy();
        expect(screen.getByTestId("milestone-note-entry")).toBeTruthy();
    });
        
    test("Renders form control buttons", () => {
        render(<Milestone/>);

        expect(screen.getByTestId("milestone-save-log-button")).toBeTruthy();
        expect(screen.getByTestId("milestone-reset-form-button")).toBeTruthy();
    });
    
    test("Shows/hides date picker (ios)", async () => {
        Platform.OS = "ios";
        
        render(<Milestone/>);

        // Press change date button
        await userEvent.press(screen.getByTestId("milestone-date-button"));
        // ensure date picker has been shown
        expect(screen.getByTestId("dateTimePicker")).toBeTruthy();

        // Press change date button again to close
        await userEvent.press(screen.getByTestId("milestone-date-button"));
        // ensure date picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();
    });
        
    test("Shows/hides date picker (android)", async () => {
        Platform.OS = "android";

        render(<Milestone/>);

        // ensure date picker isn't visible yet
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(0);

        // open start date editer
        await userEvent.press(screen.getByTestId("milestone-date-button"));

        // ensure date picker has been shown
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);
    });
            
    test("Resets all values", async () => {
        Platform.OS = "android";
        const testNote = "test note";
        const testCategory = "test category";
        const testName = "test name";
        const testTime = new Date();
        testTime.setFullYear(testTime.getFullYear() - 1);  // decrement the year by 1, so that it serializes to a different mm/dd/yyyy
        const testPhotoName = "test photo";

        render(<Milestone/>);

        // fill in inputs
        await setMilestoneInputs({category: testCategory, name: testName, time: testTime, note: testNote,
            photo: {uri: "x", fileName: testPhotoName}});

        // ensure all entered data is visible
        expect(screen.getByText(testCategory)).toBeTruthy();
        expect(screen.getByDisplayValue(testName)).toBeTruthy();
        expect(screen.getByText(testTime.toLocaleDateString())).toBeTruthy();
        expect(screen.getByText(`(${testPhotoName})`)).toBeTruthy();
        expect(screen.getByDisplayValue(testNote)).toBeTruthy();

        // submit log
        await userEvent.press(
            screen.getByTestId("milestone-reset-form-button")
        );

        // ensure all entered data has been reverted
        expect(() => screen.getByText(testCategory)).toThrow();
        expect(() => screen.getByDisplayValue(testName)).toThrow();
        expect(() => screen.getByText(testTime.toLocaleDateString())).toThrow();
        expect(() => screen.getByText(testPhotoName)).toThrow();
        expect(() => screen.getByDisplayValue(testNote)).toThrow();
    });
            
    test("Catches denied photo permissions", async () => {
        // requestMediaLibraryPermissionsAsync() should be mocked to return:
        // { status: /* not "granted" */ }
        // This should cause error handling in app/(trackers)/milestone.tsx -> pickPhoto()
        (requestMediaLibraryPermissionsAsync as jest.Mock).mockImplementationOnce(
            async () => ({ })
        );

        render(<Milestone/>);

        // Press add photo button
        await userEvent.press(screen.getByTestId("milestone-photo-button"));

        // error message generated by app/(trackers)/milestone.tsx -> pickPhoto()
        // Alert.alert() called by app/(trackers)/milestone.tsx -> pickPhoto()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Permission needed`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Please allow photo library access to attach a milestone photo.`);
    });
            
    test("Displays image name", async () => {
        const testFileName = "test.uri";
        const testUri = `path/${testFileName}`;
        const testName = "test name";

        render(<Milestone/>);

        // add image with no given name
        await setMilestoneInputs({photo: {uri: testUri}});

        // ensure file path name is displayed on the screen
        expect(screen.getByText(`(${testFileName})`)).toBeTruthy();

        // add image with a given name
        await setMilestoneInputs({photo: {uri: testUri, fileName: testName}});

        // ensure file path name is displayed on the screen
        expect(screen.getByText(`(${testName})`)).toBeTruthy();
    });
        
    test("Catch missing name", async () => {
        const testFormattedList = "test list";

        render(<Milestone/>);

        // library/utils.ts -> formatStringList() should be mocked to return a test string
        // This is to ensure its return value is displayed properly
        (formatStringList as jest.Mock).mockImplementationOnce(
            () => testFormattedList
        );

        // don't fill in name. Date should be auto-filled
        await userEvent.press(
            screen.getByTestId("milestone-save-log-button")
        );

        expect(formatStringList as jest.Mock).toHaveBeenLastCalledWith(
            ["name"]
        );

        // error message generated by app/(trackers)/milestone.tsx -> checkInputs()
        // Alert.alert() called by app/(trackers)/milestone.tsx -> handleSaveMilestoneLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Missing Information`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(
            `Failed to save the Milestone log. You are missing the following fields: ${testFormattedList}.`
        );
    });

    test("Catch saveLog() error", async () => {
        const testErrorMessage = "test error";

        // library/log-functions.ts -> saveLog() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(trackers)/milestone.tsx -> handleSaveMilestoneLog()
        (saveLog as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );

        render(<Milestone/>);
        await userEvent.type(  // fill in minimum required inputs
            screen.getByTestId("milestone-item-name"),
            "Test name"
        );

        await userEvent.press(
            screen.getByTestId("milestone-save-log-button")
        );

        // error message generated by library/log-functions.ts -> saveLog()
        // Alert.alert() called by app/(trackers)/milestone.tsx -> handleSaveMilestoneLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Failed to save milestone log: ${testErrorMessage}`);
    });
    
    test("Redirects user on successful submit", async () => {
        render(<Milestone/>);

        await userEvent.type(  // fill in minimum required inputs
            screen.getByTestId("milestone-item-name"),
            "Test name"
        );
        await userEvent.press(
            screen.getByTestId("milestone-save-log-button")
        );

        // confirm that the expo-router was called to send the user back to the tracker page
        expect((router.dismissTo as jest.Mock)).toHaveBeenLastCalledWith("/(tabs)");
        expect((router.dismissTo as jest.Mock)).toHaveBeenCalledTimes(1);

        // Alert.alert() called by app/(trackers)/milestone.tsx -> handleSaveMilestoneLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Milestone log saved successfully!`);
    });
            
    test("Saves correct values (ios)", async () => {
        Platform.OS = "ios";
        await savesCorrectValues();
    });
            
    test("Saves correct values (android)", async () => {
        Platform.OS = "android";
        await savesCorrectValues();
    });

});


async function savesCorrectValues() {
    const testNote = "test note";
    const testCategory = "test category";
    const testName = "test name";
    const testTime = new Date;
    const testPhotoURI = "test path";

    render(<Milestone/>);

    // fill in inputs
    await setMilestoneInputs({
        category: testCategory,
        name: testName,
        time: testTime,
        note: testNote,
        photo: { uri: testPhotoURI }
    });

    // submit log
    await userEvent.press(
        screen.getByTestId("milestone-save-log-button")
    );

    const savedValues = (saveLog as jest.Mock).mock.calls[0][0].fields;

    // Ensure saveLog() was called with the correct values
    const findfield = (name: string, value: any) =>
        (field: field) => field.dbFieldName === name && field.value === value;
    expect(savedValues.find(findfield("category", testCategory))).toBeTruthy();
    expect(savedValues.find(findfield("title", testName))).toBeTruthy();
    expect(savedValues.find(findfield("achieved_at", testTime))).toBeTruthy();
    expect(savedValues.find(findfield("note", testNote))).toBeTruthy();
    expect(savedValues.find(findfield("photo_url", testPhotoURI))).toBeTruthy();

    // Ensure that log was saved successfully
    // Alert.alert() called by app/(trackers)/milestone.tsx -> handleSaveMilestoneLog()
    expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Milestone log saved successfully!`);
}
