import { render, screen, userEvent, act } from "@testing-library/react-native";
import Feeding from "@/app/(trackers)/feeding";
import { router } from "expo-router";
import { Alert } from "react-native";
import { getActiveChildId } from '@/library/utils';
import supabase from "@/library/supabase-client";
import FeedingCategory, { FeedingCategoryList } from '@/components/feeding-category';
import { encryptData } from "@/library/crypto";


jest.mock("expo-router", () => {
    const replace = jest.fn();
    return ({
        router: {
            replace: replace,
        },
    });
});

jest.mock("@/library/supabase-client", () => {
    const insert = jest.fn(async () => ({success: true}));
    return ({
        from: () => ({
            insert: insert,
        })
    });
});

jest.mock("@/library/crypto", () => ({
    encryptData: async (string: string) => `Encrypted: ${string}`
}));

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

jest.mock("@/library/utils", () => ({
    getActiveChildId: jest.fn(async () => ({ success: true }))
}));

jest.mock("@/components/feeding-category.tsx", () => {
    const { View, TextInput } = jest.requireActual("react-native");
    const FeedingCategoryMock = jest.fn((
        { testID, category, itemName, amount, feedingTime }:
        { testID?: string; category: FeedingCategoryList; itemName: string; amount: string; feedingTime: Date; }
    ) => (
        <View testID={testID}>
            <TextInput value={category}/>
            <TextInput value={itemName}/>
            <TextInput value={amount}/>
            <TextInput value={feedingTime}/>
        </View>
    ));
    return FeedingCategoryMock;
});

jest.mock("@/library/auth-provider", () => ({
  useAuth: () => ({ isGuest: false }),
}));

jest.mock("expo-crypto", () => ({}));

/*
 *  setFeedingInputs:
 *      Reads update handlers from first call to FeedingCategory mock
 *      Calls update handlers with provided inputs
 *      Calls userEvent.type for note
*/
async function setFeedingInputs({
    category,
    itemName,
    amount,
    time,
    note,
} : {
    category?: FeedingCategoryList;
    itemName?: string;
    amount?: string;
    time?: Date;
    note?: string;
}) {
    // read parameters to first call of DiaperModule
    const {
        onCategoryUpdate,
        onItemNameUpdate,
        onAmountUpdate,
        onTimeUpdate,
    } = (FeedingCategory as jest.Mock).mock.calls[0][0];

    // call update handlers for feeding info
    if (category != null) {
        await act(() => onCategoryUpdate?.(category));
    }
    if (itemName != null) {
        await act(() => onItemNameUpdate?.(itemName));
    }
    if (amount != null) {
        await act(() => onAmountUpdate?.(amount));
    }
    if (time != null) {
        await act(() => onTimeUpdate?.(time));
    }

    // type into <TextInput/> components for note
    if (note != null) {
        await userEvent.type(
            screen.getByTestId("feeding-note-entry"),
            note
        );
    }
}


