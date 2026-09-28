import App from "@/components/features/App/App";
import { queryClient } from "@/query-client";
import { persistOptions } from "@/query-persistence";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={persistOptions}
    >
      <App />
    </PersistQueryClientProvider>
  </StrictMode>,
);
