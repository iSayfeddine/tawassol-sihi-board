
"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function redirectAfterLogin(userId: string) {
    const supabase = createClient();

    const { data: profile, error } = await supabase
      .from("bureau_profiles")
      .select("must_change_password")
      .eq("user_id", userId)
      .maybeSingle();

    if (error || !profile) {
      await supabase.auth.signOut();
      setMessage(
        "Compte du bureau non configuré. Contactez le président ou le VPI."
      );
      setLoading(false);
      return;
    }

    if (profile.must_change_password) {
      router.replace("/change-password");
    } else {
      router.replace("/dashboard");
    }

    router.refresh();
  }

  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        redirectAfterLogin(data.session.user.id);
      }
    });
  }, []);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");

    const supabase = createClient();

    const normalizedUsername = username.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: `${normalizedUsername}@tawassol-sihi.example.com`,
      password,
    });

    if (error || !data.user) {
      setMessage("Connexion impossible. Vérifiez votre nom et mot de passe.");
      setLoading(false);
      return;
    }

    await redirectAfterLogin(data.user.id);
  }

  return (
    <main className="login-shell">
      <section className="login-panel">
        <div className="brand">
          <div className="brand-mark">
            <img
              src="/tawassol-logo.png"
              alt="Tawassol Sihi logo"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
              }}
            />
          </div>
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
            <label htmlFor="username">Nom d'utilisateur</label>
            <input
              className="form-input"
              id="username"
              type="text"
              autoComplete="username"
              placeholder="Ex. Linah"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
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
