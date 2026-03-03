"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Container, Button } from "@/components/ui";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [isCoach, setIsCoach] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/login");
        return;
      }
      // detect role (coach)
const { data: prof } = await supabase.from("profiles").select("is_coach").eq("user_id", data.session.user.id).maybeSingle();
setIsCoach(Boolean(prof?.is_coach));
setReady(true);

    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) router.replace("/login");
    });

    return () => sub.subscription.unsubscribe();
  }, [router]);

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/");
  }

  if (!ready) {
    return (
      <Container>
        <div className="text-text2">Se încarcă...</div>
      </Container>
    );
  }

  return (
    <Container>
      <div className="flex items-center justify-between gap-3">
        <Link href="/app" className="text-xl font-semibold">Anabolic Kitchen</Link>
        <div className="flex items-center gap-2">
          <Link href="/app/recipes"><Button variant="ghost">Rețete</Button></Link>
          <Link href="/app/day"><Button variant="ghost">Ziua</Button></Link>
          <Link href="/app/foods"><Button variant="ghost">Alimente</Button></Link>
          <Link href="/app"><Button variant="ghost">Dashboard</Button></Link>
          {isCoach ? <Link href="/app/coach"><Button variant="ghost">Coach</Button></Link> : null}
          <Button variant="ghost" onClick={logout}>Logout</Button>
        </div>
      </div>

      <div className="mt-6">{children}</div>
    </Container>
  );
}
