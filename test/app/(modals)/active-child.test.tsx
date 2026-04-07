import { render, screen, userEvent, waitFor, act } from "@testing-library/react-native";
import ActiveChild from "@/app/(modals)/active-child";
import stringLib from "@/assets/stringLibrary.json";
import { Alert } from "react-native";
import RenameChildPopup from "@/components/rename-child-popup";
import SwitchChildPopup from "@/components/switch-child-popup";
import { deleteChild, formatName, getActiveChildData, getChildren, updateChildName } from "@/library/utils";
import { router } from "expo-router";
import supabase from "@/library/supabase-client";


const testIDs = stringLib.testIDs.activeChild;


jest.mock("@/components/switch-child-popup", () => {
    const View = jest.requireActual("react-native").View;
    const SwitchChildMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return SwitchChildMock;
});

jest.mock("@/components/rename-child-popup", () => {
    const View = jest.requireActual("react-native").View;
    const RenameChildMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return RenameChildMock;
});

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

jest.mock("@/library/utils", () => ({
    getActiveChildData: jest.fn(async () => ({ success: true, childName: true, childId: true, created_at: true })),
    formatName: jest.fn(),
    updateChildName: jest.fn(),
    getChildren: jest.fn(async () => [{ }, { }, { }]),
    deleteChild: jest.fn(),
}));

jest.mock("@/library/supabase-client", () => ({
    auth: {
        updateUser: jest.fn(),
    },
}));

jest.mock("expo-router", () => ({
    router: {
        dismissTo: jest.fn(),
    },
}));


function manualPromise(): {
    promise: Promise<unknown>, resolve: (value?: any) => void
} {
    let resolvePromise: (value: any) => void = () => undefined;
    const promise = new Promise((resolve) => {
        resolvePromise = (value: any = undefined) => resolve(value);
    });
    return { promise, resolve: resolvePromise };
};


