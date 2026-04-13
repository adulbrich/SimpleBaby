import { formatStringList } from "@/library/utils";



describe("formatStringList()", () => {
    test("one item", () =>
        expect(formatStringList(["item 1"])).toBe("item 1")
    );

    test("two items", () =>
        expect(formatStringList(["item 1", "item 2"])).toBe("item 1 and item 2")
    );

    test("three items", () =>
        expect(formatStringList(["item 1", "item 2", "item 3"])).toBe("item 1, item 2 and item 3")
    );
    
    test("four items", () =>
        expect(formatStringList(["item 1", "item 2", "item 3", "item 4"])).toBe("item 1, item 2, item 3 and item 4")
    );
});
