import DiaperLogsView from "@/app/(logs)/diaper-logs";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import { getActiveChildId } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { decryptData, encryptData } from "@/library/crypto";
import { format } from 'date-fns';
import { Alert } from "react-native";


jest.mock("@/library/supabase-client", () => {
    const select = jest.fn();
    const del = jest.fn(async () => ({}));
    const updateId = jest.fn(async () => ({}));
    const updateData = jest.fn(() => ({ eq: updateId }));
    return ({
        from: () => ({
            select: () => ({
                eq: () => ({
                    order: select,
                }),
            }),
            delete: () => ({
                eq: del,
            }),
            update: updateData,
        }),
    });
});

jest.mock("@/library/crypto", () => ({
    encryptData: jest.fn(async (string) => `Encrypted: ${string}`),
    decryptData: jest.fn(async (string) => string ? `Decrypted: ${string}` : ""),
}));

jest.mock("@/library/utils", () => ({
    getActiveChildId: jest.fn(async () => ({ success: true, childId: true })),
}));

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});


const TEST_LOGS = [{
    id: "test log id 1",
    child_id: "test child id",
    consistency: "test consistency 1 U2FsdGVkX1",
    amount: "test amount 1 U2FsdGVkX1",
    logged_at: (new Date()).toISOString(),
    note: "test note 1 U2FsdGVkX1",
}, {
    id: "test log id 2",
    child_id: "test child id",
    consistency: "test consistency 2 U2FsdGVkX1",
    amount: "test amount 2 U2FsdGVkX1",
    logged_at: (new Date("1 Jan 2000")).toISOString(),
    note: "",
}];

// set default mock
(supabase.from("").select().eq("", "").order as jest.Mock).mockImplementation(
    async () => ({ data: TEST_LOGS })
);


