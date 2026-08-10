import { ToastProvider } from "@/components/ui/toast";

export default function ModeratorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ToastProvider>{children}</ToastProvider>;
}
