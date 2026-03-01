import { Suspense } from "react";
import LoginClient from "./LoginClient";

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ color: "#9CA3AF", padding: 24 }}>Se încarcă...</div>}>
      <LoginClient />
    </Suspense>
  );
}