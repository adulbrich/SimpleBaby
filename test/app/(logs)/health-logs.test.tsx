import HealthLogsView from "@/app/(logs)/health-logs";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import { getActiveChildData } from "@/library/utils";
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
import EditLogPopup from "@/components/edit-log-popup";


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
    getActiveChildData: jest.fn(async () => ({ success: true, childId: true })),
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

jest.mock("@/components/edit-log-popup", () => {
    const View = jest.requireActual("react-native").View;
    return jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
});


const NOW = (new Date).getTime();
const TEST_CHILD_ID = "test child id";
const TEST_LOGS = [{
    id: "test log id 1",
    child_id: TEST_CHILD_ID,
    category: "Growth",
    growth_length: "test growth length U2FsdGVkX1",
    growth_weight: "test growth weight U2FsdGVkX1",
    growth_head: "test growth head U2FsdGVkX1",
    date: (new Date(NOW - 1*24*60*60*1000)).toISOString(),
    note: "test note 1 U2FsdGVkX1",
    test_category: "growth",
}, {
    id: "test log id 2",
    child_id: TEST_CHILD_ID,
    category: "Activity",
    activity_type: "test activity type U2FsdGVkX1",
    activity_duration: "test activity duration U2FsdGVkX1",
    date: (new Date(NOW - 2*24*60*60*1000)).toISOString(),
    note: "test note 2 U2FsdGVkX1",
    test_category: "activity",
}, {
    id: "test log id 3",
    child_id: TEST_CHILD_ID,
    category: "Meds",
    meds_name: "test meds name U2FsdGVkX1",
    meds_amount: "test meds amount U2FsdGVkX1",
    date: (new Date(NOW - 3*24*60*60*1000)).toISOString(),
    note: "",
    test_category: "meds",
}, {
    id: "test log id 4",
    child_id: TEST_CHILD_ID,
    category: "Vaccine",
    vaccine_name: "test vaccine name U2FsdGVkX1",
    vaccine_location: "test vaccine location U2FsdGVkX1",
    date: (new Date(NOW - 4*24*60*60*1000)).toISOString(),
    note: "",
    test_category: "vaccine",
}, {
    id: "test log id 5",
    child_id: TEST_CHILD_ID,
    category: "Other",
    other_name: "test other name U2FsdGVkX1",
    other_description: "test other description U2FsdGVkX1",
    date: (new Date(NOW - 5*24*60*60*1000)).toISOString(),
    note: "",
    test_category: "other",
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


describe("Health logs screen", () => {

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
        (EditLogPopup as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Catch getActiveChildData() error", async () => {
        const testErrorMessage = "testErrorGetID";
    
        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(logs)/health-logs.tsx -> fetchHealthLogs()
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );
        await catchLoadingError(testErrorMessage);
    }, 10000);

    test("Catch supabase select error", async () => {
        const testErrorMessage = "test error";
    
        // supabase.from().select().eq().order() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(logs)/health-logs.tsx -> fetchHealthLogs()
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
        await catchNoLogs("You don't have any health logs yet!");
    });

    test("Renders no logs (specific child)", async () => {
        const testChildName = "test child name";
        // supabase.from().select().eq().order() should be mocked to return:
        // { data: /* falsy value */ }
        // This should cause a notification to the user of no logs found to be displayed
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementationOnce(
            async () => ({})
        );
        
        // library/utils -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childId: /* truthy value */, childName: /* test value */ }
        // This is to track the test value passed as childName
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childId: true, childName: testChildName })
        );
        await catchNoLogs(`You don't have any health logs for ${testChildName} yet!`);
    });

    test("Renders log buttons", rendersLogButtons, 10000);

    test("Catches decryption error", catchDecryptionError);

    test("Renders log values", rendersLogs);

    test("Displays delete log confirmation", async () => {
        render(<HealthLogsView/>);
        await screen.findByTestId("health-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            await userEvent.press(
                screen.getByTestId(`health-logs-delete-button-${log.id}`)
            );

            // Alert.alert called by health-logs.tsx -> handleDelete()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Delete Entry");
            expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe("Are you sure you want to delete this log?");
            expect((Alert.alert as jest.Mock).mock.calls[0][2][0].text).toBe("Cancel");  // cancel button
            expect((Alert.alert as jest.Mock).mock.calls[0][2][1].text).toBe("Delete");  // delete button
        }
    });

    test("Catches delete log error", async () => catchDeleteError(() =>
        // supabase.from().delete().eq() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in callback defined in app/(logs)/health-logs.tsx -> handleDelete
        (supabase.from("").delete().eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        )
    ));

    test("Deletes log", deletesLog);

    test("Displays edit log", async () => {
        render(<HealthLogsView/>);
        await screen.findByTestId("health-logs");  // wait for log list to render

        // open edit log pop-up
        await userEvent.press(
            screen.getByTestId(`health-logs-edit-button-${TEST_LOGS[0].id}`)
        );
                        
        // ensure popup is in DOM
        expect(screen.getByTestId("health-logs-edit-popup")).toBeTruthy();
        // Ensure popup has been shown
        expect((EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].popupVisible).toBe(true);
    });

    test("Passes current values to edit log pop-up", async () => {
        render(<HealthLogsView/>);
        await screen.findByTestId("health-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // open edit log pop-up
            await userEvent.press(
                screen.getByTestId(`health-logs-edit-button-${log.id}`)
            );
                        
            // retrieve current editingLog from <EditingLogPopup/>
            const editingLog = (EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].editingLog;
            
            // check field values
            expect(editingLog.note.value).toBe(await decryptData(log.note));
            
            if (log.test_category === "growth") {
                expect(editingLog.growth_head.value)
                    .toBe(await decryptData(log.growth_head as string));
                expect(editingLog.growth_length.value)
                    .toBe(await decryptData(log.growth_length as string));
                expect(editingLog.growth_weight.value)
                    .toBe(await decryptData(log.growth_weight as string));
            } else if (log.test_category === "activity") {
                expect(editingLog.activity_type.value)
                    .toBe(await decryptData(log.activity_type as string));
                expect(editingLog.activity_duration.value)
                    .toBe(await decryptData(log.activity_duration as string));
            } else if (log.test_category === "meds") {
                expect(editingLog.meds_name.value) 
                    .toBe(await decryptData(log.meds_name as string));
                expect(editingLog.meds_amount.value)
                    .toBe(await decryptData(log.meds_amount as string));
            } else if (log.test_category === "vaccine") {
                expect(editingLog.vaccine_name.value)
                    .toBe(await decryptData(log.vaccine_name as string));
                expect(editingLog.vaccine_location.value)
                    .toBe(await decryptData(log.vaccine_location as string));
            } else if (log.test_category === "other") {
                expect(editingLog.other_name.value)
                    .toBe(await decryptData(log.other_name as string));
                expect(editingLog.other_description.value)
                    .toBe(await decryptData(log.other_description as string));
            }
        }
    });

    test("Catch encryption error edit log", async () => {
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<HealthLogsView/>);
        await screen.findByTestId("health-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            // library/crypto -> encryptData() should be mocked to throw an error
            // This should cause error handling in callback defined in app/(logs)/health-logs.tsx -> handleSaveEdit
            (encryptData as jest.Mock).mockImplementationOnce(
                async () => { throw new Error; }
            );

            // open edit log pop-up
            await userEvent.press(
                screen.getByTestId(`health-logs-edit-button-${log.id}`)
            );
            
            // submit edit
            const submitCallback = (EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].handleSubmit;
            await act(async () => submitCallback());

            // Alert.alert called by health-logs.tsx -> handleSaveEdit()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Something went wrong during save.");
            (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
        }
    });

    test("Catch supabase error edit log", async () => catchUpdateError(() =>
        // supabase.from().update().eq() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(logs)/health-logs.tsx -> handleSaveEdit
        (supabase.from("").update({}).eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        )
    ));

    test("Updates remotely stored logs", async () => updateRemoteLogs(
        (supabase.from("").update as unknown as jest.Mock).mockClear(),
        0,
        (supabase.from("").update({}).eq as unknown as jest.Mock).mockClear(),
        1
    ));

    test("Updates displayed logs", async () => updateDisplayedLogs((newLogs) => {
        (supabase.from("").select().eq("", "").order as jest.Mock).mockImplementation(
            async () => ({ data: newLogs })
        );
    }));
});


