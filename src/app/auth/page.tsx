// app/auth/page.tsx
import { Suspense } from "react";
import AuthPage from "./AuthPage"; // Move your current code to AuthPage.tsx

export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AuthPage />
    </Suspense>
  );
}
