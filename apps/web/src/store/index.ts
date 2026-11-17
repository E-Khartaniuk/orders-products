import { combineReducers, configureStore } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { api } from "./api";
import { authSlice } from "./auth-slice";
import { persistenceMiddleware } from "./persistence-middleware";
import { prefsSlice } from "./prefs-slice";
import { sessionsSlice } from "./sessions-slice";
import { uiSlice } from "./ui-slice";

const rootReducer = combineReducers({
  [api.reducerPath]: api.reducer,
  [authSlice.name]: authSlice.reducer,
  [prefsSlice.name]: prefsSlice.reducer,
  [sessionsSlice.name]: sessionsSlice.reducer,
  [uiSlice.name]: uiSlice.reducer,
});

export function makeStore() {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefault) =>
      getDefault().prepend(persistenceMiddleware.middleware).concat(api.middleware),
  });
}

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof rootReducer>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
