import { decryptData, encryptData } from "@/library/crypto";
import { getActiveChildData, saveNewChild, getChildren, updateChildName, deleteChild } from "@/library/remote-store";
import supabase from "@/library/supabase-client";
import { formatName } from "@/library/utils";


jest.mock("@/library/supabase-client", () => {
    const selectEq = jest.fn();
    const updateEq = jest.fn();
    const single = jest.fn(() => ({
        data: {}
    }));
    const select = jest.fn(() => ({
        single: single,
    }));
    const insert = jest.fn(() => ({
        select: select,
    }));
    const update = jest.fn(() => ({
        eq: updateEq,
    }));
    const delEq1 = jest.fn(() => ({
        single: single,
    }));
    const delEq2 = jest.fn(() => ({
        eq: delEq1,
    }));
    return ({
        auth: {
            getUser: jest.fn(() => ({
                data: { user: { id: true, user_metadata: { activeChild: true } } },
            })),
            updateUser: jest.fn(async () => ({})),
        },
        from: jest.fn(() => ({
            select: () => ({
                eq: selectEq,
            }),
            insert: insert,
            update: update,
            delete: () => ({
                eq: delEq2,
            }),
        })),
    });
});

jest.mock("@/library/utils", () => ({
    formatName: jest.fn(string => string),
}));

jest.mock("@/library/crypto", () => ({
    encryptData: jest.fn(async (string) => `Encrypted: ${string}`),
    decryptData: jest.fn(async (string) => string ? `Decrypted: ${string}` : ""),
}));


describe("Remote Store: getActiveChildData", () => {

    beforeAll(() => {
        // to match the expected return in getChildrenByUserId()
        const single = jest.fn();
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementation(() => ({
            eq: () => ({
                single: single
            }),
        }));
    });

    test("Catches no active user", async () => {
        (supabase.auth.getUser as jest.Mock).mockReturnValueOnce({ data: {} });
        const result = await getActiveChildData();
        expect(result.success).toBe(false);
        expect(result.error).toBe('No authenticated user found');
    });

    test("Catches no active child", async () => {
        (supabase.auth.getUser as jest.Mock).mockReturnValueOnce({ data: { user: { user_metadata: {} } } });
        const result = await getActiveChildData();
        expect(result.success).toBe(false);
        expect(result.error).toBe('No active child set in user metadata');
    });

    test("Catches supabase select error", async () => {
        const testError = new Error("test error message");
        // supabase.from().select().eq().eq().single() should be mocked to return:
        // { error: /* truthy value */ }
        // this should cause error handling in library/remote-store.ts -> getActiveChildData()
        (supabase.from('').select('').eq('', '').eq('', 0).single as jest.Mock)
            .mockReturnValueOnce({ error: testError });
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        const result = await getActiveChildData();

        expect(result.success).toBe(false);
        expect(result.error).toBe(testError.message);
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenLastCalledWith('Error getting active child:', testError);
    });

    test("Successfully returns active child ID", async () => {
        const testID = "test ID";
        // supabase.from().select().eq().eq().single() should be mocked to return:
        // { data: { id: /* test value */ } }
        (supabase.from('').select('').eq('', '').eq('', 0).single as jest.Mock)
            .mockReturnValueOnce({ data: { id: testID } });
        
        const result = await getActiveChildData();

        expect(result.success).toBe(true);
        expect(result.childId).toBe(testID);
    });
});


