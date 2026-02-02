import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Components
import { Toaster } from "@/components/ui/sonner";
import App from "./App";

// Contexts
import { WalletProvider } from "@/contexts/WalletContext";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <WalletProvider>
        <App />
        <Toaster position="top-right" theme="dark" richColors />
      </WalletProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
