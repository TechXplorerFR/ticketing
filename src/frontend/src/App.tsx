import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";

type TicketStatus = "open" | "closed";

type Ticket = {
  id: number;
  title: string;
  description: string | null;
  requester: string;
  status: TicketStatus;
  createdAt: string;
};

const API_BASE_URL = "http://localhost:3000/api/tickets";

function App() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requester, setRequester] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | TicketStatus>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  const endpoint = useMemo(() => {
    if (statusFilter === "all") {
      return API_BASE_URL;
    }

    return `${API_BASE_URL}?status=${statusFilter}`;
  }, [statusFilter]);

  const loadTickets = async () => {
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
  };

  useEffect(() => {
    void loadTickets();
  }, [endpoint]);

  const createTicket = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setMessage("");

    if (!title.trim()) {
      setMessage("Le titre est requis.");
      return;
    }

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
        }),
      });

      if (!response.ok) {
        throw new Error("Impossible de creer le ticket");
      }

      setTitle("");
      setDescription("");
      setRequester("");
      setMessage("Ticket cree avec succes.");
      await loadTickets();
    } catch (error) {
      console.error(error);
      setMessage("Erreur lors de la creation du ticket.");
    }
  };

  const toggleStatus = async (ticket: Ticket) => {
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

  return (
    <main className="page">
      <section className="panel">
        <h1>Ticketing Simple</h1>
        <p className="subtitle">Creer et suivre des tickets sans complexite.</p>

        <form className="ticket-form" onSubmit={createTicket}>
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Titre du ticket"
          />
          <input
            value={requester}
            onChange={(event) => setRequester(event.target.value)}
            placeholder="Demandeur"
          />
          <textarea
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Description"
            rows={3}
          />
          <button type="submit">Ajouter</button>
        </form>

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
            {tickets.map((ticket) => (
              <li key={ticket.id} className="ticket-item">
                <div className="ticket-header">
                  <h2>{ticket.title}</h2>
                  <span className={`badge ${ticket.status}`}>{ticket.status}</span>
                </div>
                <p>{ticket.description || "Pas de description"}</p>
                <p className="meta">
                  Demandeur: {ticket.requester} | Cree le {new Date(ticket.createdAt).toLocaleString()}
                </p>
                <div className="actions">
                  <button type="button" onClick={() => void toggleStatus(ticket)}>
                    {ticket.status === "open" ? "Fermer" : "Reouvrir"}
                  </button>
                  <button type="button" className="danger" onClick={() => void deleteTicket(ticket.id)}>
                    Supprimer
                  </button>
                </div>
              </li>
            ))}
            {tickets.length === 0 ? <li>Aucun ticket.</li> : null}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
