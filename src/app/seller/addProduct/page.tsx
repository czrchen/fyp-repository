import { Suspense } from "react";
import AddProductPage from "./AddProductPage";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="text-muted-foreground">Loading Form...</div>
        </div>
      }
    >
      <AddProductPage />
    </Suspense>
  );
}
