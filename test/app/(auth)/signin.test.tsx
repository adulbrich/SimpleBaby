import { render, screen, userEvent } from "@testing-library/react-native";
import SignInScreen from "@/app/(auth)/signin";
import { router } from 'expo-router';
import { useAuth } from '@/library/auth-provider';
import { Alert } from "react-native";

jest.mock("@/library/auth-provider", () => {
    const signIn = jest.fn(async () => ({}));
    return {
        useAuth: () => ({
            signIn: signIn,
        }),
    };
});

jest.mock("expo-router", () => ({
    router: {
        replace: jest.fn(),
        push: jest.fn(),
    },
}));

jest.mock("react-native", () => {
    const module = jest.requireActual("react-native");
    module.Alert.alert = jest.fn();
    return module;
});


describe("Log in screen", () => {
    beforeEach(() => {
        // to clear the mock calls
        (router.replace as jest.Mock).mockClear();
        (Alert.alert as jest.Mock).mockClear();
    });

    
    test("Render input fields", () => {
        render(<SignInScreen/>);
      
        expect(screen.getByTestId("sign-in-email")).toBeTruthy();
        expect(screen.getByTestId("sign-in-password")).toBeTruthy();
    });

    test("Render nav buttons", () => {
        render(<SignInScreen/>);
      
        expect(screen.getByTestId("sign-in-show-password")).toBeTruthy();
        expect(screen.getByTestId("sign-in-forgot-password")).toBeTruthy();
        expect(screen.getByTestId("sign-in-button")).toBeTruthy();
        expect(screen.getByTestId("sign-in-sign-up-button")).toBeTruthy();
        expect(screen.getByTestId("sign-in-guest-button")).toBeTruthy();
    });

    test("Redirects to sign up page", async () => {
        render(<SignInScreen/>);
      
        // press go to sign up page button
        await userEvent.press(screen.getByTestId("sign-in-sign-up-button"));

        // ensure user was redirected to the sign up page
        expect(router.replace).toHaveBeenCalledTimes(1);
        expect(router.replace).toHaveBeenLastCalledWith("/(auth)/signup");
    });

    test("Redirects to guest page", async () => {
        render(<SignInScreen/>);
      
        // press go to guest page button
        await userEvent.press(screen.getByTestId("sign-in-guest-button"));

        // ensure user was redirected to the guest page
        expect(router.push).toHaveBeenCalledTimes(1);
        expect(router.push).toHaveBeenLastCalledWith("/(auth)/guest");
    });

    test("Catches sign in error (generic error message)", async () => {
        // library/auth-provider.tsx -> useAuth().signIn() should be mocked to return:
        // { error: /* truthy value */ }
        // This should cause error handling in app/(auth)/signin.tsx -> handleSignIn()
        (useAuth().signIn as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        );
        
        render(<SignInScreen/>);
      
        // press sign in button
        await userEvent.press(screen.getByTestId("sign-in-button"));

        // ensure user was redirected to the guest page
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Sign In Error");
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe("An error occurred while signing in.");
    });

    test("Catches sign in error (specific error message)", async () => {
        const testError = "test error";
        // library/auth-provider.tsx -> useAuth().signIn() should be mocked to return:
        // { error: { message: /* truthy string */ } }
        // This should cause error handling in app/(auth)/signin.tsx -> handleSignIn()
        (useAuth().signIn as jest.Mock).mockImplementationOnce(
            async () => ({ error: { message: testError } })
        );
        
        render(<SignInScreen/>);
      
        // press sign in button
        await userEvent.press(screen.getByTestId("sign-in-button"));

        // ensure user was redirected to the guest page
        expect((Alert.alert as jest.Mock).mock.calls[0][0]).toBe("Sign In Error");
        expect((Alert.alert as jest.Mock).mock.calls[0][1]).toBe(testError);
    });

    test("Redirects user on successful sign in", async () => {
        render(<SignInScreen/>);
      
        // press sign in button
        await userEvent.press(screen.getByTestId("sign-in-button"));

        // ensure user was redirected to the home page
        expect(router.replace).toHaveBeenCalledTimes(1);
        expect(router.replace).toHaveBeenLastCalledWith("/(tabs)");
    });
});
