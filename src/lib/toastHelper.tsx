import { Toast, ToastProvider, ToastTitle, ToastDescription, ToastViewport } from "@/components/ui/toast";
import { createRoot } from "react-dom/client";

type ToastOptions = {
  title: string;
  description?: string;
  variant?: "default" | "destructive";
  duration?: number;
};

export function toast({ title, description, variant = "default", duration = 4000 }: ToastOptions) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const root = createRoot(container);

  root.render(
    <ToastProvider>
      <Toast variant={variant} open>
        <ToastTitle>{title}</ToastTitle>
        {description && <ToastDescription>{description}</ToastDescription>}
      </Toast>
      <ToastViewport />
    </ToastProvider>
  );

  setTimeout(() => {
    root.unmount();
    container.remove();
  }, duration);
}
