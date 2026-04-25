/**
 * UserMenu — Phase 1.6a auth-aware header affordance.
 *
 * Tests pin down the three render states (loading / authed / anonymous) and the two
 * click outcomes (logout-and-route, openAuthModal). useAuth and useAuthModal are mocked
 * because we're asserting UI behavior, not the hook's network logic — those have their
 * own dedicated tests in useAuth.test.tsx.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mocks must be set up BEFORE the component imports so the hooks resolve to the mocks.
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

const mockOpenAuthModal = jest.fn();
jest.mock("@/components/AuthModalProvider", () => ({
  useAuthModal: () => ({ open: mockOpenAuthModal }),
}));

const mockLogout = jest.fn();
const mockUseAuth = jest.fn();
jest.mock("@/hooks/useAuth", () => ({
  useAuth: () => mockUseAuth(),
}));

import { UserMenu } from "./UserMenu";

beforeEach(() => {
  mockPush.mockReset();
  mockOpenAuthModal.mockReset();
  mockLogout.mockReset();
  mockUseAuth.mockReset();
});

describe("UserMenu", () => {
  it("renders nothing while auth state is loading (avoids flicker)", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: true,
      logout: mockLogout,
    });
    const { container } = render(<UserMenu />);
    // Empty render — no Sign in / Sign out flicker before /me resolves.
    expect(container).toBeEmptyDOMElement();
  });

  it("shows Sign in button when anonymous; clicking opens AuthModal", () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      isLoading: false,
      logout: mockLogout,
    });
    render(<UserMenu />);

    const signInBtn = screen.getByRole("button", { name: /sign in/i });
    expect(signInBtn).toBeInTheDocument();
    fireEvent.click(signInBtn);
    expect(mockOpenAuthModal).toHaveBeenCalledTimes(1);
    // Anonymous click must NOT navigate — the modal handles the rest.
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows email + Sign out when authed; clicking logs out and routes home", async () => {
    mockUseAuth.mockReturnValue({
      user: { id: "u1", email: "alice@example.com", name: "alice" },
      isAuthenticated: true,
      isLoading: false,
      logout: mockLogout.mockResolvedValue(undefined),
    });
    render(<UserMenu />);

    // Email is shown (the screen-reader-friendly title attr would also be on hover).
    expect(screen.getByText("alice@example.com")).toBeInTheDocument();

    const signOutBtn = screen.getByRole("button", { name: /sign out/i });
    fireEvent.click(signOutBtn);

    // Logout is called once, then we route to "/".
    await waitFor(() => expect(mockLogout).toHaveBeenCalledTimes(1));
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith("/"));
    // Modal MUST NOT open — sign-out path is independent of the auth-modal trigger.
    expect(mockOpenAuthModal).not.toHaveBeenCalled();
  });
});
