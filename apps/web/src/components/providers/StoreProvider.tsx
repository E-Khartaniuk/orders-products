"use client";

import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { I18nProvider } from "./I18nProvider";
import { PersistenceBootstrap } from "./PersistenceBootstrap";
import { SessionBootstrap } from "./SessionBootstrap";
import { SocketBridge } from "./SocketBridge";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <Provider store={store}>
      <PersistenceBootstrap />
      <SessionBootstrap />
      <SocketBridge />
      <I18nProvider>{children}</I18nProvider>
    </Provider>
  );
}
