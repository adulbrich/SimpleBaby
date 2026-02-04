import Milestone from "@/app/(trackers)/milestone";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import { Alert, Platform } from "react-native";
import { getActiveChildId } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { router } from "expo-router";
import { encryptData } from "@/library/crypto";
import MilestoneCategory from "@/components/milestone-category";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { launchImageLibraryAsync } from "expo-image-picker";


jest.mock("@react-native-community/datetimepicker", () => {
    const View = jest.requireActual("react-native").View;
    return {
        __esModule: true,
        default: jest.fn(({testID}: {testID: string}) => <View testID={testID}/>),
        DateTimePickerAndroid: { open: jest.fn() },
    };
});

jest.mock("@/components/milestone-category", () => {
    const View = jest.requireActual("react-native").View;
    const MilestoneCategoryMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return MilestoneCategoryMock;
});

jest.mock("@/library/supabase-client", () => {
    const insert = jest.fn(async () => ({ error: false }));
    const upload = jest.fn(async () => ({data: {}}));
    return ({
        from: () => ({
            insert: insert,
        }),
        auth: {
            getUser: jest.fn(() => ({ data: { user: {} } })),
        },
        storage: {
            from: () => ({
                upload: upload,
            }),
        },
    });
});

jest.mock("expo-image-picker", () => ({
    requestMediaLibraryPermissionsAsync: jest.fn(() => ({ status: "granted" })),
    launchImageLibraryAsync: jest.fn(),
}));

jest.mock("expo-router", () => {
    const replace = jest.fn();
    return ({
        router: {
            replace: replace,
        },
    });
});

jest.mock("@/library/crypto", () => ({
    encryptData: jest.fn(async (string) => `Encrypted: ${string}`)
}));

jest.mock("@/library/utils", () => {
    const getActiveChildId = jest.fn(async () => ({ success: true }));
    return {
        getActiveChildId: getActiveChildId
    };
});

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

// mock fetch()
(global.fetch as any) = async () => ({
    arrayBuffer: jest.fn(async() => new ArrayBuffer(1)),
});

/*
 *  setmilestoneInputs:
 *      Reads update handlers from first call to MilestoneCategory mock
 *      Calls update handlers with provided inputs
 *      Sets other inputs by component testIDs
*/
async function setmilestoneInputs({
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
    // read parameters to first call of MilestoneCategory
    const {
        onCategoryUpdate,
    } = (MilestoneCategory as jest.Mock).mock.calls[0][0];

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
        expect(screen.getByTestId("dateTimePicker")).toBeTruthy();
        if (Platform.OS === "ios") {
            const onTimeChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
            await act(() => onTimeChange(time));
        } else if (Platform.OS === "android") {
            const onTimeChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
            await act(() => onTimeChange(time));
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
        (MilestoneCategory as jest.Mock).mockClear();
        (supabase.from("").insert as jest.Mock).mockClear();
        (DateTimePicker as jest.Mock).mockClear();
        (DateTimePickerAndroid.open as jest.Mock).mockClear();
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
        
    test("Catch getActiveChildId error", async () => {
        const testErrorMessage = "testErrorGetID";

        // library/utils.ts -> getActiveChildId() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(trackers)/milestone.tsx -> saveMilestoneLog()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
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

        // error message generated by library/utils.ts -> getActiveChildId()
        // Alert.alert() called by app/(trackers)/milestone.tsx -> saveMilestoneLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error: ${testErrorMessage}`);

        // error message generated by library/utils.ts -> getActiveChildId()
        // Alert.alert() called by app/(trackers)/milestone.tsx -> handleSaveMilestoneLog()
        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe(`Failed to save milestone log: ${testErrorMessage}`);
    });

    test("Catch supabase insert error", async () => {
        const testErrorMessage = "testErrorInsert";

        // supabase.from().insert() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(trackers)/milestone.tsx -> createMilestoneLog()
        (supabase.from("").insert as jest.Mock).mockReturnValueOnce(
            { error: testErrorMessage }
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<Milestone/>);
        await userEvent.type(  // fill in minimum required inputs
            screen.getByTestId("milestone-item-name"),
            "Test name"
        );

        await userEvent.press(
            screen.getByTestId("milestone-save-log-button")
        );

        // error message generated by supabase.from().insert()
        // console.error() called by app/(trackers)/milestone.tsx -> createMilestoneLog()
        expect((console.error as jest.Mock).mock.calls[0][0]).toBe(`Error creating milestone log:`);
        expect((console.error as jest.Mock).mock.calls[0][1]).toBe(testErrorMessage);

        // error message generated by supabase.from().insert()
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
        expect((router.replace as jest.Mock)).toHaveBeenLastCalledWith("/(tabs)");
        expect((router.replace as jest.Mock)).toHaveBeenCalledTimes(1);

        // Alert.alert() called by app/(trackers)/milestone.tsx -> handleSaveMilestoneLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Milestone log saved successfully!`);
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
            
    test("Saves correct values", async () => {
        Platform.OS = "ios";
        const testNote = "test note";
        const testCategory = "test category";
        const testName = "test name";
        const testTime = new Date;
        const testID = "test ID";
        const testPhotoPath = "test path";

        // mock library/utils.ts -> getActiveChildId() to return the test child ID
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childId: testID })
        );

        // mock supabase.storage.from().upload() to return the test photo path
        (supabase.storage.from("").upload as jest.Mock).mockImplementationOnce(
            async () => ({ data: {path: testPhotoPath} })
        );

        render(<Milestone/>);

        // fill in inputs
        await setmilestoneInputs({category: testCategory, name: testName, time: testTime, note: testNote, photo: {uri: "x"}});

        // submit log
        await userEvent.press(
            screen.getByTestId("milestone-save-log-button")
        );

        const insertedObject = (supabase.from("").insert as jest.Mock).mock.calls[0][0][0];

        // Ensure supabase.from().insert() was called with the correct values; the note and name should now be encrypted
        expect(insertedObject.child_id).toBe(testID);
        expect(insertedObject.category).toBe(testCategory);
        expect(insertedObject.title).toBe(await encryptData(testName));
        expect(insertedObject.achieved_at).toBe(testTime.toISOString());
        expect(insertedObject.note).toBe(await encryptData(testNote));

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/milestone.tsx -> handleSaveMilestoneLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Milestone log saved successfully!`);
    });

});
