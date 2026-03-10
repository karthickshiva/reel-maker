export type AuthState = {
  isAuthenticated: boolean;
};

export function useAuthStore(): AuthState {
  return { isAuthenticated: false };
}
