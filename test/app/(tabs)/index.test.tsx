import { render, screen, waitFor, act } from "@testing-library/react-native";
import MainTab from "@/app/(tabs)";
import AddChildPopup from "@/components/add-child-popup";
import { useAuth } from "@/library/auth-provider";
import TrackerButton from "@/components/tracker-button";
import { saveNewChild } from "@/library/utils";
import { Alert } from "react-native";
import { createChild, getActiveChildId } from "@/library/local-store";
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.tabsIndex;

// the buttons expected to be displayed, in order
const buttons = ["Sleep",  "Nursing", "Milestone", "Feeding", "Diaper", "Health"];


jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
    },
}));

jest.mock("@/library/auth-provider", () => ({
    useAuth: jest.fn(() => ({
        session: {
            user: {
                user_metadata: {
                    activeChildId: true,
                },
            },
        },
        isGuest: false,
        loading: false,
    })),
}));

jest.mock("@/components/add-child-popup", () => {
    const View = jest.requireActual("react-native").View;
    const AddChildMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return AddChildMock;
});

jest.mock("@/components/tracker-button", () => {
    const View = jest.requireActual("react-native").View;
    const ButtonMock = jest.fn(({testID}: {testID?: string}) => (<View testID={testID}></View>));
    return ButtonMock;
});

jest.mock("@/library/utils", () => ({
    formatName: jest.fn((name: string) => `Formatted name: ${name}`),
    saveNewChild: jest.fn(),
}));

jest.mock("@/library/local-store", () => ({
    getActiveChildId: jest.fn(async () => true),
    createChild: jest.fn(),
}));

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});


function updateUseAuth({
    clearSession,
    activeChildId,
    isGuest,
    loading,
}: {
    clearSession?: boolean;
    activeChildId?: string;
    isGuest?: boolean;
    loading?: boolean;
}) {
    // get the current mocked return value of useAuth(). Convert to mock and read mockImplementation property to avoid linting errors
    const auth: any = (useAuth as jest.Mock)();
    if (activeChildId !== undefined) auth.session = { user: { user_metadata: { activeChildId } } };
    if (clearSession) auth.session = undefined;
    if (isGuest) auth.isGuest = isGuest;
    if (loading !== undefined) auth.loading = loading;
    (useAuth as jest.Mock).mockImplementation(() => auth);
}


describe("Tracker screen", () => {

    beforeAll(() => {
        updateUseAuth({
            isGuest: false,
        });
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (AddChildPopup as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
        (saveNewChild as jest.Mock).mockClear();

        // reset mock functionality of useAuth()
        updateUseAuth({
            activeChildId: "x",
            loading: false,
        });
    });

    test("Loads tracker option buttons", () => {
        render(<MainTab/>);

        expect(screen.getByTestId(testIDs.sleepButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.nursingButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.milestoneButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.feedingButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.diaperButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.healthButton)).toBeTruthy();
    });

    test("Calls TrackerButton with correct information", () => {
        render(<MainTab/>);

        // get last calls to <TrackerButton/>
        const renderedButtons = (TrackerButton as jest.Mock).mock.calls.slice(-buttons.length);

        for (const call of renderedButtons) {
            const { label, icon, link} = call[0].button;
            expect(buttons.includes(label)).toBe(true);
            expect(link === `/${label.toLowerCase()}`).toBe(true);
            expect(icon).toBeTruthy();
        }
    });

    test("Calls TrackerButtons in expected order", () => {
        render(<MainTab/>);

        // get last calls to <TrackerButton/>
        const renderedButtons = (TrackerButton as jest.Mock).mock.calls.slice(-buttons.length);
        
        for (let i = 0; i < buttons.length; i++) {
            expect(renderedButtons[i][0].button.label === buttons[i]).toBe(true);
        }
    });

    test("Hides add child popup when loading", () => {
        updateUseAuth({ loading: true });
        render(<MainTab/>);

        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });

    test("Hides add child popup when user has an active child", () => {
        render(<MainTab/>);

        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });

    test("Shows add child popup when user has no active child", async () => {
        // library/auth-provider.tsx -> useAuth() should be mocked to return:
        // { user: { user_metadata: { activeChildId: /* falsy value */ } } }
        // This should cause the user to be prompted to add a new child
        updateUseAuth({ activeChildId: "" });
        render(<MainTab/>);

        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);
        expect(screen.getByTestId(testIDs.addChildPopup)).toBeTruthy();
    });

    test("Catches save child error", async () => {
        const testErrorMessage = "test error";

        // library/auth-provider.tsx -> useAuth() should be mocked to return:
        // { user: { user_metadata: { activeChildId: /* falsy value */ } } }
        // This should cause the user to be prompted to add a new child
        updateUseAuth({ activeChildId: "" });
        
        // library/utils.ts -> saveNewChild() should be mocked to throw an error
        // This should cause error handling in app/(tabs)/index.tsx -> handleSaveChild()
        (saveNewChild as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(testErrorMessage); }
        );

        render(<MainTab/>);

        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

        // set new child name, then attempt to save
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleSave());
        
        // error message generated by library/utils.ts -> saveNewChild()
        // Alert.alert() called by app/(tabs)/index.tsx -> handleSaveChild()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(testErrorMessage);
    });

    test("Saves correct child name", async () => {
        const testName = "test name";

        // library/auth-provider.tsx -> useAuth() should be mocked to return:
        // { user: { user_metadata: { activeChildId: /* falsy value */ } } }
        // This should cause the user to be prompted to add a new child
        updateUseAuth({ activeChildId: "" });

        render(<MainTab/>);

        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

        // set new child name, then save
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testName));
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        // ensure correct name was formatted and saved
        expect((saveNewChild as jest.Mock).mock.calls[0][0]).toBe(testName);
    });

    test("Hides add child popup on successful save", async () => {
        const testName = "test name";

        // library/auth-provider.tsx -> useAuth() should be mocked to return:
        // { user: { user_metadata: { activeChildId: /* falsy value */ } } }
        // This should cause the user to be prompted to add a new child
        updateUseAuth({ activeChildId: "" });

        render(<MainTab/>);

        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true);

        // set new child name, then save
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testName));
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        // add child popup should now be hidden
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });
});


