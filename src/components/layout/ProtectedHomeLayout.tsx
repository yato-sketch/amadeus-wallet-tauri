import { Outlet } from "react-router-dom";
import HomeLayout from "@/components/layout/HomeLayout";
import ProtectedRoute from "@/pages/ProtectedRoute";

export default function ProtectedHomeLayout() {
    return (
        <ProtectedRoute disableOnboarding={true}>
            <HomeLayout>
                <Outlet />
            </HomeLayout>
        </ProtectedRoute>
    );
}
