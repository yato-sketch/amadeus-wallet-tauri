// Asssets
import DarkLogo from "@/assets/amadeus-logo-dark.svg";

export default function OnboardingPage() {
    return (
        <div className="flex flex-col items-center justify-center h-screen">
            <div className="flex flex-col items-center justify-center gap-4 select-none">
                <img src={DarkLogo} alt="Amadeus Logo" className="w-36 h-36 object-contain" />
                <h1 className="text-3xl font-bold">Amadeus Protocol</h1>
            </div>
        </div>
    );
}