import { Loader2, AlertCircle, Info } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function LoadingState({ 
  message = "Loading...", 
  className,
  fullScreen = false 
}) {
  const content = (
    <div className={cn("flex flex-col items-center justify-center gap-2", className)}>
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return content;
}

export function ErrorState({ 
  title = "Something went wrong",
  message = "An error occurred while loading this content.",
  retry,
  className 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-6 text-center", className)}>
      <AlertCircle className="h-8 w-8 text-destructive" />
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {retry && (
        <Button onClick={retry} variant="outline">
          Try Again
        </Button>
      )}
    </div>
  );
}

export function EmptyState({ 
  title = "No items found",
  message = "There are no items to display at this time.",
  action,
  className 
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center gap-4 p-6 text-center", className)}>
      <Info className="h-8 w-8 text-muted-foreground" />
      <div>
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-sm text-muted-foreground">{message}</p>
      </div>
      {action && (
        <Button onClick={action.onClick} variant={action.variant || "default"}>
          {action.label}
        </Button>
      )}
    </div>
  );
}

export function FeedbackState({ 
  type = "success",
  message,
  className 
}) {
  const styles = {
    success: "bg-green-50 text-green-800 border-green-200",
    error: "bg-destructive/10 text-destructive border-destructive/20",
    warning: "bg-yellow-50 text-yellow-800 border-yellow-200",
    info: "bg-blue-50 text-blue-800 border-blue-200"
  };

  return (
    <div className={cn(
      "rounded-lg border p-4",
      styles[type],
      className
    )}>
      <p className="text-sm font-medium">{message}</p>
    </div>
  );
} 