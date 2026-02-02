import { copyToClipboard } from "@/lib/utils";
import { AboutSection } from "@/components/settings/AboutSection";

export default function AboutPage() {
    return (
        <div className="max-w-2xl mx-auto">
            <AboutSection onCopy={copyToClipboard} />
        </div>
    );
}
