import { render, screen, userEvent, act } from "@testing-library/react-native";
import SignUpScreen from "@/app/(auth)/signup";
import { router } from "expo-router";
import { Alert } from "react-native";
import { useAuth } from "@/library/auth-provider";
import { formatStringList } from "@/library/utils";
import stringLib from "@/assets/stringLibrary.json";


const testIDs = stringLib.testIDs.signUp;


jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
        push: jest.fn(),
    },
}));

jest.mock("@/library/auth-provider", () => {
    const signUp = jest.fn(async () => ({}));
    const signIn = jest.fn(async () => ({}));
    return {
        useAuth: () => ({
            signUp: signUp,
            signIn: signIn,
        }),
    };
});

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});

jest.mock("@/library/utils", () => ({
    formatStringList: jest.fn(),
}));


async function fillInputs({
    email,
    firstName,
    lastName,
    passwordInitial,
    passwordConfirmed,
}: {
    email?: string;
    firstName?: string;
    lastName?: string;
    passwordInitial?: string;
    passwordConfirmed?: string;
}) {
    if (email) {
        await userEvent.type(
            screen.getByTestId(testIDs.email),
            email
        );
    }
    if (firstName) {
        await userEvent.type(
            screen.getByTestId(testIDs.firstName),
            firstName
        );
    }
    if (lastName) {
        await userEvent.type(
            screen.getByTestId(testIDs.lastName),
            lastName
        );
    }
    if (passwordInitial) {
        await userEvent.type(
            screen.getByTestId(testIDs.passwordInitial),
            passwordInitial
        );
    }
    if (passwordConfirmed) {
        await userEvent.type(
            screen.getByTestId(testIDs.passwordConfirm),
            passwordConfirmed
        );
    }
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


describe("Create Account screen", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (router.replace as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
        (useAuth().signUp as jest.Mock).mockClear();
        (useAuth().signIn as jest.Mock).mockClear();
    });

    test("Render input fields", () => {
        render(<SignUpScreen/>);

        expect(screen.getByTestId(testIDs.firstName)).toBeTruthy();
        expect(screen.getByTestId(testIDs.lastName)).toBeTruthy();
        expect(screen.getByTestId(testIDs.email)).toBeTruthy();
        expect(screen.getByTestId(testIDs.passwordInitial)).toBeTruthy();
        expect(screen.getByTestId(testIDs.passwordConfirm)).toBeTruthy();
    });

    test("Render nav buttons", () => {
        render(<SignUpScreen/>);

        expect(screen.getByTestId(testIDs.passwordVisibility)).toBeTruthy();
        expect(screen.getByTestId(testIDs.forgotPassword)).toBeTruthy();
        expect(screen.getByTestId(testIDs.signUpButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.signInButton)).toBeTruthy();
        expect(screen.getByTestId(testIDs.guestButton)).toBeTruthy();
    });

    test("Redirects to sign in screen", async () => {
        render(<SignUpScreen/>);

        await userEvent.press(screen.getByTestId(testIDs.signInButton));

        expect(router.replace).toHaveBeenCalledTimes(1);
        expect((router.replace as jest.Mock).mock.calls[0][0]).toBe("/signin");
    });

    test("Redirects to guest screen", async () => {
        render(<SignUpScreen/>);

        await userEvent.press(screen.getByTestId(testIDs.guestButton));

        expect(router.push).toHaveBeenCalledTimes(1);
        expect((router.push as jest.Mock).mock.calls[0][0]).toBe("/guest");
    });

    test("Catch missing inputs", async () => {
        const testList = "test list";
        // library/utils.ts -> formatStringList() should be mocked to return:
        // /* test string */
        (formatStringList as jest.Mock).mockImplementationOnce(
            () => testList
        );

        render(<SignUpScreen/>);

        // fill in one input at a time, and attempt to submit between each
        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe(stringLib.errors.missingFields);
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(`Please provide the following fields: ${testList}.`);
        expect((formatStringList as jest.Mock).mock.lastCall[0])
            .toEqual(["email", "first name", "last name", "password"]);

        await fillInputs({ lastName: "x" });

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((formatStringList as jest.Mock).mock.lastCall[0])
            .toEqual(["email", "first name", "password"]);

        await fillInputs({ passwordInitial: "x" });

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((formatStringList as jest.Mock).mock.lastCall[0])
            .toEqual(["email", "first name", "confirmed password"]);

        await fillInputs({ email: "x" });

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((formatStringList as jest.Mock).mock.lastCall[0])
            .toEqual(["first name", "confirmed password"]);

        await fillInputs({ firstName: "x" });

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((formatStringList as jest.Mock).mock.lastCall[0])
            .toEqual(["confirmed password"]);
    });

    test("Catch mismatched passwords", async () => {
        render(<SignUpScreen/>);

        // fill in both password entries, but with different passwords
        await fillInputs({
            email: "x",
            firstName: "x",
            lastName: "x",
            passwordInitial: "pass1",
            passwordConfirmed: "pass2",
        });

        expect(screen.getByTestId(testIDs.passwordError)).toBeTruthy();

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((Alert.alert as jest.Mock).mock.lastCall[0]).toBe(stringLib.errors.mismatchedPasswords);
    });

    test("Submits correct user data", async () => {
        const testInputs = {
            email: "test email",
            firstName: "test first name",
            lastName: "test last name",
            passwordInitial: "test password",
            passwordConfirmed: "test password",
        };

        render(<SignUpScreen/>);

        // fill in test inputs
        await fillInputs(testInputs);

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((useAuth().signUp as jest.Mock).mock.calls[0][0]).toBe(testInputs.email);
        expect((useAuth().signUp as jest.Mock).mock.calls[0][1]).toBe(testInputs.passwordInitial);
        expect((useAuth().signUp as jest.Mock).mock.calls[0][2]).toBe(testInputs.firstName);
        expect((useAuth().signUp as jest.Mock).mock.calls[0][3]).toBe(testInputs.lastName);
    });

    test("Catch duplicate email signUp() error", async () => {
        // library/auth-provider.ts -> signUp() should be mocked to return:
        // { error: Error("User already registered") }
        // This is a specific error thrown when the user attempts to register with an already-registered email
        // This should cause error handling in app/(auth)/signup.tsx -> handleSignUp()
        (useAuth().signUp as jest.Mock).mockImplementationOnce(
            async () => ({ error: new Error("User already registered") })
        );

        render(<SignUpScreen/>);

        // fill in minimum inputs
        await fillInputs({
            email: "x",
            firstName: "x",
            lastName: "x",
            passwordInitial: "x",
            passwordConfirmed: "x",
        });

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((Alert.alert as jest.Mock).mock.lastCall[0]).toBe(stringLib.errors.signUp);
        expect((Alert.alert as jest.Mock).mock.lastCall[1]).toBe(stringLib.errors.emailInUse);
    });

    test("Catch generic signUp() error", async () => {
        const testErrorMessage = "test sign in error";
        // library/auth-provider.ts -> signUp() should be mocked to return:
        // { error: Error(/* test string */) }
        // This should cause error handling in app/(auth)/signup.tsx -> handleSignUp()
        (useAuth().signUp as jest.Mock).mockImplementationOnce(
            async () => ({ error: new Error(testErrorMessage) })
        );

        render(<SignUpScreen/>);

        // fill in minimum inputs
        await fillInputs({
            email: "x",
            firstName: "x",
            lastName: "x",
            passwordInitial: "x",
            passwordConfirmed: "x",
        });

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((Alert.alert as jest.Mock).mock.lastCall[0]).toBe(stringLib.errors.signUp);
        expect((Alert.alert as jest.Mock).mock.lastCall[1]).toBe(testErrorMessage);
    });

    test("Catch signIn() error", async () => {
        const testErrorMessage = "test sign in error";
        // library/auth-provider.ts -> signIn() should be mocked to return:
        // { error: Error(/* test string */) }
        // This should cause error handling in app/(auth)/signup.tsx -> handleSignUp()
        (useAuth().signIn as jest.Mock).mockImplementationOnce(
            async () => ({ error: new Error(testErrorMessage) })
        );

        render(<SignUpScreen/>);

        // fill in minimum inputs
        await fillInputs({
            email: "x",
            firstName: "x",
            lastName: "x",
            passwordInitial: "x",
            passwordConfirmed: "x",
        });

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((Alert.alert as jest.Mock).mock.lastCall[0]).toBe(stringLib.errors.signIn);
        expect((Alert.alert as jest.Mock).mock.lastCall[1]).toBe(testErrorMessage);
    });

    test("Redirects to home page on success", async () => {
        render(<SignUpScreen/>);

        // fill in minimum inputs
        await fillInputs({
            email: "x",
            firstName: "x",
            lastName: "x",
            passwordInitial: "x",
            passwordConfirmed: "x",
        });

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));
        expect((router.replace as jest.Mock).mock.calls[0][0]).toBe("/(tabs)");
    });

    test("Indicates loading", async () => {
        const { promise: waitForSignUp, resolve: resolveSignUp } = manualPromise();
        const { promise: waitForSignUpCalled, resolve: resolveSignUpCalled } = manualPromise();
        const { promise: waitForSignIn, resolve: resolveSignIn } = manualPromise();
        const { promise: waitForSignInCalled, resolve: resolveSignInCalled } = manualPromise();

        // library/auth-provider.ts -> signUp() should be mocked to return:
        // a Promise that can be manually resolved to: {}
        (useAuth().signUp as jest.Mock).mockImplementationOnce(async () => {
            resolveSignUpCalled();
            return await waitForSignUp;
        });

        // library/auth-provider.ts -> signIn() should be mocked to return:
        // a Promise that can be manually resolved to: {}
        (useAuth().signIn as jest.Mock).mockImplementationOnce(async () => {
            resolveSignInCalled();
            return await waitForSignIn;
        });

        render(<SignUpScreen/>);

        // fill in minimum inputs
        await fillInputs({
            email: "x",
            firstName: "x",
            lastName: "x",
            passwordInitial: "x",
            passwordConfirmed: "x",
        });
        expect(screen.getByText(stringLib.uiLabels.signUpButton)).toBeTruthy();

        await userEvent.press(screen.getByTestId(testIDs.signUpButton));

        // wait for library/auth-provider.tsx -> signUp() to be called
        await waitForSignUpCalled;
        // the sign up button label should indicate loading
        expect(() => screen.getByText(stringLib.uiLabels.signUpButton)).toThrow();
        expect(screen.getByText(stringLib.uiLabels.signUpButtonLoading)).toBeTruthy();
        await act(async () => resolveSignUp({}));  // unblock signUp()

        // wait for library/auth-provider.tsx -> signIn() to be called
        await waitForSignInCalled;
        // the sign up button label should indicate loading
        expect(() => screen.getByText(stringLib.uiLabels.signUpButton)).toThrow();
        expect(screen.getByText(stringLib.uiLabels.signUpButtonLoading)).toBeTruthy();
        await act(async () => resolveSignIn({}));  // unblock signIn()

        // the sign up button label should no longer indicate loading
        expect(screen.getByText(stringLib.uiLabels.signUpButton)).toBeTruthy();
        expect(() => screen.getByText(stringLib.uiLabels.signUpButtonLoading)).toThrow();
    });
});