describe("Diaper logs screen", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (Alert.alert as jest.Mock).mockClear();
        (supabase.from("").update({}).eq as unknown as jest.Mock).mockClear();
        (supabase.from("").update as unknown as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Catch getActiveChildId() error", async () => {
        const testErrorMessage = "testErrorGetID";
    
        // library/utils.ts -> getActiveChildId() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(logs)/diaper-logs.tsx -> fetchDiaperLogs()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );
        
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<DiaperLogsView/>);

        expect(await screen.findByTestId("diaper-logs-loading-error")).toBeTruthy();  // wait for loading to finish
        expect(screen.getByText(testErrorMessage, {exact: false})).toBeTruthy();  // specific error is displayed
    });

    test("Catch supabase select error", async () => {
        const testErrorMessage = new Error("test error");
    
        // supabase.from().select().eq().order() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(logs)/diaper-logs.tsx -> fetchDiaperLogs()
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementationOnce(
            async () => ({ error: testErrorMessage })
        );
        
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<DiaperLogsView/>);

        expect(await screen.findByTestId("diaper-logs-loading-error")).toBeTruthy();  // wait for loading to finish
        expect(screen.getByText(String(testErrorMessage), {exact: false})).toBeTruthy();  // specific error is displayed
    });

    test("Renders no logs (generic)", async () => {
        // supabase.from().select().eq().order() should be mocked to return:
        // { data: /* falsy value */ }
        // This should cause a notification to the user of no logs found to be displayed
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementationOnce(
            async () => ({})
        );

        render(<DiaperLogsView/>);
        expect(await screen.findByText("You don't have any diaper logs yet!")).toBeTruthy();
        //expect(await screen.findByTestId("diaper-no-logs")).toBeTruthy();
    });

    test("Renders no logs (specific child)", async () => {
        const testChildName = "test child name";
        // supabase.from().select().eq().order() should be mocked to return:
        // { data: /* falsy value */ }
        // This should cause a notification to the user of no logs found to be displayed
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementationOnce(
            async () => ({})
        );
        
        // library/utils -> getActiveChildId() should be mocked to return:
        // { success: /* truthy value */, childId: /* truthy value */, childName: /* test value */ }
        // This is to track the test value passed as childName
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childId: true, childName: testChildName })
        );

        render(<DiaperLogsView/>);
        expect(await screen.findByText(`You don't have any diaper logs for ${testChildName} yet!`)).toBeTruthy();
    });

    test("Renders log buttons", async () => {
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            expect(screen.getByTestId(`diaper-logs-edit-button-${log.id}`)).toBeTruthy();
            expect(screen.getByTestId(`diaper-logs-delete-button-${log.id}`)).toBeTruthy();
        }
    });

    test("Catches decryption error", async () => {
        const testError = new Error("test error");

        // library/crypto -> decryptData() should be mocked to throw an error
        // This should cause error handling in app/(logs)/diaper-logs.tsx -> fetchDiaperLogs() -> safeDecrypt()
        (decryptData as jest.Mock).mockImplementationOnce(
            async () => { throw testError }
        );

        jest.spyOn(console, "warn").mockImplementation(() => null);  // suppress console warnings from within the tested code
        
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            expect(screen.getByText(`[Decryption Failed]: ${testError}`, {exact: false})).toBeTruthy();
        }
    });

    test("Renders log values", async () => {
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            expect(screen.getByText(format(new Date(log.logged_at), 'MMM dd, yyyy'), {exact: false})).toBeTruthy();
            expect(screen.getByText(format(new Date(log.logged_at), 'h:mm a'), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.consistency), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.amount), {exact: false})).toBeTruthy();
            if (log.note) expect(screen.getByText(await decryptData(log.note), {exact: false})).toBeTruthy();
        }
    });

    test("Displays delete log", async () => {
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            await userEvent.press(
                screen.getByTestId(`diaper-logs-delete-button-${log.id}`)
            );

            // Alert.alert called by diaper-logs.tsx -> handleDelete()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Delete Entry");
            expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe("Are you sure you want to delete this log?");
            expect((Alert.alert as jest.Mock).mock.calls[0][2][0].text).toBe("Cancel");  // cancel button
            expect((Alert.alert as jest.Mock).mock.calls[0][2][1].text).toBe("Delete");  // delete button
        }
    });

    test("Catches delete log error", async () => {

        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // supabase.from().delete().eq() should be mocked to return:
            // { error: /* truthy value */ }
            // This should cause error handling in callback defined in app/(logs)/diaper-logs.tsx -> handleDelete
            (supabase.from("").delete().eq as unknown as jest.Mock).mockImplementationOnce(
                async () => ({ error: true })
            );

            await userEvent.press(
                screen.getByTestId(`diaper-logs-delete-button-${log.id}`)
            );

            // Alert.alert called by diaper-logs.tsx -> handleDelete()
            const deleteHandler = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress as () => Promise<void>;
            await act(deleteHandler);  // call delete handler (user confirms delete)

            // Alert.alert called by diaper-logs.tsx -> handleDelete() -> anonomous callback
            expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Error deleting log");
            
            (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
        }
    });

    test("Deletes log", async () => {
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // ensure log is still present
            expect(screen.getByText(format(new Date(log.logged_at), 'MMM dd, yyyy'), {exact: false})).toBeTruthy();
            expect(screen.getByText(format(new Date(log.logged_at), 'h:mm a'), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.consistency), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.amount), {exact: false})).toBeTruthy();
            if (log.note) expect(screen.getByText(await decryptData(log.note), {exact: false})).toBeTruthy();

            // press delete
            await userEvent.press(
                screen.getByTestId(`diaper-logs-delete-button-${log.id}`)
            );
            // Alert.alert called by diaper-logs.tsx -> handleDelete()
            const deleteHandler = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress as () => Promise<void>;
            await act(deleteHandler);  // call delete handler (user confirms delete)

            // confirm all log details are no longer present
            expect(() => screen.getByText(format(new Date(log.logged_at), 'MMM dd, yyyy'), {exact: false})).toThrow();
            expect(() => screen.getByText(format(new Date(log.logged_at), 'h:mm a'), {exact: false})).toThrow();
            expect(async () => screen.getByText(await decryptData(log.consistency), {exact: false})).rejects.toThrow();
            expect(async () => screen.getByText(await decryptData(log.amount), {exact: false})).rejects.toThrow();
            expect(async () => screen.getByText(await decryptData(log.note), {exact: false})).rejects.toThrow();

            
            (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
        }
    });

    test("Displays edit log", async () => {
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        // open edit log pop-up
        await userEvent.press(
            screen.getByTestId(`diaper-logs-edit-button-${TEST_LOGS[0].id}`)
        );
        
        // edit fields
        expect(screen.getByTestId("diaper-log-edit-consistency")).toBeTruthy();
        expect(screen.getByTestId("diaper-log-edit-amount")).toBeTruthy();
        expect(screen.getByTestId("diaper-log-edit-note")).toBeTruthy();

        // edit buttons
        expect(screen.getByTestId("diaper-log-edit-cancel")).toBeTruthy();
        expect(screen.getByTestId("diaper-log-edit-save")).toBeTruthy();
    });

    // this test causes console warnings!!!
    test("Pre-populates edit log fields", async () => {
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // open edit log pop-up
            await userEvent.press(
                screen.getByTestId(`diaper-logs-edit-button-${log.id}`)
            );
            
            // check field values
            expect(screen.getByTestId("diaper-log-edit-consistency")._fiber.pendingProps.value)  // find consistency input and extract the value
                .toBe(await decryptData(log.consistency));
            expect(screen.getByTestId("diaper-log-edit-amount")._fiber.pendingProps.value)  // find amount input and extract the value
                .toBe(await decryptData(log.amount));
            expect(screen.getByTestId("diaper-log-edit-note")._fiber.pendingProps.value)  // find note input and extract the value
                .toBe(await decryptData(log.note));

            // close edit log pop-up
            await userEvent.press(
                screen.getByTestId(`diaper-log-edit-cancel`)
            );
        }
    });

    test("Catch encryption error edit log", async () => {
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // library/crypto -> encryptData() should be mocked to throw an error
            // This should cause error handling in callback defined in app/(logs)/diaper-logs.tsx -> handleSaveEdit
            (encryptData as jest.Mock).mockImplementationOnce(
                async () => { throw new Error }
            );

            // open edit log pop-up
            await userEvent.press(
                screen.getByTestId(`diaper-logs-edit-button-${log.id}`)
            );
            
            // submit edit
            await userEvent.press(
                screen.getByTestId("diaper-log-edit-save")
            );

            // Alert.alert called by diaper-logs.tsx -> handleSaveEdit()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Something went wrong during save.");
            (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
        }
    });

    test("Catch supabase error edit log", async () => {render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // supabase.from().update().eq() should be mocked to return:
            // { error: /* truthy value */ }
            // This should cause error handling in callback defined in app/(logs)/diaper-logs.tsx -> handleSaveEdit
            (supabase.from("").update({}).eq as unknown as jest.Mock).mockImplementationOnce(
                async () => ({ error: true })
            );
        
            // open edit log pop-up
            await userEvent.press(
                screen.getByTestId(`diaper-logs-edit-button-${log.id}`)
            );

            // submit edit
            await userEvent.press(
                screen.getByTestId("diaper-log-edit-save")
            );

            // Alert.alert called by diaper-logs.tsx -> handleSaveEdit()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Failed to update log");
            (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
        }
    });

    test("Updates remotely stored logs", async () => {
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            const editedConsistency = `edited consistency ${log.id}`;
            const editedAmount = `edited amount ${log.id}`;
            const editedNote = `edited note ${log.id}`;

            // clear .mock.calls array each loop
            (supabase.from("").update({}).eq as unknown as jest.Mock).mockClear();
            (supabase.from("").update as unknown as jest.Mock).mockClear();

            // open edit log pop-up
            await userEvent.press(
                screen.getByTestId(`diaper-logs-edit-button-${log.id}`)
            );
            
            // clear fields, then type new values
            await userEvent.clear(screen.getByTestId("diaper-log-edit-consistency"));
            await userEvent.type(
                screen.getByTestId("diaper-log-edit-consistency"),
                editedConsistency
            );
            await userEvent.clear(screen.getByTestId("diaper-log-edit-amount"));
            await userEvent.type(
                screen.getByTestId("diaper-log-edit-amount"),
                editedAmount
            );
            await userEvent.clear(screen.getByTestId("diaper-log-edit-note"));
            await userEvent.type(
                screen.getByTestId("diaper-log-edit-note"),
                editedNote
            );

            // submit edit
            await userEvent.press(
                screen.getByTestId("diaper-log-edit-save")
            );

            // Ensure supabase.from.update() was called with correct (updated) values
            expect((supabase.from("").update as jest.Mock).mock.calls[0][0])
                .toEqual({  // loose comparison for objects
                    consistency: await encryptData(editedConsistency),
                    amount: await encryptData(editedAmount),
                    note: await encryptData(editedNote),
                });
            // Ensure supabase.from.update.eq() was called with correct id
            expect((supabase.from("").update({}).eq as unknown as jest.Mock).mock.calls[0][1])
                .toBe(log.id);
        }
    });

    test("Updates displayed logs", async () => {
        const log = TEST_LOGS[0];  // use any log

        const editedLog = {
            id: "test log id 1",
            child_id: "test child id",
            consistency: "edited consistency U2FsdGVkX1",
            amount: "edited amount U2FsdGVkX1",
            logged_at: (new Date()).toISOString(),
            note: "edited note U2FsdGVkX1",
        };
        const updatedLogs = [editedLog].concat(  // join new edited log
            TEST_LOGS.filter((item) => item != log)  // and remove previous log
        );
        
        render(<DiaperLogsView/>);
        await screen.findByTestId("diaper-logs");  // wait for log list to render

        // open edit log pop-up
        await userEvent.press(
            screen.getByTestId(`diaper-logs-edit-button-${log.id}`)
        );

        // update the mock to return 'updated' logs
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementation(
            async () => ({ data: updatedLogs })
        );

        // submit edit
        await userEvent.press(
            screen.getByTestId("diaper-log-edit-save")
        );

        // ensure new values are on the page...
        expect(screen.getByText(await decryptData(editedLog.consistency), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(editedLog.amount), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(editedLog.note), {exact: false})).toBeTruthy();
        // ...and that the previous values are not
        expect(async () => screen.getByText(await decryptData(log.consistency), {exact: false})).rejects.toThrow();
        expect(async () => screen.getByText(await decryptData(log.amount), {exact: false})).rejects.toThrow();
        expect(async () => screen.getByText(await decryptData(log.note), {exact: false})).rejects.toThrow();
    });
});
