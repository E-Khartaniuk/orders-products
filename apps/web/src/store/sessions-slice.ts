import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

type SessionsState = {
  count: number | null;
  connected: boolean;
};

const initialState: SessionsState = { count: null, connected: false };

export const sessionsSlice = createSlice({
  name: "sessions",
  initialState,
  reducers: {
    connectionChanged: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
    },
    countReceived: (state, action: PayloadAction<number>) => {
      state.count = action.payload;
    },
  },
});

export const { connectionChanged, countReceived } = sessionsSlice.actions;
