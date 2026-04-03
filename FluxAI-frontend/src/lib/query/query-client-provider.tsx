"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, useState } from "react";

export function ReactQueryProvider({ children }: { children: ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                defaultOptions: {
                    queries: {
                        // Data is considered fresh for 30 seconds — avoids redundant refetches
                        staleTime: 30 * 1000,
                        // Keep cached data for 5 minutes after component unmounts
                        gcTime: 5 * 60 * 1000,
                        // Retry failed requests once before showing an error
                        retry: 1,
                        retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
                        // Refetch on window focus for real-time data freshness
                        refetchOnWindowFocus: true,
                    },
                    mutations: {
                        // Do not retry mutations (they may cause duplicate writes)
                        retry: 0,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            {children}
        </QueryClientProvider>
    );
}
