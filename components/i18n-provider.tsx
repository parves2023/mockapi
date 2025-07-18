"use client"

import type React from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "@/lib/i18n" // Import the i18n instance

export function I18nProvider({ children }: { children: React.ReactNode }) {
  return <I18nextProvider i18n={i18n}>{children}</I18nextProvider>
}
