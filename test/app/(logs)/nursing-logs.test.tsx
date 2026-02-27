import NursingLogsView from "@/app/(logs)/nursing-logs";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import { getActiveChildId } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { decryptData, encryptData } from "@/library/crypto";
import { format } from 'date-fns';
import { Alert } from "react-native";
import { useAuth } from "@/library/auth-provider";
import {
	listRows,
	updateRow,
	deleteRow,
	getActiveChildId as getLocalActiveChildId,
} from "@/library/local-store";


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

jest.mock("@/library/auth-provider", () => ({
    useAuth: jest.fn(() => ({})),
}));

jest.mock("@/library/local-store", () => ({
    getActiveChildId: jest.fn(),
    listRows: jest.fn(),
    deleteRow: jest.fn(async () => true),
    updateRow: jest.fn(async () => true),
}));


const NOW = (new Date).getTime();
const TEST_CHILD_ID = "test child id";
const TEST_LOGS = [{
    id: "test log id 1",
    child_id: TEST_CHILD_ID,
    left_amount: "test left amount 1 U2FsdGVkX1",
    right_amount: "test right amount 1 U2FsdGVkX1",
    left_duration: "test left duration 1 U2FsdGVkX1",
    right_duration: "test right duration 1 U2FsdGVkX1",
    logged_at: (new Date(NOW)).toISOString(),
    note: "test note 1 U2FsdGVkX1",
}, {
    id: "test log id 2",
    child_id: TEST_CHILD_ID,
    left_amount: "test left amount 2 U2FsdGVkX1",
    right_amount: "test right amount 2 U2FsdGVkX1",
    left_duration: "test left duration 2 U2FsdGVkX1",
    right_duration: "test right duration 2 U2FsdGVkX1",
    logged_at: (new Date(NOW - 2*24*60*60*1000 - 60*1000)).toISOString(),
    note: "",
}];

// set default mocks to return test data
(supabase.from("").select().eq("", "").order as jest.Mock).mockImplementation(
    async () => ({ data: TEST_LOGS })
);
(listRows as jest.Mock).mockImplementation(
    async () => TEST_LOGS
);
(getLocalActiveChildId as jest.Mock).mockImplementation(
    async () => TEST_CHILD_ID
);


