import { Suspense } from "react";
import { LoginCard } from "./LoginCard";

export const metadata = { title: "Sign in · Breaking Bytes" };

export default function Login() {
  return (
    <main className="grid min-h-svh place-items-center bg-ink px-4 text-paper">
      {/* reads ?next and ?error, so it streams in at request time */}
      <Suspense>
        <LoginCard />
      </Suspense>
    </main>
  );
}
