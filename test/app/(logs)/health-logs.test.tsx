import HealthLogsView from "@/app/(logs)/health-logs";
import { render, screen, act } from "@testing-library/react-native";
import supabase from "@/library/supabase-client";
import { encryptData } from "@/library/crypto";
import { format } from 'date-fns';
import { Alert } from "react-native";
import { useAuth } from "@/library/auth-provider";
import {
	updateRow,
	deleteRow,
} from "@/library/local-store";
import EditLogPopup from "@/components/edit-log-popup";
import LogItem from "@/components/log-item";
import { fetchLogs } from "@/library/log-functions";


jest.mock("@/library/supabase-client", () => {
    const del = jest.fn(async () => ({}));
    const updateId = jest.fn(async () => ({}));
    const updateData = jest.fn(() => ({ eq: updateId }));
    return ({
        from: () => ({
            delete: () => ({
                eq: del,
            }),
            update: updateData,
        }),
    });
});

jest.mock("@/library/crypto", () => ({
    encryptData: jest.fn(async (string) => `Encrypted: ${string}`),
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
    deleteRow: jest.fn(async () => true),
    updateRow: jest.fn(async () => true),
}));

jest.mock("@/components/edit-log-popup", () => {
    const View = jest.requireActual("react-native").View;
    return jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
});

jest.mock("@/components/log-item.tsx", () => {
    const View = jest.requireActual("react-native").View;
    return jest.fn(({id}: {id?: string}) => (<View testID={`log-item-${id}`}></View>));
});

jest.mock("@/library/log-functions", () => ({
    fetchLogs: jest.fn(),
}));


const NOW = (new Date).getTime();
const BASE_LOG = {
    growth_length: "",
    growth_weight: "",
    growth_head: "",
    activity_type: "",
    activity_duration: "",
    meds_name: "",
    meds_amount: "",
    vaccine_name: "",
    vaccine_location: "",
    other_name: "",
    other_description: "",
};
const TEST_LOGS = [{
    ...BASE_LOG,
    id: "test log id 1",
    category: "Growth",
    growth_length: "test growth length",
    growth_weight: "test growth weight",
    growth_head: "test growth head",
    date: new Date(NOW - 1*24*60*60*1000),
    note: "test note 1",
    test_category: "growth",
}, {
    ...BASE_LOG,
    id: "test log id 2",
    category: "Activity",
    activity_type: "test activity type",
    activity_duration: "test activity duration",
    date: new Date(NOW - 2*24*60*60*1000),
    note: "test note 2",
    test_category: "activity",
}, {
    ...BASE_LOG,
    id: "test log id 3",
    category: "Meds",
    meds_name: "test meds name",
    meds_amount: "test meds amount",
    date: new Date(NOW - 3*24*60*60*1000),
    note: "",
    test_category: "meds",
}, {
    ...BASE_LOG,
    id: "test log id 4",
    category: "Vaccine",
    vaccine_name: "test vaccine name",
    vaccine_location: "test vaccine location",
    date: new Date(NOW - 4*24*60*60*1000),
    note: "",
    test_category: "vaccine",
}, {
    ...BASE_LOG,
    id: "test log id 5",
    category: "Other",
    other_name: "test other name",
    other_description: "test other description",
    date: new Date(NOW - 5*24*60*60*1000),
    note: "",
    test_category: "other",
}];

// set default mocks to return test data
(fetchLogs as jest.Mock).mockImplementation(
    async () => ({ success: true, data: TEST_LOGS })
);


