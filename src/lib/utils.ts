import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

export function copyToClipboard(
    text: string,
    label: string,
    onSuccess?: () => void
): void {
    navigator.clipboard.writeText(text).then(
        () => {
            toast.success(`${label} copied`);
            onSuccess?.();
        },
        () => toast.error("Failed to copy")
    );
}
