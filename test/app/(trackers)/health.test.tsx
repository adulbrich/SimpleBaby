import { render, screen, userEvent, act } from "@testing-library/react-native";
import Health from "@/app/(trackers)/health";
import { Alert } from "react-native";
import { getActiveChildId } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { router } from "expo-router";
import HealthModule, { HealthCategory } from "@/components/health-module";
import { encryptData } from "@/library/crypto";

jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
    },
}));

jest.mock("@/library/supabase-client", () => {
    const insert = jest.fn();
    return ({
        from: () => ({
            insert: insert,
        })
    });
});

jest.mock("@/library/crypto", () => ({
    encryptData: jest.fn(async () => "")
}));

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

jest.mock("@/library/utils", () => ({
    getActiveChildId: jest.fn(async () => ({ success: true }))  // default case, should cause no immediate error handling
}));

jest.mock("@/components/health-module.tsx", () => {
    const View = jest.requireActual("react-native").View;
    const HealthModuleMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return HealthModuleMock;
});

/*
 *  setHealthInputs:
 *      Reads update handlers from first call to HealthModule mock
 *      Calls update handlers with provided inputs
 *      Cuurently only supports category and growth updates
*/
function setHealthInputs({
    category,
    growth,
} : {
    category?: HealthCategory,
    growth?: { length?: string; weight?: string; head?: string; },
}) {
    // read parameters to first call of HealthModule
    const {
        onCategoryUpdate,
        onGrowthUpdate,
    } = (HealthModule as jest.Mock).mock.calls[0][0];

    if (category) {
        act(() => onCategoryUpdate?.(category));
    }
    if (growth) {
        act(() => onGrowthUpdate?.(growth));
    }
}


describe("Track health screen", () => {
    beforeEach(() => {
        // to clear the .mock.calls arrays
        (HealthModule as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
        jest.spyOn(console, "error").mockClear();
    });

    test("Renders health tracking inputs", () => {
        render(<Health/>);

        expect(screen.getByTestId("health-main-inputs")).toBeTruthy();
        expect(screen.getByTestId("health-note-entry")).toBeTruthy();
    });

    test("Renders form control buttons", () => {
        render(<Health/>);

        expect(screen.getByTestId("health-save-log-button")).toBeTruthy();
        expect(screen.getByTestId("health-reset-form-button")).toBeTruthy();
    });
        
    test("Catch unfilled growth inputs", async () => {
        render(<Health/>);  // will default to growth category

        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Please provide at least one growth measurement`);
    });
        
    test("Catch unfilled activity inputs", async () => {
        render(<Health/>);

        setHealthInputs({category: "Activity"});  // switch to activity category

        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Please provide both activity type and duration`);
    });
        
    test("Catch unfilled meds inputs", async () => {
        render(<Health/>);

        setHealthInputs({category: "Meds"});  // switch to meds category

        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Please provide medication name, amount, and time taken`);
    });
        
    test("Catch getActiveChildId error", async () => {
        const testErrorMessage = "testErrorGetID";

        // library/utils.ts -> getActiveChildId() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(trackers)/health.tsx -> handleSaveHealthLog()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );
    
        render(<Health/>);

        setHealthInputs({growth: {length: "x", weight: "", head: ""}});  // fill in any input
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // error message generated by library/utils.ts -> getActiveChildId()
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Failed to get active child: ${testErrorMessage}`);
    });
        
    test("Catch ecryption error", async () => {
        const testErrorMessage = "testErrorEncryption";

        // library/crypto.ts -> encryptData() should be mocked to throw an error
        // This should cause error handling in app/(trackers)/health.tsx -> handleSaveHealthLog()
        (encryptData as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testErrorMessage); }
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code
    
        render(<Health/>);

        setHealthInputs({growth: {length: "x", weight: "", head: ""}});  // fill in any input
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // error message generated by library/crypto.ts -> encryptData()
        // console.error() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((console.error as jest.Mock).mock.calls[0][0]).toBe(`❌ Encryption failed:`);
        // loose inequality to compare separate Error instances
        expect((console.error as jest.Mock).mock.calls[0][1]).toEqual(new Error(testErrorMessage));

        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Failed to encrypt and save health log.`);
    });
        
    test("Catch Supabase insert error", async () => {
        const testErrorMessage = "testErrorInsert";

        // supabase.from().insert() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(trackers)/health.tsx -> createHealthLog()
        (supabase.from("").insert as jest.Mock).mockImplementationOnce(
            async () => ({ error: testErrorMessage })
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code
    
        render(<Health/>);

        setHealthInputs({growth: {length: "x", weight: "", head: ""}});  // fill in any input
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // error message generated by supabase.from().insert()
        // console.error() called by app/(trackers)/health.tsx -> createHealthLog()
        expect((console.error as jest.Mock).mock.calls[0][0]).toBe(`Error creating health log:`);
        expect((console.error as jest.Mock).mock.calls[0][1]).toBe(testErrorMessage);

        // error message generated by supabase.from().insert()
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Failed to save health log: ${testErrorMessage}`);
    });
        
    test("Successfully submit health log", async () => {
        // supabase.from().insert() should be mocked to return:
        // { error: /* falsy value */ }
        // This should not cause any errors
        (supabase.from("").insert as jest.Mock).mockReturnValueOnce(
            Promise.resolve({ error: false })
        );
    
        render(<Health/>);

        setHealthInputs({growth: {length: "x", weight: "", head: ""}});  // fill in any input
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // confirm that the expo-router was called to send the user back to the tracker page
        expect((router.replace as jest.Mock)).toHaveBeenLastCalledWith("/(tabs)");
        expect((router.replace as jest.Mock)).toHaveBeenCalledTimes(1);

        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Success`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Health log saved successfully!`);
    });
});