describe("Nursing logs screen", () => {

    beforeAll(() => {
        // set to account (not guest) mode:
        // library/auth-provider -> useAuth() should be mocked to return: { isGuest: /* falsy value */ }
        (useAuth as jest.Mock).mockImplementation(() => ({}));
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (Alert.alert as jest.Mock).mockClear();
        (supabase.from("").update({}).eq as unknown as jest.Mock).mockClear();
        (supabase.from("").update as unknown as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Catch getActiveChildId() error (account)", async () => {
        const testErrorMessage = "testErrorGetID";
    
        // library/utils.ts -> getActiveChildId() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(logs)/nursing-logs.tsx -> fetchNursingLogs()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );
        await catchLoadingError(testErrorMessage);
    });

    test("Catch supabase select error", async () => {
        const testErrorMessage = "test error";
    
        // supabase.from().select().eq().order() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(logs)/nursing-logs.tsx -> fetchNursingLogs()
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementationOnce(
            async () => ({ error: new Error(testErrorMessage) })
        );
        await catchLoadingError(testErrorMessage);
    });

    test("Renders no logs (generic)", async () => {
        // supabase.from().select().eq().order() should be mocked to return:
        // { data: /* falsy value */ }
        // This should cause a notification to the user of no logs found to be displayed
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementationOnce(
            async () => ({})
        );
        await catchNoLogs("You don't have any nursing logs yet!");
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
        await catchNoLogs(`You don't have any nursing logs for ${testChildName} yet!`);
    });

    test("Renders log buttons", rendersLogButtons);

    test("Catches decryption error", catchDecryptionError);

    test("Renders log values", rendersLogs);

    test("Displays delete log confirmation", async () => {
        render(<NursingLogsView/>);
        await screen.findByTestId("nursing-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            await userEvent.press(
                screen.getByTestId(`nursing-logs-delete-button-${log.id}`)
            );

            // Alert.alert called by nursing-logs.tsx -> handleDelete()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Delete Entry");
            expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe("Are you sure you want to delete this log?");
            expect((Alert.alert as jest.Mock).mock.calls[0][2][0].text).toBe("Cancel");  // cancel button
            expect((Alert.alert as jest.Mock).mock.calls[0][2][1].text).toBe("Delete");  // delete button
        }
    });

    test("Catches delete log error", async () => catchDeleteError(() =>
        // supabase.from().delete().eq() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in callback defined in app/(logs)/nursing-logs.tsx -> handleDelete
        (supabase.from("").delete().eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        )
    ));

    test("Deletes log", deletesLog);

    test("Displays edit log", async () => {
        render(<NursingLogsView/>);
        await screen.findByTestId("nursing-logs");  // wait for log list to render

        // open edit log pop-up
        await userEvent.press(
            screen.getByTestId(`nursing-logs-edit-button-${TEST_LOGS[0].id}`)
        );
        
        // edit fields
        expect(screen.getByTestId("nursing-log-edit-left-amount")).toBeTruthy();
        expect(screen.getByTestId("nursing-log-edit-right-amount")).toBeTruthy();
        expect(screen.getByTestId("nursing-log-edit-left-duration")).toBeTruthy();
        expect(screen.getByTestId("nursing-log-edit-right-duration")).toBeTruthy();
        expect(screen.getByTestId("nursing-log-edit-note")).toBeTruthy();

        // edit buttons
        expect(screen.getByTestId("nursing-log-edit-cancel")).toBeTruthy();
        expect(screen.getByTestId("nursing-log-edit-save")).toBeTruthy();
    });

    test("Pre-populates edit log fields", async () => {
        render(<NursingLogsView/>);
        await screen.findByTestId("nursing-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // open edit log pop-up
            await userEvent.press(
                screen.getByTestId(`nursing-logs-edit-button-${log.id}`)
            );
            
            // check field values
            expect(screen.getByTestId("nursing-log-edit-left-amount")._fiber.pendingProps.value)  // find category input and extract the value
                .toBe(await decryptData(log.left_amount));
            expect(screen.getByTestId("nursing-log-edit-right-amount")._fiber.pendingProps.value)  // find item input and extract the value
                .toBe(await decryptData(log.right_amount));
            expect(screen.getByTestId("nursing-log-edit-left-duration")._fiber.pendingProps.value)  // find amount input and extract the value
                .toBe(await decryptData(log.left_duration));
            expect(screen.getByTestId("nursing-log-edit-right-duration")._fiber.pendingProps.value)  // find amount input and extract the value
                .toBe(await decryptData(log.right_duration));
            expect(screen.getByTestId("nursing-log-edit-note")._fiber.pendingProps.value)  // find note input and extract the value
                .toBe(await decryptData(log.note));

            // close edit log pop-up
            await userEvent.press(
                screen.getByTestId(`nursing-log-edit-cancel`)
            );
        }
    });

    test("Catch encryption error edit log", async () => {
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<NursingLogsView/>);
        await screen.findByTestId("nursing-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // library/crypto -> encryptData() should be mocked to throw an error
            // This should cause error handling in callback defined in app/(logs)/nursing-logs.tsx -> handleSaveEdit
            (encryptData as jest.Mock).mockImplementationOnce(
                async () => { throw new Error; }
            );

            // open edit log pop-up
            await userEvent.press(
                screen.getByTestId(`nursing-logs-edit-button-${log.id}`)
            );
            
            // submit edit
            await userEvent.press(
                screen.getByTestId("nursing-log-edit-save")
            );

            // Alert.alert called by nursing-logs.tsx -> handleSaveEdit()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Something went wrong during save.");
            (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
        }
    });

    test("Catch supabase error edit log", async () => catchUpdateError(() =>
        // supabase.from().update().eq() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(logs)/nursing-logs.tsx -> handleSaveEdit
        (supabase.from("").update({}).eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        )
    ));

    test("Updates remotely stored logs", async () => updateRemoteLogs(
        (supabase.from("").update as unknown as jest.Mock).mockClear(),
        0,
        (supabase.from("").update({}).eq as unknown as jest.Mock).mockClear(),
        1
    ), 10000);

    test("Updates displayed logs", async () => updateDisplayedLogs((newLogs) => {
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementation(
            async () => ({ data: newLogs })
        );
    }));
});