describe("Track feeding screen", () => {

    beforeEach(() => {
        // to clear the .mock.calls array for each
        (Alert.alert as jest.Mock).mockClear();
        (router.replace as jest.Mock).mockClear();
        jest.spyOn(console, "error").mockClear();
        (FeedingCategory as jest.Mock).mockClear();
        (supabase.from("").insert as jest.Mock).mockClear();
    });

    test("Renders feeding tracking inputs", () => {
        render(<Feeding/>);

        expect(screen.getByTestId("feeding-data-entry")).toBeTruthy();
        expect(screen.getByTestId("feeding-note-entry")).toBeTruthy();
    });
    
    test("Renders form control buttons", () => {
        render(<Feeding/>);

        expect(screen.getByTestId("feeding-save-log-button")).toBeTruthy();
        expect(screen.getByTestId("feeding-reset-form-button")).toBeTruthy();
    });
    
    test("Refreshes on reset", async () => {
        const testCategory = "Soft";
        const testName = "test name";
        const testAmount = "test amount";
        const testNote = "test note";

        render(<Feeding/>);

        // simulate user input
        await setFeedingInputs({
            category: testCategory,
            itemName: testName,
            amount: testAmount,
            note: testNote,
        });

        // check values are there before we reset
        expect(screen.getByDisplayValue(testCategory)).toBeTruthy();
        expect(screen.getByDisplayValue(testName)).toBeTruthy();
        expect(screen.getByDisplayValue(testAmount)).toBeTruthy();
        expect(screen.getByDisplayValue(testNote)).toBeTruthy();

        await userEvent.press(screen.getByTestId("feeding-reset-form-button"));

        // after reset, those values should no longer be in any input
        expect(screen.queryByDisplayValue(testCategory)).toBeNull();
        expect(screen.queryByDisplayValue(testName)).toBeNull();
        expect(screen.queryByDisplayValue(testAmount)).toBeNull();
        expect(screen.queryByDisplayValue(testNote)).toBeNull();
    });
    
    test("Catch unfilled inputs", async () => {
        render(<Feeding/>);
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // error message generated by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[0][1])
            .toBe("Failed to save the Feeding log. You are missing the following fields: item name and amount.");
        
        // repeat with item name filled
        await setFeedingInputs({ itemName: "test food" });
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // error message generated by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[1][1])
            .toBe("Failed to save the Feeding log. You are missing the following fields: amount.");
        
        // repeat with amount filled
        await setFeedingInputs({ itemName: "", amount: "test amount" });  // clear item name
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // error message generated by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[2][0]).toBe("Missing Information");
        expect((Alert.alert as jest.Mock).mock.calls[2][1])
            .toBe("Failed to save the Feeding log. You are missing the following fields: item name.");
    });
    
    test("catch utils.ts->getActiveChildID() error", async () => {
        const testErrorMessage = "testErrorGet";

        // library/utils.ts -> getActiveChild() should be mocked to return:
        // { success: /* falsy value */, error: /* string */ }
        // This should cause error handling in app/(trackers)/feeding.tsx -> saveFeedingLog()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            () => ({success: false, error: testErrorMessage})
        );

        render(<Feeding/>);

        // simulate minimum required user input
        await setFeedingInputs({
            category: "Soft",
            itemName: "test food",
            amount: "test amount",
        });
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // error message generated by mock of app/library/utils.ts -> getActiveChildId()
        // Alert.alert() called by app/(trackers)/feeding.tsx -> saveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error: ${testErrorMessage}`);

        // error message generated by mock of app/library/utils.ts -> getActiveChildId()
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe(`Failed to save feeding log: ${testErrorMessage}`);
    });
    
    test("catch supabase insert error", async () => {
        const testErrorMessage = "testErrorInsert";

        // supabase.from().insert() should be mocked to return:
        // {error: /* truthy string */}
        // This should cause error handling in app/(trackers)/feeding.tsx -> createFeedingLog()
        (supabase.from("").insert as jest.Mock).mockImplementationOnce(
            async () => ({ error: testErrorMessage })
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<Feeding/>);

        // simulate minimum required user input
        await setFeedingInputs({
            category: "Soft",
            itemName: "test food",
            amount: "test amount",
        });
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // error message generated by supabase.from().insert()
        // console.error() called by app/(trackers)/feeding.tsx -> createFeedingLog()
        expect((console.error as jest.Mock).mock.calls[0][0]).toBe(`Error creating feeding log:`);
        expect((console.error as jest.Mock).mock.calls[0][1]).toBe(testErrorMessage);

        // error message generated by mock of supabase.from().insert()
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Failed to save feeding log: ${testErrorMessage}`);
    });
    
    test("catch supabase(/encryption) error", async () => {
        const testErrorMessage = "testErrorInsert";
        const testError = new Error(testErrorMessage);

        // supabase.from().insert() should be mocked to throw an error:
        // This should cause error handling in app/(trackers)/feeding.tsx -> createFeedingLog()
        (supabase.from("").insert as jest.Mock).mockImplementationOnce(
            async () => { throw testError; }
        );

        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        render(<Feeding/>);

        // simulate minimum required user input
        await setFeedingInputs({
            category: "Soft",
            itemName: "test food",
            amount: "test amount",
        });
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // error generated by mock of supabase.from().insert()
        // console.error() called by app/(trackers)/feeding.tsx -> createFeedingLog()
        expect((console.error as jest.Mock).mock.calls[0][0]).toBe(`❌ Encryption or insert failed:`);
        expect((console.error as jest.Mock).mock.calls[0][1]).toBe(testError);

        // error message generated by mock of supabase.from().insert()
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Failed to save feeding log: Encryption or database error`);
    });

    test("Redirects user on successful submit", async () => {
        render(<Feeding/>);

        // simulate minimum required user input
        await setFeedingInputs({
            category: "Soft",
            itemName: "test food",
            amount: "test amount",
        });
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // confirm that the expo-router was called to send the user back to the tracker page
        expect((router.replace as jest.Mock).mock.calls[0][0]).toBe(`/(tabs)`);
        expect((router.replace as jest.Mock)).toHaveBeenCalledTimes(1);

        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Feeding log saved successfully!`);
    });
        
    test("Saves correct values", async () => {
        const testID = "test ID";
        const testNote = "test note";
        const testName = "test food";
        const testAmount = "test amount";
        const testCategory = "Solid";
        const testTime = new Date();

        // mock library/utils.ts -> getActiveChildId() to return the test child ID
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childId: testID })
        );

        render(<Feeding/>);

        // simulate user input
        await setFeedingInputs({
            category: testCategory,
            itemName: testName,
            amount: testAmount,
            note: testNote,
            time: testTime,
        });

        // submit log
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        const insertedObject = (supabase.from("").insert as jest.Mock).mock.calls[0][0][0];

        // Ensure supabase.from().insert() was called with the correct values; they should now be encrypted
        expect(insertedObject.child_id).toBe(testID);
        expect(insertedObject.item_name).toBe(await encryptData(testName));
        expect(insertedObject.category).toBe(await encryptData(testCategory));
        expect(insertedObject.amount).toBe(await encryptData(testAmount));
        expect(insertedObject.note).toBe(await encryptData(testNote));
        expect(insertedObject.feeding_time).toBe(testTime.toISOString());

        // Ensure that log was saved successfully
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Feeding log saved successfully!`);
    });

});