describe("health logs screen (guest mode)", () => {

    beforeAll(() => {
        // change to guest mode
        (useAuth as jest.Mock).mockImplementation(() => ({isGuest: true}));
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (Alert.alert as jest.Mock).mockClear();
        (EditLogPopup as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Catch getLocalActiveChildId() error", async () => {
        const testErrorMessage = "testErrorGetID";
        // library/local-store.ts -> getActiveChildId() should be mocked to throw an error
        // This should cause error handling in app/(logs)/health-logs.tsx -> fetchHealthLogs()
        (getLocalActiveChildId as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testErrorMessage); }
        );
        await catchLoadingError(testErrorMessage);
    });

    test("Catch invalid childID", async () => {
        // library/local-store.ts -> getActiveChildId() should be mocked to return:
        // /* falsy value */
        // This should cause error handling in app/(logs)/health-logs.tsx -> fetchHealthLogs()
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
        await catchNoLogs("You don't have any health logs yet!");
    });

    test("Renders log buttons (guest)", rendersLogButtons);

    test("Catches decryption error (guest)", catchDecryptionError);

    test("Renders log values (guest)", rendersLogs);

    test("Catches delete log error (guest)", async () => catchDeleteError(() =>
        // library/local-store.ts -> deleteRow() should be mocked to return:
        // /* falsy value */
        // This should cause error handling in callback defined in app/(logs)/health-logs.tsx -> handleDelete
        (deleteRow as jest.Mock).mockImplementationOnce(
            async () => false
        )
    ));

    test("Deletes log (guest)", deletesLog);

    test("Catch supabase error edit log", async () => catchUpdateError(() =>
        // library/local-store.ts -> updateRow should be mocked to return:
        // /* falsy value */
        // This should cause error handling in app/(logs)/health-logs.tsx -> handleSaveEdit
        (updateRow as jest.Mock).mockImplementationOnce(
            async () => false
        )
    ));

    test("Updates remotely stored logs", async () => updateRemoteLogs(
        (updateRow as jest.Mock).mockClear(),
        2,  // updateRow() is called wit the data object as the 3rd argument
        (updateRow as jest.Mock).mockClear(),
        1  // updateRow() is called wit the log id as the 2nd argument
    ));

    test("Updates displayed logs", async () => updateDisplayedLogs((newLogs) => {
        (listRows as jest.Mock).mockImplementationOnce(
            async () => newLogs
        );
    }));
});


