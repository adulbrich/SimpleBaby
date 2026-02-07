import Nursing from "@/app/(trackers)/nursing";
import { getActiveChildId } from "@/library/utils";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import supabase from "@/library/supabase-client";
import { router } from "expo-router";
import { encryptData } from "@/library/crypto";
import NursingStopwatch from "@/components/nursing-stopwatch";


jest.mock("@/library/supabase-client", () => {
    const insert = jest.fn(async () => ({ error: false }));
    return {
        from: () => ({
            insert: insert
        })
    };
});

jest.mock("@/library/crypto", () =>({
    encryptData: jest.fn(async (string) => `Encrypted: ${string}`)
}));

jest.mock("expo-router", () => {
    const replace = jest.fn();
    return {
        router: {
            replace: replace,
        },
    };
});

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

jest.mock("@/library/utils", () => {
    const getActiveChildId = jest.fn(async () => ({ success: true }));
    return {
        getActiveChildId: getActiveChildId
    };
});

jest.mock("@/components/nursing-stopwatch.tsx", () => {
    const View = jest.requireActual("react-native").View;
    const NursingStopwatchMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return NursingStopwatchMock;
});

jest.mock("@/library/auth-provider", () => ({
  useAuth: () => ({ isGuest: false }),
}));


/*
 *  setNursingInputs:
 *      Reads update handlers from first call to NursingStopwatch mock
 *      Calls update handlers with provided inputs for durations
 *      Calls userEvent.type for amounts and note
*/
async function setNursingInputs({
    leftAmount,
    rightAmount,
    leftDuration,
    rightDuration,
    note,
} : {
    leftAmount?: string;
    rightAmount?: string;
    leftDuration?: string;
    rightDuration?: string;
    note?: string;
}) {
    // read parameters to first call of NursingStopwatch
    const {
        onTimeUpdateLeft,
        onTimeUpdateRight,
    } = (NursingStopwatch as jest.Mock).mock.calls[0][0];

    // call update handlers for durations
    if (leftDuration) {
        await act(() => onTimeUpdateLeft?.(leftDuration));
    }
    if (rightDuration) {
        await act(() => onTimeUpdateRight?.(rightDuration));
    }

    // type into <TextInput/> components for amounts and note
    if (leftAmount) {
        await userEvent.type(
            screen.getByTestId("nursing-left-amount"),
            leftAmount
        );
    }
    if (rightAmount) {
        await userEvent.type(
            screen.getByTestId("nursing-right-amount"),
            rightAmount
        );
    }
    if (note) {
        await userEvent.type(
            screen.getByTestId("nursing-note-entry"),
            note
        );
    }
}