const pressButton = async (id: string, button: "delete" | "edit") => {
    const logItems = (LogItem as jest.Mock).mock.calls;
    const logItemProps = logItems.find(call => call[0].id === id)[0];
    if (button === "delete") await act(async () => logItemProps.onDelete());
    if (button === "edit") await act(async () => logItemProps.onEdit());
};


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
        (LogItem as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Catch fetchLogs() error", async () => {
        const testErrorMessage = "test error";
    
        // library/log-functions.ts -> fetchLogs() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(logs)/health-logs.tsx -> fetchHealthLogs()
        (fetchLogs as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<HealthLogsView/>);

        expect(await screen.findByTestId("health-logs-loading-error")).toBeTruthy();  // wait for loading to finish
        expect(screen.getByText(testErrorMessage, {exact: false})).toBeTruthy();  // specific error is displayed
    }, 10000);

    test("Renders no logs (generic)", async () => {
        // library/log-functions.ts -> fetchLogs() should be mocked to return:
        // { success: /* truthy value */, data: /* falsy value */ }
        // This should cause a notification to the user of no logs found to be displayed
        (fetchLogs as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, data: [] })
        );
        await catchNoLogs("You don't have any health logs yet!");
    });

    test("Renders no logs (specific child)", async () => {
        const testChildName = "test child name";
        // library/log-functions.ts -> fetchLogs() should be mocked to return:
        // { success: /* truthy value */, data: /* falsy value */, childName: /* truthy string */ }
        // This should cause a notification to the user of no logs found to be displayed with the child name
        (fetchLogs as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, data: [], childName: testChildName })
        );
        await catchNoLogs(`You don't have any health logs for ${testChildName} yet!`);
    });

    test("Renders log buttons", rendersLogItems, 10000);

    test("Renders log values", async () => {
        render(<HealthLogsView/>);
        await screen.findByTestId("health-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            const logItems = (LogItem as jest.Mock).mock.calls;
            const logItemProps = logItems.find(call => call[0].id === log.id)[0];
            const displayValues = logItemProps.logData.map((item: any) => item.value);
            
            expect(displayValues.includes(format(new Date(log.date), 'MMM dd, yyyy'))).toBeTruthy();
            if (log.note) expect(displayValues.includes(log.note)).toBeTruthy();
            // the remaining displayed data depends on what category the log is
            if (log.test_category === "growth") {
                expect(displayValues.includes(log.growth_head as string)).toBeTruthy();
                expect(displayValues.includes(log.growth_length as string)).toBeTruthy();
                expect(displayValues.includes(log.growth_weight as string)).toBeTruthy();
            } else if (log.test_category === "activity") {
                expect(displayValues.includes(log.activity_type as string)).toBeTruthy();
                expect(displayValues.includes(log.activity_duration as string)).toBeTruthy();
            } else if (log.test_category === "meds") {
                expect(displayValues.includes(log.meds_name as string)).toBeTruthy();
                expect(displayValues.includes(log.meds_amount as string)).toBeTruthy();
            } else if (log.test_category === "vaccine") {
                expect(displayValues.includes(log.vaccine_name as string)).toBeTruthy();
                expect(displayValues.includes(log.vaccine_location as string)).toBeTruthy();
            } else if (log.test_category === "other") {
                expect(displayValues.includes(log.other_name as string)).toBeTruthy();
                expect(displayValues.includes(log.other_description as string)).toBeTruthy();
            }
        }
    });

    test("Displays delete log confirmation", async () => {
        render(<HealthLogsView/>);
        await screen.findByTestId("health-logs");  // wait for log list to render

        for (const log of TEST_LOGS) {
            await pressButton(log.id, "delete");

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
        await pressButton(TEST_LOGS[0].id, "edit");
                        
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
            await pressButton(log.id, "edit");
                        
            // retrieve current editingLog from <EditingLogPopup/>
            const editingLog = (EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].editingLog;
            
            // check field values
            expect(editingLog.note.value).toBe(log.note);
            
            if (log.test_category === "growth") {
                expect(editingLog.growth_head.value)
                    .toBe(log.growth_head as string);
                expect(editingLog.growth_length.value)
                    .toBe(log.growth_length as string);
                expect(editingLog.growth_weight.value)
                    .toBe(log.growth_weight as string);
            } else if (log.test_category === "activity") {
                expect(editingLog.activity_type.value)
                    .toBe(log.activity_type as string);
                expect(editingLog.activity_duration.value)
                    .toBe(log.activity_duration as string);
            } else if (log.test_category === "meds") {
                expect(editingLog.meds_name.value) 
                    .toBe(log.meds_name as string);
                expect(editingLog.meds_amount.value)
                    .toBe(log.meds_amount as string);
            } else if (log.test_category === "vaccine") {
                expect(editingLog.vaccine_name.value)
                    .toBe(log.vaccine_name as string);
                expect(editingLog.vaccine_location.value)
                    .toBe(log.vaccine_location as string);
            } else if (log.test_category === "other") {
                expect(editingLog.other_name.value)
                    .toBe(log.other_name as string);
                expect(editingLog.other_description.value)
                    .toBe(log.other_description as string);
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
            await pressButton(log.id, "edit");
            
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

    test("Updates displayed logs", async () => updateDisplayedLogs());
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
        (LogItem as jest.Mock).mockClear();
        // to revert to showing errors:
        jest.spyOn(console, "error").mockRestore();
    });

    test("Renders log buttons (guest)", rendersLogItems);

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

    test("Updates displayed logs", async () => updateDisplayedLogs());
});


async function catchNoLogs(message: string) {
    render(<HealthLogsView/>);
    expect(await screen.findByText(message)).toBeTruthy();
}

