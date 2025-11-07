import React from "react";
import { render, screen, userEvent } from "@testing-library/react-native";
import RootIndex from "@/app/index";
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

describe("Login screen", () => {
    test("Renders app logo", () => {
      render(<RootIndex/>);

      expect(screen.getByTestId("simple-baby-logo")).toBeTruthy();
    })
  
    test("Renders login buttons", () => {
        render(<RootIndex/>);

        expect(screen.getByTestId("sign-in-button")).toBeTruthy();
        expect(screen.getByTestId("sign-up-button")).toBeTruthy();
        expect(screen.getByTestId("guest-button")).toBeTruthy();
    })
})


describe("Create Account screen", () => {
    test("Render input fields", () => {
        render(<SignUpScreen/>);
      
        expect(screen.getByTestId("sign-up-first")).toBeTruthy();
        expect(screen.getByTestId("sign-up-last")).toBeTruthy();
        expect(screen.getByTestId("sign-up-email")).toBeTruthy();
        expect(screen.getByTestId("sign-up-password1")).toBeTruthy();
        expect(screen.getByTestId("sign-up-password2")).toBeTruthy();
    });

    test("Render nav buttons", () => {
        render(<SignUpScreen/>);
      
        expect(screen.getByTestId("sign-up-password-visibility")).toBeTruthy();
        expect(screen.getByTestId("sign-up-forgot-password")).toBeTruthy();
        expect(screen.getByTestId("sign-up")).toBeTruthy();
        expect(screen.getByTestId("sign-in")).toBeTruthy();
        expect(screen.getByTestId("guest-button")).toBeTruthy();
    });

    test("Catch invalid passwords", async () => {
        render(<SignUpScreen/>);
      
        //fill in both password entries, but with different passwords
        await userEvent.type(
          screen.getByTestId("sign-up-password1"),
          "pass1"
        )
        await userEvent.type(
          screen.getByTestId("sign-up-password2"),
          "pass2"
        )
      
        expect(screen.getByTestId("password-error")).toBeTruthy();
    });
})