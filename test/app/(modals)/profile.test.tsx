import { render, screen, userEvent, act, waitFor } from "@testing-library/react-native";
import { router } from "expo-router";
import Profile from "@/app/(modals)/profile";
import { useAuth } from "@/library/auth-provider";
import { getActiveChildData, getChildren, saveNewChild } from "@/library/utils";
import supabase from "@/library/supabase-client";
import { Alert } from "react-native";
import AddChildPopup from "@/components/add-child-popup";
import SwitchChildPopup from "@/components/switch-child-popup";
import stringLib from "@/assets/stringLibrary.json";
import { getActiveChildId, listChildren } from "@/library/local-store";


const testIDs = stringLib.testIDs.profile;


jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
        push: jest.fn(),
    },
}));

jest.mock("expo-audio", () => ({
    useAudioPlayer: () => undefined,
}));

jest.mock("@/components/switch-child-popup", () => {
    const View = jest.requireActual("react-native").View;
    const SwitchChildMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return SwitchChildMock;
});

jest.mock("@/components/add-child-popup", () => {
    const View = jest.requireActual("react-native").View;
    const AddChildMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return AddChildMock;
});

jest.mock("@/library/auth-provider", () => {
    const exitGuest = jest.fn();
    return {
        useAuth: jest.fn(() => ({
            session: { user: { user_metadata: {} } },
            isGuest: false,
            exitGuest: exitGuest,
        })),
    };
});

jest.mock("@/library/utils", () => ({
    getActiveChildData: jest.fn(async () => ({ success: true })),
    getChildren: jest.fn(),
    saveNewChild: jest.fn(),
}));

jest.mock("@/library/local-store", () => ({
    getActiveChildId: jest.fn(async () => true),
    listChildren: jest.fn(async () => [{ id: true }]),
}));

jest.mock("@/library/supabase-client", () => {
    return ({
        auth: {
            signOut: jest.fn(async () => ({})),
            updateUser: jest.fn(async () => ({})),
        },
    });
});

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

jest.mock("@/assets/sounds/ui-pop.mp3", () => undefined);


function updateUseAuth({
    clearSession,
    userData,
    isGuest,
    exitGuest,
}: {
    clearSession?: boolean;
    userData?: {
        firstName: string,
        lastName: string,
        email: string,
    };
    isGuest?: boolean;
    exitGuest?: () => Promise<{ error: any } | void>;
}) {
    // get the current mocked return value of useAuth(). Convert to mock and read mockImplementation property to avoid linting errors
    const auth: any = (useAuth as jest.Mock)();
    if (userData) auth.session = { user: { user_metadata: userData } };
    if (clearSession) auth.session = undefined;
    if (isGuest) auth.isGuest = isGuest;
    if (exitGuest) (auth.exitGuest as jest.Mock).mockImplementation(exitGuest);
    (useAuth as jest.Mock).mockImplementation(() => auth);
}


function manualPromise(): {
    promise: Promise<unknown>, resolve: (value?: any) => void
} {
    let resolvePromise: (value: any) => void = () => undefined;
    const promise = new Promise((resolve) => {
        resolvePromise = (value: any = undefined) => resolve(value);
    });
    return { promise, resolve: resolvePromise };
};


