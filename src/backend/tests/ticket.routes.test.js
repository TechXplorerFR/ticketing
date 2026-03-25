/**
 * Test Suite for Ticket and User API Routes
 * Tests all CRUD operations, validation, and error handling for both resources.
 * Uses in-memory SQLite database for isolated test environment.
 */

// Set test environment variables
process.env.NODE_ENV = "test";
process.env.dialect = "sqlite";
process.env.DB = ":memory:";
process.env.SQLITE_STORAGE = ":memory:";

const request = require("supertest");
const app = require("../server");
const db = require("../models");

/**
 * Helper function to create a test user
 * @param {string} name - User's name
 * @param {string} role - User's role (default: 'viewer')
 * @returns {Object} Created user object
 */
const createUser = async (name, role = "viewer") => {
  const response = await request(app)
    .post("/api/users")
    .send({ name, role })
    .expect(201);

  return response.body;
};

/**
 * Helper function to create a test ticket
 * @param {Object} payload - Ticket data {title, description?, requester?, assigneeId?}
 * @returns {Object} Created ticket object
 */
const createTicket = async (payload) => {
  const response = await request(app)
    .post("/api/tickets")
    .send(payload)
    .expect(201);

  return response.body;
};

// Main test suite
describe("Routes API Ticket et Users", () => {
  let assigneeId; // Will store ID of test assignee user

  // Initialize database before all tests
  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  // Reset database before each test
  beforeEach(async () => {
    await db.sequelize.sync({ force: true });
    // Create a default assignee for test tickets
    const assignee = await createUser("Alice", "agent");
    assigneeId = assignee.id;
  });

  // Close database connection after all tests
  afterAll(async () => {
    await db.sequelize.close();
  });

  // ============ USER TESTS ============

  // Test: Create user with valid role
  it("cree un utilisateur avec role valide", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ name: "Bob", role: "admin" })
      .expect(201);

    expect(response.body.name).toBe("Bob");
    expect(response.body.role).toBe("admin");
  });

  // Test: Reject user creation without name
  it("refuse la creation d'utilisateur sans nom", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ name: "   ", role: "viewer" })
      .expect(400);

    expect(response.body.message).toContain("nom utilisateur");
  });

  // Test: Reject user creation with invalid role
  it("refuse la creation d'utilisateur avec role invalide", async () => {
    const response = await request(app)
      .post("/api/users")
      .send({ name: "Chris", role: "root" })
      .expect(400);

    expect(response.body.message).toContain("Role utilisateur invalide");
  });

  // Test: Update user role successfully
  it("met a jour le role d'un utilisateur", async () => {
    const created = await createUser("Dana", "viewer");

    const response = await request(app)
      .put(`/api/users/${created.id}/role`)
      .send({ role: "agent" })
      .expect(200);

    expect(response.body.id).toBe(created.id);
    expect(response.body.role).toBe("agent");
  });

  // Test: Reject role update for non-existent user
  it("refuse le changement de role sur un id introuvable", async () => {
    await request(app)
      .put("/api/users/9999/role")
      .send({ role: "agent" })
      .expect(404);
  });

  // ============ TICKET TESTS ============

  // Test: Create ticket with trimmed title and assignee
  it("cree un ticket avec titre trimme et assignee", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        title: "   Probleme de connexion   ",
        description: "Impossible de se connecter",
        requester: "Client A",
        assigneeId,
      })
      .expect(201);

    expect(response.body.title).toBe("Probleme de connexion");
    expect(response.body.status).toBe("open");
    expect(response.body.assignee.id).toBe(assigneeId);
  });

  // Test: Reject ticket creation without title
  it("refuse la creation d'un ticket sans titre", async () => {
    await request(app)
      .post("/api/tickets")
      .send({
        description: "Aucun titre",
      })
      .expect(400);
  });

  // Test: Reject ticket with invalid assignee ID
  it("refuse la creation avec assigneeId invalide", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        title: "Ticket invalide",
        assigneeId: "abc",
      })
      .expect(400);

    expect(response.body.message).toContain("identifiant d'assignation");
  });

  // Test: Reject ticket with non-existent assignee
  it("refuse la creation avec assigneeId introuvable", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        title: "Ticket sans utilisateur",
        assigneeId: 9999,
      })
      .expect(400);

    expect(response.body.message).toContain("Utilisateur assigne introuvable");
  });

  // Test: Get list of tickets with status filter
  it("retourne la liste des tickets avec filtre status", async () => {
    await createTicket({ title: "Ticket 1", assigneeId });
    const created = await createTicket({ title: "Ticket 2", assigneeId });

    await request(app)
      .put(`/api/tickets/${created.id}`)
      .send({ status: "closed" })
      .expect(200);

    // Get tickets filtered by open status
    const openResponse = await request(app)
      .get("/api/tickets?status=open")
      .expect(200);

    // Get tickets filtered by closed status
    const closedResponse = await request(app)
      .get("/api/tickets?status=closed")
      .expect(200);

    expect(openResponse.body).toHaveLength(1);
    expect(closedResponse.body).toHaveLength(1);
  });

  // Test: Get single ticket by ID with assignee details
  it("retourne un ticket par id avec son assignee", async () => {
    const created = await createTicket({
      title: "Ticket detail",
      requester: "User Test",
      assigneeId,
    });

    const response = await request(app)
      .get(`/api/tickets/${created.id}`)
      .expect(200);

    expect(response.body.id).toBe(created.id);
    expect(response.body.assignee.id).toBe(assigneeId);
  });

  // Test: Return 404 for non-existent ticket
  it("retourne 404 pour un ticket inexistant", async () => {
    await request(app)
      .get("/api/tickets/9999")
      .expect(404);
  });

  // Test: Update ticket status and assignee
  it("met a jour le statut et l'assignation d'un ticket", async () => {
    const created = await createTicket({ title: "Ticket a modifier", assigneeId });
    const secondUser = await createUser("Eva", "agent");

    const response = await request(app)
      .put(`/api/tickets/${created.id}`)
      .send({
        status: "closed",
        assigneeId: secondUser.id,
      })
      .expect(200);

    expect(response.body.status).toBe("closed");
    expect(response.body.assignee.id).toBe(secondUser.id);
  });

  // Test: Unassign a ticket by setting assigneeId to null
  it("desassigne un ticket avec assigneeId null", async () => {
    const created = await createTicket({ title: "Ticket desassignable", assigneeId });

    const response = await request(app)
      .put(`/api/tickets/${created.id}`)
      .send({ assigneeId: null })
      .expect(200);

    expect(response.body.assigneeId).toBeNull();
    expect(response.body.assignee).toBeNull();
  });

  // Test: Reject empty update request
  it("refuse une mise a jour vide", async () => {
    const created = await createTicket({ title: "Ticket sans update", assigneeId });

    await request(app)
      .put(`/api/tickets/${created.id}`)
      .send({ unknown: true })
      .expect(400);
  });

  // Test: Reject update with empty title
  it("refuse une mise a jour avec titre vide", async () => {
    const created = await createTicket({ title: "Ticket titre", assigneeId });

    await request(app)
      .put(`/api/tickets/${created.id}`)
      .send({ title: "   " })
      .expect(400);
  });

  // Test: Reject update with invalid assignee ID
  it("refuse une mise a jour avec assigneeId invalide", async () => {
    const created = await createTicket({ title: "Ticket invalide update", assigneeId });

    const response = await request(app)
      .put(`/api/tickets/${created.id}`)
      .send({ assigneeId: -1 })
      .expect(400);

    expect(response.body.message).toContain("identifiant d'assignation");
  });

  // Test: Return 404 when updating non-existent ticket
  it("retourne 404 si ticket a mettre a jour introuvable", async () => {
    await request(app)
      .put("/api/tickets/9999")
      .send({ status: "closed" })
      .expect(404);
  });

  // Test: Delete ticket and verify it no longer exists
  it("supprime un ticket puis renvoie 404 a la lecture", async () => {
    const created = await createTicket({ title: "Ticket a supprimer", assigneeId });

    await request(app)
      .delete(`/api/tickets/${created.id}`)
      .expect(200);

    await request(app)
      .get(`/api/tickets/${created.id}`)
      .expect(404);
  });

  // Test: Return 404 when deleting non-existent ticket
  it("retourne 404 sur suppression d'un ticket inexistant", async () => {
    await request(app)
      .delete("/api/tickets/9999")
      .expect(404);
  });
});
