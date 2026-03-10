"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "react-hot-toast";
import { queryClient } from "@/lib/query-client";

/**
 * Client-side providers wrapper.
 * Kept as a separate component so layout.tsx stays a Server Component.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="bottom-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: "#1D1D1F",
            color: "#F5F5F7",
            borderRadius: "12px",
            fontSize: "14px",
            fontWeight: 500,
          },
          success: {
            iconTheme: { primary: "#34C759", secondary: "#fff" },
          },
          error: {
            iconTheme: { primary: "#FF3B30", secondary: "#fff" },
          },
        }}
      />
    </QueryClientProvider>
  );
}
