import { Suspense } from "react";
import MessagesPage from "./MessagePage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading messages...</div>
        </div>
      }
    >
      <MessagesPage />
    </Suspense>
  );
}
