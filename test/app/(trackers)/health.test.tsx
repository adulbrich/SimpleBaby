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
    const insert = jest.fn(async () => ({ error: false }));
    return ({
        from: () => ({
            insert: insert,
        })
    });
});

jest.mock("@/library/crypto", () => ({
    encryptData: jest.fn(async (string) => `Encrypted: ${string}`)
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

jest.mock("@/library/auth-provider", () => ({
  useAuth: () => ({ isGuest: false }),
}));

jest.mock("expo-crypto", () => ({}));

/*
 *  setHealthInputs:
 *      Reads update handlers from first call to HealthModule mock
 *      Calls update handlers with provided inputs
*/
async function setHealthInputs({
    category,
    growth,
    activity,
    meds,
    vaccine,
    other,
    date,
} : {
    category?: HealthCategory;
    growth?: { length?: string; weight?: string; head?: string; };
    activity?: { type: string; duration: string; };
    meds?: { name?: string; amount?: string; timeTaken?: Date; };
    vaccine?: { name?: string; location?: string; };
    other?: { name?: string; description?: string; };
    date?: Date;
}) {
    // read parameters to first call of HealthModule
    const {
        onCategoryUpdate,
        onGrowthUpdate,
        onActivityUpdate,
        onMedsUpdate,
        onVaccineUpdate,
        onOtherUpdate,
        onDateUpdate,
    } = (HealthModule as jest.Mock).mock.calls[0][0];

    if (category) {
        await act(() => onCategoryUpdate?.(category));
    }
    if (growth) {
        await act(() => onGrowthUpdate?.(growth));
    }
    if (activity) {
        await act(() => onActivityUpdate?.(activity));
    }
    if (meds) {
        await act(() => onMedsUpdate?.(meds));
    }
    if (vaccine) {
        await act(() => onVaccineUpdate?.(vaccine));
    }
    if (other) {
        await act(() => onOtherUpdate?.(other));
    }
    if (date) {
        await act(() => onDateUpdate?.(date));
    }
}


describe("Track health screen", () => {
    beforeEach(() => {
        // to clear the .mock.calls arrays
        (HealthModule as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
        (supabase.from("").insert as jest.Mock).mockClear();
        jest.spyOn(console, "error").mockClear();
        (router.replace as jest.Mock).mockClear();
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

    test("Refreshes on reset", async () => {
        const testNote = "test note";
        render(<Health/>);

        // write something in the note entry...
        await userEvent.type(
            screen.getByTestId("health-note-entry"),
            testNote
        );
        expect(screen.getByDisplayValue(testNote)).toBeTruthy();  // ensure the typed note can be found

        const mainInputs = screen.getByTestId("health-main-inputs");  // get the displayed <HealthModule/>

        await userEvent.press(
            screen.getByTestId("health-reset-form-button")
        );

        // ensure note is no longer present
        expect(() => screen.getByDisplayValue(testNote)).toThrow();
        // ensure new instance of <HealthModule/> is being used
        expect(screen.getByTestId("health-main-inputs") === mainInputs).toBeFalsy();
    });
        
    test("Catch unfilled growth inputs", async () => {
        render(<Health/>);  // will default to growth category

        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[0][1])
            .toBe("Failed to save the Growth Health log. You are missing the following fields: length, weight and head.");

        // repeat with length and weight filled
        await setHealthInputs({growth: {length: "x", weight: "y", head: ""}});
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[1][1])
            .toBe("Failed to save the Growth Health log. You are missing the following fields: head.");

        // repeat with length and head filled
        await setHealthInputs({growth: {length: "x", weight: "", head: "y"}});
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[2][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[2][1])
            .toBe("Failed to save the Growth Health log. You are missing the following fields: weight.");

        // repeat with weight and head filled
        await setHealthInputs({growth: {length: "", weight: "x", head: "y"}});
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[3][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[3][1])
            .toBe("Failed to save the Growth Health log. You are missing the following fields: length.");
    });
        
    test("Catch unfilled activity inputs", async () => {
        render(<Health/>);

        await setHealthInputs({category: "Activity"});  // switch to activity category

        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[0][1])
            .toBe("Failed to save the Activity Health log. You are missing the following fields: type and duration.");

        // repeat with type filled
        await setHealthInputs({activity: {type: "x", duration: ""}});
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[1][1])
            .toBe("Failed to save the Activity Health log. You are missing the following fields: duration.");

        // repeat with duration filled
        await setHealthInputs({activity: {type: "", duration: "x"}});
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[2][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[2][1])
            .toBe("Failed to save the Activity Health log. You are missing the following fields: type.");
    });
        
    test("Catch unfilled meds inputs", async () => {
        render(<Health/>);

        await setHealthInputs({category: "Meds"});  // switch to meds category

        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[0][1])
            .toBe("Failed to save the Medicine Health log. You are missing the following fields: name and amount.");

        // repeat with name filled
        await setHealthInputs({meds: {name: "x", amount: ""}});
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[1][1])
            .toBe("Failed to save the Medicine Health log. You are missing the following fields: amount.");

        // repeat with amount filled
        await setHealthInputs({meds: {name: "", amount: "x"}});
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[2][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[2][1])
            .toBe("Failed to save the Medicine Health log. You are missing the following fields: name.");
    });
        
    test("Catch unfilled vaccine inputs", async () => {
        render(<Health/>);

        await setHealthInputs({category: "Vaccine"});  // switch to meds category

        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[0][1])
            .toBe("Failed to save the Vaccine Health log. Please provide at least a name for the vaccine received.");
    });
        
    test("Catch unfilled other inputs", async () => {
        render(<Health/>);

        await setHealthInputs({category: "Other"});  // switch to meds category

        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[0][1])
            .toBe("Failed to save the 'Other' Health log. Please provide at least a title for the health event.");
    });
        
    test("Catch getActiveChildId error", async () => {
        const testErrorMessage = "Failed to get active child: testErrorGetID";

        // library/utils.ts -> getActiveChildId() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(trackers)/health.tsx -> handleSaveHealthLog()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );
    
        render(<Health/>);

        await setHealthInputs({growth: {length: "x", weight: "y", head: "z"}});  // fill in required inputs
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // error message generated by library/utils.ts -> getActiveChildId()
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Failed to save health log: ${testErrorMessage}`);
    });
        
    test("Catch encryption error", async () => {
        const testErrorMessage = "Failed to encrypt and save health log";

        // library/crypto.ts -> encryptData() should be mocked to throw an error
        // This should cause error handling in app/(trackers)/health.tsx -> handleSaveHealthLog()
        (encryptData as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testErrorMessage); }
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code
    
        render(<Health/>);

        await setHealthInputs({growth: {length: "x", weight: "y", head: "z"}});  // fill in required inputs
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
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Failed to save health log: ${testErrorMessage}.`);
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

        await setHealthInputs({growth: {length: "x", weight: "y", head: "z"}});  // fill in required inputs
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
        
    test("Redirects user on successful submit", async () => {
        render(<Health/>);

        await setHealthInputs({growth: {length: "x", weight: "y", head: "z"}});  // fill in required inputs
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
        
    test("Saves correct values (growth)", async () => {
        const testLength = "test length";
        const testWeight = "test weight";
        const testHead = "test head";
        render(<Health/>);

        // fill inputs
        await setHealthInputs({growth: {length: testLength, weight: testWeight, head: testHead}});

        // submit log
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        const insertedObject = (supabase.from("").insert as jest.Mock).mock.calls[0][0][0];

        // Ensure Supabase.insert was called with the correct values, which should now be encrypted
        expect(insertedObject.category).toBe("Growth");
        expect(insertedObject.growth_length).toBe(await encryptData(testLength));
        expect(insertedObject.growth_weight).toBe(await encryptData(testWeight));
        expect(insertedObject.growth_head).toBe(await encryptData(testHead));

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Success`);
    });
        
    test("Saves correct values (activity)", async () => {
        const testType = "test activity";
        const testDuration = "test duration";
        render(<Health/>);

        // fill inputs
        await setHealthInputs({category: "Activity", activity: {type: testType, duration: testDuration}});

        // submit log
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        const insertedObject = (supabase.from("").insert as jest.Mock).mock.calls[0][0][0];

        // Ensure Supabase.insert was called with the correct values, which should now be encrypted
        expect(insertedObject.category).toBe("Activity");
        expect(insertedObject.activity_type).toBe(await encryptData(testType));
        expect(insertedObject.activity_duration).toBe(await encryptData(testDuration));

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Success`);
    });
        
    test("Saves correct values (meds)", async () => {
        const testName = "test name";
        const testAmount = "test amount";
        const testTime = new Date;
        render(<Health/>);

        // fill inputs
        await setHealthInputs({category: "Meds", meds: {name: testName, amount: testAmount, timeTaken: testTime}});

        // submit log
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        const insertedObject = (supabase.from("").insert as jest.Mock).mock.calls[0][0][0];

        // Ensure Supabase.insert was called with the correct values, which should now be encrypted
        expect(insertedObject.category).toBe("Meds");
        expect(insertedObject.meds_name).toBe(await encryptData(testName));
        expect(insertedObject.meds_amount).toBe(await encryptData(testAmount));
        expect(insertedObject.meds_time_taken).toBe(testTime);

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Success`);
    });
        
    test("Saves correct values (vaccine)", async () => {
        const testName = "test name";
        const testLocation = "test location";
        render(<Health/>);

        // fill inputs
        await setHealthInputs({category: "Vaccine", vaccine: {name: testName, location: testLocation}});

        // submit log
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        const insertedObject = (supabase.from("").insert as jest.Mock).mock.calls[0][0][0];

        // Ensure Supabase.insert was called with the correct values, which should now be encrypted
        expect(insertedObject.category).toBe("Vaccine");
        expect(insertedObject.vaccine_name).toBe(await encryptData(testName));
        expect(insertedObject.vaccine_location).toBe(await encryptData(testLocation));

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Success`);
    });
        
    test("Saves correct values (other)", async () => {
        const testName = "test name";
        const testDescription = "test description";
        render(<Health/>);

        // fill inputs
        await setHealthInputs({category: "Other", other: {name: testName, description: testDescription}});

        // submit log
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        const insertedObject = (supabase.from("").insert as jest.Mock).mock.calls[0][0][0];

        // Ensure Supabase.insert was called with the correct values, which should now be encrypted
        expect(insertedObject.category).toBe("Other");
        expect(insertedObject.other_name).toBe(await encryptData(testName));
        expect(insertedObject.other_description).toBe(await encryptData(testDescription));

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Success`);
    });
        
    test("Saves correct values (id/date/note)", async () => {
        const testNote = "test note";
        const testDate = new Date;
        const testID = "test ID";

        // mock library/utils.ts -> getActiveChildId() to return the test child ID
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childId: testID })
        );

        render(<Health/>);

        // write a note
        await userEvent.type(
            screen.getByTestId("health-note-entry"),
            testNote
        );
        // fill date
        await setHealthInputs({
            date: testDate,
            growth: {length: "x", weight: "y", head: "z"}  // fill in required inputs to avoid errors
        });

        // submit log
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        const insertedObject = (supabase.from("").insert as jest.Mock).mock.calls[0][0][0];

        // Ensure supabase.from().insert() was called with the correct values; the note should now be encrypted
        expect(insertedObject.child_id).toBe(testID);
        expect(insertedObject.date).toBe(testDate.toISOString());
        expect(insertedObject.note).toBe(await encryptData(testNote));

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Success`);
    });
});