describe("Track nursing screen", () => {
    beforeEach(() => {
        // to clear the .mock.calls array
        (Alert.alert as jest.Mock).mockClear();
        (supabase.from("").insert as jest.Mock).mockClear();
        (NursingStopwatch as jest.Mock).mockClear();
        jest.spyOn(console, "error").mockClear();
    });

    test("Renders nursing tracking inputs", () => {
        render(<Nursing/>);

        expect(screen.getByTestId("nursing-stopwatch")).toBeTruthy();
        expect(screen.getByTestId("nursing-left-amount")).toBeTruthy();
        expect(screen.getByTestId("nursing-right-amount")).toBeTruthy();
        expect(screen.getByTestId("nursing-note-entry")).toBeTruthy();
    });
        
    test("Renders nursing form control buttons", () => {
        render(<Nursing/>);

        expect(screen.getByTestId("nursing-save-log-button")).toBeTruthy();
        expect(screen.getByTestId("nursing-reset-form-button")).toBeTruthy();
    });
        
    test("Refreshes on reset", async () => {
        const testNote = "test note";
        const testLeftAmount = "test left";
        const testRightAmount = "test right";
        render(<Nursing/>);

        // write something in the note entry...
        await userEvent.type(
            screen.getByTestId("nursing-note-entry"),
            testNote
        );
        expect(screen.getByDisplayValue(testNote)).toBeTruthy();  // ensure the typed note can be found

        // write left amount...
        await userEvent.type(
            screen.getByTestId("nursing-left-amount"),
            testLeftAmount
        );
        expect(screen.getByDisplayValue(testLeftAmount)).toBeTruthy();  // ensure the typed amount can be found

        // write right amount...
        await userEvent.type(
            screen.getByTestId("nursing-right-amount"),
            testRightAmount
        );
        expect(screen.getByDisplayValue(testRightAmount)).toBeTruthy();  // ensure the typed amount can be found

        const mainInputs = screen.getByTestId("nursing-stopwatch");  // get the displayed <NursingStopwatch/>

        await userEvent.press(
            screen.getByTestId("nursing-reset-form-button")
        );

        // ensure note is no longer present
        expect(() => screen.getByDisplayValue(testNote)).toThrow();
        // ensure left and right amounts are no longer present
        expect(() => screen.getByDisplayValue(testLeftAmount)).toThrow();
        expect(() => screen.getByDisplayValue(testRightAmount)).toThrow();
        // ensure new instance of <NursingStopwatch/> is being used
        expect(screen.getByTestId("nursing-stopwatch") === mainInputs).toBeFalsy();
    });

    test("Catch no input", async () => {
        render(<Nursing/>);
        await userEvent.press(
            screen.getByTestId("nursing-save-log-button")
        );

        // error message generated by app/(trackers)/nursing.tsx -> handleSaveNursingLog()
        // Alert.alert() called by app/(trackers)/nursing.tsx -> handleSaveNursingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Missing Information");
    });

    test("Catch getActiveChildId() error", async () => {
        const testErrorMessage = "testErrorInsert";

        // library/utils.ts -> getActiveChildId() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(trackers)/nursing.tsx -> saveNursingLog()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );

        render(<Nursing/>);

        await setNursingInputs({ leftAmount: "0" });  // fill in minumum required inputs
        await userEvent.press(
            screen.getByTestId("nursing-save-log-button")
        );

        // error message generated by library/utils.ts -> getActiveChildId()
        // Alert.alert() called by app/(trackers)/nursing.tsx -> saveNursingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error: ${testErrorMessage}`);

        // error message generated by library/utils.ts -> getActiveChildId()
        // Alert.alert() called by app/(trackers)/nursing.tsx -> handleSaveNursingLog()
        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe(`Failed to save nursing log: ${testErrorMessage}`);
    });
            
    test("Catch encryption error", async () => {
        const testErrorMessage = "testErrorEncryption";

        // library/crypto.ts -> encryptData() should be mocked to throw an error
        // This should cause error handling in app/(trackers)/nursing.tsx -> createNursingLog()
        (encryptData as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testErrorMessage); }
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code
    
        render(<Nursing/>);

        await setNursingInputs({ leftAmount: "0" });  // fill in minumum required inputs
        await userEvent.press(
            screen.getByTestId("nursing-save-log-button")
        );

        // error message generated by library/crypto.ts -> encryptData()
        // console.error() called by app/(trackers)/nursing.tsx -> createNursingLog()
        expect((console.error as jest.Mock).mock.calls[0][0]).toBe(`❌ Encryption failed:`);
        // loose inequality to compare separate Error instances
        expect((console.error as jest.Mock).mock.calls[0][1]).toEqual(new Error(testErrorMessage));

        // error message generated by library/crypto.ts -> encryptData()
        // Alert.alert() called by app/(trackers)/nursing.tsx -> createNursingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Failed to save nursing log: Encryption error`);
    });

    test("Catch supabase insert error", async () => {
        const testErrorMessage = "testErrorInsert";

        // supabase.from().insert() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(trackers)/nursing.tsx -> createNursingLog()
        (supabase.from("").insert as jest.Mock).mockImplementationOnce(
            async () => ({ error: testErrorMessage })
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<Nursing/>);

        await setNursingInputs({ leftAmount: "0" });  // fill in minumum required inputs
        await userEvent.press(
            screen.getByTestId("nursing-save-log-button")
        );

        // error message generated by supabase.from().insert()
        // console.error() called by app/(trackers)/nursing.tsx -> createNursingLog()
        expect((console.error as jest.Mock).mock.calls[0][0]).toBe(`Error creating nursing log:`);
        expect((console.error as jest.Mock).mock.calls[0][1]).toBe(testErrorMessage);

        // error message generated by supabase.from().insert()
        // Alert.alert() called by app/(trackers)/nursing.tsx -> handleSaveNursingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Failed to save nursing log: ${testErrorMessage}`);
    });

    test("Redirects user on successful submit", async () => {
        render(<Nursing/>);

        await setNursingInputs({ leftAmount: "0" });  // fill in minumum required inputs
        await userEvent.press(
            screen.getByTestId("nursing-save-log-button")
        );

        // confirm that the expo-router was called to send the user back to the tracker page
        expect((router.replace as jest.Mock)).toHaveBeenLastCalledWith("/(tabs)");
        expect((router.replace as jest.Mock)).toHaveBeenCalledTimes(1);

        // Alert.alert() called by app/(trackers)/nursing.tsx -> handleSaveNursingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Nursing log saved successfully!`);
    });
        
    test("Saves correct values", async () => {
        const testNote = "test note";
        const testID = "test ID";
        const testLeftAmount = "test left amount";
        const testRightAmount = "test right amount";
        const testLeftDuration = "test left duration";
        const testRightDuration = "test right duration";

        // mock library/utils.ts -> getActiveChildId() to return the test child ID
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childId: testID })
        );

        render(<Nursing/>);

        await setNursingInputs({
            leftAmount: testLeftAmount,
            rightAmount: testRightAmount,
            leftDuration: testLeftDuration,
            rightDuration: testRightDuration,
            note: testNote,
        });

        // submit log
        await userEvent.press(
            screen.getByTestId("nursing-save-log-button")
        );

        const insertedObject = (supabase.from("").insert as jest.Mock).mock.calls[0][0][0];

        // Ensure supabase.from().insert() was called with the correct values; the note should now be encrypted
        expect(insertedObject.child_id).toBe(testID);
        expect(insertedObject.left_amount).toBe(await encryptData(testLeftAmount));
        expect(insertedObject.right_amount).toBe(await encryptData(testRightAmount));
        expect(insertedObject.left_duration).toBe(await encryptData(testLeftDuration));
        expect(insertedObject.right_duration).toBe(await encryptData(testRightDuration));
        expect(insertedObject.note).toBe(await encryptData(testNote));

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/nursing.tsx -> handleSaveNursingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Nursing log saved successfully!`);
    });

});
