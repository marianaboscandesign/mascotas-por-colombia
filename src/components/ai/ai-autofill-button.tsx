import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiAutofillButtonProps {
  onClick: () => void;
}

export function AiAutofillButton({ onClick }: AiAutofillButtonProps) {
  return (
    <Button
      type="button"
      onClick={onClick}
      variant="outline"
      className="w-full relative overflow-hidden group border-amber-200/50 hover:border-amber-400 bg-amber-50/30 hover:bg-amber-100/30 text-amber-900 transition-all duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-r from-amber-200/20 via-amber-400/20 to-amber-200/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
      <Sparkles className="size-4 mr-2 text-amber-500 group-hover:animate-pulse" />
      <span className="font-medium">Autocompletar con IA</span>
    </Button>
  );
}
