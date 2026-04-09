import { render, screen, userEvent, act } from "@testing-library/react-native";
import SwitchChildPopup from "@/components/switch-child-popup";
import stringLib from "@/assets/stringLibrary.json";
import ListSelect from "@/components/list-select";


const testIDs = stringLib.testIDs.switchChild;


jest.mock("@/components/list-select", () => {
    const View = jest.requireActual("react-native").View;
    const ListSelectMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return ListSelectMock;
});

jest.mock("expo-blur", () => ({
    BlurView: jest.requireActual("react-native").View,
}));


describe("Switch child popup", () => {
    
    beforeEach(() => {
        // to clear the .mock.calls array
        (ListSelect as jest.Mock).mockClear();
    });

    test("Modal show/hides", async () => {
        // render with visible=false
        const { rerender } = render(<SwitchChildPopup
            childNames={[]}
            handleCancel={() => undefined}
            handleSwitch={() => undefined}
            visible={false}
            testID={testIDs.popup}
        />);
        expect(() => expect(screen.getByTestId(testIDs.popup)).toBeVisible()).toThrow();

        // re-render with visible=true
        rerender(<SwitchChildPopup
            childNames={[]}
            handleCancel={() => undefined}
            handleSwitch={() => undefined}
            visible={true}
            testID={testIDs.popup}
        />);
        expect(screen.getByTestId(testIDs.popup)).toBeVisible();
        
        // re-render with visible=false
        rerender(<SwitchChildPopup
            childNames={[]}
            handleCancel={() => undefined}
            handleSwitch={() => undefined}
            visible={false}
            testID={testIDs.popup}
        />);
        expect(() => expect(screen.getByTestId(testIDs.popup)).toBeVisible()).toThrow();
    });

    test("Displays buttons", async () => {
        render(<SwitchChildPopup
            childNames={[]}
            handleCancel={() => undefined}
            handleSwitch={() => undefined}
            visible={true}
        />);

        expect(screen.getByTestId(testIDs.selectButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.cancelButton)).toBeTruthy();
    });

    test("Hides cancel button", async () => {
        render(<SwitchChildPopup
            childNames={[]}
            handleCancel={() => undefined}
            handleSwitch={() => undefined}
            visible={true}
            hideCancelButton={true}
        />);

        expect(() => screen.getByTestId(testIDs.cancelButton)).toThrow();
    });

    test("Passes child names to <ListSelect/>", async () => {
        const testNames = ["test name 1"];

        render(<SwitchChildPopup
            childNames={testNames}
            handleCancel={() => undefined}
            handleSwitch={() => undefined}
            visible={true}
        />);

        expect((ListSelect as jest.Mock).mock.calls[0][0].items).toBe(testNames);
    });

    test("Passes current name index to <ListSelect/>", async () => {
        const testNames = ["test name 1", "test name 2", "test name 3", "test name 4"];
        const testSelectedName = "test selected name";
        const testSelectedIndex = 1;
        testNames[testSelectedIndex] = testSelectedName;

        render(<SwitchChildPopup
            childNames={testNames}
            currentChild={testSelectedName}
            handleCancel={() => undefined}
            handleSwitch={() => undefined}
            visible={true}
        />);

        expect((ListSelect as jest.Mock).mock.lastCall[0].selected).toBe(testSelectedIndex);
    });

    test("Calls save handler", async () => {
        const saveHandler = jest.fn();

        render(<SwitchChildPopup
            childNames={[]}
            handleCancel={() => undefined}
            handleSwitch={saveHandler}
            visible={true}
        />);

        await userEvent.press(screen.getByTestId(testIDs.selectButton));
        expect(saveHandler).toHaveBeenCalledTimes(1);
    });

    test("Calls save handler with new index", async () => {
        const testSelectedIndex = 3;
        const saveHandler = jest.fn();

        render(<SwitchChildPopup
            childNames={[]}
            handleCancel={() => undefined}
            handleSwitch={saveHandler}
            visible={true}
        />);

        const select = (ListSelect as jest.Mock).mock.lastCall[0].onSelect;
        await act(async () => select(testSelectedIndex));

        await userEvent.press(screen.getByTestId(testIDs.selectButton));

        expect(saveHandler).toHaveBeenCalledTimes(1);
        expect(saveHandler.mock.calls[0][0]).toBe(testSelectedIndex);
    });

    test("Calls cancel handler", async () => {
        const cancelHandler = jest.fn();

        render(<SwitchChildPopup
            childNames={[]}
            handleCancel={cancelHandler}
            handleSwitch={() => undefined}
            visible={true}
        />);

        expect(screen.getByTestId(testIDs.cancelButton)).toBeTruthy();  // ensure cancel button is visible
        await userEvent.press(screen.getByTestId(testIDs.cancelButton));
        expect(cancelHandler).toHaveBeenCalledTimes(1);
    });
});
