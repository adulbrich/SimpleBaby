import { render, screen, userEvent, act } from "@testing-library/react-native";
import Health from "@/app/(trackers)/health";
import { Alert } from "react-native";
import { router } from "expo-router";
import HealthModule, { HealthCategory } from "@/components/health-module";
import { field, saveLog } from "@/library/log-functions";
import { formatStringList } from "@/library/utils";


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

jest.mock("@/components/health-module.tsx", () => {
    const View = jest.requireActual("react-native").View;
    const HealthModuleMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return HealthModuleMock;
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


type HealthInputs = {
    category?: HealthCategory;
    growth?: { length?: string; weight?: string; head?: string; };
    activity?: { type: string; duration: string; };
    meds?: { name?: string; amount?: string; time_taken?: Date; };
    vaccine?: { name?: string; location?: string; };
    other?: { name?: string; description?: string; };
    date?: Date;
    note?: string;
};

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
    note,
} : HealthInputs) {
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
    if (note) {
        await userEvent.type(
            screen.getByTestId("health-note-entry"),
            note
        );
    }
}


describe("Track health screen", () => {
    beforeEach(() => {
        // to clear the .mock.calls arrays
        (HealthModule as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
        jest.spyOn(console, "error").mockClear();
        (router.dismissTo as jest.Mock).mockClear();
        (saveLog as jest.Mock).mockClear();
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
        const testFormattedList = "test list";

        render(<Health/>);  // will default to growth category
        
        const testInputs = [
            { category: "Growth" as HealthCategory, growth: { length: "", weight: "", head: "" } },
            { category: "Growth" as HealthCategory, growth: { length: " ", weight: " ", head: " " } },
            { category: "Growth" as HealthCategory, growth: { length: "x", weight: "y", head: "" } },
            { category: "Growth" as HealthCategory, growth: { length: "x", weight: "", head: "y" } },
            { category: "Growth" as HealthCategory, growth: { length: "", weight: "x", head: "y" } },
            { category: "Activity" as HealthCategory, activity: { type: "", duration: "" } },
            { category: "Activity" as HealthCategory, activity: { type: " ", duration: " " } },
            { category: "Activity" as HealthCategory, activity: { type: "x", duration: "" } },
            { category: "Activity" as HealthCategory, activity: { type: "", duration: "x" } },
            { category: "Meds" as HealthCategory, meds: { name: "", amount: "", time_taken: new Date() } },
            { category: "Meds" as HealthCategory, meds: { name: " ", amount: " ", time_taken: new Date() } },
            { category: "Meds" as HealthCategory, meds: { name: "x", amount: "", time_taken: new Date() } },
            { category: "Meds" as HealthCategory, meds: { name: "", amount: "x", time_taken: new Date() } },
            { category: "Vaccine" as HealthCategory, vaccine: { name: "" } },
            { category: "Vaccine" as HealthCategory, vaccine: { name: " " } },
            { category: "Other" as HealthCategory, other: { name: "" } },
            { category: "Other" as HealthCategory, other: { name: " " } },
        ];

        for (const testInput of testInputs) {
            (Alert.alert as jest.Mock).mockClear();  // clear calls between iterations

            // library/utils.ts -> formatStringList() should be mocked to return a test string
            // This is to ensure its return value is displayed properly
            (formatStringList as jest.Mock).mockImplementationOnce(
                () => testFormattedList
            );

            // fill in test inputs
            await setHealthInputs(testInput);
            await userEvent.press(
                screen.getByTestId("health-save-log-button")
            );

            const category = Object.values(testInput)[0];
            const fields = Object.values(testInput)[1];
            expect(formatStringList as jest.Mock).toHaveBeenLastCalledWith(
                Object.entries(fields).map(([field, value]) =>
                    value instanceof Date || (value as string).trim() ? null :
                    category === "Vaccine" && field === "name" ? "vaccine name" :
                    category === "Other" && field === "name" ? "health event name" :
                    field
                ).filter(field => field)
            );

            // error message generated by app/(trackers)/health.tsx -> checkInputs()
            // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
            expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Missing Information`);
            expect((Alert.alert as jest.Mock).mock.calls[0][1]
                .startsWith(`Failed to save the `)).toBeTruthy();
            expect((Alert.alert as jest.Mock).mock.calls[0][1]
                .endsWith(` Health log. You are missing the following fields: ${testFormattedList}.`)).toBeTruthy();
        }
    });

    test("Catch saveLog() error", async () => {
        const testErrorMessage = "test error";

        // library/log-functions.ts -> saveLog() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(trackers)/health.tsx -> handleSaveHealthLog()
        (saveLog as jest.Mock).mockImplementationOnce(
            async () => ({ success: false, error: testErrorMessage })
        );

        render(<Health/>);
        await setHealthInputs({growth: {length: "x", weight: "y", head: "z"}});  // fill in required inputs

        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // error message generated by library/log-functions.ts -> saveLog()
        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Error");
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Failed to save health log: ${testErrorMessage}`);
    });
        
    test("Redirects user on successful submit", async () => {
        render(<Health/>);

        await setHealthInputs({growth: {length: "x", weight: "y", head: "z"}});  // fill in required inputs
        await userEvent.press(
            screen.getByTestId("health-save-log-button")
        );

        // confirm that the expo-router was called to send the user back to the tracker page
        expect((router.dismissTo as jest.Mock)).toHaveBeenLastCalledWith("/(tabs)");
        expect((router.dismissTo as jest.Mock)).toHaveBeenCalledTimes(1);

        // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Success`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Health log saved successfully!`);
    });
        
    test("Saves correct values (growth)", async () =>
        await savesCorrectValues({
            category: "Growth",
            note: "test note",
            date: new Date(),
            growth: {
                length: "test length",
                weight: "test weight",
                head: "test head",
            },
        })
    );
        
    test("Saves correct values (activity)", async () =>
        await savesCorrectValues({
            category: "Activity",
            note: "test note",
            date: new Date(),
            activity: {
                type: "test type",
                duration: "test duration",
            },
        })
    );
        
    test("Saves correct values (meds)", async () =>
        await savesCorrectValues({
            category: "Meds",
            note: "test note",
            date: new Date(),
            meds: {
                name: "test name",
                amount: "test amount",
                time_taken: new Date(),
            },
        })
    );
        
    test("Saves correct values (vaccine)", async () =>
        await savesCorrectValues({
            category: "Vaccine",
            note: "test note",
            date: new Date(),
            vaccine: {
                name: "test name",
                location: "test location",
            },
        })
    );
        
    test("Saves correct values (other)", async () =>
        await savesCorrectValues({
            category: "Other",
            note: "test note",
            date: new Date(),
            other: {
                name: "test name",
                description: "test description",
            },
        })
    );
});


async function savesCorrectValues(values: HealthInputs & { category: HealthCategory }) {
    render(<Health/>);

    // fill inputs
    await setHealthInputs(values);

    // submit log
    await userEvent.press(
        screen.getByTestId("health-save-log-button")
    );

    const savedValues = (saveLog as jest.Mock).mock.calls[0][0].fields;

    // Ensure saveLog() was called with the correct values
    const findfield = (name: string, value: any) =>
        (field: field) => field.dbFieldName === name && field.value === value;
    expect(savedValues.find(findfield("category", values.category))).toBeTruthy();
    expect(savedValues.find(findfield("note", values.note))).toBeTruthy();
    expect(savedValues.find(findfield("date", values.date))).toBeTruthy();

    const category = values.category.toLowerCase();
    const fields = (values as any)[category];
    for (const [field, value] of Object.entries(fields)) {
        expect(savedValues.find(findfield(`${category}_${field}`, value))).toBeTruthy();
    }

    // Ensure that log was saved successfully
    // Alert.alert() called by app/(trackers)/health.tsx -> handleSaveHealthLog()
    expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Success`);
}
