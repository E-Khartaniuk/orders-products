import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { AuthResponse, User } from "@/types/api";

type AuthStatus = "unknown" | "authenticated" | "anonymous";

type AuthState = {
  status: AuthStatus;
  user: User | null;
  accessToken: string | null;
};

const initialState: AuthState = { status: "unknown", user: null, accessToken: null };

export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    credentialsReceived: (state, action: PayloadAction<AuthResponse>) => {
      state.status = "authenticated";
      state.user = action.payload.user;
      state.accessToken = action.payload.accessToken;
    },
    loggedOut: (state) => {
      state.status = "anonymous";
      state.user = null;
      state.accessToken = null;
    },
  },
});

export const { credentialsReceived, loggedOut } = authSlice.actions;
