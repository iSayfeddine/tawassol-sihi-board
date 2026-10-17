
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type BureauMember = {
  user_id: string;
  username: string;
  arabic_name: string;
  arabic_role: string;
  phone: string | null;
  comment: string | null;
};

export default function BureauPage() {
  const supabase = useMemo(() => createClient(), []);
  const [members, setMembers] = useState<BureauMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadBureau() {
      const { data: authData } = await supabase.auth.getUser();

      if (!authData.user) {
        window.location.href = "/";
        return;
      }

      const { data: profile } = await supabase
        .from("bureau_profiles")
        .select("access_role")
        .eq("user_id", authData.user.id)
        .maybeSingle();

      if (!profile) {
        await supabase.auth.signOut();
        window.location.href = "/";
        return;
      }

      const { data, error: fetchError } = await supabase
        .from("bureau_profiles")
        .select("user_id, username, arabic_name, arabic_role, phone, comment")
        .order("username");

      if (fetchError) {
        setError("Impossible de charger les membres du bureau.");
      } else {
        setMembers((data ?? []) as BureauMember[]);
      }

      setLoading(false);
    }

    void loadBureau();
  }, [supabase]);

  return (
    <main className="page-shell">
      <header className="topbar">
        <Link href="/dashboard" className="brand">
          <span className="brand-mark">TS</span>
          <span>Tawassol Sihi</span>
        </Link>
        <Link href="/dashboard" className="button button-secondary">
          <ArrowLeft size={16} />
          Retour aux membres
        </Link>
      </header>

      <section className="page-heading">
        <div>
          <p className="eyebrow">GESTION DU CLUB</p>
          <h1>Bureau</h1>
          <p className="muted">
            Annuaire interne des membres du bureau.
          </p>
        </div>
        <div className="stat-card">
          <Users size={19} />
          <span>{members.length} membres</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <h2>Annuaire du bureau</h2>
          <span className="muted">Accès réservé au bureau</span>
        </div>

        {loading ? (
          <p className="empty-state">Chargement...</p>
        ) : error ? (
          <p className="error-message">{error}</p>
        ) : (
          <div className="table-wrap">
            <table className="data-table bureau-table">
              <thead>
                <tr>
                  <th>الاسم</th>
                  <th>المنصب</th>
                  <th>Numéro</th>
                  <th>Commentaire</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.user_id}>
                    <td dir="rtl" className="arabic-cell">
                      {member.arabic_name}
                    </td>
                    <td dir="rtl" className="arabic-cell">
                      {member.arabic_role}
                    </td>
                    <td>{member.phone || "—"}</td>
                    <td>{member.comment || "—"}</td>
                  </tr>
                ))}
                {members.length === 0 && (
                  <tr>
                    <td colSpan={4} className="empty-state">
                      Aucun profil de bureau configuré pour le moment.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
