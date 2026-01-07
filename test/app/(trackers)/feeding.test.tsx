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
    const View = jest.requireActual("react-native").View;
    const FeedingCategoryMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return FeedingCategoryMock;
});

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
    if (category) {
        await act(() => onCategoryUpdate?.(category));
    }
    if (itemName) {
        await act(() => onItemNameUpdate?.(itemName));
    }
    if (amount) {
        await act(() => onAmountUpdate?.(amount));
    }
    if (time) {
        await act(() => onTimeUpdate?.(time));
    }

    // type into <TextInput/> components for note
    if (note) {
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
        // store mock implementation of <FeedingCategory/>
        const feedingCategoryMock = (FeedingCategory as jest.Mock).getMockImplementation();
        // revert <FeedingCategory/> to original implementation
        (FeedingCategory as jest.Mock).mockImplementation(
            jest.requireActual('@/components/feeding-category').default
        );

        render(<Feeding/>);

        const itemNameInput = screen.getByTestId("feeding-item-name");
        const amountInput = screen.getByTestId("feeding-amount");
        const resetButton = screen.getByTestId("feeding-reset-form-button");
        const noteInput = screen.getByTestId("feeding-note-entry");

        // type into the fields so we have something to clear
        await userEvent.type(itemNameInput, "Applesauce");
        await userEvent.type(amountInput, "4 oz");
        await userEvent.type(noteInput, "Baby disliked this");

        // check values are there before we reset
        expect(screen.getByDisplayValue("Applesauce")).toBeTruthy();
        expect(screen.getByDisplayValue("4 oz")).toBeTruthy();
        expect(screen.getByDisplayValue("Baby disliked this")).toBeTruthy();

        await userEvent.press(resetButton);

        // after reset, those values should no longer be in any input
        expect(screen.queryByDisplayValue("Applesauce")).toBeNull();
        expect(screen.queryByDisplayValue("4 oz")).toBeNull();
        expect(screen.queryByDisplayValue("Baby disliked this")).toBeNull();

        // restore mock implementation of <FeedingCategory/>
        (FeedingCategory as jest.Mock).mockImplementation(feedingCategoryMock);
    });
    
    test("Catch unfilled category/name/amount", async () => {
        render(<Feeding/>);
        await userEvent.press(
            screen.getByTestId("feeding-save-log-button")
        );

        // error message generated by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        // Alert.alert() called by app/(trackers)/feeding.tsx -> handleSaveFeedingLog()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Please provide category, item name, and amount");
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