describe("Profile screen", () => {
    beforeEach(() => {
        // to clear the .mock.calls array
        (router.replace as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
        (AddChildPopup as jest.Mock).mockClear();
        (SwitchChildPopup as jest.Mock).mockClear();
        (saveNewChild as jest.Mock).mockClear();
        (supabase.auth.updateUser as jest.Mock).mockClear();
    });

    test("Displays buttons and labels", async () => {
        render(<Profile/>);
        await screen.findByText("👶 ERROR");  // wait for child name to finish loading...

        expect(screen.getByTestId(testIDs.childNameButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.addChildButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.caretakersButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.emailButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.passwordButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.appVersionButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.signOutButton)).toBeTruthy();
        expect(screen.getByText("Sign Out")).toBeTruthy();  // sign out button label

        // this should be hidden for signed in users
        expect(() => screen.getByTestId(testIDs.childNameGuest)).toThrow();
    });

    test("Hides popups by default", async () => {
        render(<Profile/>);
        await screen.findByText("👶 ERROR");  // wait for child name to finish loading...

        // <AddChildPopup/> and <SwitchChildPopup/> have not yet been called with visible=true
        expect((AddChildPopup as jest.Mock).mock.calls.find(call =>
            call[0].visible !== false
        )).toBeFalsy();
        expect((SwitchChildPopup as jest.Mock).mock.calls.find(call =>
            call[0].visible !== false
        )).toBeFalsy();
    });

    test("Displays user data", async () => {
        const testFirstName = "test first name";
        const testLastName = "test last name";
        const testEmail = "test email";
        updateUseAuth({ userData: {
            firstName: testFirstName,
            lastName: testLastName,
            email: testEmail,
        }});

        render(<Profile/>);
        await screen.findByText("👶 ERROR");  // wait for child name to finish loading...

        expect(screen.getByText(`${testFirstName} ${testLastName}`)).toBeTruthy();
        expect(screen.getByText(testEmail)).toBeTruthy();
    });

    test("Loads and displays active child", async () => {
        const testChildName = "test child name";
        const { promise: waitForChildData, resolve: resolveChildData } = manualPromise();
        const { promise: waitForChildDataCalled, resolve: resolveChildDataCalled } = manualPromise();

        // library/utils.ts -> getActiveChild() should be mocked to return:
        // a Promise that can be manually resolved to:
        // { success: /* truthy value */, childName: /* string */ }
        const originalMock = (getActiveChildData as jest.Mock).getMockImplementation();
        (getActiveChildData as jest.Mock).mockImplementation(async () => {
            resolveChildDataCalled();
            return await waitForChildData;
        });

        render(<Profile/>);

        // wait for page to load...
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());
        await waitForChildDataCalled;  // ...then ensure that getActiveChildData() has been called

        expect(screen.getByText("Loading...", { exact: false })).toBeTruthy();

        await act(async () => resolveChildData({ success: true, childName: testChildName }));
        expect(() => screen.getByText("Loading...", { exact: false })).toThrow();
        expect(screen.getByText(testChildName, { exact: false })).toBeTruthy();

        // revert mock implementation
        (getActiveChildData as jest.Mock).mockImplementation(originalMock);
    });

    test("Catches sign out error", async () => {
        const testErrorMessage = "test error";

        // supabase.auth.signout() should be mocked to return:
        // { error: /* truthy value */ }
        // this should cause error handling in app/(modals)/profile.tsx -> handleSignOut()
        (supabase.auth.signOut as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testErrorMessage); }
        );

        render(<Profile/>);
        await screen.findByText("👶 ERROR");  // wait for child name to finish loading...

        await userEvent.press(screen.getByTestId(testIDs.signOutButton));

        expect(Alert.alert as jest.Mock).toHaveBeenLastCalledWith("Sign out failed", testErrorMessage);
        expect(router.replace as jest.Mock).toHaveBeenCalledTimes(0);  // user was not redirected
    });

    test("Redirects on successful sign out", async () => {
        render(<Profile/>);
        await screen.findByText("👶 ERROR");  // wait for child name to finish loading...

        await userEvent.press(screen.getByTestId(testIDs.signOutButton));

        expect(router.replace as jest.Mock).toHaveBeenCalledTimes(1);  // user was redirected
        expect(router.replace as jest.Mock).toHaveBeenLastCalledWith("/");
    });

    test("Displays loading message for child names/switching", async () => {
        const { promise: waitForGetChildren, resolve: resolveGetChildren } = manualPromise();
        const { promise: waitForGetChildrenCalled, resolve: resolveGetChildrenCalled } = manualPromise();

        // library/utils.ts -> getActiveChild() should be mocked to return:
        // a Promise that can be manually resolved to:
        // /* {}[] with length >= 2 */
        const originalMock = (getActiveChildData as jest.Mock).getMockImplementation();
        (getChildren as jest.Mock).mockImplementation(async () => {
            resolveGetChildrenCalled();
            return await waitForGetChildren;
        });

        render(<Profile/>);

        // wait for page to load...
        await screen.findByText("👶 ERROR");
        await waitForGetChildrenCalled;  // ...then ensure that getChildren() has been called

        expect(screen.getByTestId(testIDs.loadingNames)).toBeTruthy();

        await act(async () => resolveGetChildren([{}, {}]));

        // switch child button should now be displayed instead of the loading indicator
        expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow();
        expect(screen.getByTestId(testIDs.switchChildButton)).toBeTruthy();

        // revert mock implementation
        (getChildren as jest.Mock).mockImplementation(originalMock);
    });

    test("Displays child names error", async () => {
        const testErrorMessage = "test error";

        // library/utils.ts->getChildren() should be mocked to throw an error
        // this should cause error handling in app/(modals)/profile.tsx -> fetchChildNames()
        (getChildren as jest.Mock).mockImplementation(
            async () => { throw new Error(testErrorMessage); }
        );

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        expect(screen.getByTestId(testIDs.namesError)).toBeTruthy();
        expect(screen.getByTestId(testIDs.addChildButton)).toBeTruthy();  // but user should still be able to add a child

        // revert mock implementation
        (getChildren as jest.Mock).mockReset();
    });

    test("Hides switch child button when user has no children", async () => {
        // library/utils.ts->getChildren() should be mocked to return:
        // /* {}[] with length = 0 */
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => []
        );

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");  //
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        expect(() => screen.getByTestId(testIDs.namesError)).toThrow();
        expect(() => screen.getByTestId(testIDs.switchChildButton)).toThrow();
    });

    test("Hides switch child button when user has 1 child", async () => {
        // library/utils.ts->getChildren() should be mocked to return:
        // /* {}[] with length = 1 */
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => [{}]
        );

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        expect(() => screen.getByTestId(testIDs.namesError)).toThrow();
        expect(() => screen.getByTestId(testIDs.switchChildButton)).toThrow();
    });

    test("Shows switch child button when user has 2 children", async () => {
        // library/utils.ts->getChildren() should be mocked to return:
        // /* {}[] with length = 2 */
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => [{}, {}]
        );

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        // now the switch child button should be shown
        expect(() => screen.getByTestId(testIDs.namesError)).toThrow();
        expect(screen.getByTestId(testIDs.switchChildButton)).toBeTruthy();
    });

    test("Displays add child popup", async () => {
        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.addChildButton));

        // now the add child popup should be visible
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);
    });

    test("Add child popup hides and resets name after cancel", async () => {
        const testName = "test name";

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.addChildButton));

        // enter child name
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testName));

        // the name should be passed to the add child popup
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].childName).toBe(testName);

        // press cancel button
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleCancel());

        // the add child popup should now be hidden
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);

        await userEvent.press(screen.getByTestId(testIDs.addChildButton));

        // the name should have been reset
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].childName).toBe("");
    });

    test("Catch saveNewChild() error", async () => {
        const testErrorMessage = "test error";

        // library/utils.ts->saveNewChild() should be mocked to throw an error
        // this should cause error handling in app/(modals)/profile.tsx -> handleSaveChild()
        (saveNewChild as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testErrorMessage); }
        );

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.addChildButton));

        // press save button
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        // the add child popup should still be visible
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

        // error message generated by library/utils.ts -> saveNewChild()
        // Alert.alert() called by app/(modals)/profile.tsx -> handleSaveChild()
        expect((Alert.alert as jest.Mock).mock.lastCall[0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.lastCall[1]).toBe(testErrorMessage);
    });

    test("Saves correct new child name", async () => {
        const testName = "test name";

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.addChildButton));

        // enter child name
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testName));
        // press save button
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        // ensure correct name was saved
        expect((saveNewChild as jest.Mock).mock.calls[0][0]).toBe(testName);
    });

    test("Add child popup hides and resets name after successful save", async () => {
        const testName = "test name";

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.addChildButton));

        // enter child name
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testName));

        // the name should be passed to the add child popup
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].childName).toBe(testName);

        // press save button
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        // the add child popup should now be hidden
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);

        await userEvent.press(screen.getByTestId(testIDs.addChildButton));

        // the name should have been reset
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].childName).toBe("");
    });

    test("Displays switch child popup", async () => {
        // library/utils.ts->getChildren() should be mocked to return:
        // /* {}[] with length >= 2 */
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => [{}, {}]
        );

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.switchChildButton));

        // now the switch child popup should be visible
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);
    });

    test("Passes correct names to switch child popup", async () => {
        const testChildren = ["test name 1", "test name 2", "test name 3"];
        const testActiveChild = "test active child";

        // library/utils.ts->getChildren() should be mocked to return:
        // { name: /* test name */ }[]
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => testChildren.map(name => ({ name }))
        );

        // library/utils.ts -> getActiveChild() should be mocked to return:
        // { success: /* truthy value */, childName: /* test name */ }
        (getActiveChildData as jest.Mock).mockImplementationOnce(
            async () => ({ success: true, childName: testActiveChild }));

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText(testActiveChild, { exact: false });
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.switchChildButton));

        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].childNames).toEqual(testChildren);
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].currentChild).toEqual(testActiveChild);
    });

    test("Hides switch child popup on close", async () => {
        // library/utils.ts->getChildren() should be mocked to return:
        // /* {}[] with length >= 2 */
        (getChildren as jest.Mock).mockImplementationOnce(
            async () => [{}, {}]
        );

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.switchChildButton));

        // now the switch child popup should be visible
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

        // press cancel button
        await act(async () => (SwitchChildPopup as jest.Mock).mock.lastCall[0].handleCancel());

        // now the switch child popup should be hidden again
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });

    test("Catch invalid child switch request", async () => {
        const testChildren = [{}, {}, {}];
        const testSwitch = -1;  // should not be < testChildren.length and >= 0
        const testActiveChild = "test active child";

        // library/utils.ts->getChildren() should be mocked to return:
        // {}[]
        (getChildren as jest.Mock).mockImplementationOnce(async () => testChildren);

        // library/utils.ts -> getActiveChild() should be mocked to return:
        // { success: /* truthy value */, childName: /* test name */ }
        // this is so that loading the child name causes no errors/Alert.alert calls
        const originalMock = (getActiveChildData as jest.Mock).getMockImplementation();
        (getActiveChildData as jest.Mock).mockImplementation(
            async () => ({ success: true, childName: testActiveChild })
        );

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText(testActiveChild, { exact: false });
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.switchChildButton));

        // now the switch child popup should be visible
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

        (getChildren as jest.Mock).mockClear();  // reset the .mock.calls array before selecting a new child

        // press select button
        await act(async () => (SwitchChildPopup as jest.Mock).mock.lastCall[0].handleSwitch(testSwitch));

        // error message generated by app/(modals)/profile.tsx -> handleSwitchChild()
        // Alert.alert() called by app/(modals)/profile.tsx -> handleSwitchChild()
        expect((Alert.alert as jest.Mock).mock.lastCall[0]).toBe("Error switching:");
        expect((Alert.alert as jest.Mock).mock.lastCall[1]).toBe("Unable to find selected child");

        expect(getChildren as jest.Mock).toHaveBeenCalled();  // profile page should have refetched the user's children

        // restore prior mock of getActiveChildData()
        (getActiveChildData as jest.Mock).mockImplementation(originalMock);
    });

    // This test awaiting issue # 168 on gitHub
    // test("Catch updateUser() error", async () => {
    //     const testChildren = [{}, {}, {}];
    //     const testSwitch = 1;  // must be < testChildren.length and >= 0

    //     // library/utils.ts->getChildren() should be mocked to return:
    //     // {}[]
    //     (getChildren as jest.Mock).mockImplementationOnce(async () => testChildren);

    //     // supabase.auth.updateUser() should be mocked to return:
    //     // { error: /* truthy value */ }
    //     // This should cause error handling in app/(modals)/profile.tsx -> handleSwitchChild()
    //     (supabase.auth.updateUser as jest.Mock).mockImplementationOnce(
    //         async () => ({ error: true })
    //     );

    //     render(<Profile/>);

    //     // wait for child names to finish loading...
    //     await screen.findByText("👶 ERROR");
    //     await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

    //     await userEvent.press(screen.getByTestId(testIDs.switchChildButton));

    //     // now the switch child popup should be visible
    //     expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

    //     // press select button
    //     await act(async () => (SwitchChildPopup as jest.Mock).mock.lastCall[0].handleSwitch(testSwitch));

    //     // error message generated by app/(modals)/profile.tsx -> handleSwitchChild()
    //     // Alert.alert() called by app/(modals)/profile.tsx -> handleSwitchChild()
    //     expect((Alert.alert as jest.Mock).mock.lastCall[0]).toBe("Error switching");
    //     expect((Alert.alert as jest.Mock).mock.lastCall[1]).toBe("Unable to find selected child");
    // });

    test("Successfully switches child", async () => {
        const testChildren = [
            { name: "test name 1", id: "test id 1" },
            { name: "test name 2", id: "test id 2" },
            { name: "test name 3", id: "test id 3" },
        ];
        const testSwitch = 2;  // must be < testChildren.length and >= 0

        // library/utils.ts->getChildren() should be mocked to return:
        // { name: /* test name */, id: /* test value */ }[]
        (getChildren as jest.Mock).mockImplementationOnce(async () => testChildren);

        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.switchChildButton));

        // now the switch child popup should be visible
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

        // press select button
        await act(async () => (SwitchChildPopup as jest.Mock).mock.lastCall[0].handleSwitch(testSwitch));

        expect((supabase.auth.updateUser as jest.Mock).mock.calls[0][0].data.activeChildId)
            .toBe(testChildren[testSwitch].id);

        // now the switch child popup should be hidden again
        expect((SwitchChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });

    test("Redirects to active child page", async () => {
        render(<Profile/>);

        // wait for child names to finish loading...
        await screen.findByText("👶 ERROR");
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());

        await userEvent.press(screen.getByTestId(testIDs.childNameButton));

        // user was redirected
        expect((router.push as jest.Mock).mock.calls[0][0]).toBe("/(modals)/active-child");
    });
});


