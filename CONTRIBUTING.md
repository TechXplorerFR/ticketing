# CONTRIBUTING - Ticketing

Bonjouer et merci pour votre participation à notre projet. Afin de contribuer à ce dernier, vous devrez être en connaissance de plusieurs consignes et conventions lister dans ce document.

## Branches

Chaque nouvelle fonction se doit d'avoir sa propre branche. Vous devrez donc en créer une sur votre repo local en suivant les conventions mentionné dans la section précédentes puis faire une Pull Request afin que votre travail soit récupérer par nos équipes.

Une fois votre travail terminé et votre branche fusionné dans la branche supérieure, elle sera alors supprimé car inutilisé.

Enfin, si vous créer une branche suite à une issue, cette dernière sera supprimé en même temps que la résolution de l'issue.

## Convention

Les conventions sont définit dans un adr que vous pouvez retrouver à ce [lien](./docs/adr/2026_03_11_-_14_20_30_conventions.md).

En voici un aperçu avec les conventions les plus importante :

| Casse      | Usage                                 |
| ---------- | ------------------------------------- |
| kebab-case | Création de branches                  |
| snake_case | Création de fichiers et de dossiers   |
| camelCase  | Création de fonctions et de variables |

Vous devez aussi garder à l'esprit la façon dont les commit doivent être efféctuer. \
Il faut que ces derniers soit concis et descriptif de vos changement !

Pensez également à commenter votre code afin que d'autres puissent le reprendre et le comprendre plus aisément.

## Architecture

Concernant l'architecture, elle doit suivre le plan suivant :

```mermaid
ticketing
    ├── docs
    │   ├── adr
    │   |   ├── 2026_03_11_-_14_20_30_conventions.md
    │   |   ├── 2026_03_11_-_14_21_30_choix_framework_backend.md
    │   |   └── 2026_03_11_-_14_21_50_choix_framework_frontend.md
    |   ├── specs
    |   |   ├── fucntional_specifications.md
    |   |   └── technical_specifications.md
    |   └── img
    |       └── screenshot_clone.png
    ├── src
    │   ├── backend
    │   │   ├── config
    │   │   │   └── db.config.js
    │   │   ├── controllers
    │   │   │   ├── auth.controller.js
    │   │   │   └── example.controller.js
    │   │   ├── middlewares
    │   │   │   ├── auth.middleware.js
    │   │   │   └── validation.middleware.js
    │   │   ├── models
    │   │   │   ├── example.model.js
    │   │   │   ├── index.js
    │   │   │   └── user.model.js
    │   │   ├── routes
    │   │   │   ├── auth.routes.js
    │   │   │   └── example.routes.js
    │   │   ├── tests
    │   │   │   ├── auth.routes.test.js
    │   │   │   └── example.routes.test.js
    │   │   ├── .env.example
    │   │   ├── jest.config.js
    │   │   ├── package.json
    │   │   ├── server.js
    │   │   └── swagger.js
    │   └── frontend
    │       ├── public
    │       │   └── vite.svg
    │       ├── src
    │       │   ├── assets
    │       │   │   └── react.svg
    │       │   ├── App.css
    │       │   ├── App.tsx
    │       │   ├── index.css
    │       │   └── main.tsx
    │       ├── .gitignore
    │       ├── eslint.config.js
    │       ├── index.html
    │       ├── package.json
    │       ├── tsconfig.app.json
    │       ├── tsconfig.json
    │       ├── tsconfig.node.json
    │       └── vite.config.ts
    ├── .gitignore
    ├── CONTRIBUTING.md
    └── README.md
```

## Pull Request

Enfin, pour les pull request, vous devez respecter les template prédéfini dans le repo et les compléter le plsu assidument possible.

Si vos modifications passent le pipeline CI/CD alors un membre de notre équipe fera une revue de votre code et l'ajoutera à la branche supérieur ou non en fonction de l'utilité de la fonction implémenté.

Dans le cas où votre PR aurait des erreurs, une issue vous sera attribué et il vous incombera de la fermé avatn qu'une autre revue ne soit entamé.

## Mot de fin

Prenez plaisir à travailler et respecter vos collaborateurs !
