
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Search,
  Users,
  LayoutDashboard,
  Layers3,
  Contact,
  LogOut,
  Plus,
  Diamond,
  AlertTriangle,
  RefreshCw,
} from "lucide-react";

type Member = {
  id: string;
  name: string;
  filiere: string | null;
  academic_year: string | null;
  phone: string | null;
  cotisation_paid: boolean;
  interests: string[];
  skills: string[];
  notes: string | null;
  is_vip: boolean;
  is_flagged: boolean;
};

type BureauProfile = {
  username: string;
  arabic_name: string;
  access_role: "president" | "vpi" | "bureau";
};

export default function DashboardPage() {
  const router = useRouter();

  const [members, setMembers] = useState<Member[]>([]);
  const [profile, setProfile] = useState<BureauProfile | null>(null);
  const [search, setSearch] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [saving, setSaving] = useState(false);

  const [name, setName] = useState("");
  const [filiere, setFiliere] = useState("");
  const [year, setYear] = useState("");
  const [phone, setPhone] = useState("");
  const [paid, setPaid] = useState(false);

  const supabase = useMemo(() => createClient(), []);

  const canManageMembers =
    profile?.access_role === "president" ||
    profile?.access_role === "vpi";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: authData, error: authError } =
      await supabase.auth.getUser();

    if (authError || !authData.user) {
      router.replace("/");
      return;
    }

    const { data: bureau, error: profileError } = await supabase
      .from("bureau_profiles")
      .select("username, arabic_name, access_role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (profileError || !bureau) {
      await supabase.auth.signOut();
      router.replace("/");
      return;
    }

    setProfile(bureau);

    const { data, error: membersError } = await supabase
      .from("members")
      .select("*")
      .order("cotisation_paid", { ascending: false })
      .order("name", { ascending: true });

    if (membersError) {
      setError("Impossible de charger les membres. Réessayez.");
    } else {
      setMembers((data ?? []) as Member[]);
    }

    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const filteredMembers = members.filter((member) => {
    const term = search.toLocaleLowerCase("fr");

    const matchesSearch = [
      member.name,
      member.filiere,
      member.academic_year,
      member.phone,
      ...(member.interests ?? []),
      ...(member.skills ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase("fr")
      .includes(term);

    const matchesPayment =
      paymentFilter === "all" ||
      (paymentFilter === "paid" && member.cotisation_paid) ||
      (paymentFilter === "unpaid" && !member.cotisation_paid);

    return matchesSearch && matchesPayment;
  });

  async function addMember(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManageMembers) return;

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("members").insert({
      name: name.trim(),
      filiere: filiere.trim() || null,
      academic_year: year.trim() || null,
      phone: phone.trim() || null,
      cotisation_paid: paid,
    });

    if (insertError) {
      setError("Ajout impossible. Vérifiez les informations et réessayez.");
      setSaving(false);
      return;
    }

    setName("");
    setFiliere("");
    setYear("");
    setPhone("");
    setPaid(false);
    setShowAdd(false);
    setSaving(false);

    await loadData();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">TS</div>
          <div>
            <div className="brand-name">Tawassol Sihi</div>
            <div className="brand-subtitle">Board workspace</div>
          </div>
        </div>

        <div className="nav-label">Espace bureau</div>

        <nav>
          <a className="nav-link active" href="/dashboard">
            <LayoutDashboard size={16} />
            Tableau de bord
          </a>
          <a className="nav-link" href="/dashboard">
            <Users size={16} />
            Membres
          </a>
          <a className="nav-link" href="/cells">
            <Layers3 size={16} />
            Cellules
          </a>
          <a className="nav-link" href="/bureau">
            <Contact size={16} />
            Bureau
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="connection-status">
            <span className="status-dot" />
            Espace privé
          </div>
          <button
            className="nav-link"
            onClick={signOut}
            style={{
              width: "100%",
              marginTop: 12,
              background: "transparent",
              border: 0,
              textAlign: "left",
            }}
          >
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Tawassol Sihi <span style={{ margin: "0 8px" }}>/</span>
            <strong>Membres</strong>
          </div>

          <div className="topbar-right">
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: 11, fontWeight: 600 }}>
                {profile?.username ?? "Bureau"}
              </div>
              <div className="muted small-text">
                {profile?.access_role === "president"
                  ? "Président"
                  : profile?.access_role === "vpi"
                    ? "Vice-président · Interne"
                    : "Membre du bureau"}
              </div>
            </div>
            <div className="user-avatar">
              {profile?.username?.slice(0, 1).toUpperCase() ?? "B"}
            </div>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">GESTION DU CLUB</div>
              <h1>Base des membres</h1>
              <p className="page-description">
                Consultez et gérez les informations des membres de Tawassol Sihi.
              </p>
            </div>

            <button
              className="btn btn-primary"
              onClick={() => setShowAdd(true)}
              disabled={!canManageMembers}
              title={
                canManageMembers
                  ? "Ajouter un membre"
                  : "Réservé au Président et au Vice-président chargé des affaires internes"
              }
            >
              <Plus size={15} />
              Ajouter un membre
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(145px, 1fr))",
              gap: 12,
              marginBottom: 22,
            }}
          >
            <div className="panel" style={{ padding: 17 }}>
              <div className="muted small-text">TOTAL DES MEMBRES</div>
              <div
                style={{
                  fontSize: 27,
                  fontWeight: 600,
                  marginTop: 9,
                  fontFamily: "Space Grotesk, sans-serif",
                }}
              >
                {members.length}
              </div>
            </div>

            <div className="panel" style={{ padding: 17 }}>
              <div className="muted small-text">COTISATIONS PAYÉES</div>
              <div
                style={{
                  fontSize: 27,
                  fontWeight: 600,
                  color: "var(--green)",
                  marginTop: 9,
                  fontFamily: "Space Grotesk, sans-serif",
                }}
              >
                {members.filter((m) => m.cotisation_paid).length}
              </div>
            </div>

            <div className="panel" style={{ padding: 17 }}>
              <div className="muted small-text">EN ATTENTE</div>
              <div
                style={{
                  fontSize: 27,
                  fontWeight: 600,
                  color: "var(--red)",
                  marginTop: 9,
                  fontFamily: "Space Grotesk, sans-serif",
                }}
              >
                {members.filter((m) => !m.cotisation_paid).length}
              </div>
            </div>

            <div className="panel" style={{ padding: 17 }}>
              <div className="muted small-text">MEMBRES VIP</div>
              <div
                style={{
                  fontSize: 27,
                  fontWeight: 600,
                  color: "var(--gold)",
                  marginTop: 9,
                  fontFamily: "Space Grotesk, sans-serif",
                }}
              >
                {members.filter((m) => m.is_vip).length}
              </div>
            </div>
          </div>

          <section className="panel">
            <div className="panel-header">
              <div>
                <h2 className="panel-title">Registre des membres</h2>
                <p className="panel-subtitle">
                  {filteredMembers.length} résultat(s) · Cotisations payées en premier
                </p>
              </div>

              <div className="toolbar">
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    border: "1px solid var(--border)",
                    borderRadius: 7,
                    paddingLeft: 10,
                    background: "#0b1018",
                  }}
                >
                  <Search size={14} color="#8490a3" />
                  <input
                    className="search-input"
                    aria-label="Rechercher un membre"
                    placeholder="Nom, filière, téléphone..."
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    style={{ border: 0, background: "transparent" }}
                  />
                </div>

                <select
                  className="filter-select"
                  aria-label="Filtrer par cotisation"
                  value={paymentFilter}
                  onChange={(event) => setPaymentFilter(event.target.value)}
                >
                  <option value="all">Toutes les cotisations</option>
                  <option value="paid">Payées</option>
                  <option value="unpaid">Non payées</option>
                </select>

                <button
                  className="btn"
                  onClick={() => void loadData()}
                  title="Actualiser"
                >
                  <RefreshCw size={14} />
                </button>
              </div>
            </div>

            {error && (
              <div
                className="message message-error"
                style={{ margin: 14 }}
                role="alert"
              >
                {error}
              </div>
            )}

            {loading ? (
              <div className="empty-state">Chargement des membres...</div>
            ) : filteredMembers.length === 0 ? (
              <div className="empty-state">
                <Users
                  size={25}
                  style={{ margin: "0 auto 12px", opacity: 0.5 }}
                />
                <strong>
                  {members.length === 0
                    ? "Votre registre est prêt."
                    : "Aucun résultat"}
                </strong>
                {members.length === 0
                  ? "Les membres apparaîtront ici après leur ajout."
                  : "Essayez de modifier votre recherche ou vos filtres."}
              </div>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nom</th>
                      <th>Filière</th>
                      <th>Année</th>
                      <th>Téléphone</th>
                      <th>Cotisation</th>
                      <th>Intérêts</th>
                      <th>Compétences</th>
                      <th>Cellules</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr key={member.id}>
                        <td>
                          <span className="member-name">
                            {member.name}
                            {member.is_vip && (
                              <Diamond
                                className="vip-icon"
                                size={13}
                                aria-label="VIP"
                              />
                            )}
                            {member.is_flagged && (
                              <AlertTriangle
                                className="warning-icon"
                                size={13}
                                aria-label="Attention"
                              />
                            )}
                          </span>
                        </td>
                        <td>{member.filiere || "—"}</td>
                        <td>{member.academic_year || "—"}</td>
                        <td>{member.phone || "—"}</td>
                        <td>
                          <span
                            className={
                              member.cotisation_paid
                                ? "status-paid"
                                : "status-unpaid"
                            }
                          >
                            {member.cotisation_paid ? "Payée" : "Non payée"}
                          </span>
                        </td>
                        <td>
                          <div className="tag-list">
                            {(member.interests ?? []).length ? (
                              member.interests.map((tag) => (
                                <span className="tag tag-purple" key={tag}>
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="tag-list">
                            {(member.skills ?? []).length ? (
                              member.skills.map((tag) => (
                                <span className="tag" key={tag}>
                                  {tag}
                                </span>
                              ))
                            ) : (
                              <span className="muted">—</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className="muted">—</span>
                        </td>
                        <td>{member.notes || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <p
            className="muted small-text"
            style={{ marginTop: 16, lineHeight: 1.8 }}
          >
            Espace réservé aux comptes autorisés du bureau. Les droits d’accès
            sont également contrôlés par la base de données.
          </p>
        </section>
      </main>

      {showAdd && (
        <div
          role="presentation"
          onClick={(event) => {
            if (event.target === event.currentTarget) setShowAdd(false);
          }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 30,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "#000a",
            backdropFilter: "blur(5px)",
          }}
        >
          <section
            className="panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="add-member-title"
            style={{ width: "100%", maxWidth: 520, padding: 22 }}
          >
            <div className="eyebrow">NOUVEAU DOSSIER</div>
            <h2
              id="add-member-title"
              className="panel-title"
              style={{ fontSize: 18 }}
            >
              Ajouter un membre
            </h2>
            <p
              className="page-description"
              style={{ marginTop: 8, marginBottom: 20 }}
            >
              Les champs pourront être complétés plus tard.
            </p>

            <form onSubmit={addMember}>
              <div className="form-grid">
                <div className="form-field full-width">
                  <label htmlFor="member-name">Nom complet *</label>
                  <input
                    id="member-name"
                    className="form-input"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    required
                    maxLength={120}
                    autoFocus
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="member-filiere">Filière</label>
                  <input
                    id="member-filiere"
                    className="form-input"
                    value={filiere}
                    onChange={(event) => setFiliere(event.target.value)}
                    placeholder="Ex. Médecine"
                  />
                </div>

                <div className="form-field">
                  <label htmlFor="member-year">Année d&#39;études</label>
                  <input
                    id="member-year"
                    className="form-input"
                    value={year}
                    onChange={(event) => setYear(event.target.value)}
                    placeholder="Ex. 4e année"
                  />
                </div>

                <div className="form-field full-width">
                  <label htmlFor="member-phone">Téléphone</label>
                  <input
                    id="member-phone"
                    className="form-input"
                    type="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="+212..."
                  />
                </div>

                <div className="form-field full-width">
                  <label
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 9,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={paid}
                      onChange={(event) => setPaid(event.target.checked)}
                    />
                    Cotisation payée
                  </label>
                </div>
              </div>

              {error && (
                <div
                  className="message message-error"
                  style={{ marginTop: 15 }}
                  role="alert"
                >
                  {error}
                </div>
              )}

              <div className="form-actions">
                <button
                  type="button"
                  className="btn"
                  onClick={() => setShowAdd(false)}
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={saving || !name.trim()}
                >
                  {saving ? "Enregistrement..." : "Créer le dossier"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
