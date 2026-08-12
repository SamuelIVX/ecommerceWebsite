import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CartModel from "./CartModel";
import { useCartStore } from "@/hooks/useCartStore";
import { useWixClient } from "@/hooks/useWixClient";

vi.mock("next/image", () => ({
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
        // eslint-disable-next-line @next/next/no-img-element -- test mock for next/image
        <img {...props} alt={props.alt ?? ""} />
    ),
}));

vi.mock("@/hooks/useWixClient", () => ({
    useWixClient: vi.fn(),
}));

vi.mock("@wix/sdk", () => ({
    media: {
        getScaledToFillImageUrl: () => "http://example.com/image.jpg",
    },
}));

const item = {
    _id: "item-1",
    productName: { original: "Test Product" },
    price: { amount: 19.99 },
    quantity: 2,
    availability: { status: "In Stock" },
    image: "wix:image://test/123",
};

describe("CartModel", () => {
    beforeEach(() => {
        useCartStore.setState({
            cart: { lineItems: [] },
            isLoading: false,
            counter: 0,
        });
        vi.mocked(useWixClient).mockReturnValue({
            currentCart: {},
        } as never);
    });

    it("shows an empty state when the cart has no lineItems key", () => {
        useCartStore.setState({
            cart: {},
            counter: 0,
            isLoading: false,
        });
        render(<CartModel />);
        expect(screen.getByText("Cart is Empty")).toBeInTheDocument();
    });

    it("renders the cart section for an empty lineItems array", () => {
        render(<CartModel />);
        expect(screen.getByRole("heading", { name: "Shopping Cart" })).toBeInTheDocument();
        expect(screen.getByText("$0")).toBeInTheDocument();
    });

    it("renders line items with name, price, quantity and subtotal", () => {
        useCartStore.setState({
            cart: { lineItems: [item] },
            counter: 1,
            isLoading: false,
        });
        render(<CartModel />);

        expect(screen.getByRole("heading", { name: "Shopping Cart" })).toBeInTheDocument();
        expect(screen.getByText("Test Product")).toBeInTheDocument();
        expect(screen.getByText("2 x")).toBeInTheDocument();
        expect(screen.getByText("In Stock")).toBeInTheDocument();
        expect(screen.getByText("$39.98")).toBeInTheDocument();
        expect(screen.getByRole("button", { name: "Checkout" })).toBeInTheDocument();
    });

    it("calls removeItem with the client and item id", () => {
        const removeItem = vi.fn();
        useCartStore.setState({
            cart: { lineItems: [item] },
            counter: 1,
            isLoading: false,
        });
        useCartStore.setState({ ...useCartStore.getState(), removeItem });

        render(<CartModel />);
        fireEvent.click(screen.getByText("Remove"));

        expect(removeItem).toHaveBeenCalledTimes(1);
        expect(removeItem.mock.calls[0][1]).toBe("item-1");
    });

    it("disables checkout while loading", () => {
        useCartStore.setState({
            cart: { lineItems: [item] },
            counter: 1,
            isLoading: true,
        });
        render(<CartModel />);
        expect(screen.getByRole("button", { name: "Checkout" })).toBeDisabled();
    });
});
