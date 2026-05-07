import HealthModule, { HealthFields } from "@/components/health-module";
import { render, screen, userEvent, act } from "@testing-library/react-native";
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Platform } from "react-native";
import CategoryModule from "@/components/category-module";


jest.mock("@react-native-community/datetimepicker", () => {
    const View = jest.requireActual("react-native").View;
    return {
        __esModule: true,
        default: jest.fn(({testID}: {testID: string}) => <View testID={testID}/>),
        DateTimePickerAndroid: { open: jest.fn() },
    };
});

jest.mock("@/components/category-module", () => {
    const Text = jest.requireActual("react-native").Text;
    const CategoryModuleMock = jest.fn(
        ({testID, selectedCategory}: {testID?: string; selectedCategory: string}) =>
            (<Text testID={testID}>{selectedCategory}</Text>)
    );
    return CategoryModuleMock;
});


/*
 *  setCategoryInput:
 *      Reads update handler from last call to CategoryModule
 *      Calls update handler with provided input
*/
async function setCategoryInput(
    category: string,
 ) {
    // get update callback from most recent call to <CategoryModule/>
    const onCategoryUpdate = (CategoryModule as jest.Mock).mock.lastCall[0].onCategoryUpdate;
    await act(() => onCategoryUpdate?.(category));
}


