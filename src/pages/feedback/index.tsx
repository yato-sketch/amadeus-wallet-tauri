import { Link } from "react-router-dom";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function FeedbackPage() {
    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Feedback</CardTitle>
                    <CardDescription>
                        Share your feedback about the Amadeus wallet app.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button variant="outline" asChild>
                        <Link to="/">Back to wallet</Link>
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
