import "./globals.css"

import type { ReactNode } from "react"

export const metadata = { title: "Better Experience" }

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-svh antialiased">
        {children}
      </body>
    </html>
  )
}
