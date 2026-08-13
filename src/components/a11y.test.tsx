/**
 * Accessibility smoke tests (axe) for CartModel and NavIcons.
 */
import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import axe from "axe-core";
import CartModel from "./CartModel";
import NavIcons from "./NavIcons";
import { useCartStore } from "@/hooks/useCartStore";
import { useWixClient } from "@/hooks/useWixClient";

vi.mock("next/image", () => ({
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => (
        // eslint-disable-next-line @next/next/no-img-element -- test mock for next/image
        <img {...props} alt={props.alt ?? ""} />
    ),
}));

vi.mock("next/link", () => ({
    default: ({
        children,
        ...props
    }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
        <a {...props}>{children}</a>
    ),
}));

vi.mock("next/navigation", () => ({
    useRouter: () => ({ push: vi.fn() }),
}));

vi.mock("js-cookie", () => ({
    default: {
        get: vi.fn(),
        set: vi.fn(),
        remove: vi.fn(),
    },
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
    price: { amount: "19.99" },
    quantity: 2,
    availability: { status: "AVAILABLE" },
    image: "wix:image://test/123",
} as const;

async function seriousViolations(container: HTMLElement) {
    const results = await axe.run(container, {
        rules: {
            "color-contrast": { enabled: false },
        },
    });
    return results.violations.filter(
        (v) => v.impact === "critical" || v.impact === "serious"
    );
}

describe("a11y", () => {
    it("cart model with items has no critical or serious violations", async () => {
        useCartStore.setState({
            cart: { lineItems: [item] },
            counter: 1,
            isLoading: false,
        });
        vi.mocked(useWixClient).mockReturnValue({ currentCart: {} } as never);
        const { container } = render(<CartModel />);
        expect(await seriousViolations(container)).toEqual([]);
    });

    it("nav icons with cart counter have no critical or serious violations", async () => {
        useCartStore.setState({
            cart: { lineItems: [item] },
            counter: 1,
            isLoading: false,
        });
        vi.mocked(useWixClient).mockReturnValue({
            auth: { loggedIn: () => false },
            currentCart: {
                getCurrentCart: vi.fn().mockResolvedValue({
                    lineItems: [item],
                }),
            },
        } as never);
        const { container } = render(<NavIcons />);
        expect(await seriousViolations(container)).toEqual([]);
    });
});
