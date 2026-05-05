import { render, screen, userEvent } from "@testing-library/react-native";
import CategoryModule from "@/components/category-module";
import { Text } from "react-native";


const iconTexts = ["icon 1", "icon 2", "icon 3"];
const testCategories = [
    { label: "category 1", icon: <Text>{iconTexts[0]}</Text> },
    { label: "category 2", icon: <Text>{iconTexts[1]}</Text> },
    { label: "category 3", icon: <Text>{iconTexts[2]}</Text> },
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

        for (let i = 0; i < testCategories.length; i++) {
            const { label } = testCategories[i];
            expect(screen.getByTestId(`category-${label.toLowerCase()}-button`)).toBeTruthy();
            expect(screen.getByText(label)).toBeTruthy();
            expect(screen.getByText(iconTexts[i])).toBeTruthy();
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
