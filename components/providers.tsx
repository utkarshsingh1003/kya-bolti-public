"use client";

import type { ReactNode } from "react";
import type { Locale } from "@/lib/types";
import { LocaleProvider } from "@/components/locale-context";
import { LocationProvider } from "@/components/location-context";
import { AssistantProvider } from "@/components/assistant-context";
import { LocationDialog } from "@/components/location-dialog";
import { Assistant } from "@/components/assistant";

export function Providers({ initialLocale, children }: { initialLocale: Locale; children: ReactNode }) {
  return (
    <LocaleProvider initialLocale={initialLocale}>
      <LocationProvider>
        <AssistantProvider>
          {children}
          <LocationDialog />
          <Assistant />
        </AssistantProvider>
      </LocationProvider>
    </LocaleProvider>
  );
}