async function rendersLogItems() {
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        expect(screen.getByTestId(`log-item-${log.id}`)).toBeTruthy();
    }
}

async function catchDeleteError(mockFailingDelete: () => void) {
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        mockFailingDelete();

        // press delete
        await pressButton(log.id, "delete");

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
        let logItems = (LogItem as jest.Mock).mock.calls;
        expect(logItems.find(call => call[0].id === log.id)).toBeTruthy();

        // press delete
        await pressButton(log.id, "delete");

        (LogItem as jest.Mock).mockClear();  // clear the calls of <LogItem/>
        logItems = (LogItem as jest.Mock).mock.calls;  // track which items are re-rendered from this point onwards

        // Alert.alert called by health-logs.tsx -> handleDelete()
        const deleteHandler = (Alert.alert as jest.Mock).mock.calls[0][2][1].onPress as () => Promise<void>;
        await act(deleteHandler);  // call delete handler (user confirms delete)

        // confirm deleted log was not rerendered
        expect(logItems.find(call => call[0].id === log.id)).toBeFalsy();
        
        (Alert.alert as jest.Mock).mockClear();  // clear .mock.calls array for next loop
    }
}

async function catchUpdateError(mockFailingEdit: () => void) {
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    for (const log of TEST_LOGS) {
        mockFailingEdit();
    
        // open edit log pop-up
        await pressButton(log.id, "edit");

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
            "date",
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
        const editedDate = new Date((new Date(log.date)).getTime() + 5*24*60*60*1000);

        // clear .mock.calls array each loop
        idMock.mockClear();
        dataMock.mockClear();

        // open edit log pop-up
        await pressButton(log.id, "edit");
                
        // retrieve setLog callback from <EditingLogPopup/>
        const setLog = (EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].setLog;
        
        // clear set new field values from <EditLogPopup/>
        const editedFields = Object.fromEntries(
            editFields.map(field => (
                field === "date" ?
                    [field, editedDate]
                :
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
                if (field === "date") {
                    expect(submittedValue).toBe(editedDate.toISOString());
                } else {
                    expect(submittedValue).toBe(await encryptData(`edited ${field} ${log.id}`));
                }
            } else {
                expect(submittedValue).toBe(null);
            }
        }
        // Ensure mock was called with correct id
        expect(idMock.mock.calls[0][idArgI])
            .toBe(log.id);
    }
}

async function updateDisplayedLogs() {
    const log = TEST_LOGS[0];  // this test set up for a log with growth category

    const editedLog = {
        ...log,
        growth_head: "edited growth head",
        growth_length: "edited growth length",
        growth_weight: "edited growth weight",
        note: "edited note",
    };
    const updatedLogs = [editedLog].concat(  // join new edited log
        (TEST_LOGS as any[]).filter((item) => item !== log)  // and remove previous log
    );
    
    render(<HealthLogsView/>);
    await screen.findByTestId("health-logs");  // wait for log list to render

    // open edit log pop-up
    await pressButton(log.id, "edit");

    // library/log-functions.ts -> fetchLogs() should be mocked to return:
    // { success: /* truthy value */, data: /* updated logs */ }
    // This should not cause any errors
    (fetchLogs as jest.Mock).mockImplementationOnce(
        async () => ({ success: true, data: updatedLogs })
    );

    // clear the calls of <LogItem/> to track which items are re-rendered from this point onwards
    (LogItem as jest.Mock).mockClear();

    // submit edit
    const submitCallback = (EditLogPopup as jest.Mock).mock.calls.slice(-1)[0][0].handleSubmit;
    await act(async () => submitCallback());

    await act(async () => {
        const logItems = (LogItem as jest.Mock).mock.calls;
        const logItemProps = logItems.find(call => call[0].id === log.id)[0];
        const displayValues = logItemProps.logData.map((item: any) => item.value);
        // ensure new values were passed...
        expect(displayValues.includes(editedLog.growth_head)).toBeTruthy();
        expect(displayValues.includes(editedLog.growth_length)).toBeTruthy();
        expect(displayValues.includes(editedLog.growth_weight)).toBeTruthy();
        expect(displayValues.includes(editedLog.note)).toBeTruthy();
        // ...and that the previous values are not
        expect(displayValues.includes(log.growth_head as string)).toBeFalsy();
        expect(displayValues.includes(log.growth_length as string)).toBeFalsy();
        expect(displayValues.includes(log.growth_weight as string)).toBeFalsy();
        expect(displayValues.includes(log.note)).toBeFalsy();
    });
}
