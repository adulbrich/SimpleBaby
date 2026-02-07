import { getActiveChildId } from "@/library/utils";
import supabase from "@/library/supabase-client";


jest.mock("@/library/supabase-client", () => {
    const getUser = jest.fn(() => ({data: {user: {user_metadata: {activeChild: true}}}}));
    const single = jest.fn();
    return ({
        auth: {
            getUser: getUser
        },
        from: () => ({
            select: () => ({
                eq: () => ({
                    eq: () => ({
                        single: single
                    })
                })
            })
        })
    });
});


describe("Utils: getActiveChildId", () => {

    test("Catches no active user", async () => {
        (supabase.auth.getUser as jest.Mock).mockReturnValueOnce({data: {}});
        const result = await getActiveChildId();
        expect(result.success).toBe(false);
        expect(result.error).toBe('No authenticated user found');
    });

    test("Catches no active child", async () => {
        (supabase.auth.getUser as jest.Mock).mockReturnValueOnce({data: {user: {user_metadata: {}}}});
        const result = await getActiveChildId();
        expect(result.success).toBe(false);
        expect(result.error).toBe('No active child set in user metadata');
    });

    test("Catches supabase select error", async () => {
        const testError = new Error("test error message");
        (supabase.from('').select('').eq('', '').eq('', 0).single as jest.Mock)
            .mockReturnValueOnce({error: testError});
        jest.spyOn(console, "error").mockImplementation(() => null);  // suppress console warnings from within the tested code

        const result = await getActiveChildId();

        expect(result.success).toBe(false);
        expect(result.error).toBe(testError);
        expect(console.error).toHaveBeenCalledTimes(1);
        expect(console.error).toHaveBeenLastCalledWith('Error getting active child:', testError);
    });

    test("Successfully returns active child ID", async () => {
        const testID = "test ID";
        (supabase.from('').select('').eq('', '').eq('', 0).single as jest.Mock)
            .mockReturnValueOnce({data: {id: testID}});
        
        const result = await getActiveChildId();

        expect(result.success).toBe(true);
        expect(result.childId).toBe(testID);
    });
});