describe("Health component <HealthModule/>", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (DateTimePicker as jest.Mock).mockClear();
        (DateTimePickerAndroid.open as jest.Mock).mockClear();
    });

    test("Renders category and date inputs", () => {
        render(<HealthModule
            healthFields={{ category: "Other", other: {}, date: new Date() } as HealthFields}
        />);

        expect(screen.getByTestId("health-category-module")).toBeTruthy();
        expect(screen.getByTestId("health-date-button")).toBeTruthy();
    });

    test("Renders growth inputs", () => {
        render(<HealthModule
            healthFields={{ category: "Growth", growth: {}, date: new Date() } as HealthFields}
        />);

        expect(screen.getByTestId("health-growth-length")).toBeTruthy();
        expect(screen.getByTestId("health-growth-weight")).toBeTruthy();
        expect(screen.getByTestId("health-growth-head")).toBeTruthy();
    });

    test("Renders activity inputs", async () => {
        render(<HealthModule
            healthFields={{ category: "Activity", activity: {}, date: new Date() } as HealthFields}
        />);

        expect(screen.getByTestId("health-activity-type")).toBeTruthy();
        expect(screen.getByTestId("health-activity-duration")).toBeTruthy();
    });

    test("Renders meds inputs", async () => {
        render(<HealthModule
            healthFields={{ category: "Meds", meds: { time_taken: new Date() }, date: new Date() } as HealthFields}
        />);

        expect(screen.getByTestId("health-meds-name")).toBeTruthy();
        expect(screen.getByTestId("health-meds-amount")).toBeTruthy();
    });

    test("Renders vaccine inputs", async () => {
        render(<HealthModule
            healthFields={{ category: "Vaccine", vaccine: {}, date: new Date() } as HealthFields}
        />);

        expect(screen.getByTestId("health-vaccine-name")).toBeTruthy();
        expect(screen.getByTestId("health-vaccine-location")).toBeTruthy();
    });

    test("Renders 'other' inputs", async () => {
        render(<HealthModule
            healthFields={{ category: "Other", other: {}, date: new Date() } as HealthFields}
        />);

        expect(screen.getByTestId("health-other-name")).toBeTruthy();
        expect(screen.getByTestId("health-other-description")).toBeTruthy();
    });

    test("Renders provided values", () => {
        const testFieldSets = [
            {
                category: "Growth",
                growth: { length: "test length", weight: "test weight", head: "test head" },
                date: new Date()
            },
            {
                category: "Activity",
                activity: { type: "test type", duration: "test duration" },
                date: new Date()
            },
            {
                category: "Meds",
                meds: { name: "test name", amount: "test amount", time_taken: new Date() },
                date: new Date()
            },
            {
                category: "Vaccine",
                vaccine: { name: "test name", location: "test location" },
                date: new Date()
            },
            {
                category: "Other",
                other: { name: "test name", description: "test description" },
                date: new Date()
            },
        ];
        const { rerender } = render(<HealthModule healthFields={testFieldSets[0] as HealthFields}/>);

        for (const testFields of testFieldSets) {
            // rerender with new values
            rerender(<HealthModule healthFields={testFields as HealthFields}/>);

            // ensure updated category is in <CategoryModule/> props
            const categoryCalls = (CategoryModule as jest.Mock).mock.calls.filter(
                call => call[0].testID === "health-category-module"  // filter calls by test id
            );
            // get props from most recent call
            const category = categoryCalls.slice(-1)[0][0].selectedCategory;
            expect(category).toBe(testFields.category);

            // ensure date is displayed on screen
            const formattedDate = testFields.date.toLocaleDateString();
            expect(screen.getByText(formattedDate)).toBeTruthy();

            // ensure category-specific fields are displayed
            const categoryFields =  // get the one of the following that should be an object, the rest should be undefined
                testFields.growth ||
                testFields.activity ||
                testFields.meds ||
                testFields.vaccine ||
                testFields.other;
            for (const field of Object.values(categoryFields)) {
                if (field instanceof Date) {  // this should only apply to meds time taken
                    const formattedTime = field.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    expect(screen.getByText(formattedTime)).toBeTruthy();
                } else {
                    expect(screen.getByDisplayValue(field)).toBeTruthy();
                }
            }
        }
    });

    test("Shows/hides date picker (ios)", async () => {
        Platform.OS = "ios";

        render(<HealthModule
            healthFields={{ category: "Other", other: {}, date: new Date() } as HealthFields}
        />);

        // Press change date button
        await userEvent.press(screen.getByTestId("health-date-button"));
        // ensure date picker has been shown
        expect(screen.getByTestId("dateTimePicker")).toBeTruthy();

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // close date picker with non-set event
        await act(async () => onDateChange({type: 'cancel'}));
        // ensure date picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();

        // Press change date button to show date picker again
        await userEvent.press(screen.getByTestId("health-date-button"));
        // ensure date picker has been shown
        expect(screen.getByTestId("dateTimePicker")).toBeTruthy();

        // Press change date button again to close
        await userEvent.press(screen.getByTestId("health-date-button"));
        // ensure date picker has been closed
        expect(() => screen.getByTestId("dateTimePicker")).toThrow();
    });

    test("updates date (ios)", async () => {
        Platform.OS = "ios";
        const testDate = new Date();
        const onDateUpdate = jest.fn();  // to capture callbacks by <ManualEntry/>

        render(<HealthModule
            healthFields={{ category: "Other", other: {}, date: new Date() } as HealthFields}
            onDateUpdate={onDateUpdate}
        />);

        // Press change date button
        await userEvent.press(screen.getByTestId("health-date-button"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange({type: 'set'}, testDate));

        // ensure date has been updated once with the test date as the start date
        expect(onDateUpdate).toHaveBeenCalledTimes(1);
        expect(onDateUpdate.mock.calls[0][0]).toBe(testDate);
    });

    test("Shows/hides date picker (android)", async () => {
        Platform.OS = "android";

        render(<HealthModule
            healthFields={{ category: "Other", other: {}, date: new Date() } as HealthFields}
        />);

        // ensure date picker isn't visible yet
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(0);

        // open start date editer
        await userEvent.press(screen.getByTestId("health-date-button"));

        // ensure date picker has been shown
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);
    });

    test("Updates date (android)", async () => {
        Platform.OS = "android";
        const testDate = new Date();

        const onDateUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule
            healthFields={{ category: "Other", other: {}, date: new Date() } as HealthFields}
            onDateUpdate={onDateUpdate}
        />);
        await userEvent.press(screen.getByTestId("health-date-button"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange(undefined, testDate));

        // ensure date has been updated once with the test date as the start date
        expect(onDateUpdate).toHaveBeenCalledTimes(1);
        expect(onDateUpdate.mock.calls[0][0]).toBe(testDate);
    });

    test("Updates category", async () => {
        const onCategoryUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule
            healthFields={{ category: "Other", other: {}, date: new Date() } as HealthFields}
            onCategoryUpdate={onCategoryUpdate}
        />);

        const testConsistencyCategories = ["Activity", "Meds", "Vaccine", "Other", "Growth"];

        for (const category of testConsistencyCategories) {
            await setCategoryInput(category);  // switch category
            expect(onCategoryUpdate.mock.lastCall[0]).toBe(category);
        }
    });

    test("Updates growth", async () => {
        const testLength = "test length";
        const testWeight = "test weight";
        const testHead = "test head";
        const onGrowthUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule
            healthFields={{ category: "Growth", growth: {}, date: new Date() } as HealthFields}
            onGrowthUpdate={onGrowthUpdate}
        />);

        // Fill in inputs
        // Callback should be called to update after each value is changed
        await userEvent.type(
            screen.getByTestId("health-growth-length"),
            testLength
        );
        expect(onGrowthUpdate).toHaveBeenLastCalledWith({ length: testLength });
        await userEvent.type(
            screen.getByTestId("health-growth-weight"),
            testWeight
        );
        expect(onGrowthUpdate).toHaveBeenLastCalledWith({ weight: testWeight });
        await userEvent.type(
            screen.getByTestId("health-growth-head"),
            testHead
        );
        expect(onGrowthUpdate).toHaveBeenLastCalledWith({ head: testHead });
    });

    test("Updates activity", async () => {
        const testType = "test type";
        const testDuration = "test duration";
        const onActivtityUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule
            healthFields={{ category: "Activity", activity: {}, date: new Date() } as HealthFields}
            onActivityUpdate={onActivtityUpdate}
        />);

        // Fill in inputs
        // Callback should be called to update after each value is changed
        await userEvent.type(
            screen.getByTestId("health-activity-type"),
            testType
        );
        expect(onActivtityUpdate).toHaveBeenLastCalledWith({ type: testType });
        await userEvent.type(
            screen.getByTestId("health-activity-duration"),
            testDuration
        );
        expect(onActivtityUpdate).toHaveBeenLastCalledWith({ duration: testDuration });
    });

    test("Shows/hides meds time picker (ios)", async () => {
        Platform.OS = "ios";

        render(<HealthModule
            healthFields={{ category: "Meds", meds: { time_taken: new Date() }, date: new Date() } as HealthFields}
        />);

        // Press change time button
        await userEvent.press(screen.getByTestId("health-meds-time"));
        // ensure time picker has been shown
        expect(screen.getByTestId("timeTimePicker")).toBeTruthy();

        // retrieve callback for when the time changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // close time picker with non-set event
        await act(async () => onDateChange({type: 'cancel'}));
        // ensure time picker has been closed
        expect(() => screen.getByTestId("timeTimePicker")).toThrow();
    });

    test("Updates meds (ios)", async () => {
        Platform.OS = "ios";

        const testName = "test name";
        const testAmount = "test amount";
        const testTimeTaken = new Date();
        const onMedsUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        const initialMeds = { time_taken: new Date() };
        render(<HealthModule
            healthFields={{ category: "Meds", meds: initialMeds, date: new Date() } as HealthFields}
            onMedsUpdate={onMedsUpdate}
        />);

        // Fill in inputs
        // Callback should be called to update after each value is changed

        // open date picker
        await userEvent.press(screen.getByTestId("health-meds-time"));
        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange({type: 'set'}, testTimeTaken));
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ time_taken: testTimeTaken });

        // fill in other inputs
        await userEvent.type(
            screen.getByTestId("health-meds-name"),
            testName
        );
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ ...initialMeds, name: testName });
        await userEvent.type(
            screen.getByTestId("health-meds-amount"),
            testAmount
        );
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ ...initialMeds, amount: testAmount });
    });

    test("Shows/hides meds time picker (android)", async () => {
        Platform.OS = "android";

        render(<HealthModule
            healthFields={{ category: "Meds", meds: { time_taken: new Date() }, date: new Date() } as HealthFields}
        />);

        // ensure time picker isn't visible yet
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(0);

        // Press change time button
        await userEvent.press(screen.getByTestId("health-meds-time"));

        // ensure time picker has been shown
        expect(DateTimePickerAndroid.open).toHaveBeenCalledTimes(1);
    });

    test("Updates meds (android)", async () => {
        Platform.OS = "android";

        const testName = "test name";
        const testAmount = "test amount";
        const testTimeTaken = new Date();
        const onMedsUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        const initialMeds = { time_taken: new Date() };
        render(<HealthModule
            healthFields={{ category: "Meds", meds: initialMeds, date: new Date() } as HealthFields}
            onMedsUpdate={onMedsUpdate}
        />);

        // Fill in inputs
        // Callback should be called to update after each value is changed

        // open date picker
        await userEvent.press(screen.getByTestId("health-meds-time"));
        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange(undefined, testTimeTaken));
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ time_taken: testTimeTaken });

        // fill in other inputs
        await userEvent.type(
            screen.getByTestId("health-meds-name"),
            testName
        );
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ ...initialMeds, name: testName });
        await userEvent.type(
            screen.getByTestId("health-meds-amount"),
            testAmount
        );
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ ...initialMeds, amount: testAmount });
    });

    test("Updates vaccine", async () => {
        const testName = "test name";
        const testLocation = "test location";
        const onVaccineUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule
            healthFields={{ category: "Vaccine", vaccine: {}, date: new Date() } as HealthFields}
            onVaccineUpdate={onVaccineUpdate}
        />);

        // Fill in inputs
        // Callback should be called to update after each value is changed
        await userEvent.type(
            screen.getByTestId("health-vaccine-name"),
            testName
        );
        expect(onVaccineUpdate).toHaveBeenLastCalledWith({ name: testName });
        await userEvent.type(
            screen.getByTestId("health-vaccine-location"),
            testLocation
        );
        expect(onVaccineUpdate).toHaveBeenLastCalledWith({ location: testLocation });
    });

    test("Updates 'other'", async () => {
        const testName = "test name";
        const testDescription = "test description";
        const onOtherUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule
            healthFields={{ category: "Other", other: {}, date: new Date() } as HealthFields}
            onOtherUpdate={onOtherUpdate}
        />);

        // Fill in inputs
        // Callback should be called to update after each value is changed
        await userEvent.type(
            screen.getByTestId("health-other-name"),
            testName
        );
        expect(onOtherUpdate).toHaveBeenLastCalledWith({ name: testName });
        await userEvent.type(
            screen.getByTestId("health-other-description"),
            testDescription
        );
        expect(onOtherUpdate).toHaveBeenLastCalledWith({ description: testDescription });
    });
});
