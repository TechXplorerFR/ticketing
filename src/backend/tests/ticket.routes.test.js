process.env.NODE_ENV = "test";
process.env.dialect = "sqlite";
process.env.DB = ":memory:";
process.env.SQLITE_STORAGE = ":memory:";

const request = require("supertest");
const app = require("../server");
const db = require("../models");

describe("Routes API Ticket", () => {
  let createdTicketId;

  beforeAll(async () => {
    await db.sequelize.sync({ force: true });
  });

  afterAll(async () => {
    await db.sequelize.close();
  });

  it("cree un ticket", async () => {
    const response = await request(app)
      .post("/api/tickets")
      .send({
        title: "Probleme de connexion",
        description: "Impossible de me connecter a l'application",
        requester: "Alice",
      })
      .expect(201);

    createdTicketId = response.body.id;
    expect(response.body.title).toBe("Probleme de connexion");
    expect(response.body.status).toBe("open");
  });

  it("refuse la creation sans titre", async () => {
    await request(app)
      .post("/api/tickets")
      .send({
        description: "Aucun titre",
      })
      .expect(400);
  });

  it("retourne la liste des tickets", async () => {
    const response = await request(app)
      .get("/api/tickets")
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
  });

  it("retourne un ticket par id", async () => {
    const response = await request(app)
      .get(`/api/tickets/${createdTicketId}`)
      .expect(200);

    expect(response.body.id).toBe(createdTicketId);
  });

  it("met a jour le statut d'un ticket", async () => {
    const response = await request(app)
      .put(`/api/tickets/${createdTicketId}`)
      .send({
        status: "closed",
      })
      .expect(200);

    expect(response.body.status).toBe("closed");
  });

  it("supprime un ticket", async () => {
    await request(app)
      .delete(`/api/tickets/${createdTicketId}`)
      .expect(200);

    await request(app)
      .get(`/api/tickets/${createdTicketId}`)
      .expect(404);
  });
});
