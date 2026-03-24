import HealthModule from "@/components/health-module";
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
    // get calls to <CategoryModule/>
    const onCategoryUpdate = (CategoryModule as jest.Mock).mock.calls
        .slice(-1)[0][0].onCategoryUpdate;  // get update callback from most recent call
    await act(() => onCategoryUpdate?.(category));
}


describe("Health component <HealthModule/>", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (DateTimePicker as jest.Mock).mockClear();
        (DateTimePickerAndroid.open as jest.Mock).mockClear();
    });

    test("Renders category and date inputs", () => {
        render(<HealthModule/>);

        expect(screen.getByTestId("health-category-module")).toBeTruthy();
        expect(screen.getByTestId("health-date-button")).toBeTruthy();
    });

    test("Renders growth inputs", () => {
        render(<HealthModule/>);
        // should default to showing growth

        expect(screen.getByTestId("health-growth-length")).toBeTruthy();
        expect(screen.getByTestId("health-growth-weight")).toBeTruthy();
        expect(screen.getByTestId("health-growth-head")).toBeTruthy();
    });

    test("Renders activity inputs", async () => {
        render(<HealthModule/>);
        // switch to activity
        await setCategoryInput("Activity");

        expect(screen.getByTestId("health-activity-type")).toBeTruthy();
        expect(screen.getByTestId("health-activity-duration")).toBeTruthy();
    });

    test("Renders meds inputs", async () => {
        render(<HealthModule/>);
        // switch to meds
        await setCategoryInput("Meds");

        expect(screen.getByTestId("health-meds-name")).toBeTruthy();
        expect(screen.getByTestId("health-meds-amount")).toBeTruthy();
    });

    test("Renders vaccine inputs", async () => {
        render(<HealthModule/>);
        // switch to vaccine
        await setCategoryInput("Vaccine");

        expect(screen.getByTestId("health-vaccine-name")).toBeTruthy();
        expect(screen.getByTestId("health-vaccine-location")).toBeTruthy();
    });

    test("Renders 'other' inputs", async () => {
        render(<HealthModule/>);
        // switch to other
        await setCategoryInput("Other");

        expect(screen.getByTestId("health-other-name")).toBeTruthy();
        expect(screen.getByTestId("health-other-description")).toBeTruthy();
    });

    test("Shows/hides date picker (ios)", async () => {
        Platform.OS = "ios";
        
        render(<HealthModule/>);

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
        
        render(<HealthModule onDateUpdate={onDateUpdate}/>);

        // Press change date button
        await userEvent.press(screen.getByTestId("health-date-button"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange({type: 'set'}, testDate));

        // ensure date has been updated once since first useEffect() call
        expect(onDateUpdate).toHaveBeenCalledTimes(2);
        // ensure second call to onDatesUpdate was with the test date as the start date
        expect(onDateUpdate.mock.calls[1][0]).toBe(testDate);
    });
    
    test("Shows/hides date picker (android)", async () => {
        Platform.OS = "android";

        render(<HealthModule/>);

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
        render(<HealthModule onDateUpdate={onDateUpdate}/>);

        await userEvent.press(screen.getByTestId("health-date-button"));

        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange(undefined, testDate));

        // ensure date has been updated once since first useEffect() call
        expect(onDateUpdate).toHaveBeenCalledTimes(2);
        // ensure second call to onDatesUpdate was with the test date as the start date
        expect(onDateUpdate.mock.calls[1][0]).toBe(testDate);
    });
    
    test("Updates category", async () => {
        const onCategoryUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule onCategoryUpdate={onCategoryUpdate}/>);

        // category should default to growth
        expect(onCategoryUpdate).toHaveBeenCalledTimes(1);
        expect(onCategoryUpdate.mock.calls[0][0]).toBe("Growth");

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
        render(<HealthModule onGrowthUpdate={onGrowthUpdate}/>);

        // growth should start with empty/default values. Use loose equality to compare objects
        expect(onGrowthUpdate).toHaveBeenCalledTimes(1);
        expect(onGrowthUpdate.mock.calls[0][0]).toEqual({ length: "", weight: "", head: "" });

        // Fill in inputs
        // Callback should be called to update after each value is changed
        await userEvent.type(
            screen.getByTestId("health-growth-length"),
            testLength
        );
        expect(onGrowthUpdate).toHaveBeenLastCalledWith({ length: testLength, weight: "", head: "" });
        await userEvent.type(
            screen.getByTestId("health-growth-weight"),
            testWeight
        );
        expect(onGrowthUpdate).toHaveBeenLastCalledWith({ length: testLength, weight: testWeight, head: "" });
        await userEvent.type(
            screen.getByTestId("health-growth-head"),
            testHead
        );
        expect(onGrowthUpdate).toHaveBeenLastCalledWith({ length: testLength, weight: testWeight, head: testHead });
    });
    
    test("Updates activity", async () => {
        const testType = "test type";
        const testDuration = "test duration";
        const onActivtityUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule onActivityUpdate={onActivtityUpdate}/>);

        // switch to activity
        await setCategoryInput("Activity");

        // growth should start with empty/default values. Use loose equality to compare objects
        expect(onActivtityUpdate).toHaveBeenCalledTimes(1);
        expect(onActivtityUpdate.mock.calls[0][0]).toEqual({ type: "", duration: "" });

        // Fill in inputs
        // Callback should be called to update after each value is changed
        await userEvent.type(
            screen.getByTestId("health-activity-type"),
            testType
        );
        expect(onActivtityUpdate).toHaveBeenLastCalledWith({ type: testType, duration: "" });
        await userEvent.type(
            screen.getByTestId("health-activity-duration"),
            testDuration
        );
        expect(onActivtityUpdate).toHaveBeenLastCalledWith({ type: testType, duration: testDuration });
    });

    test("Shows/hides meds time picker (ios)", async () => {
        Platform.OS = "ios";
        
        render(<HealthModule/>);
        // switch to meds
        await setCategoryInput("Meds");

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
        const timeBeforeNow = new Date();
        render(<HealthModule onMedsUpdate={onMedsUpdate}/>);

        // switch to meds
        await setCategoryInput("Meds");
        const timeAfterNow = new Date();

        // growth should start with empty/default values, except the time, which will be initialized to the current time
        expect(onMedsUpdate).toHaveBeenCalledTimes(1);
        expect(onMedsUpdate.mock.calls[0][0].name).toBe("");
        expect(onMedsUpdate.mock.calls[0][0].amount).toBe("");
        // ensure time was initialized to approximately the current time
        expect(onMedsUpdate.mock.calls[0][0].timeTaken.getTime()).toBeGreaterThanOrEqual(timeBeforeNow.getTime());
        expect(onMedsUpdate.mock.calls[0][0].timeTaken.getTime()).toBeLessThanOrEqual(timeAfterNow.getTime());

        // Fill in inputs
        // Callback should be called to update after each value is changed

        // open date picker
        await userEvent.press(screen.getByTestId("health-meds-time"));
        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePicker as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange({type: 'set'}, testTimeTaken));
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ name: "", amount: "", timeTaken: testTimeTaken });

        // fill in other inputs
        await userEvent.type(
            screen.getByTestId("health-meds-name"),
            testName
        );
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ name: testName, amount: "", timeTaken: testTimeTaken });
        await userEvent.type(
            screen.getByTestId("health-meds-amount"),
            testAmount
        );
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ name: testName, amount: testAmount, timeTaken: testTimeTaken });
    });
    
    test("Shows/hides meds time picker (android)", async () => {
        Platform.OS = "android";

        render(<HealthModule/>);
        // switch to meds
        await setCategoryInput("Meds");

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
        const timeBeforeNow = new Date();
        render(<HealthModule onMedsUpdate={onMedsUpdate}/>);

        // switch to meds
        await setCategoryInput("Meds");
        const timeAfterNow = new Date();

        // growth should start with empty/default values, except the time, which will be initialized to the current time
        expect(onMedsUpdate).toHaveBeenCalledTimes(1);
        expect(onMedsUpdate.mock.calls[0][0].name).toBe("");
        expect(onMedsUpdate.mock.calls[0][0].amount).toBe("");
        // ensure time was initialized to approximately the current time
        expect(onMedsUpdate.mock.calls[0][0].timeTaken.getTime()).toBeGreaterThanOrEqual(timeBeforeNow.getTime());
        expect(onMedsUpdate.mock.calls[0][0].timeTaken.getTime()).toBeLessThanOrEqual(timeAfterNow.getTime());

        // Fill in inputs
        // Callback should be called to update after each value is changed

        // open date picker
        await userEvent.press(screen.getByTestId("health-meds-time"));
        // retrieve callback for when the date changes in the time picker
        const onDateChange = (DateTimePickerAndroid.open as jest.Mock).mock.calls[0][0].onChange;
        // simulate date change with callback
        await act(async () => onDateChange(undefined, testTimeTaken));
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ name: "", amount: "", timeTaken: testTimeTaken });

        // fill in other inputs
        await userEvent.type(
            screen.getByTestId("health-meds-name"),
            testName
        );
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ name: testName, amount: "", timeTaken: testTimeTaken });
        await userEvent.type(
            screen.getByTestId("health-meds-amount"),
            testAmount
        );
        expect(onMedsUpdate).toHaveBeenLastCalledWith({ name: testName, amount: testAmount, timeTaken: testTimeTaken });
    });
    
    test("Updates vaccine", async () => {
        const testName = "test name";
        const testLocation = "test location";
        const onVaccineUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule onVaccineUpdate={onVaccineUpdate}/>);

        // switch to vaccine
        await setCategoryInput("Vaccine");

        // growth should start with empty/default values. Use loose equality to compare objects
        expect(onVaccineUpdate).toHaveBeenCalledTimes(1);
        expect(onVaccineUpdate.mock.calls[0][0]).toEqual({ name: "", location: "" });

        // Fill in inputs
        // Callback should be called to update after each value is changed
        await userEvent.type(
            screen.getByTestId("health-vaccine-name"),
            testName
        );
        expect(onVaccineUpdate).toHaveBeenLastCalledWith({ name: testName, location: "" });
        await userEvent.type(
            screen.getByTestId("health-vaccine-location"),
            testLocation
        );
        expect(onVaccineUpdate).toHaveBeenLastCalledWith({ name: testName, location: testLocation });
    });
    
    test("Updates 'other'", async () => {
        const testName = "test name";
        const testDescription = "test description";
        const onOtherUpdate = jest.fn();  // to capture callbacks by <HealthModule/>
        render(<HealthModule onOtherUpdate={onOtherUpdate}/>);

        // switch to other
        await setCategoryInput("Other");

        // growth should start with empty/default values. Use loose equality to compare objects
        expect(onOtherUpdate).toHaveBeenCalledTimes(1);
        expect(onOtherUpdate.mock.calls[0][0]).toEqual({ name: "", description: "" });

        // Fill in inputs
        // Callback should be called to update after each value is changed
        await userEvent.type(
            screen.getByTestId("health-other-name"),
            testName
        );
        expect(onOtherUpdate).toHaveBeenLastCalledWith({ name: testName, description: "" });
        await userEvent.type(
            screen.getByTestId("health-other-description"),
            testDescription
        );
        expect(onOtherUpdate).toHaveBeenLastCalledWith({ name: testName, description: testDescription });
    });
});
