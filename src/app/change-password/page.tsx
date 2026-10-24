
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (password.length < 8) {
      setMessage("Le mot de passe doit contenir au moins 8 caractères.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setLoading(true);

    const supabase = createClient();

    const { data: sessionData } = await supabase.auth.getSession();

    if (!sessionData.session) {
      router.replace("/");
      return;
    }

    const { error: passwordError } = await supabase.auth.updateUser({
      password,
    });

    if (passwordError) {
      setMessage("Impossible de modifier le mot de passe. Réessayez.");
      setLoading(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("bureau_profiles")
      .update({ must_change_password: false })
      .eq("user_id", sessionData.session.user.id);

    if (profileError) {
      setMessage(
        "Mot de passe modifié, mais la validation du compte a échoué. Contactez le président ou le VPI."
      );
      setLoading(false);
      return;
    }

    router.replace("/dashboard");
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

        <div className="eyebrow">PREMIÈRE CONNEXION</div>
        <h1>Choisissez votre mot de passe.</h1>
        <p className="page-description">
          Pour sécuriser votre compte, remplacez votre mot de passe temporaire
          par un mot de passe personnel d&apos;au moins 8 caractères.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="new-password">Nouveau mot de passe</label>
            <input
              className="form-input"
              id="new-password"
              type="password"
              autoComplete="new-password"
              placeholder="8 caractères minimum"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={8}
              required
            />
          </div>

          <div className="form-field">
            <label htmlFor="confirm-password">
              Confirmer le mot de passe
            </label>
            <input
              className="form-input"
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              placeholder="Retapez votre mot de passe"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              minLength={8}
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
            {loading ? "Enregistrement..." : "Enregistrer →"}
          </button>
        </form>
      </section>
    </main>
  );
}
