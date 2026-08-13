/**
 * Zustand store for the Wix current-cart: fetch, add, and remove line items.
 * Callers must pass the browser `WixClient` from context; state is global so
 * NavIcons badge and CartModel stay in sync.
 */
import { create } from "zustand";
import { currentCart } from "@wix/ecom";
import { WixClient } from "@/context/wixContext";

const emptyCart: currentCart.Cart = {
  lineItems: [],
};

type CartState = {
  cart: currentCart.Cart;
  isLoading: boolean;
  counter: number;
  getCart: (wixClient: WixClient) => void;
  addItem: (
    wixClient: WixClient,
    productId: string,
    variantId: string,
    quantity: number
  ) => void;
  removeItem: (wixClient: WixClient, itemId: string) => void;
};

/**
 * Global cart store. `counter` mirrors `cart.lineItems.length` after successful
 * mutations. Failed Wix calls clear `isLoading` without wiping the last cart.
 */
export const useCartStore = create<CartState>((set) => ({
  cart: emptyCart,
  isLoading: true,
  counter: 0,
  getCart: async (wixClient) => {
    try {
      const cart = await wixClient.currentCart.getCurrentCart();
      set({
        cart: cart ?? emptyCart,
        isLoading: false,
        counter: cart?.lineItems.length || 0,
      });
    } catch (err) {
      console.error("Failed to fetch cart:", err);
      set((prev) => ({ ...prev, isLoading: false }));
    }
  },
  addItem: async (wixClient, productId, variantId, quantity) => {
    set((state) => ({ ...state, isLoading: true }));
    try {
      const response = await wixClient.currentCart.addToCurrentCart({
        lineItems: [
          {
            catalogReference: {
              appId: process.env.NEXT_PUBLIC_WIX_APP_ID!,
              catalogItemId: productId,
              ...(variantId && { options: { variantId } }),
            },
            quantity: quantity,
          },
        ],
      });

      set({
        cart: response.cart,
        counter: response.cart?.lineItems.length,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to add item to cart:", err);
      set((prev) => ({ ...prev, isLoading: false }));
    }
  },
  removeItem: async (wixClient, itemId) => {
    set((state) => ({ ...state, isLoading: true }));
    try {
      const response = await wixClient.currentCart.removeLineItemsFromCurrentCart(
        [itemId]
      );

      set({
        cart: response.cart,
        counter: response.cart?.lineItems.length,
        isLoading: false,
      });
    } catch (err) {
      console.error("Failed to remove item from cart:", err);
      set((prev) => ({ ...prev, isLoading: false }));
    }
  },
}));
