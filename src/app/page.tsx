
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        router.replace("/dashboard");
      }
    });
  }, [router]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      setMessage("Connexion impossible. Vérifiez vos identifiants.");
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand">
          <div className="brand-mark">TS</div>
          <div>
            <div className="brand-name">Tawassol Sihi</div>
            <div className="brand-subtitle">Bureau · Espace privé</div>
          </div>
        </div>

        <div className="eyebrow">ACCÈS SÉCURISÉ</div>
        <h1>Bienvenue.</h1>
        <p className="page-description">
          Connectez-vous à votre espace de gestion du club.
          Réservé aux membres autorisés du bureau.
        </p>

        <form onSubmit={handleLogin}>
          <div className="form-field">
            <label htmlFor="email">Adresse e-mail</label>
            <input
              className="form-input"
              id="email"
              type="email"
              autoComplete="username"
              placeholder="votre@email.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="password">Mot de passe</label>
            <input
              className="form-input"
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Votre mot de passe"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>

          {message && (
            <div className="message message-error" role="alert">
              {message}
            </div>
          )}

          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading}
          >
            {loading ? "Connexion..." : "Se connecter →"}
          </button>
        </form>

        <p className="muted small-text" style={{ marginTop: 22 }}>
          Accès réservé · Tawassol Sihi
        </p>
      </section>
    </main>
  );
}
