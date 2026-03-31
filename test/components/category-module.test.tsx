import { render, screen, userEvent } from "@testing-library/react-native";
import CategoryModule from "@/components/category-module";


const testCategories = [
    { label: "category 1", icon: "icon 1" },
    { label: "category 2", icon: "icon 2" },
    { label: "category 3", icon: "icon 3" },
];


describe("Feeding component <FeedingCategory/>", () => {

    test("Renders title", () => {
        const testTitle = "test title";
        render(<CategoryModule
            title={testTitle}
            selectedCategory=""
            categoryList={[]}
        />);

        expect(screen.getByText(testTitle)).toBeTruthy();
    });

    test("Renders category buttons", () => {
        render(<CategoryModule
            title={""}
            selectedCategory=""
            categoryList={testCategories}
        />);

        for (const { label, icon } of testCategories) {
            expect(screen.getByTestId(`category-${label.toLowerCase()}-button`)).toBeTruthy();
            expect(screen.getByText(label)).toBeTruthy();
            expect(screen.getByText(icon)).toBeTruthy();
        }
    });

    test("Changes category", async () => {
        const onCategoryUpdate = jest.fn();
        render(<CategoryModule
            title={""}
            selectedCategory=""
            categoryList={testCategories}
            onCategoryUpdate={onCategoryUpdate}
        />);

        const testSelectCategories = [1, 2, 0];  // a list of indecies for testCategory

        for (const index of testSelectCategories) {
            const label = testCategories[index].label;
            await userEvent.press(screen.getByTestId(`category-${label.toLowerCase()}-button`));
            expect(onCategoryUpdate.mock.lastCall[0]).toBe(label);
        }
    });
});
