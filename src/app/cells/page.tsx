
"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Layers3, Users, ArrowLeft, RefreshCw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Cell = {
  id: string;
  name: string;
  chef_member_id: string | null;
};

type Member = {
  id: string;
  name: string;
};

type Assignment = {
  cell_id: string;
  member_id: string;
};

type Profile = {
  username: string;
  access_role: "president" | "vpi" | "bureau";
};

export default function CellsPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [cells, setCells] = useState<Cell[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [newCellName, setNewCellName] = useState("");
  const [newChef, setNewChef] = useState("");
  const [saving, setSaving] = useState(false);

  const canManage =
    profile?.access_role === "president" ||
    profile?.access_role === "vpi";

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: authData } = await supabase.auth.getUser();

    if (!authData.user) {
      router.replace("/");
      return;
    }

    const { data: bureau, error: profileError } = await supabase
      .from("bureau_profiles")
      .select("username, access_role")
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (profileError || !bureau) {
      await supabase.auth.signOut();
      router.replace("/");
      return;
    }

    setProfile(bureau);

    const [cellsResult, membersResult, assignmentsResult] =
      await Promise.all([
        supabase
          .from("cells")
          .select("id, name, chef_member_id")
          .order("name"),
        supabase
          .from("members")
          .select("id, name")
          .order("name"),
        supabase
          .from("member_cells")
          .select("cell_id, member_id"),
      ]);

    if (
      cellsResult.error ||
      membersResult.error ||
      assignmentsResult.error
    ) {
      setError("Impossible de charger les cellules. Réessayez.");
    } else {
      setCells(cellsResult.data ?? []);
      setMembers(membersResult.data ?? []);
      setAssignments(assignmentsResult.data ?? []);
    }

    setLoading(false);
  }, [router, supabase]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function addCell(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canManage || !newCellName.trim()) return;

    setSaving(true);
    setError("");

    const { error: insertError } = await supabase.from("cells").insert({
      name: newCellName.trim(),
      chef_member_id: newChef || null,
    });

    if (insertError) {
      setError(
        insertError.code === "23505"
          ? "Cette cellule existe déjà."
          : "Création impossible. Vérifiez vos droits et réessayez."
      );
      setSaving(false);
      return;
    }

    setNewCellName("");
    setNewChef("");
    setSaving(false);

    await loadData();
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  function getCellMembers(cellId: string) {
    const ids = assignments
      .filter((assignment) => assignment.cell_id === cellId)
      .map((assignment) => assignment.member_id);

    return members.filter((member) => ids.includes(member.id));
  }

  function getChef(cell: Cell) {
    return members.find((member) => member.id === cell.chef_member_id);
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
          <a className="nav-link" href="/dashboard">
            <ArrowLeft size={16} />
            Membres
          </a>
          <a className="nav-link active" href="/cells">
            <Layers3 size={16} />
            Cellules
          </a>
          <a className="nav-link" href="/bureau">
            <Users size={16} />
            Bureau
          </a>
        </nav>

        <div className="sidebar-bottom">
          <div className="connection-status">
            <span className="status-dot" />
            Espace privé
          </div>
          <button className="nav-link" onClick={signOut}>
            Déconnexion
          </button>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            Tawassol Sihi <span style={{ margin: "0 8px" }}>/</span>
            <strong>Cellules</strong>
          </div>
          <div className="topbar-right">
            <span className="muted small-text">
              {profile?.username ?? "Bureau"}
            </span>
          </div>
        </header>

        <section className="page-content">
          <div className="page-heading">
            <div>
              <div className="eyebrow">ORGANISATION INTERNE</div>
              <h1>Cellules</h1>
              <p className="page-description">
                Les équipes, leurs responsables et leurs membres.
              </p>
            </div>
            <button className="btn" onClick={() => void loadData()}>
              <RefreshCw size={14} />
              Actualiser
            </button>
          </div>

          {canManage && (
            <section
              className="panel"
              style={{ marginBottom: 20, padding: 18 }}
            >
              <h2 className="panel-title" style={{ marginBottom: 15 }}>
                Créer une cellule
              </h2>

              <form
                onSubmit={addCell}
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  alignItems: "end",
                }}
              >
                <div className="form-field" style={{ flex: "1 1 180px" }}>
                  <label htmlFor="cell-name">Nom de la cellule</label>
                  <input
                    id="cell-name"
                    className="form-input"
                    value={newCellName}
                    onChange={(event) => setNewCellName(event.target.value)}
                    placeholder="Ex. Communication"
                    maxLength={100}
                    required
                  />
                </div>

                <div className="form-field" style={{ flex: "1 1 180px" }}>
                  <label htmlFor="cell-chef">Chef de cellule</label>
                  <select
                    id="cell-chef"
                    className="form-select"
                    value={newChef}
                    onChange={(event) => setNewChef(event.target.value)}
                  >
                    <option value="">À définir</option>
                    {members.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.name}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving || !newCellName.trim()}
                >
                  {saving ? "Création..." : "Créer la cellule"}
                </button>
              </form>
            </section>
          )}

          {error && (
            <div
              className="message message-error"
              style={{ marginBottom: 15 }}
              role="alert"
            >
              {error}
            </div>
          )}

          {loading ? (
            <div className="panel empty-state">
              Chargement des cellules...
            </div>
          ) : cells.length === 0 ? (
            <div className="panel empty-state">
              <Layers3
                size={27}
                style={{ margin: "0 auto 12px", opacity: 0.5 }}
              />
              <strong>Aucune cellule enregistrée</strong>
              {canManage
                ? "Créez la première cellule pour commencer."
                : "Les cellules apparaîtront ici une fois créées par les responsables autorisés."}
            </div>
          ) : (
            <section className="panel">
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Cellule</th>
                      <th>Chef de cellule</th>
                      <th>Membres affectés</th>
                      <th>Effectif</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cells.map((cell) => {
                      const cellMembers = getCellMembers(cell.id);
                      const chef = getChef(cell);

                      return (
                        <tr key={cell.id}>
                          <td>
                            <span className="member-name">
                              <Layers3 size={14} color="#b9aaff" />
                              {cell.name}
                            </span>
                          </td>
                          <td>{chef?.name ?? "À définir"}</td>
                          <td>
                            {cellMembers.length ? (
                              <div className="tag-list">
                                {cellMembers.map((member) => (
                                  <span className="tag" key={member.id}>
                                    {member.name}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <span className="muted">
                                Aucun membre affecté
                              </span>
                            )}
                          </td>
                          <td>
                            <span className="status-paid">
                              <Users size={13} />
                              {cellMembers.length}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>
          )}

          <p className="muted small-text" style={{ marginTop: 15 }}>
            La gestion des cellules est réservée au Président et au
            Vice-président chargé des affaires internes. L’affectation des
            membres sera ajoutée à l’étape suivante.
          </p>
        </section>
      </main>
    </div>
  );
}
