import { Outlet, Route, Routes } from "react-router-dom";
import "./App.css";

import { AuthLayout, ProtectedHomeLayout, WalletLayout } from "./components/layout";

import HomePage from "@/pages/home";
import { LoginPage, RegisterPage } from "@/pages/auth";
import OnboardingPage from "@/pages/onboarding";
import ContactPage from "@/pages/contact";
import FeedbackPage from "@/pages/feedback";
import TransactionsPage from "@/pages/transactions";
import { WalletSendPage, WalletReceivePage } from "@/pages/wallet";
import { SettingsIndexRedirectPage, SettingsNetworkPage, SettingsPasswordPage, SettingsWalletPage, SettingsDataPage, SettingsAboutPage } from "@/pages/settings";
import NewsPage from "@/pages/news";
import PageNotFound from "@/pages/PageNotFound";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<ProtectedHomeLayout />}>
        <Route index element={<HomePage />} />
        <Route path="transactions" element={<TransactionsPage />} />
        <Route path="wallet" element={<WalletLayout />}>
          <Route path="send" element={<WalletSendPage />} />
          <Route path="receive" element={<WalletReceivePage />} />
        </Route>
        <Route path="settings" element={<Outlet />}>
          <Route index element={<SettingsIndexRedirectPage />} />
          <Route path="network" element={<SettingsNetworkPage />} />
          <Route path="password" element={<SettingsPasswordPage />} />
          <Route path="wallet" element={<SettingsWalletPage />} />
          <Route path="data" element={<SettingsDataPage />} />
          <Route path="about" element={<SettingsAboutPage />} />
        </Route>
        <Route path="news" element={<NewsPage />} />
        <Route path="feedback" element={<FeedbackPage />} />
      </Route>
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
      <Route path="/onboarding" element={<Outlet />}>
        <Route path="walkthrough" element={<OnboardingPage />} />
      </Route>
      <Route path="/contact" element={<ContactPage />} />
      <Route path="*" element={<PageNotFound />} /> 
    </Routes>
  );
}