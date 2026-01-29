import { Outlet, Route, Routes } from "react-router-dom";
import "./App.css";

// Layouts
import AuthLayout from "./components/layout/AuthLayout";

// Pages
import HomePage from "./pages/home";
import { LoginPage, RegisterPage } from "./pages/auth";
import OnboardingPage from "./pages/onboarding";
import PageNotFound from "./pages/PageNotFound";
import ProtectedRoute from "./pages/ProtectedRoute";

export default function App() {
  return (
    <Routes>
      <Route path="/" index element={<ProtectedRoute children={<HomePage />} disableOnboarding={false} />} />
      <Route path="/auth" element={<AuthLayout />}>
        <Route path="login" element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
      </Route>
      <Route path="/onboarding" element={<Outlet />}>
        <Route path="walkthrough" element={<OnboardingPage />} />
      </Route>
      <Route path="*" element={<PageNotFound />} /> 
    </Routes>
  );
}