async function catchLoadingError(testErrorMessage: string) {
    jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

    render(<HealthLogsView/>);

    expect(await screen.findByTestId("health-logs-loading-error")).toBeTruthy();  // wait for loading to finish
    expect(screen.getByText(testErrorMessage, {exact: false})).toBeTruthy();  // specific error is displayed
}

async function catchInvalidChildId() {
    jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

    render(<HealthLogsView/>);

    expect(await screen.findByTestId("health-logs-loading-error")).toBeTruthy();  // wait for loading to finish
    expect(screen.getByText("No active child selected (guest mode)", {exact: false})).toBeTruthy();  // error is displayed
}

async function catchNoLogs(message: string) {
    render(<HealthLogsView/>);
    expect(await screen.findByText(message)).toBeTruthy();
}

async function rendersLogButtons() {
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        expect(screen.getByTestId(`health-logs-edit-button-${log.id}`)).toBeTruthy();
        expect(screen.getByTestId(`health-logs-delete-button-${log.id}`)).toBeTruthy();
    }
}

async function catchDecryptionError() {
    const testError = new Error("test error");

    // library/crypto -> decryptData() should be mocked to throw an error
    // This should cause error handling in app/(logs)/health-logs.tsx -> fetchHealthLogs() -> safeDecrypt()
    (decryptData as jest.Mock).mockImplementationOnce(
        async () => { throw testError; }
    );

    jest.spyOn(console, "warn").mockImplementation(() => null);  // suppress console warnings from within the tested code
    
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    expect(screen.getByText(`[Decryption Failed]: ${testError}`, {exact: false})).toBeTruthy();
}

