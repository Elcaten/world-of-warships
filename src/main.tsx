import App from "@/components/features/App/App";
import { queryClient } from "@/query-client";
import { persistOptions } from "@/query-persistence";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";

// Cloudflare's challenge can deliver this document through a POST. Replace the
// current history entry so a later browser reload starts a fresh GET instead of
// prompting the user to resubmit the challenge response.
window.history.replaceState(window.history.state, "", window.location.href);

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