describe("Remote Store: saveNewChild", () => {

    beforeAll(() => {
        // to match the expected return in getChildrenByUserId()
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementation(
            () => ({ data: [] })
        );
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (supabase.from("").select("").eq as unknown as jest.Mock).mockClear();
        (supabase.from("").insert("").select as jest.Mock).mockClear();
        (supabase.from("").insert as jest.Mock).mockClear();
        (supabase.from as jest.Mock).mockClear();
        (supabase.auth.updateUser as jest.Mock).mockClear();
    });

    test("Throws error on empty name", async () => {
        expect(async () => await saveNewChild("  ")).rejects.toThrow('Child name is required.');
    });

    test("Throws error on missing user id", async () => {
        // supabase.auth.getUser() should be mocked to return:
        // { data: undefined }
        // this should cause error handling in library/remote-store.ts -> saveNewChild()
        (supabase.auth.getUser as jest.Mock).mockImplementationOnce(
            async () => ({ data: undefined })
        );

        expect(async () => await saveNewChild("x")).rejects.toThrow('User not found.');
    });

    test("Requests children rows", async () => {
        const testId = "test user id";
        // supabase.auth.getUser() should be mocked to return:
        // { data: { user: { id: /* test value */ } } }
        (supabase.auth.getUser as jest.Mock).mockImplementationOnce(
            async () => ({ data: { user: { id: testId } } })
        );

        await saveNewChild("x");

        expect((supabase.from as jest.Mock).mock.calls[0][0]).toBe("children");
        expect((supabase.from("").select("").eq as unknown as jest.Mock).mock.calls[0][0]).toBe("user_id");
        expect((supabase.from("").select("").eq as unknown as jest.Mock).mock.calls[0][1]).toBe(testId);
    });

    test("Throws error on supabase error (get children)", async () => {
        // supabase.from().select().eq() should be mocked to return:
        // { error: /* truthy value */ }
        // this should cause error handling in library/remote-store.ts -> getChildrenByUserId()
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        );

        expect(async () => await saveNewChild("x")).rejects.toThrow('Failed to retrieve children.');
    });

    test("Throws error on duplicate child name", async () => {
        const testEncryptedName = "test child name";
        const testName = await decryptData(testEncryptedName);
        // supabase.from().select().eq() should be mocked to return:
        // { data: [{ name: /* test encrypted name */ }] }
        // this should cause error handling in library/remote-store.ts -> saveNewChild()
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ data: [{ name: testEncryptedName }] })
        );

        // formatName should be mocked to return:
        // /* test decrypted name */
        // this should match a name returned by supabase.from().select().eq() after decryption
        (formatName as jest.Mock).mockImplementationOnce(
            () => testName
        );

        expect(async () => await saveNewChild("")).rejects.toThrow('Child name already exists.');
    });

    test("Saves new child", async () => {
        const testId = "test user id";
        const testEncryptedName = "test encrypted name";
        // supabase.auth.getUser() should be mocked to return:
        // { data: { user: { id: /* test value */ } } }
        (supabase.auth.getUser as jest.Mock).mockImplementationOnce(
            async () => ({ data: { user: { id: testId } } })
        );

        // library/crypto.ts -> encryptData() should be mocked to return:
        // /* test value */
        (encryptData as jest.Mock).mockImplementationOnce(
            async () => testEncryptedName
        );

        await saveNewChild("x");

        expect((supabase.from as jest.Mock).mock.calls[1][0]).toBe("children");
        expect((supabase.from("").insert("").select as unknown as jest.Mock).mock.calls[0][0]).toBe("id");
        // inserts one child object with the correct id and encrypted name
        expect((supabase.from("").insert as jest.Mock).mock.calls[0][0]).toEqual(
            [{ user_id: testId, name: testEncryptedName }]
        );
    });

    test("Throws error on supabase error (insert)", async () => {
        const testError = new Error("test error");
        // supabase.from().insert().select().single should be mocked to return:
        // { error: /* test value */ }
        // this should cause error handling in library/remote-store.ts -> saveNewChild()
        (supabase.from("").insert("").select().single as jest.Mock).mockImplementationOnce(
            async () => ({ error: testError })
        );

        expect(async () => await saveNewChild("x")).rejects.toThrow(testError);
    });

    test("Updates active child", async () => {
        const testId = "test child id";
        // supabase.from().insert().select().single should be mocked to return:
        // { data: id: /* test value */ } }
        (supabase.from("").insert("").select().single as jest.Mock).mockImplementationOnce(
            async () => ({ data: { id: testId } })
        );

        await saveNewChild("x");

        expect((supabase.auth.updateUser as jest.Mock).mock.calls[0][0]).toEqual(
            { data: { activeChildId: testId } }
        );
    });
});


