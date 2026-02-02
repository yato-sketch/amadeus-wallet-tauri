import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

// UI
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MailIcon, Loader2Icon, ArrowLeftIcon } from "lucide-react";

// Schemas
import { contactSchema, type ContactForm } from "@/lib/schemas";

export default function ContactPage() {
    const navigate = useNavigate();
    const {
        handleSubmit,
        control,
        formState: { errors, isSubmitting },
    } = useForm<ContactForm>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            email: "",
            subject: "",
            message: "",
        },
        mode: "onSubmit",
    });

    useEffect(() => {
        if (errors.name?.message) toast.error(errors.name.message);
        if (errors.email?.message) toast.error(errors.email.message);
        if (errors.subject?.message) toast.error(errors.subject.message);
        if (errors.message?.message) toast.error(errors.message.message);
    }, [errors.name?.message, errors.email?.message, errors.subject?.message, errors.message?.message]);

    const onSubmit = async (data: ContactForm) => {
        toast.success("Message sent", {
            description: "We'll get back to you as soon as we can.",
        });
        console.log("Contact form:", data);
    };

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MailIcon className="h-5 w-5" />
                        Contact support
                    </CardTitle>
                    <CardDescription>
                        Send us a message and we'll help you as soon as possible.
                    </CardDescription>
                </CardHeader>
                <form onSubmit={handleSubmit(onSubmit)}>
                    <CardContent className="space-y-4">
                        <Controller
                            name="name"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <label
                                        htmlFor="contact-name"
                                        className="text-sm font-medium leading-none"
                                    >
                                        Name
                                    </label>
                                    <Input
                                        {...field}
                                        id="contact-name"
                                        placeholder="Your name"
                                        className={errors.name ? "border-destructive" : ""}
                                        aria-invalid={!!errors.name}
                                    />
                                </div>
                            )}
                        />
                        <Controller
                            name="email"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <label
                                        htmlFor="contact-email"
                                        className="text-sm font-medium leading-none"
                                    >
                                        Email
                                    </label>
                                    <Input
                                        {...field}
                                        id="contact-email"
                                        type="email"
                                        placeholder="you@example.com"
                                        className={errors.email ? "border-destructive" : ""}
                                        aria-invalid={!!errors.email}
                                    />
                                </div>
                            )}
                        />
                        <Controller
                            name="subject"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <label
                                        htmlFor="contact-subject"
                                        className="text-sm font-medium leading-none"
                                    >
                                        Subject
                                    </label>
                                    <Input
                                        {...field}
                                        id="contact-subject"
                                        placeholder="What is this about?"
                                        className={errors.subject ? "border-destructive" : ""}
                                        aria-invalid={!!errors.subject}
                                    />
                                </div>
                            )}
                        />
                        <Controller
                            name="message"
                            control={control}
                            render={({ field }) => (
                                <div className="space-y-2">
                                    <label
                                        htmlFor="contact-message"
                                        className="text-sm font-medium leading-none"
                                    >
                                        Message
                                    </label>
                                    <Textarea
                                        {...field}
                                        id="contact-message"
                                        placeholder="Your message..."
                                        rows={4}
                                        className={`resize-none ${errors.message ? "border-destructive" : ""}`}
                                        aria-invalid={!!errors.message}
                                    />
                                </div>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 mt-4">
                        <Button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex w-full items-center gap-2"
                        >
                            {isSubmitting ? (
                                <Loader2Icon className="h-4 w-4 animate-spin" />
                            ) : (
                                <MailIcon className="h-4 w-4" />
                            )}
                            Send message
                        </Button>
                        <Button variant="ghost" className="w-full gap-2" onClick={(e) => { e.preventDefault(); navigate(-1); }}>
                            <ArrowLeftIcon className="h-4 w-4" />
                            Back
                        </Button>
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