describe("nursing logs screen (guest mode)", () => {

    beforeAll(() => {
        // change to guest mode
        (useAuth as jest.Mock).mockImplementation(() => ({isGuest: true}));
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (Alert.alert as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Catch getLocalActiveChildId() error", async () => {
        const testErrorMessage = "testErrorGetID";
        // library/local-store.ts -> getActiveChildId() should be mocked to throw an error
        // This should cause error handling in app/(logs)/nursing-logs.tsx -> fetchNursingLogs()
        (getLocalActiveChildId as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testErrorMessage); }
        );
        await catchLoadingError(testErrorMessage);
    });

    test("Catch invalid childID", async () => {
        // library/local-store.ts -> getActiveChildId() should be mocked to return:
        // /* falsy value */
        // This should cause error handling in app/(logs)/nursing-logs.tsx -> fetchNursingLogs()
        (getLocalActiveChildId as jest.Mock).mockImplementationOnce(
            async () => false
        );
        await catchInvalidChildId();
    });

    test("Renders no logs (generic)", async () => {
        // library/local-store.ts -> listRows() should be mocked to return:
        // []
        // This should cause a notification to the user of no logs found to be displayed
        (listRows as jest.Mock).mockImplementationOnce(
            async () => []
        );
        await catchNoLogs("You don't have any nursing logs yet!");
    });

    test("Renders log buttons (guest)", rendersLogButtons);

    test("Catches decryption error (guest)", catchDecryptionError);

    test("Renders log values (guest)", rendersLogs);

    test("Catches delete log error (guest)", async () => catchDeleteError(() =>
        // library/local-store.ts -> deleteRow() should be mocked to return:
        // /* falsy value */
        // This should cause error handling in callback defined in app/(logs)/nursing-logs.tsx -> handleDelete
        (deleteRow as jest.Mock).mockImplementationOnce(
            async () => false
        )
    ));

    test("Deletes log (guest)", deletesLog);

    test("Catch supabase error edit log", async () => catchUpdateError(() =>
        // library/local-store.ts -> updateRow should be mocked to return:
        // /* falsy value */
        // This should cause error handling in app/(logs)/nursing-logs.tsx -> handleSaveEdit
        (updateRow as jest.Mock).mockImplementationOnce(
            async () => false
        )
    ));

    test("Updates remotely stored logs", async () => updateRemoteLogs(
        (updateRow as jest.Mock).mockClear(),
        2,  // updateRow() is called wit the data object as the 3rd argument
        (updateRow as jest.Mock).mockClear(),
        1  // updateRow() is called wit the log id as the 2nd argument
    ), 10000);

    test("Updates displayed logs", async () => updateDisplayedLogs((newLogs) => {
        (listRows as jest.Mock).mockImplementationOnce(
            async () => newLogs
        );
    }));
});


async function catchLoadingError(testErrorMessage: string) {
    jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

    render(<NursingLogsView/>);

    expect(await screen.findByTestId("nursing-logs-loading-error")).toBeTruthy();  // wait for loading to finish
    expect(screen.getByText(testErrorMessage, {exact: false})).toBeTruthy();  // specific error is displayed
}

async function catchInvalidChildId() {
    jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

    render(<NursingLogsView/>);

    expect(await screen.findByTestId("nursing-logs-loading-error")).toBeTruthy();  // wait for loading to finish
    expect(screen.getByText("No active child selected (guest mode)", {exact: false})).toBeTruthy();  // error is displayed
}

async function catchNoLogs(message: string) {
    render(<NursingLogsView/>);
    expect(await screen.findByText(message)).toBeTruthy();
}

async function rendersLogButtons() {
    render(<NursingLogsView/>);
    await screen.findByTestId("nursing-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        expect(screen.getByTestId(`nursing-logs-edit-button-${log.id}`)).toBeTruthy();
        expect(screen.getByTestId(`nursing-logs-delete-button-${log.id}`)).toBeTruthy();
    }
}

async function catchDecryptionError() {
    const testError = new Error("test error");

    // library/crypto -> decryptData() should be mocked to throw an error
    // This should cause error handling in app/(logs)/nursing-logs.tsx -> fetchNursingLogs() -> safeDecrypt()
    (decryptData as jest.Mock).mockImplementationOnce(
        async () => { throw testError; }
    );

    jest.spyOn(console, "warn").mockImplementation(() => null);  // suppress console warnings from within the tested code
    
    render(<NursingLogsView/>);
    await screen.findByTestId("nursing-logs");  // wait for log list to render

    expect(screen.getByText(`[Decryption Failed]: ${testError}`, {exact: false})).toBeTruthy();
}