describe("Tracker screen (guest mode)", () => {

    beforeAll(() => {
        updateUseAuth({
            isGuest: true,
        });
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (AddChildPopup as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
        (createChild as jest.Mock).mockClear();

        // reset mock functionality of getActiveChildId()
        (getActiveChildId as jest.Mock).mockImplementation(async () => true);
    });

    test("Hides add child popup when user has an active child", () => {
        render(<MainTab/>);

        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });

    test("Shows add child popup when user has no active child", async () => {
        // library/local-store.ts -> getActiveChildId() should be mocked to return:
        // /* falsy value */
        // This should cause the user to be prompted to add a new child
        (getActiveChildId as jest.Mock).mockImplementation(async () => false);

        render(<MainTab/>);

        await waitFor(() => expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true));
        expect(screen.getByTestId(testIDs.addChildPopup)).toBeTruthy();
    });

    test("Catches save child error", async () => {

        // library/local-store.ts -> getActiveChildId() should be mocked to return:
        // /* falsy value */
        // This should cause the user to be prompted to add a new child
        (getActiveChildId as jest.Mock).mockImplementation(async () => false);
        
        // library/local-store.ts -> createChild() should be mocked to throw an error
        // This should cause error handling in app/(tabs)/index.tsx -> handleSaveChild()
        (createChild as jest.Mock).mockImplementationOnce(
            async () => { throw new Error(); }
        );

        render(<MainTab/>);

        // wait for page to finish loading
        await waitFor(() => expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true));

        // set new child name, then attempt to save
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleSave());
        
        // error message generated by library/utils.ts -> saveNewChild()
        // Alert.alert() called by app/(tabs)/index.tsx -> handleSaveChild()
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(`Error`);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe("Could not create the child in guest mode. Please try again");
    });

    test("Saves correct child name", async () => {
        const testName = "test name";

        // library/local-store.ts -> getActiveChildId() should be mocked to return:
        // /* falsy value */
        // This should cause the user to be prompted to add a new child
        (getActiveChildId as jest.Mock).mockImplementation(async () => false);

        render(<MainTab/>);

        // wait for page to finish loading
        await waitFor(() => expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true));

        // set new child name, then save
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testName));
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        // ensure correct name was formatted and saved
        expect((createChild as jest.Mock).mock.calls[0][0]).toBe(testName);
    });

    test("Hides add child popup on successful save", async () => {
        const testName = "test name";

        // library/local-store.ts -> getActiveChildId() should be mocked to return:
        // /* falsy value */
        // This should cause the user to be prompted to add a new child
        (getActiveChildId as jest.Mock).mockImplementation(async () => false);

        render(<MainTab/>);

        // wait for page to finish loading
        await waitFor(() => expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(true));

        // set new child name, then save
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].onChildNameUpdate(testName));
        await act(async () => (AddChildPopup as jest.Mock).mock.lastCall[0].handleSave());

        // add child popup should now be hidden
        expect((AddChildPopup as jest.Mock).mock.lastCall[0].visible).toBe(false);
    });
});
