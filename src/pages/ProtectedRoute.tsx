import { Navigate } from "react-router-dom";
import OnboardingCheck from "@/components/OnboardingCheck";

export default function ProtectedRoute({
    children,
    disableOnboarding = false
}: {
    children: React.ReactNode,
    disableOnboarding?: boolean
}) {
    const isAuthenticated = false;

    if (isAuthenticated) {
        if (disableOnboarding) {
            return <>{children as React.ReactNode}</>;
        }
        return (
            <OnboardingCheck>
                {children}
            </OnboardingCheck>
        );
    }
    return <Navigate to="/auth/login" />;
}