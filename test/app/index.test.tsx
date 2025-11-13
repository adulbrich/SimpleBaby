import React from "react";
import { render, screen } from "@testing-library/react-native";
import RootIndex from "@/app/index";

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
    });
  
    test("Renders login buttons", () => {
        render(<RootIndex/>);

        expect(screen.getByTestId("sign-in-button")).toBeTruthy();
        expect(screen.getByTestId("sign-up-button")).toBeTruthy();
        expect(screen.getByTestId("guest-button")).toBeTruthy();
    });
});
