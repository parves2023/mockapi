import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { I18nProvider } from "@/components/i18n-provider" // Import the new provider

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "MockAPI Clone",
  description: "A lightweight MockAPI-style web application for creating REST APIs",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <I18nProvider>{children}</I18nProvider> {/* Wrap children with the provider */}
      </body>
    </html>
  )
}