async function rendersLogs() {
    render(<NursingLogsView/>);
    await screen.findByTestId("nursing-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        expect(screen.getByText(format(new Date(log.logged_at), 'MMM dd, yyyy'), {exact: false})).toBeTruthy();
        expect(screen.getByText(format(new Date(log.logged_at), 'h:mm a'), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(log.left_amount), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(log.right_amount), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(log.left_duration), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(log.right_duration), {exact: false})).toBeTruthy();
        if (log.note) expect(screen.getByText(await decryptData(log.note), {exact: false})).toBeTruthy();
    }
}

async function catchDeleteError(mockFailingDelete: () => void) {
    render(<NursingLogsView/>);
    await screen.findByTestId("nursing-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        mockFailingDelete();

        await userEvent.press(
            screen.getByTestId(`nursing-logs-delete-button-${log.id}`)
        );

        // Alert.alert called by nursing-logs.tsx -> handleDelete()
        const deleteHandler = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress as () => Promise<void>;
        await act(deleteHandler);  // call delete handler (user confirms delete)

        // Alert.alert called by nursing-logs.tsx -> handleDelete() -> anonomous callback
        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Error deleting log");
        
        (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
    }
}

async function deletesLog() {
    render(<NursingLogsView/>);
    await screen.findByTestId("nursing-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        // ensure log is still present
        expect(screen.getByText(format(new Date(log.logged_at), 'MMM dd, yyyy'), {exact: false})).toBeTruthy();
        expect(screen.getByText(format(new Date(log.logged_at), 'h:mm a'), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(log.left_amount), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(log.right_amount), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(log.left_duration), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(log.right_duration), {exact: false})).toBeTruthy();
        if (log.note) expect(screen.getByText(await decryptData(log.note), {exact: false})).toBeTruthy();

        // press delete
        await userEvent.press(
            screen.getByTestId(`nursing-logs-delete-button-${log.id}`)
        );
        // Alert.alert called by nursing-logs.tsx -> handleDelete()
        const deleteHandler = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress as () => Promise<void>;
        await act(deleteHandler);  // call delete handler (user confirms delete)

        // confirm all log details are no longer present
        expect(() => screen.getByText(format(new Date(log.logged_at), 'MMM dd, yyyy'), {exact: false})).toThrow();
        expect(() => screen.getByText(format(new Date(log.logged_at), 'h:mm a'), {exact: false})).toThrow();
        expect(async () => screen.getByText(await decryptData(log.left_amount), {exact: false})).rejects.toThrow();
        expect(async () => screen.getByText(await decryptData(log.right_amount), {exact: false})).rejects.toThrow();
        expect(async () => screen.getByText(await decryptData(log.left_duration), {exact: false})).rejects.toThrow();
        expect(async () => screen.getByText(await decryptData(log.right_duration), {exact: false})).rejects.toThrow();
        expect(async () => screen.getByText(await decryptData(log.note), {exact: false})).rejects.toThrow();

        
        (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
    }
}

async function catchUpdateError(mockFailingEdit: () => void) {
    render(<NursingLogsView/>);
    await screen.findByTestId("nursing-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        mockFailingEdit();
    
        // open edit log pop-up
        await userEvent.press(
            screen.getByTestId(`nursing-logs-edit-button-${log.id}`)
        );

        // submit edit
        await userEvent.press(
            screen.getByTestId("nursing-log-edit-save")
        );

        // Alert.alert called by nursing-logs.tsx -> handleSaveEdit()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Failed to update log");
        (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
    }
}

async function updateRemoteLogs(dataMock: jest.Mock, dataArgI: number, idMock: jest.Mock, idArgI: number) {
    render(<NursingLogsView/>);
    await screen.findByTestId("nursing-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        const editedLeftAmount = `edited left amount ${log.id}`;
        const editedRightAmount = `edited right amount ${log.id}`;
        const editedLeftDuration = `edited left duration ${log.id}`;
        const editedRightDuration = `edited right duration ${log.id}`;
        const editedNote = `edited note ${log.id}`;

        // clear .mock.calls array each loop
        idMock.mockClear();
        dataMock.mockClear();

        // open edit log pop-up
        await userEvent.press(
            screen.getByTestId(`nursing-logs-edit-button-${log.id}`)
        );
        
        // clear fields, then type new values
        await userEvent.clear(screen.getByTestId("nursing-log-edit-left-amount"));
        await userEvent.type(
            screen.getByTestId("nursing-log-edit-left-amount"),
            editedLeftAmount
        );
        await userEvent.clear(screen.getByTestId("nursing-log-edit-right-amount"));
        await userEvent.type(
            screen.getByTestId("nursing-log-edit-right-amount"),
            editedRightAmount
        );
        await userEvent.clear(screen.getByTestId("nursing-log-edit-left-duration"));
        await userEvent.type(
            screen.getByTestId("nursing-log-edit-left-duration"),
            editedLeftDuration
        );
        await userEvent.clear(screen.getByTestId("nursing-log-edit-right-duration"));
        await userEvent.type(
            screen.getByTestId("nursing-log-edit-right-duration"),
            editedRightDuration
        );
        await userEvent.clear(screen.getByTestId("nursing-log-edit-note"));
        await userEvent.type(
            screen.getByTestId("nursing-log-edit-note"),
            editedNote
        );

        // submit edit
        await userEvent.press(
            screen.getByTestId("nursing-log-edit-save")
        );

        // Ensure mock was called with correct (updated) values
        expect(dataMock.mock.calls[0][dataArgI])
            .toEqual({  // loose comparison for objects
                left_amount: await encryptData(editedLeftAmount),
                right_amount: await encryptData(editedRightAmount),
                left_duration: await encryptData(editedLeftDuration),
                right_duration: await encryptData(editedRightDuration),
                note: await encryptData(editedNote),
            });
        // Ensure mock was called with correct id
        expect(idMock.mock.calls[0][idArgI])
            .toBe(log.id);
    }
}

async function updateDisplayedLogs(mockFetchLogs: (newLogs: object) => void) {
    const log = TEST_LOGS[0];  // use any log

    const editedLog = {
        id: "test log id 1",
        child_id: "test child id",
        left_amount: "edited left amount U2FsdGVkX1",
        right_amount: "edited right amount U2FsdGVkX1",
        left_duration: "edited left duration U2FsdGVkX1",
        right_duration: "edited right duration U2FsdGVkX1",
        logged_at: (new Date(NOW - 4*24*60*60*1000 - 6*60*1000)).toISOString(),
        note: "edited note U2FsdGVkX1",
    };
    const updatedLogs = [editedLog].concat(  // join new edited log
        TEST_LOGS.filter((item) => item !== log)  // and remove previous log
    );
    
    render(<NursingLogsView/>);
    await screen.findByTestId("nursing-logs");  // wait for log list to render

    // open edit log pop-up
    await userEvent.press(
        screen.getByTestId(`nursing-logs-edit-button-${log.id}`)
    );

    // update the mock to return 'updated' logs
    mockFetchLogs(updatedLogs);

    // submit edit
    await userEvent.press(
        screen.getByTestId("nursing-log-edit-save")
    );

    // ensure new values are on the page...
    expect(screen.getByText(await decryptData(editedLog.left_amount), {exact: false})).toBeTruthy();
    expect(screen.getByText(await decryptData(editedLog.right_amount), {exact: false})).toBeTruthy();
    expect(screen.getByText(await decryptData(editedLog.left_duration), {exact: false})).toBeTruthy();
    expect(screen.getByText(await decryptData(editedLog.right_duration), {exact: false})).toBeTruthy();
    expect(screen.getByText(await decryptData(editedLog.note), {exact: false})).toBeTruthy();
    // ...and that the previous values are not
    expect(async () => screen.getByText(await decryptData(log.left_amount), {exact: false})).rejects.toThrow();
    expect(async () => screen.getByText(await decryptData(log.right_amount), {exact: false})).rejects.toThrow();
    expect(async () => screen.getByText(await decryptData(log.left_duration), {exact: false})).rejects.toThrow();
    expect(async () => screen.getByText(await decryptData(log.right_duration), {exact: false})).rejects.toThrow();
    expect(async () => screen.getByText(await decryptData(log.note), {exact: false})).rejects.toThrow();
}
