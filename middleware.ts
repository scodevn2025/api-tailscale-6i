import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  // Log all API requests with more details
  if (request.nextUrl.pathname.startsWith("/api/")) {
    console.log(`[${new Date().toISOString()}] ${request.method} ${request.nextUrl.pathname}${request.nextUrl.search}`)
    console.log("User-Agent:", request.headers.get("user-agent"))
    console.log("Content-Type:", request.headers.get("content-type"))

    // Log request body for POST requests
    if (request.method === "POST") {
      console.log("Request has body:", request.body !== null)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: "/api/:path*",
}
