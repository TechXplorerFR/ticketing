const express = require("express");
const cors = require("cors");
const compression = require("compression");
const helmet = require("helmet");
const RateLimit = require("express-rate-limit");
require("dotenv").config();
const swaggerUi = require("swagger-ui-express");
const swaggerDocument = require("./swagger_output.json"); // On importe le fichier généré


const app = express();

// Sécurité avec Helmet - désactivé en mode test
if (process.env.NODE_ENV !== "test") {
  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'", "'unsafe-inline'"],
          imgSrc: ["'self'", "data:", "validator.swagger.io"],
        },
      },
    })
  );
}

var corsOptions = {
  origin: "http://localhost:8080",
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter - désactivé en mode test
if (process.env.NODE_ENV !== "test") {
  const limiter = RateLimit({
    windowMs: 1 * 60 * 1000, 
    max: 20,
  });
  app.use(limiter);
}

app.use(compression());

const db = require("./models");

// Synchroniser la base de données avec les modeles de notre appli
db.sequelize.sync().catch((err) => {
  console.log("Failed to sync db: " + err.message);
});

// On sert la page Swagger sur /api-docs
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Import routes
require("./routes/auth.routes")(app);
require("./routes/example.routes")(app);

const PORT = process.env.PORT || 8080;

if (process.env.NODE_ENV !== "test") {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}.`);
  });
}

module.exports = app;
