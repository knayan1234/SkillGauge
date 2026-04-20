import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryWrapper } from "@/test/queryWrapper";
import type { User } from "@/services/api";

// Mock the api module — Phase 1 hits real HTTP in production, but tests assert the hook's
// state machine, not the network. Each test seeds fetchMe's return value to drive the /me path.
jest.mock("@/services/api", () => {
  const actual = jest.requireActual("@/services/api") as Record<
    string,
    unknown
  >;
  return {
    ...actual,
    fetchMe: jest.fn<Promise<User | null>, []>(),
    loginUser: jest.fn(),
    registerUser: jest.fn(),
    logoutUser: jest.fn(),
  };
});

// Import AFTER jest.mock so the hook picks up the mocked module.
import { useAuth } from "./useAuth";
import {
  fetchMe,
  loginUser,
  logoutUser,
  registerUser,
} from "@/services/api";

const mockFetchMe = fetchMe as jest.MockedFunction<typeof fetchMe>;
const mockLogin = loginUser as jest.MockedFunction<typeof loginUser>;
const mockRegister = registerUser as jest.MockedFunction<typeof registerUser>;
const mockLogout = logoutUser as jest.MockedFunction<typeof logoutUser>;

const DEMO_USER: User = { id: "u1", email: "demo@x.com", name: "demo" };

describe("useAuth", () => {
  beforeEach(() => {
    mockFetchMe.mockReset();
    mockLogin.mockReset();
    mockRegister.mockReset();
    mockLogout.mockReset();
  });

  it("hydrates as unauthenticated when /me returns null", async () => {
    mockFetchMe.mockResolvedValue(null);
    const { result } = renderHook(() => useAuth(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it("hydrates as authenticated when /me returns a user", async () => {
    mockFetchMe.mockResolvedValue(DEMO_USER);
    const { result } = renderHook(() => useAuth(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.email).toBe("demo@x.com");
  });

  it("login populates the query cache and flips isAuthenticated", async () => {
    mockFetchMe.mockResolvedValue(null);
    mockLogin.mockResolvedValue({ user: DEMO_USER });
    const { result } = renderHook(() => useAuth(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response: { success: boolean; error?: string } | undefined;
    await act(async () => {
      response = await result.current.login("demo@x.com", "password123");
    });

    expect(response?.success).toBe(true);
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));
    expect(result.current.user?.email).toBe("demo@x.com");
    expect(mockLogin).toHaveBeenCalledWith("demo@x.com", "password123");
  });

  it("logout calls backend and clears the cache", async () => {
    mockFetchMe.mockResolvedValue(DEMO_USER);
    mockLogout.mockResolvedValue();
    const { result } = renderHook(() => useAuth(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    // queryClient.clear() inside logout drops AUTH_QUERY_KEY, which retriggers /me.
    // In real use, the cookie is gone → server 401s → fetchMe resolves null. Simulate that.
    mockFetchMe.mockResolvedValue(null);

    await act(async () => {
      await result.current.logout();
    });

    expect(mockLogout).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(result.current.isAuthenticated).toBe(false));
    expect(result.current.user).toBeNull();
  });

  it("register returns error on failure without flipping auth state", async () => {
    mockFetchMe.mockResolvedValue(null);
    mockRegister.mockRejectedValue(new Error("Email already registered"));
    const { result } = renderHook(() => useAuth(), { wrapper: QueryWrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    let response: { success: boolean; error?: string } | undefined;
    await act(async () => {
      response = await result.current.register("taken@x.com", "password123");
    });

    expect(response?.success).toBe(false);
    expect(response?.error).toBe("Email already registered");
    expect(result.current.isAuthenticated).toBe(false);
  });
});
