const express = require("express");
const cors = require("cors");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger_output.json"); // On importe le fichier généré

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const db = require("./models");

// Synchroniser la base de données avec les modeles de notre appli
db.sequelize.sync().catch((err) => {
  console.log("Failed to sync db: " + err.message);
});

// On sert la page Swagger sur /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Import routes
require("./routes/ticket.routes")(app);
require("./routes/user.routes")(app);

const PORT = process.env.PORT || 3000;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

module.exports = app;
