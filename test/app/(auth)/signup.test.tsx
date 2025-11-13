import { render, screen, userEvent } from "@testing-library/react-native";
import SignUpScreen from "@/app/(auth)/signup";

jest.mock("expo-router", () => ({
  router: {
    replace: jest.fn(),
  },
}));

jest.mock("@/library/auth-provider", () => ({
  useAuth: () => ({
    session: null,
    loading: false,
  }),
}));


describe("Create Account screen", () => {
    test("Render input fields", () => {
        render(<SignUpScreen/>);
      
        expect(screen.getByTestId("sign-up-first-name")).toBeTruthy();
        expect(screen.getByTestId("sign-up-last-name")).toBeTruthy();
        expect(screen.getByTestId("sign-up-email")).toBeTruthy();
        expect(screen.getByTestId("sign-up-password-initial")).toBeTruthy();
        expect(screen.getByTestId("sign-up-password-confirm")).toBeTruthy();
    });

    test("Render nav buttons", () => {
        render(<SignUpScreen/>);
      
        expect(screen.getByTestId("sign-up-password-visibility")).toBeTruthy();
        expect(screen.getByTestId("sign-up-forgot-password")).toBeTruthy();
        expect(screen.getByTestId("sign-up")).toBeTruthy();
        expect(screen.getByTestId("sign-in")).toBeTruthy();
        expect(screen.getByTestId("guest-button")).toBeTruthy();
    });

    test("Catch mismatched passwords", async () => {
        render(<SignUpScreen/>);
      
        //fill in both password entries, but with different passwords
        await userEvent.type(
          screen.getByTestId("sign-up-password-initial"),
          "pass1"
        );
        await userEvent.type(
          screen.getByTestId("sign-up-password-confirm"),
          "pass2"
        );
      
        expect(screen.getByTestId("password-error")).toBeTruthy();
    });
});
