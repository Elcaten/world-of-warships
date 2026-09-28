import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { VirtuosoGridMockContext, VirtuosoMockContext } from "react-virtuoso";

export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <VirtuosoGridMockContext.Provider
          value={{
            viewportHeight: 800,
            viewportWidth: 1200,
            itemHeight: 224,
            itemWidth: 300,
          }}
        >
          <VirtuosoMockContext.Provider
            value={{ viewportHeight: 800, itemHeight: 64 }}
          >
            {children}
          </VirtuosoMockContext.Provider>
        </VirtuosoGridMockContext.Provider>
      </QueryClientProvider>
    );
  }

  return { ...render(ui, { wrapper: Wrapper, ...options }), queryClient };
}
