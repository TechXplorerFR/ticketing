const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'API Ateliers',
    description: 'Documentation générée automatiquement pour notre API CRUD'
  },
  host: 'localhost:3000',
  schemes: ['http']
};

const outputFile = './swagger_output.json'; // Le fichier qui sera généré
const routes = ['./server.js']; // Le fichier principal de votre API qui contient vos routes

// Génération du fichier JSON
swaggerAutogen(outputFile, routes, doc);
