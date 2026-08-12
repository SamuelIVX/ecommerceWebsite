import { describe, it, expect, beforeEach, vi } from "vitest";
import { useCartStore } from "./useCartStore";

const makeClient = (overrides = {}) => ({
    currentCart: {
        getCurrentCart: vi.fn(),
        addToCurrentCart: vi.fn(),
        removeLineItemsFromCurrentCart: vi.fn(),
        ...overrides,
    },
});

describe("useCartStore", () => {
    beforeEach(() => {
        useCartStore.setState({
            cart: { lineItems: [] },
            isLoading: true,
            counter: 0,
        });
    });

    it("getCart populates cart and counter from the client", async () => {
        const client = makeClient();
        client.currentCart.getCurrentCart.mockResolvedValue({
            lineItems: [{ _id: "a" }, { _id: "b" }, { _id: "c" }],
        });

        await useCartStore.getState().getCart(client);

        const state = useCartStore.getState();
        expect(state.cart.lineItems).toHaveLength(3);
        expect(state.counter).toBe(3);
        expect(state.isLoading).toBe(false);
    });

    it("getCart falls back to empty cart when the client returns nothing", async () => {
        const client = makeClient();
        client.currentCart.getCurrentCart.mockResolvedValue(undefined);

        await useCartStore.getState().getCart(client);

        expect(useCartStore.getState().cart.lineItems).toEqual([]);
        expect(useCartStore.getState().isLoading).toBe(false);
    });

    it("getCart stops loading without crashing when the fetch throws", async () => {
        const client = makeClient();
        client.currentCart.getCurrentCart.mockRejectedValue(new Error("boom"));

        await useCartStore.getState().getCart(client);

        const state = useCartStore.getState();
        expect(state.isLoading).toBe(false);
        expect(state.counter).toBe(0);
    });

    it("addItem sends the line item and updates cart + counter", async () => {
        const client = makeClient();
        client.currentCart.addToCurrentCart.mockResolvedValue({
            cart: { lineItems: [{ _id: "a" }] },
        });

        await useCartStore.getState().addItem(client, "prod-1", "var-1", 2);

        expect(client.currentCart.addToCurrentCart).toHaveBeenCalledWith({
            lineItems: [
                {
                    catalogReference: {
                        appId: process.env.NEXT_PUBLIC_WIX_APP_ID,
                        catalogItemId: "prod-1",
                        options: { variantId: "var-1" },
                    },
                    quantity: 2,
                },
            ],
        });
        expect(useCartStore.getState().counter).toBe(1);
        expect(useCartStore.getState().isLoading).toBe(false);
    });

    it("addItem omits variant options when variantId is empty", async () => {
        const client = makeClient();
        client.currentCart.addToCurrentCart.mockResolvedValue({
            cart: { lineItems: [] },
        });

        await useCartStore.getState().addItem(client, "prod-1", "", 1);

        expect(client.currentCart.addToCurrentCart).toHaveBeenCalledWith({
            lineItems: [
                {
                    catalogReference: {
                        appId: process.env.NEXT_PUBLIC_WIX_APP_ID,
                        catalogItemId: "prod-1",
                    },
                    quantity: 1,
                },
            ],
        });
    });

    it("removeItem removes the line item and updates counter", async () => {
        const client = makeClient();
        client.currentCart.removeLineItemsFromCurrentCart.mockResolvedValue({
            cart: { lineItems: [{ _id: "b" }] },
        });

        await useCartStore.getState().removeItem(client, "a");

        expect(client.currentCart.removeLineItemsFromCurrentCart).toHaveBeenCalledWith([
            "a",
        ]);
        expect(useCartStore.getState().counter).toBe(1);
        expect(useCartStore.getState().isLoading).toBe(false);
    });
});
