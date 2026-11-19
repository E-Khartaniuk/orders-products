"use client";

import { LazyMotion } from "motion/react";
import { useState, type ReactNode } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store";
import { I18nProvider } from "./I18nProvider";
import { PersistenceBootstrap } from "./PersistenceBootstrap";
import { SessionBootstrap } from "./SessionBootstrap";
import { SocketBridge } from "./SocketBridge";

const loadMotionFeatures = () => import("@/lib/motion-features").then((module) => module.default);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [store] = useState(makeStore);

  return (
    <Provider store={store}>
      <PersistenceBootstrap />
      <SessionBootstrap />
      <SocketBridge />
      <I18nProvider>
        <LazyMotion features={loadMotionFeatures} strict>
          {children}
        </LazyMotion>
      </I18nProvider>
    </Provider>
  );
}
