import { useNavigate } from "react-router-dom";

// Shadcn UI
import { ArrowLeftIcon, Ghost } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
    const navigate = useNavigate();

    const goBackHome = () => {
        navigate("/");
    };
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="text-center">
                <Ghost className="w-40 h-40 mx-auto mb-8 opacity-50" />
                <h1 className="text-8xl font-bold">404</h1>
                <h2 className="mt-4 text-3xl font-semibold">Page Not Found</h2>
                <p className="mt-4 text-lg text-muted-foreground">
                    Oops! The page you are looking for does not exist.
                </p>
                <p className="text-muted-foreground">
                    It might have been moved or deleted.
                </p>
                <Button variant="outline" className="mt-4" onClick={goBackHome}>
                    <ArrowLeftIcon className="w-4 h-4 mr-2" />
                    Go Back Home
                </Button>
            </div>
        </div>
    );
}