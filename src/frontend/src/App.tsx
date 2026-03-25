import { useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type TicketStatus = "open" | "closed";
type UserRole = "viewer" | "agent" | "admin";

type User = {
  id: number;
  name: string;
  role: UserRole;
};

type Ticket = {
  id: number;
  title: string;
  description: string | null;
  requester: string;
  status: TicketStatus;
  assigneeId: number | null;
  assignee?: User | null;
  createdAt: string;
};

const API_BASE_URL = "http://localhost:3000/api/tickets";
const API_USERS_URL = "http://localhost:3000/api/users";
const LOCAL_STORAGE_USER_KEY = "ticketing.currentUserId";

const userRoles: UserRole[] = ["viewer", "agent", "admin"];

const sanitizeRole = (value: string | null): UserRole => {
  if (value === "viewer" || value === "agent" || value === "admin") {
    return value;
  }

  return "viewer";
};

const roleLabel: Record<UserRole, string> = {
  viewer: "Lecteur",
  agent: "Agent",
  admin: "Admin",
};

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState("");
  const [newTicketAssigneeId, setNewTicketAssigneeId] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newUserRole, setNewUserRole] = useState<UserRole>("viewer");
  const [currentUserId, setCurrentUserId] = useState<string>(() => window.localStorage.getItem(LOCAL_STORAGE_USER_KEY) || "");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const currentUser = useMemo(
    () => users.find((user) => String(user.id) === currentUserId) || null,
    [users, currentUserId]
  );

  const currentRole = sanitizeRole(currentUser?.role || null);

  const canCreateTicket = currentRole === "agent" || currentRole === "admin";
  const canToggleStatus = currentRole === "agent" || currentRole === "admin";
  const canDeleteTicket = currentRole === "admin";
  const canAssignTicket = currentRole === "admin";
  const canManageUsers = currentRole === "admin" || users.length === 0;

  const visibleTickets = useMemo(() => {
    if (currentRole !== "viewer") {
      return tickets;
    }

    if (!currentUser) {
      return [];
    }

    return tickets.filter(
      (ticket) => ticket.requester === currentUser.name || ticket.assigneeId === currentUser.id
    );
  }, [tickets, currentRole, currentUser]);

  const endpoint = useMemo(() => {
    if (statusFilter === "all") {
      return API_BASE_URL;
    }

    return `${API_BASE_URL}?status=${statusFilter}`;
  }, [statusFilter]);

  useEffect(() => {
    if (currentUserId) {
      window.localStorage.setItem(LOCAL_STORAGE_USER_KEY, currentUserId);
      return;
    }

    window.localStorage.removeItem(LOCAL_STORAGE_USER_KEY);
  }, [currentUserId]);

  const loadTickets = useCallback(async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error("Impossible de charger les tickets");
      }

      const data = (await response.json()) as Ticket[];
      setTickets(data);
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du chargement des tickets.");
    } finally {
      setLoading(false);
    }
  }, [endpoint]);

  const loadUsers = useCallback(async () => {
    try {
      const response = await fetch(API_USERS_URL);

      if (!response.ok) {
        throw new Error("Impossible de charger les utilisateurs");
      }

      const data = (await response.json()) as User[];
      setUsers(data);

      const savedUserId = window.localStorage.getItem(LOCAL_STORAGE_USER_KEY);
      const hasSavedUser = savedUserId ? data.some((user) => String(user.id) === savedUserId) : false;

      if (hasSavedUser) {
        setCurrentUserId(savedUserId || "");
      } else if (data.length > 0) {
        setCurrentUserId(String(data[0].id));
      } else {
        setCurrentUserId("");
      }
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors du chargement des utilisateurs.");
    }
  }, []);

  useEffect(() => {
    void loadTickets();
  }, [loadTickets]);

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");

    if (!canCreateTicket) {
      setMessage("Votre role ne permet pas de creer des tickets.");
      return;
    }

    if (!title.trim()) {
      setMessage("Le titre est requis.");
      return;
    }

    const parsedAssigneeId = newTicketAssigneeId ? Number(newTicketAssigneeId) : null;

    try {
      const response = await fetch(API_BASE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          description,
          requester: requester || "anonymous",
          assigneeId: parsedAssigneeId,
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible de creer le ticket");
      }

      setTitle("");
      setDescription("");
      setRequester(currentUser?.name || "");
      setNewTicketAssigneeId("");
      setMessage("Ticket cree avec succes.");
      await loadTickets();
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la creation du ticket.");
    }
  };

  const toggleStatus = async (ticket: Ticket) => {
    if (!canToggleStatus) {
      setMessage("Votre role ne permet pas de modifier le statut des tickets.");
      return;
    }

    const nextStatus: TicketStatus = ticket.status === "open" ? "closed" : "open";

    try {
      const response = await fetch(`${API_BASE_URL}/${ticket.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: nextStatus }),
      });

      if (!response.ok) {
        throw new Error("Impossible de mettre a jour le ticket");
      }

      await loadTickets();
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la mise a jour du statut.");
    }
  };

  const deleteTicket = async (id: number) => {
    if (!canDeleteTicket) {
      setMessage("Votre role ne permet pas de supprimer des tickets.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Impossible de supprimer le ticket");
      }

      await loadTickets();
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la suppression du ticket.");
    }
  };

  const assignTicket = async (ticketId: number, assigneeId: number | null) => {
    if (!canAssignTicket) {
      setMessage("Votre role ne permet pas d'assigner des tickets.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/${ticketId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ assigneeId }),
      });

      if (!response.ok) {
        throw new Error("Impossible d'assigner le ticket");
      }

      setMessage("Assignation du ticket mise a jour.");
      await loadTickets();
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de l'assignation du ticket.");
    }
  };

  const createUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");

    if (!canManageUsers) {
      setMessage("Votre role ne permet pas de gerer les utilisateurs.");
      return;
    }

    if (!newUserName.trim()) {
      setMessage("Le nom utilisateur est requis.");
      return;
    }

    try {
      const response = await fetch(API_USERS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: newUserName,
          role: newUserRole,
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible de creer l'utilisateur");
      }

      setNewUserName("");
      setNewUserRole("viewer");
      setMessage("Utilisateur cree avec succes.");
      await loadUsers();
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la creation de l'utilisateur.");
    }
  };

  const updateUserRole = async (userId: number, role: UserRole) => {
    const canUpdateRole = canManageUsers || currentUser?.id === userId;

    if (!canUpdateRole) {
      setMessage("Votre role ne permet pas de modifier les roles.");
      return;
    }

    try {
      const response = await fetch(`${API_USERS_URL}/${userId}/role`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (!response.ok) {
        throw new Error("Impossible de modifier le role");
      }

      setMessage("Role utilisateur mis a jour.");
      await loadUsers();
      await loadTickets();
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la mise a jour du role utilisateur.");
    }
  };

  const switchCurrentUserRole = async (role: UserRole) => {
    if (!currentUser) {
      setMessage("Aucun utilisateur actif selectionne.");
      return;
    }

    await updateUserRole(currentUser.id, role);
  };

  return (
    <main className="page">
      <section className="panel">
        <h1>Ticketing Simple</h1>
        <p className="subtitle">Creer et suivre des tickets sans complexite.</p>

        <div className="toolbar">
          <label htmlFor="current-user">Utilisateur actif</label>
          <select
            id="current-user"
            value={currentUserId}
            onChange={(event) => setCurrentUserId(event.target.value)}
            disabled={users.length === 0}
          >
            {users.length === 0 ? <option value="">Aucun utilisateur</option> : null}
            {users.map((user) => (
              <option key={user.id} value={String(user.id)}>
                {user.name} ({roleLabel[user.role]})
              </option>
            ))}
          </select>
        </div>
        <p className="meta">
          Utilisateur actif: {currentUser?.name || "Aucun"} | Role: {roleLabel[currentRole]}
        </p>
        <div className="toolbar">
          <label htmlFor="current-role">Role actif</label>
          <select
            id="current-role"
            value={currentRole}
            disabled={!currentUser}
            onChange={(event) => void switchCurrentUserRole(event.target.value as UserRole)}
          >
            {userRoles.map((role) => (
              <option key={role} value={role}>
                {roleLabel[role]}
              </option>
            ))}
          </select>
        </div>

        <form className="ticket-form" onSubmit={createTicket}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titre du ticket"
            disabled={!canCreateTicket}
          />
          <input
            value={requester}
            onChange={(event) => setRequester(event.target.value)}
            placeholder="Demandeur"
            disabled={!canCreateTicket}
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            rows={3}
            disabled={!canCreateTicket}
          />
          <select
            value={newTicketAssigneeId}
            onChange={(event) => setNewTicketAssigneeId(event.target.value)}
            disabled={!canCreateTicket}
          >
            <option value="">Non assigne</option>
            {users.map((user) => (
              <option key={user.id} value={String(user.id)}>
                {user.name} ({roleLabel[user.role]})
              </option>
            ))}
          </select>
          <button type="submit" disabled={!canCreateTicket}>
            Ajouter
          </button>
        </form>

        <section className="user-panel">
          <h2>Utilisateurs et roles</h2>
          <form className="user-form" onSubmit={createUser}>
            <input
              value={newUserName}
              onChange={(event) => setNewUserName(event.target.value)}
              placeholder="Nom utilisateur"
              disabled={!canManageUsers}
            />
            <select
              value={newUserRole}
              onChange={(event) => setNewUserRole(event.target.value as UserRole)}
              disabled={!canManageUsers}
            >
              {userRoles.map((role) => (
                <option key={role} value={role}>
                  {roleLabel[role]}
                </option>
              ))}
            </select>
            <button type="submit" disabled={!canManageUsers}>
              Creer utilisateur
            </button>
          </form>

          <ul className="user-list">
            {users.map((user) => (
              <li key={user.id} className="user-item">
                <span>
                  {user.name} - {roleLabel[user.role]}
                </span>
                <div className="role-actions">
                  {userRoles.map((role) => (
                    <button
                      key={role}
                      type="button"
                      className={user.role === role ? "role-btn active" : "role-btn"}
                      disabled={!canManageUsers && currentUser?.id !== user.id}
                      onClick={() => void updateUserRole(user.id, role)}
                    >
                      {roleLabel[role]}
                    </button>
                  ))}
                </div>
              </li>
            ))}
            {users.length === 0 ? <li>Aucun utilisateur.</li> : null}
          </ul>
        </section>

        <div className="toolbar">
          <label htmlFor="status">Filtre</label>
          <select
            id="status"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value as "all" | TicketStatus)}
          >
            <option value="all">Tous</option>
            <option value="open">Ouverts</option>
            <option value="closed">Fermes</option>
          </select>
          <button type="button" onClick={() => void loadTickets()}>
            Rafraichir
          </button>
        </div>

        {message ? <p className="message">{message}</p> : null}

        {loading ? (
          <p>Chargement...</p>
        ) : (
          <ul className="ticket-list">
            {visibleTickets.map((ticket) => (
              <li key={ticket.id} className="ticket-item">
                <div className="ticket-header">
                  <h2>{ticket.title}</h2>
                  <span className={`badge ${ticket.status}`}>{ticket.status}</span>
                </div>
                <p>{ticket.description || "Pas de description"}</p>
                <p className="meta">
                  Demandeur: {ticket.requester} | Assigne a: {ticket.assignee?.name || "personne"} | Cree le{" "}
                  {new Date(ticket.createdAt).toLocaleString()}
                </p>
                <div className="assign-row">
                  <label htmlFor={`assignee-${ticket.id}`}>Assigner a</label>
                  <select
                    id={`assignee-${ticket.id}`}
                    value={ticket.assigneeId ?? ""}
                    disabled={!canAssignTicket}
                    onChange={(event) => {
                      const value = event.target.value;
                      void assignTicket(ticket.id, value ? Number(value) : null);
                    }}
                  >
                    <option value="">Non assigne</option>
                    {users.map((user) => (
                      <option key={user.id} value={String(user.id)}>
                        {user.name} ({roleLabel[user.role]})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="actions">
                  <button type="button" disabled={!canToggleStatus} onClick={() => void toggleStatus(ticket)}>
                    {ticket.status === "open" ? "Fermer" : "Reouvrir"}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    disabled={!canDeleteTicket}
                    onClick={() => void deleteTicket(ticket.id)}
                  >
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
            {visibleTickets.length === 0 ? <li>Aucun ticket visible.</li> : null}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