async function rendersLogs() {
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        expect(screen.getByText(format(new Date(log.date), 'MMM dd, yyyy'), {exact: false})).toBeTruthy();
        if (log.note) expect(screen.getByText(await decryptData(log.note), {exact: false})).toBeTruthy();
        // the remaining displayed data depends on what category the log is
        if (log.test_category === "growth") {
            expect(screen.getByText(await decryptData(log.growth_head as string), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.growth_length as string), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.growth_weight as string), {exact: false})).toBeTruthy();
        } else if (log.test_category === "activity") {
            expect(screen.getByText(await decryptData(log.activity_type as string), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.activity_duration as string), {exact: false})).toBeTruthy();
        } else if (log.test_category === "meds") {
            expect(screen.getByText(await decryptData(log.meds_name as string), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.meds_amount as string), {exact: false})).toBeTruthy();
        } else if (log.test_category === "vaccine") {
            expect(screen.getByText(await decryptData(log.vaccine_name as string), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.vaccine_location as string), {exact: false})).toBeTruthy();
        } else if (log.test_category === "other") {
            expect(screen.getByText(await decryptData(log.other_name as string), {exact: false})).toBeTruthy();
            expect(screen.getByText(await decryptData(log.other_description as string), {exact: false})).toBeTruthy();
        }
    }
}

async function catchDeleteError(mockFailingDelete: () => void) {
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        mockFailingDelete();

        await userEvent.press(
            screen.getByTestId(`health-logs-delete-button-${log.id}`)
        );

        // Alert.alert called by health-logs.tsx -> handleDelete()
        const deleteHandler = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress as () => Promise<void>;
        await act(deleteHandler);  // call delete handler (user confirms delete)

        // Alert.alert called by health-logs.tsx -> handleDelete() -> anonomous callback
        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Error deleting log");
        
        (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
    }
}

async function deletesLog() {
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        // ensure log is still present
        const displayedValues = [
            format(new Date(log.date), 'MMM dd, yyyy'),
            log.note ? await decryptData(log.note) : null,
            // growth category values
            log.growth_head ? await decryptData(log.growth_head) : null,
            log.growth_length ? await decryptData(log.growth_length) : null,
            log.growth_weight ? await decryptData(log.growth_weight) : null,
            // activity category values
            log.activity_type ? await decryptData(log.activity_type) : null,
            log.activity_duration ? await decryptData(log.activity_duration) : null,
            // meds category values
            log.meds_name ? await decryptData(log.meds_name) : null,
            log.meds_amount ? await decryptData(log.meds_amount) : null,
            // vaccine category values
            log.vaccine_name ? await decryptData(log.vaccine_name) : null,
            log.vaccine_location ? await decryptData(log.vaccine_location) : null,
            // other category values
            log.other_name ? await decryptData(log.other_name) : null,
            log.other_description ? await decryptData(log.other_description) : null,
        ].filter(value => value !== null);  // remove null values

        for (const text of displayedValues as unknown as string) {
            expect(await screen.getByText(text, {exact: false})).toBeTruthy();
        }

        // press delete
        await userEvent.press(
            screen.getByTestId(`health-logs-delete-button-${log.id}`)
        );
        // Alert.alert called by health-logs.tsx -> handleDelete()
        const deleteHandler = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress as () => Promise<void>;
        await act(deleteHandler);  // call delete handler (user confirms delete)

        // confirm all log details are no longer present
        for (const text of displayedValues as unknown as string) {
            expect(async () => screen.getByText(text, {exact: false})).rejects.toThrow();
        }
        
        (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
    }
}

async function catchUpdateError(mockFailingEdit: () => void) {
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        mockFailingEdit();
    
        // open edit log pop-up
        await userEvent.press(
            screen.getByTestId(`health-logs-edit-button-${log.id}`)
        );

        // submit edit
        const submitCallback = (EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].handleSubmit;
        await act(async () => submitCallback());

        // Alert.alert called by health-logs.tsx -> handleSaveEdit()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Failed to update log");
        (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
    }
}