describe("Remote Store: getChildren", () => {

    test("Throws error on missing user id", async () => {
        // supabase.auth.getUser() should be mocked to return:
        // { data: undefined }
        // this should cause error handling in library/remote-store.ts -> saveNewChild()
        (supabase.auth.getUser as jest.Mock).mockImplementationOnce(
            async () => ({ data: undefined })
        );

        expect(async () => await saveNewChild("x")).rejects.toThrow('User not found.');
    });

    test("Throws error on supabase error", async () => {
        // supabase.from().select().eq() should be mocked to return:
        // { error: /* truthy value */ }
        // this should cause error handling in library/remote-store.ts -> getChildrenByUserId()
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        );

        expect(async () => await getChildren()).rejects.toThrow('Failed to retrieve children.');
    });

    test("Decrypts child names", async () => {
        const testChildren = [
            { name: "test name 1", id: "test id 1" },
            { name: "test name 2", id: "test id 2" },
        ];
        const decryptedChildren = await Promise.all(testChildren.map(
            async ({ name, id }) => ({ name: await decryptData(name), id })
        ));

        // supabase.from().select().eq() should be mocked to return:
        // { data: { name: /* test value */, id: /* test value */ }[] }
        // this should cause error handling in library/remote-store.ts -> getChildrenByUserId()
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ data: testChildren })
        );

        const res = await getChildren();
        expect(res).toEqual(decryptedChildren);
    });

    test("Sorts decrypted child names", async () => {
        const testChildren = [
            { name: "test name 1", id: "test id 1" },
            { name: "test name 2", id: "test id 2" },
            { name: "test name 2", id: "test id 3" },
            { name: "test name 2", id: "test id 4" },
            { name: "test name 2", id: "test id 5" },
        ];
        const decryptedChildren = await Promise.all(testChildren.map(
            async ({ name, id }) => ({ name: await decryptData(name), id })
        ));
        const sortedChildren = decryptedChildren.sort(
            (child1, child2) => child1.name.localeCompare(child2.name)
        );

        // supabase.from().select().eq() should be mocked to return:
        // { data: { name: /* test value */, id: /* test value */ }[] }
        // this should cause error handling in library/remote-store.ts -> getChildrenByUserId()
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ data: testChildren })
        );

        const res = await getChildren();
        expect(res).toEqual(sortedChildren);
    });
});


describe("Remote Store: updateChildName", () => {

    beforeAll(() => {
        // to match the expected return in getChildrenByUserId()
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementation(
            () => ({ data: [] })
        );
        // to match the expected return of supabase.from().update().eq().eq().single()
        const single = jest.fn(() => ({}));
        const eq = jest.fn(() => ({ single: single }));
        (supabase.from("").update("").eq as unknown as jest.Mock).mockImplementation(
            () => ({ eq: eq })
        );
    });

    beforeEach(() => {
        // to clear the .mock.calls array
        (supabase.from("").select("").eq as unknown as jest.Mock).mockClear();
        (supabase.from("").update("").eq("", "").eq as unknown as jest.Mock).mockClear();
        (supabase.from("").update("").eq as unknown as jest.Mock).mockClear();
        (supabase.from("").update as unknown as jest.Mock).mockClear();
        (supabase.from as jest.Mock).mockClear();
    });

    test("Throws error on empty name", async () => {
        expect(async () => await updateChildName("", "  ")).rejects.toThrow('Child name is required.');
    });

    test("Throws error on missing user id", async () => {
        // supabase.auth.getUser() should be mocked to return:
        // { data: undefined }
        // this should cause error handling in library/remote-store.ts -> updateChildName()
        (supabase.auth.getUser as jest.Mock).mockImplementationOnce(
            async () => ({ data: undefined })
        );

        expect(async () => await updateChildName("", "x")).rejects.toThrow('User not found.');
    });

    test("Requests children rows", async () => {
        const testId = "test user id";
        // supabase.auth.getUser() should be mocked to return:
        // { data: { user: { id: /* test value */ } } }
        (supabase.auth.getUser as jest.Mock).mockImplementationOnce(
            async () => ({ data: { user: { id: testId } } })
        );

        await updateChildName("", "x");

        expect((supabase.from as jest.Mock).mock.calls[0][0]).toBe("children");
        expect((supabase.from("").select("").eq as unknown as jest.Mock).mock.calls[0][0]).toBe("user_id");
        expect((supabase.from("").select("").eq as unknown as jest.Mock).mock.calls[0][1]).toBe(testId);
    });

    test("Throws error on supabase error (get children)", async () => {
        // supabase.from().select().eq() should be mocked to return:
        // { error: /* truthy value */ }
        // this should cause error handling in library/remote-store.ts -> getChildrenByUserId()
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        );

        expect(async () => await updateChildName("", "x")).rejects.toThrow('Unable to check name availability.');
    });

    test("Throws error on duplicate child name", async () => {
        const testEncryptedName = "test child name";
        const testName = await decryptData(testEncryptedName);
        // supabase.from().select().eq() should be mocked to return:
        // { data: [{ name: /* test encrypted name */ }] }
        // this should cause error handling in library/remote-store.ts -> updateChildName()
        (supabase.from("").select("").eq as unknown as jest.Mock).mockImplementationOnce(
            async () => ({ data: [{ name: testEncryptedName }] })
        );

        // formatName should be mocked to return:
        // /* test decrypted name */
        // this should match a name returned by supabase.from().select().eq() after decryption
        (formatName as jest.Mock).mockImplementationOnce(
            () => testName
        );

        expect(async () => await updateChildName("", "")).rejects.toThrow('Child name already exists.');
    });

    test("Updates child", async () => {
        const testUserId = "test user id";
        const testChildId = "test user id";
        const testEncryptedName = "test encrypted name";
        // supabase.auth.getUser() should be mocked to return:
        // { data: { user: { id: /* test value */ } } }
        (supabase.auth.getUser as jest.Mock).mockImplementationOnce(
            async () => ({ data: { user: { id: testUserId } } })
        );

        // library/crypto.ts -> encryptData() should be mocked to return:
        // /* test value */
        (encryptData as jest.Mock).mockImplementationOnce(
            async () => testEncryptedName
        );

        await updateChildName(testChildId, "x");

        expect((supabase.from as jest.Mock).mock.calls[1][0]).toBe("children");
        expect((supabase.from("").update as jest.Mock).mock.calls[0][0]).toEqual(
            { name: testEncryptedName }
        );
        expect((supabase.from("").update("").eq as unknown as jest.Mock).mock.calls[0]).toEqual(
            ["user_id", testUserId]
        );
        expect((supabase.from("").update("").eq("", "").eq as unknown as jest.Mock).mock.calls[0]).toEqual(
            ["id", testChildId]
        );
    });

    test("Throws error on supabase error (update)", async () => {
        // supabase.from().update().eq().eq().single() should be mocked to return:
        // { error: /* truthy value */ }
        // this should cause error handling in library/remote-store.ts -> updateChildName()
        (supabase.from("").update("").eq("", "").eq("", "").single as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        );

        expect(async () => await updateChildName("", "x")).rejects.toThrow("Failed to update child name.");
    });
});