describe("Active Child screen", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (router.dismissTo as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
        (RenameChildPopup as jest.Mock).mockClear();
        (SwitchChildPopup as jest.Mock).mockClear();
        (formatName as jest.Mock).mockClear();
        (updateChildName as jest.Mock).mockClear();
        (getChildren as jest.Mock).mockClear();
        (deleteChild as jest.Mock).mockClear();
        (supabase.auth.updateUser as jest.Mock).mockClear();
    });

    test("Displays buttons", async () => {
        render(<ActiveChild/>);

        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        expect(screen.getByTestId(testIDs.renameButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.deleteButton)).toBeTruthy();
    });

    test("Catch child information error", async () => {
        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* falsy value */ }
        // this should cause error handling in app/(modals)/active-child.tsx -> loadChildData()
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: false })
        );

        const { promise: waitForRouterCalled, resolve: resolveRouterCalled } = manualPromise();
        // router.dismissTo should be mocked to resolve a promise when called:
        // this is to indicate that the page has completed loading
        (router.dismissTo as jest.Mock).mockImplementationOnce(resolveRouterCalled);

        render(<ActiveChild/>);

        await waitForRouterCalled;  // wait for router.dismissTo() to be called, indicating page has finished loading

        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(stringLib.errors.childData);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(stringLib.errors.childDataMessage);

        // user was redirected to profile page
        expect(router.dismissTo).toHaveBeenCalledTimes(1);
        expect((router.dismissTo as jest.Mock).mock.calls[0][0]).toBe("/(modals)/profile");
    });

    test("Displays loading indicators", async () => {
        const { promise: waitForChildData, resolve: resolveChildData } = manualPromise();
        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // a Promise that can be manually resolved to:
        // { success: /* truthy value */, childName: /* truthy value */, childId: /* truthy value */, created_at: /* truthy value */ }
        (getActiveChildData as jest.Mock).mockReturnValueOnce(waitForChildData);

        render(<ActiveChild/>);

        // loading should be shown for both child name and created date
        expect(screen.getAllByText("Loading...", { exact: false }).length).toBe(2);

        // unblock getActiveChildData()
        resolveChildData({ success: true, childName: true, childId: true, created_at: true });

        // loading indicators should clear
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());
    });

    test("Displays child information", async () => {
        const testName = "test child name";
        const testCreated = "2000-1-1";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */, created_at: /* test string */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testName, childId: true, created_at: testCreated })
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        expect(screen.getByText(testName, { exact: false })).toBeTruthy();
        expect(screen.getByText((new Date(testCreated)).toDateString())).toBeTruthy();
    });

    test("Displays rename child popup with current name", async () => {
        const testName = "test child name";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testName, childId: true })
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        // popup should be hidden
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);

        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // popup should now be visible
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

        // current name should be passed, and new name should default current name
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].originalName).toBe(testName);
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].childName).toBe(testName);
    });

    test("Updates new name in rename child popup", async () => {
        const testName = "test child name";
        const testNewName = "test new child name";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testName, childId: true })
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // new name should default to current name
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].childName).toBe(testName);

        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testNewName));

        // new name should have been updated
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].childName).toBe(testNewName);
    });

    test("Hides popup on cancel", async () => {
        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        // popup should be hidden
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);

        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // popup should now be visible
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

        // press cancel
        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].handleCancel());

        // popup should be hidden again
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });

    test("Resets new child name upon reopening rename popup", async () => {
        const testName = "test child name";
        const testNewName = "test new child name";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testName, childId: true })
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        // popup should be hidden
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);

        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // enter a name for the child
        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testNewName));

        // the name should have been passed back to <RenameChildPopup/>
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].childName).toBe(testNewName);

        // press cancel, then re-open
        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].handleCancel());
        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // child name was reset to current name
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].childName).toBe(testName);
    });

    test("Catches rename to same name", async () => {
        const testName = "test child name";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testName, childId: true })
        );

        // library/utils.ts -> formatName() should be mocked to return:
        // /* test string matching getActiveChildData().childName */
        // this should cause error handling in app/(modals)/active-child.tsx -> handleRenameChild()
        (formatName as jest.Mock).mockReturnValueOnce(testName);

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // submit new name
        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(stringLib.warnings.renameChildSameName);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(stringLib.warnings.renameChildSameNameMessage);

        // popup should be hidden automatically
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });

    test("Catches updateChildName() error", async () => {
        const testError = "test error message";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* truthy value */, childId: /* test string */ }
        // this should not cause any errors
        /* (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: true, childId: testID })
        ); */

        // library/utils.ts -> updateChildName() should be mocked to throw an error
        // this should cause error handling in app/(modals)/active-child.tsx -> handleRenameChild()
        (updateChildName as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testError); }
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // submit new name
        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Error");
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(testError);

        // popup should be hidden automatically
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });

    test("Passes child id and new name to updateChildName()", async () => {
        const testNewName = "test new child name";
        const testID = "test child id";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* truthy value */, childId: /* test string */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: true, childId: testID })
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // enter and submit new name
        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testNewName));
        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        expect((updateChildName as jest.Mock).mock.calls[0][0]).toBe(testID);
        expect((updateChildName as jest.Mock).mock.calls[0][1]).toBe(testNewName);

        // popup should be hidden automatically
        expect((RenameChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });

    test("Displays loading indicators after rename", async () => {
        const { promise: waitForChildData, resolve: resolveChildData } = manualPromise();
        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* truthy value */, childId: /* truthy value */ }
        // then for a second call, which should occur after the user has submitted a new name:
        // a Promise that can be manually resolved to:
        // { success: /* truthy value */, childName: /* truthy value */, childId: /* truthy value */, created_at: /* truthy value */ }
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: true, childId: true })
        ).mockReturnValueOnce(waitForChildData);

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // submit new name
        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        // loading should be shown for both child name and created date
        expect(screen.getAllByText("Loading...", { exact: false }).length).toBe(2);

        // unblock getActiveChildData()
        resolveChildData({ success: true, childName: true, childId: true, created_at: true });

        // loading indicators should clear
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());
    });

    test("Refetches child name on successful rename", async () => {
        const testName = "test old name";
        const testNewName = "test new name";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // then for a second call, which should occur after the user has submitted a new name:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testName, childId: true })
        ).mockImplementationOnce(
            async () => ({ success: true, childName: testNewName, childId: true })
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        // old name, but not new name, should be present
        expect(screen.getByText(testName, { exact: false })).toBeTruthy();
        expect(() => screen.getByText(testNewName, { exact: false })).toThrow();

        await userEvent.press(screen.getByTestId(testIDs.renameButton));

        // submit new name
        await act(async () => (RenameChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        // new name, but not old name, should be shown
        expect(screen.getByText(testNewName, { exact: false })).toBeTruthy();
        expect(() => screen.getByText(testName, { exact: false })).toThrow();
    });

    test("Provides confirmation on delete", async () => {
        const testName = "test new child name";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testName, childId: true })
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Confirm Delete");
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Are you sure you want to delete ${testName}?`);
        expect((Alert.alert as jest.Mock).mock.calls[0][2].length).toBe(2);  // 2 buttons provided
        expect((Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Cancel")).toBeTruthy();  // a cancel button is provided
        expect((Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm")).toBeTruthy();  // a confirm button is provided
    });

    test("Catch getChildren() error", async () => {
        const testError = "test error message";

        // library/utils.ts -> getChildren() should be mocked to throw an error
        // this should cause error handling in app/(modals)/active-child.tsx -> handleConfirmedDeleteChild()
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testError); }
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Error");
        expect((Alert.alert as jest.Mock).mock.calls[1][1]).toBe(testError);
    });

    test("Catch deleteChild() error", async () => {
        const testError = "test error message";

        // library/utils.ts -> deleteChild() should be mocked to throw an error
        // this should cause error handling in app/(modals)/active-child.tsx -> handleConfirmedDeleteChild()
        (deleteChild as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testError); }
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Error");
        expect((Alert.alert as jest.Mock).mock.calls[1][1]).toBe(testError);
    });

    test("Catch updateUser() error (delete only child)", async () => {
        const testError = "test error message";
        const testName = "test new child name";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testName, childId: true })
        );

        // library/utils.ts -> getChildren() should be mocked to return:
        // [{ name: /* getActiveChildData().childName */ }]
        // this should not cause any errors
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => [{ name: testName }]
        );

        // supabase.auth.updateUser() should be mocked to throw an error
        // this should cause error handling in app/(modals)/active-child.tsx -> handleConfirmedDeleteChild()
        (supabase.auth.updateUser as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testError); }
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Error");
        expect((Alert.alert as jest.Mock).mock.calls[1][1]).toBe(testError);

        // user's active child cleared with supabase.auth.updateUser(), since the deleted child was the only child
        expect((supabase.auth.updateUser as jest.Mock).mock.calls[0][0].data)
            .toEqual({ activeChild: "", activeChildId: "" });
    });

    test("Handles delete only child", async () => {
        const testName = "test new child name";

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testName, childId: true })
        );

        // library/utils.ts -> getChildren() should be mocked to return:
        // [{ name: /* getActiveChildData().childName */ }]
        // this should not cause any errors
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => [{ name: testName }]
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        // user should have been redirected to the home page
        expect(router.dismissTo).toHaveBeenCalledTimes(1);
        expect((router.dismissTo as jest.Mock).mock.calls[0][0]).toBe("/(tabs)");

        // user's active child cleared with supabase.auth.updateUser()
        expect((supabase.auth.updateUser as jest.Mock).mock.calls[0][0].data)
            .toEqual({ activeChild: "", activeChildId: "" });
    });

    test("Catch updateUser() error (delete with multiple children)", async () => {
        const testError = "test error message";

        // supabase.auth.updateUser() should be mocked to throw an error
        // this should cause error handling in app/(modals)/active-child.tsx -> handleConfirmedDeleteChild()
        (supabase.auth.updateUser as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testError); }
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Error");
        expect((Alert.alert as jest.Mock).mock.calls[1][1]).toBe(testError);
    });

    test("Handles delete one of two children", async () => {
        const testChildren = [
            { name: "test child name", id: true },
            { name: true, id: "test child id 2" },
        ];

        // library/utils.ts -> getActiveChildData() should be mocked to return:
        // { success: /* truthy value */, childName: /* test string */, childId: /* truthy value */ }
        // this should not cause any errors
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testChildren[0].name, childId: true })
        );

        // library/utils.ts -> getChildren() should be mocked to return:
        // [{ name: /* any */, id: /* string */ }], with exactly one item with name !== getActiveChildData().childName
        // this should not cause any errors
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => testChildren
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        // user should have been sent back to profile page
        expect(router.dismissTo).toHaveBeenCalledTimes(1);
        expect((router.dismissTo as jest.Mock).mock.calls[0][0]).toBe("/(modals)/profile");

        // user's active child set to other child id with supabase.auth.updateUser()
        expect((supabase.auth.updateUser as jest.Mock).mock.calls[0][0].data)
            .toEqual({ activeChild: "", activeChildId: testChildren[1].id });
    });

    test("Shows <SwitchChildPopup/>", async () => {
        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        // pop up should be hidden
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        // popup should now be visible, with no cancel button
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].hideCancelButton).toBe(true);
    });

    test("Pass child names to <SwitchChildPopup/>", async () => {
        const testChildren = [  // no name field should match getActiveChildData().childName
            { name: "test child name 1", id: "test child id 1" },
            { name: "test child name 2", id: "test child id 2" },
            { name: "test child name 3", id: "test child id 3" },
        ];

        // library/utils.ts -> getChildren() should be mocked to return:
        // [{ name: /* getActiveChildData().childName */ }]
        // this should not cause any errors
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => testChildren
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        // all test names should be present, since none match the current child name
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].childNames)
            .toEqual(testChildren.map(child => child.name));
        // selected child should be in the list
        expect(testChildren.find(child =>
            child.name === (SwitchChildPopup as jest.Mock).mock.lastCall[0].currentChild)
        ).toBeTruthy();
    });

    test("Handles cancel during switch child", async () => {
        const testChildren = [  // no name field should match getActiveChildData().childName
            { name: "test child name 1", id: "test child id 1" },
            { name: "test child name 2", id: "test child id 2" },
            { name: "test child name 3", id: "test child id 3" },
        ];

        // library/utils.ts -> getChildren() should be mocked to return:
        // [{ name: /* getActiveChildData().childName */ }]
        // this should not cause any errors
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => testChildren
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        // call cancel handler
        await act(async () =>
            (SwitchChildPopup as jest.Mock).mock.lastCall[0].handleCancel()
        );

        // user's active child set to default id with supabase.auth.updateUser()
        expect(supabase.auth.updateUser).toHaveBeenCalledTimes(1);
        expect(testChildren.find(child =>
            child.id === (supabase.auth.updateUser as jest.Mock).mock.calls[0][0].data.activeChildId
        )).toBeTruthy();

        // user should have been sent back to profile page
        expect(router.dismissTo).toHaveBeenCalledTimes(1);
        expect((router.dismissTo as jest.Mock).mock.calls[0][0]).toBe("/(modals)/profile");
    });

    test("Catch updateUser() error (select new active child)", async () => {
        const testError = "test error message";

        // library/utils.ts -> getChildren() should be mocked to return:
        // [{ name: /* getActiveChildData().childName */ }]
        // this should not cause any errors
        /* (getChildren as jest.Mock).mockImplementationOnce(
            async () => testChildren
        ); */

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        // supabase.auth.updateUser() should be mocked to throw an error
        // this should cause error handling in app/(modals)/active-child.tsx -> handleSelectChild()
        (supabase.auth.updateUser as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testError); }
        );

        // select any child to switch to
        await act(async () =>
            (SwitchChildPopup as jest.Mock).mock.lastCall[0].handleSwitch(0)
        );

        expect((Alert.alert as jest.Mock).mock.calls[1][0]).toBe("Error switching:");
        expect((Alert.alert as jest.Mock).mock.calls[1][1]).toBe(testError);
    });

    test("Handles switch child", async () => {
        const testChildren = [  // no name field should match getActiveChildData().childName
            { name: "test child name 1", id: "test child id 1" },
            { name: "test child name 2", id: "test child id 2" },
            { name: "test child name 3", id: "test child id 3" },
        ];
        const testSwitchIndex = 2;  // a number to index testChildren

        // library/utils.ts -> getChildren() should be mocked to return:
        // [{ name: /* getActiveChildData().childName */ }]
        // this should not cause any errors
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => testChildren
        );

        render(<ActiveChild/>);
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.deleteButton));

        const confirmButton = (Alert.alert as jest.Mock).mock.calls[0][2]
            .find((button: any) => button.text === "Confirm");
        await act(async () => confirmButton.onPress());

        // user's active child set to default id with supabase.auth.updateUser()
        expect(testChildren.find(child =>
            child.id === (supabase.auth.updateUser as jest.Mock).mock.calls[0][0].data.activeChildId
        )).toBeTruthy();

        // select child to switch to
        await act(async () =>
            (SwitchChildPopup as jest.Mock).mock.lastCall[0].handleSwitch(testSwitchIndex)
        );

        // user should have been sent back to profile page
        expect(router.dismissTo).toHaveBeenCalledTimes(1);
        expect((router.dismissTo as jest.Mock).mock.calls[0][0]).toBe("/(modals)/profile");

        // user's active child set to chosen id with second call to supabase.auth.updateUser()
        expect(supabase.auth.updateUser).toHaveBeenCalledTimes(2);
        expect((supabase.auth.updateUser as jest.Mock).mock.calls[1][0].data)
            .toEqual({ activeChild: "", activeChildId: testChildren[testSwitchIndex].id });
    });
});
