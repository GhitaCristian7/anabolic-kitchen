"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Container, Card, CardHeader, CardBody, Input, Button } from "@/components/ui";

export default function LoginClient() {
  const router = useRouter();
  const params = useSearchParams();
  const mode = useMemo(() => (params.get("mode") === "register" ? "register" : "login"), [params]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) router.replace("/app");
    });
  }, [router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    try {
      if (mode === "register") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMsg("Cont creat. Dacă ai activat confirmarea emailului în Supabase, verifică inbox-ul.");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.replace("/app");
      }
    } catch (err: any) {
      setMsg(err?.message ?? "Eroare necunoscută.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Container>
      <div className="flex items-center justify-between gap-4">
        <Link href="/" className="text-white/90 hover:text-white">← Acasă</Link>
        <div className="text-text2 text-sm">Anabolic Kitchen</div>
      </div>

      <div className="max-w-md mx-auto mt-8">
        <Card>
          <CardHeader
            title={mode === "register" ? "Creează cont" : "Autentificare"}
            subtitle={mode === "register" ? "Acces pe bază de cont" : "Intră în aplicație"}
          />
          <CardBody>
            <form onSubmit={onSubmit} className="space-y-4">
              <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              <Input label="Parolă" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              <Button type="submit" className="w-full" disabled={busy}>
                {busy ? "..." : mode === "register" ? "Creează cont" : "Intră"}
              </Button>
            </form>

            {msg ? <div className="mt-4 text-sm text-warn">{msg}</div> : null}

            <div className="mt-6 text-sm text-text2">
              {mode === "register" ? (
                <>
                  Ai deja cont? <Link className="text-white underline" href="/login">Autentifică-te</Link>
                </>
              ) : (
                <>
                  Nu ai cont? <Link className="text-white underline" href="/login?mode=register">Creează cont</Link>
                </>
              )}
            </div>
          </CardBody>
        </Card>
      </div>
    </Container>
  );
}
