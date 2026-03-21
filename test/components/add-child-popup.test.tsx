import { render, screen, userEvent } from "@testing-library/react-native";
import AddChildPopup from "@/components/add-child-popup";
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.addChild;


jest.mock("expo-blur", () => ({
    BlurView: jest.requireActual("react-native").View,
}));


describe("Profile screen", () => {

    test("Modal show/hides", async () => {
        // render with visible=false
        const { rerender } = render(<AddChildPopup
            childName={""}
            onChildNameUpdate={() => undefined}
            handleSave={() => undefined}
            visible={false}
            testID={testIDs.popup}
        />);
        expect(() => expect(screen.getByTestId(testIDs.popup)).toBeVisible()).toThrow();

        // re-render with visible=true
        rerender(<AddChildPopup
            childName={""}
            onChildNameUpdate={() => undefined}
            handleSave={() => undefined}
            visible={true}
            testID={testIDs.popup}
        />);
        expect(screen.getByTestId(testIDs.popup)).toBeVisible();
        
        // re-render with visible=false
        rerender(<AddChildPopup
            childName={""}
            onChildNameUpdate={() => undefined}
            handleSave={() => undefined}
            visible={false}
            testID={testIDs.popup}
        />);
        expect(() => expect(screen.getByTestId(testIDs.popup)).toBeVisible()).toThrow();
    });

    test("Displays inputs", async () => {
        render(<AddChildPopup
            childName={""}
            onChildNameUpdate={() => undefined}
            handleSave={() => undefined}
            handleCancel={() => undefined}
        />);

        expect(screen.getByTestId(testIDs.nameEntry)).toBeTruthy();
        expect(screen.getByTestId(testIDs.saveButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.cancelButton)).toBeTruthy();  // visible since a handler was provided
    });

    test("Hides cancel button when no handler provided", async () => {
        render(<AddChildPopup
            childName={""}
            onChildNameUpdate={() => undefined}
            handleSave={() => undefined}
        />);

        expect(() => screen.getByTestId(testIDs.cancelButton)).toThrow();
    });

    test("Displays custom labels", async () => {
        const testTitle = "test title";
        const testSubtitle = "test subtitle";

        render(<AddChildPopup
            childName={""}
            onChildNameUpdate={() => undefined}
            handleSave={() => undefined}
            altTitle={testTitle}
            altSubtitle={testSubtitle}
        />);

        expect(screen.getByText(testTitle)).toBeTruthy();
        expect(screen.getByText(testSubtitle)).toBeTruthy();
    });

    test("Displays current name", async () => {
        const testName = "test name";

        render(<AddChildPopup
            childName={testName}
            onChildNameUpdate={() => undefined}
            handleSave={() => undefined}
        />);

        expect(screen.getByDisplayValue(testName)).toBeTruthy();
    });

    test("Updates name", async () => {
        const testNameInitial = "test name";
        const testNameUpdated = "test name updated";

        const updateHandler = jest.fn();

        render(<AddChildPopup
            childName={testNameInitial}
            onChildNameUpdate={updateHandler}
            handleSave={() => undefined}
        />);
        expect(screen.getByDisplayValue(testNameInitial)).toBeTruthy();

        await userEvent.clear(screen.getByTestId(testIDs.nameEntry));
        expect(updateHandler).toHaveBeenLastCalledWith("");

        await userEvent.paste(screen.getByTestId(testIDs.nameEntry), testNameUpdated);
        expect(updateHandler).toHaveBeenLastCalledWith(testNameUpdated);
    });

    test("Calls save handler", async () => {
        const saveHandler = jest.fn();

        render(<AddChildPopup
            childName={""}
            onChildNameUpdate={() => undefined}
            handleSave={saveHandler}
        />);

        await userEvent.press(screen.getByTestId(testIDs.saveButton));
        expect(saveHandler).toHaveBeenCalledTimes(1);
    });

    test("Calls cancel handler", async () => {
        const cancelHandler = jest.fn();

        render(<AddChildPopup
            childName={""}
            onChildNameUpdate={() => undefined}
            handleSave={() => undefined}
            handleCancel={cancelHandler}
        />);

        expect(screen.getByTestId(testIDs.cancelButton)).toBeTruthy();  // ensure cancel button is visible
        await userEvent.press(screen.getByTestId(testIDs.cancelButton));
        expect(cancelHandler).toHaveBeenCalledTimes(1);
    });
});