describe("profile screen (guest mode)", () => {
    beforeAll(() => {
        updateUseAuth({ isGuest: true, clearSession: true });
    });
    
    beforeEach(() => {
        // to clear the .mock.calls array
        (router.replace as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
        (AddChildPopup as jest.Mock).mockClear();
        (SwitchChildPopup as jest.Mock).mockClear();
        (saveNewChild as jest.Mock).mockClear();
    });

    test("Displays buttons (guest)", async () => {
        render(<Profile/>);
        await screen.findByText("👶 Guest Child");  // wait for child name to finish loading...

        expect(screen.getByTestId(testIDs.childNameGuest)).toBeTruthy();
        expect(screen.getByTestId(testIDs.appVersionButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.signOutButton)).toBeTruthy();
        expect(screen.getByText("Exit Guest Mode")).toBeTruthy();  // sign out button label

        // these buttons should be hidden in guest mode
        expect(() => screen.getByTestId(testIDs.childNameButton)).toThrow();
        expect(() => screen.getByTestId(testIDs.addChildButton)).toThrow();
        expect(() => screen.getByTestId(testIDs.caretakersButton)).toThrow();
        expect(() => screen.getByTestId(testIDs.emailButton)).toThrow();
        expect(() => screen.getByTestId(testIDs.passwordButton)).toThrow();
    });

    test("Loads and displays active child", async () => {
        const testChildName = "test child name";
        const testChildId = "test child id";
        const { promise: waitForListChildren, resolve: resolveListChildren } = manualPromise();
        const { promise: waitForListChildrenCalled, resolve: resolveListChildrenCalled } = manualPromise();

        // library/local-store.ts -> getLocalActiveChildId() should be mocked to return:
        // /* test string */
        // This should match the id field of one of the objects in the array returned by the mock of listChildren()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => testChildId
        );

        // library/local-store.ts -> listChildren() should be mocked to return:
        // a Promise that can be manually resolved to:
        // { id: /* string */, name: /* string */ }[] where the id field matches testId
        (listChildren as jest.Mock).mockImplementationOnce(async () => {
            resolveListChildrenCalled();
            return await waitForListChildren;
        });

        render(<Profile/>);

        // wait for child names to finish loading...
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());
        await waitForListChildrenCalled;  // ensure getActiveChildData() has been called

        expect(screen.getByText("Loading...", { exact: false })).toBeTruthy();

        await act(async () => resolveListChildren([{ id: testChildId, name: testChildName }]));
        expect(() => screen.getByText("Loading...", { exact: false })).toThrow();
        expect(screen.getByText(testChildName, { exact: false })).toBeTruthy();
    });

    test("Catches missing child ID", async () => {
        // library/local-store.ts -> getLocalActiveChildId() should be mocked to return:
        // /* falsy value */
        // This should cause error handling in app/(modals)/profile.tsx -> loadChildName()
        (getActiveChildId as jest.Mock).mockImplementationOnce(
            async () => false
        );

        render(<Profile/>);

        // wait for child names to finish loading...
        await waitFor(() => expect(() => screen.getByTestId(testIDs.loadingNames)).toThrow());
        await waitFor(() => expect(() => screen.getByText("Loading...", { exact: false })).toThrow());

        expect(screen.getByText("Guest Child", { exact: false })).toBeTruthy();
    });

    // this test awaiting github issue # 169
    // test("Catches sign out error", async () => {
    //     const testErrorMessage = "test error";

    //     // library/auth-provider.tsx -> exitGuest should be mocked to return:
    //     // { error: /* truthy value */ }
    //     // this should cause error handling in app/(modals)/profile.tsx -> handleSignOut()
    //     updateUseAuth({ exitGuest: async () => ({ error: true })});

    //     render(<Profile/>);
    //     await screen.findByText("👶 Guest Child");  // wait for child name to finish loading...

    //     await userEvent.press(screen.getByTestId(testIDs.signOutButton));

    //     expect(Alert.alert as jest.Mock).toHaveBeenLastCalledWith("Sign out failed", testErrorMessage);
    //     expect(router.replace as jest.Mock).toHaveBeenCalledTimes(0);  // user was not redirected

    //     // revert library/auth-provider.tsx -> exitGuest to not cause any errors
    //     updateUseAuth({ exitGuest: async () => undefined});
    // });

    test("Redirects on successful sign out", async () => {
        render(<Profile/>);
        await screen.findByText("👶 Guest Child");  // wait for child name to finish loading...

        await userEvent.press(screen.getByTestId(testIDs.signOutButton));

        expect(router.replace as jest.Mock).toHaveBeenCalledTimes(1);  // user was redirected
        expect(router.replace as jest.Mock).toHaveBeenLastCalledWith("/");
    });
});
