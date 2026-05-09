import Diaper from "@/app/(trackers)/diaper";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import { Alert } from "react-native";
import { router } from "expo-router";
import DiaperModule from "@/components/diaper-module";
import { field, saveLog } from "@/library/log-functions";
import { formatStringList } from "@/library/utils";
import NoteEntry from "@/components/note-entry";


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

jest.mock("@/components/diaper-module.tsx", () => {
    const View = jest.requireActual("react-native").View;
    const DiaperModuleMock = jest.fn(({ testID }: { testID?: string }) => (<View testID={testID}></View>));
    return DiaperModuleMock;
});

jest.mock("@/components/note-entry.tsx", () => {
    const View = jest.requireActual("react-native").View;
    const NoteEntryMock = jest.fn(({ testID }: { testID?: string }) => (<View testID={testID}></View>));
    return NoteEntryMock;
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
 *  setDiaperInputs:
 *      Reads update handlers from first call to DiaperModule mock
 *      Calls update handlers with provided inputs
*/
async function setDiaperInputs({
    consistency,
    amount,
    time,
    note,
} : {
    consistency?: any;
    amount?: any;
    time?: Date;
    note?: string;
}) {
    // read parameters to most recent call of <DiaperModule/>
    const {
        onConsistencyUpdate,
        onAmountUpdate,
        onTimeUpdate,
    } = (DiaperModule as jest.Mock).mock.lastCall[0];

    if (consistency !== undefined) {
        await act(() => onConsistencyUpdate?.(consistency));
    }
    if (amount !== undefined) {
        await act(() => onAmountUpdate?.(amount));
    }
    if (time !== undefined) {
        await act(() => onTimeUpdate?.(time));
    }

    // read parameters to most recent call of <NoteEntry/>
    const { setNote } = (NoteEntry as jest.Mock).mock.lastCall[0];

    if (note !== undefined) {
        await act(() => setNote?.(note));
    }
}


describe("Track diaper screen", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (Alert.alert as jest.Mock).mockClear();
        jest.spyOn(console, "error").mockClear();
        (DiaperModule as jest.Mock).mockClear();
        (router.dismissTo as jest.Mock).mockClear();
        (saveLog as jest.Mock).mockClear();
    });

    test("Renders diaper tracking inputs", () => {
        render(<Diaper/>);

        expect(screen.getByTestId("diaper-main-inputs")).toBeTruthy();
        expect(screen.getByTestId("diaper-note-entry")).toBeTruthy();
    });

    test("Renders form control buttons", () => {
        render(<Diaper/>);

        expect(screen.getByTestId("diaper-save-log-button")).toBeTruthy();
        expect(screen.getByTestId("diaper-reset-form-button")).toBeTruthy();
    });

    test("Refreshes on reset", async () => {
        const testNote = "test note";
        render(<Diaper/>);

        // write something in the note entry...
        await setDiaperInputs({ note: testNote });
        expect((NoteEntry as jest.Mock).mock.lastCall[0].note).toBe(testNote);  // ensure the typed note can be found

        const mainInputs = screen.getByTestId("diaper-main-inputs");  // get the displayed <DiaperModule/>

        await userEvent.press(
            screen.getByTestId("diaper-reset-form-button")
        );

        // ensure note is no longer present
        expect((NoteEntry as jest.Mock).mock.lastCall[0].note).toBe("");
        // ensure new instance of <DiaperModule/> is being used
        expect(screen.getByTestId("diaper-main-inputs") === mainInputs).toBeFalsy();
    });

    test("Catch unfilled inputs", async () => {
        const testFormattedList = "test list";

        render(<Diaper/>);

        const testInputs = [
            { consistency: "", amount: "" },
            { consistency: "wet", amount: "" },
            { consistency: "", amount: "SM" },
        ];

        for (const testInput of testInputs) {
            (Alert.alert as jest.Mock).mockClear();  // clear calls between iterations

            // library/utils.ts -> formatStringList() should be mocked to return a test string
            // This is to ensure its return value is displayed properly
            (formatStringList as jest.Mock).mockImplementationOnce(
                () => testFormattedList
            );

            // fill in test inputs
            await setDiaperInputs(testInput);
            await userEvent.press(
                screen.getByTestId("diaper-save-log-button")
            );

            expect(formatStringList as jest.Mock).toHaveBeenLastCalledWith(
                Object.entries(testInput).map(([field, value]) => value.trim() ? null : field)
                    .filter(field => field)
            );

            // error message generated by app/(trackers)/diaper.tsx -> checkInputs()
            // Alert.alert() called by app/(trackers)/diaper.tsx -> handleSaveDiaperLog()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Missing Information`);
            expect((Alert.alert as jest.Mock).mock.calls[0][1])
                .toBe(`Failed to save the Diaper log. You are missing the following fields: ${testFormattedList}.`);
        }
    });

    test("Catch saveLog() error", async () => {
        const testErrorMessage = "test error";

        // library/log-functions.ts -> saveLog() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(trackers)/diaper.tsx -> handleSaveDiaperLog()
        (saveLog as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );

        render(<Diaper/>);
        await setDiaperInputs({ consistency: "wet", amount: "SM"});  // fill in minimum required inputs

        await userEvent.press(
            screen.getByTestId("diaper-save-log-button")
        );

        // error message generated by library/log-functions.ts -> saveLog()
        // Alert.alert() called by app/(trackers)/diaper.tsx -> handleSaveDiaperLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Failed to save diaper log: ${testErrorMessage}`);
    });

    test("Redirects user on successful submit", async () => {
        render(<Diaper/>);
        setDiaperInputs({ consistency: "wet", amount: "SM"});  // fill in minimum required inputs

        await userEvent.press(
            screen.getByTestId("diaper-save-log-button")
        );

        // confirm that the expo-router was called to send the user back to the tracker page
        expect((router.dismissTo as jest.Mock)).toHaveBeenLastCalledWith("/(tabs)");
        expect((router.dismissTo as jest.Mock)).toHaveBeenCalledTimes(1);

        // Alert.alert() called by app/(trackers)/diaper.tsx -> handleSaveDiaperLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Diaper log saved successfully!`);
    });

    test("Saves correct values", async () => {
        const testNote = "test note";
        const testTime = new Date(new Date().getTime() - 1.3*60*60*1000);
        const testConsistency = "test consistency";
        const testAmount = "test amount";

        render(<Diaper/>);
        await setDiaperInputs({
            consistency: testConsistency,
            amount: testAmount,
            time: testTime,
            note: testNote,
        });

        // submit log
        await userEvent.press(
            screen.getByTestId("diaper-save-log-button")
        );

        const savedValues = (saveLog as jest.Mock).mock.calls[0][0].fields;

        // Ensure saveLog() was called with the correct values
        const findfield = (name: string, value: any) =>
            (field: field) => field.dbFieldName === name && field.value === value;
        expect(savedValues.find(findfield("consistency", testConsistency))).toBeTruthy();
        expect(savedValues.find(findfield("amount", testAmount))).toBeTruthy();
        expect(savedValues.find(findfield("change_time", testTime))).toBeTruthy();
        expect(savedValues.find(findfield("note", testNote))).toBeTruthy();

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/diaper.tsx -> handleSaveDiaperLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Diaper log saved successfully!`);
    });

});