async function updateRemoteLogs(dataMock: jest.Mock, dataArgI: number, idMock: jest.Mock, idArgI: number) {
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {

        const editFields = [
            log.note ? "note" : null,
            // growth category values
            log.test_category === "growth" ? "growth_head" : null,
            log.test_category === "growth" ? "growth_length" : null,
            log.test_category === "growth" ? "growth_weight" : null,
            // activity category values
            log.test_category === "activity" ? "activity_type" : null,
            log.test_category === "activity" ? "activity_duration" : null,
            // meds category values
            log.test_category === "meds" ? "meds_name" : null,
            log.test_category === "meds" ? "meds_amount" : null,
            // vaccine category values
            log.test_category === "vaccine" ? "vaccine_name" : null,
            log.test_category === "vaccine" ? "vaccine_location" : null,
            // other category values
            log.test_category === "other" ? "other_name" : null,
            log.test_category === "other" ? "other_description" : null,
        ].filter(value => value !== null);  // remove null values

        // clear .mock.calls array each loop
        idMock.mockClear();
        dataMock.mockClear();

        // open edit log pop-up
        await userEvent.press(
            screen.getByTestId(`health-logs-edit-button-${log.id}`)
        );
                
        // retrieve setLog callback from <EditingLogPopup/>
        const setLog = (EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].setLog;
        
        // clear set new field values from <EditLogPopup/>
        const editedFields = Object.fromEntries(
            editFields.map(field => (
                [field, `edited ${field} ${log.id}`]
            ))
        );
        await act(async () =>
            setLog((prev: object) => ({
                ...prev,
                ...editedFields,
            }))
        );

        // submit edit
        const submitCallback = (EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].handleSubmit;
        await act(async () => submitCallback());

        // Ensure mock was called with correct (updated) values
        const submitedData = dataMock.mock.calls[0][dataArgI];
        for (const [field, submittedValue] of Object.entries(submitedData)) {
            if (editFields.includes(field)) {
                expect(submittedValue).toBe(await encryptData(`edited ${field} ${log.id}`));
            } else {
                expect(submittedValue).toBe(null);
            }
        }
        // Ensure mock was called with correct id
        expect(idMock.mock.calls[0][idArgI])
            .toBe(log.id);
    }
}

async function updateDisplayedLogs(mockFetchLogs: (newLogs: object) => void) {
    const log = TEST_LOGS[0];  // this test set up for a log with growth category

    const editedLog = {
        ...log,
        growth_head: "edited growth head U2FsdGVkX1",
        growth_length: "edited growth length U2FsdGVkX1",
        growth_weight: "edited growth weight U2FsdGVkX1",
        note: "edited note U2FsdGVkX1",
    };
    const updatedLogs = [editedLog].concat(  // join new edited log
        (TEST_LOGS as any[]).filter((item) => item !== log)  // and remove previous log
    );
    
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    // open edit log pop-up
    await userEvent.press(
        screen.getByTestId(`health-logs-edit-button-${log.id}`)
    );

    // update the mock to return 'updated' logs
    mockFetchLogs(updatedLogs);

    // submit edit
    const submitCallback = (EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].handleSubmit;
    await act(async () => submitCallback());

    await act(async () => {
        // ensure new values are on the page...
        expect(screen.getByText(await decryptData(editedLog.growth_head), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(editedLog.growth_length), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(editedLog.growth_weight), {exact: false})).toBeTruthy();
        expect(screen.getByText(await decryptData(editedLog.note), {exact: false})).toBeTruthy();
        // ...and that the previous values are not
        expect(async () => screen.getByText(await decryptData(log.growth_head as string), {exact: false})).rejects.toThrow();
        expect(async () => screen.getByText(await decryptData(log.growth_length as string), {exact: false})).rejects.toThrow();
        expect(async () => screen.getByText(await decryptData(log.growth_weight as string), {exact: false})).rejects.toThrow();
        expect(async () => screen.getByText(await decryptData(log.note), {exact: false})).rejects.toThrow();
    });
}
