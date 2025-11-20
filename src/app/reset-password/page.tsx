// app/auth/page.tsx
import { Suspense } from "react";
import ResetPage from "./ResetPage"; // Move your current code to AuthPage.tsx

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ResetPage />
    </Suspense>
  );
}