describe("Remote Store: deleteChild", () => {

    beforeEach(() => {
        // to clear the .mock.calls array
        (supabase.from("").delete().eq("", "").eq as unknown as jest.Mock).mockClear();
        (supabase.from("").delete().eq as unknown as jest.Mock).mockClear();
        (supabase.from as jest.Mock).mockClear();
    });

    test("Throws error on missing user id", async () => {
        // supabase.auth.getUser() should be mocked to return:
        // { data: undefined }
        // this should cause error handling in library/remote-store.ts -> deleteChild()
        (supabase.auth.getUser as jest.Mock).mockImplementationOnce(
            async () => ({ data: undefined })
        );

        expect(async () => await deleteChild("")).rejects.toThrow('User not found.');
    });

    test("Deletes child", async () => {
        const testUserId = "test user id";
        const testChildId = "test user id";
        // supabase.auth.getUser() should be mocked to return:
        // { data: { user: { id: /* test value */ } } }
        (supabase.auth.getUser as jest.Mock).mockImplementationOnce(
            async () => ({ data: { user: { id: testUserId } } })
        );

        await deleteChild(testChildId);

        expect((supabase.from as jest.Mock).mock.calls[0][0]).toBe("children");
        expect((supabase.from("").delete().eq as unknown as jest.Mock).mock.calls[0]).toEqual(
            ["user_id", testUserId]
        );
        expect((supabase.from("").delete().eq("", "").eq as unknown as jest.Mock).mock.calls[0]).toEqual(
            ["id", testChildId]
        );
    });

    test("Throws error on supabase error (delete)", async () => {
        // supabase.from().update().eq().eq().single() should be mocked to return:
        // { error: /* truthy value */ }
        // this should cause error handling in library/remote-store.ts -> deleteChild()
        (supabase.from("").delete().eq("", "").eq("", "").single as jest.Mock).mockImplementationOnce(
            async () => ({ error: true })
        );

        expect(async () => await deleteChild("")).rejects.toThrow("Failed to delete child.");
    });
});
