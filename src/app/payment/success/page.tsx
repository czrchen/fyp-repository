// app/auth/page.tsx
import { Suspense } from "react";
import SuccessPage from "./SuccessPage"; // Move your current code to AuthPage.tsx

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SuccessPage />
    </Suspense>
  );
}
