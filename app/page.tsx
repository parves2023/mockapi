"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check if user is authenticated by trying to fetch projects
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/projects")
        if (response.ok) {
          // User is authenticated, redirect to dashboard
          router.push("/dashboard")
        } else {
          // User is not authenticated, redirect to login
          router.push("/login")
        }
      } catch {
        // Network error or API not available, redirect to login
        router.push("/login")
      }
    }

    checkAuth()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
