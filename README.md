# README - Ticketing

## Description

Dans le cadre d'une évolution du service de notre entreprise, nous développons un module de gestion de tickets d'incidents.
L’objectif est de permettre aux utilisateurs de créer, consulter et suivre des tickets, et aux
techniciens de les mettre à jour ou de les clôturer.

## Installation

Afin d'installer notre projet sur votre machine, vous devez cloner le repo GitHub. Pour ce faire, allez sur le [repo](https://github.com/TechXplorerFR/ticketing) puis clickez sur le bouton code vert.

![clone depuis GitHub](./docs/img/screenshot_clone.png)

Une fois fait, ouvrez un terminal et créez un dossier pour y mettre le projet :

```bash
mkdir ticketing
cd ticketing
```

Ensuite, clonez le repo localement :

```bash
git clone https://github.com/TechXplorerFR/ticketing
```

Puis accédez-y avec la ligne suivante :

```bash
code .
```

Vous avez maintenant accès au projet en local. Il vous reste désormais plus qu'à télécharger les modules et extensions nécessaires pour pouvoir travailler dessus.

Vous aurez besoin des suivants :

| Nom     | Version Minimum | Lien de téléchargement                               |
| ------- | --------------- | ---------------------------------------------------- |
| Node.js | v20.19+         | <https://nodejs.org/en/download>                     |
| npm     | v7+             | <https://docs.npmjs.com/cli/v8/commands/npm-install> |

Vous pouvez les télécharger à la fois dans le dossier ``backend`` et dans le dossier ``frontend``.

Voici les lignes de codes nécessaire :

```bash
cd src/frontend
npm i
cd ../backend
npm i
```

Vous êtes maintenant prêt à vous lancer sur le projet, n'oubliez pas de passer par la section [contributing](#contributing) avant de commencer.

## Execution du code

Pour exécuter le code, exécutez les commandes suivantes dans deux terminaux distincts:

**Terminal 1:**

```bash
cd src/frontend
npm run build
npm run preview
```

**Terminal 2:**

```bash
cd src/backend
npm run dev
```

Vous pourrez accéder à l'application à l'adresse `http://localhost:4173`

## Usage

_Créer un ticket_ :

En arrivant sur la page de l'application, remplissez les différents champs requis et cliquez sur "Créer un ticket".

_Assigner un ticket_ :

Lors de la création d'un ticket, cliquer sur le menu déorulant d'assignation et choisissez à qui assigner la tâche.

_Assigner une priorité à un ticket_ :

Cette fonctionnalité n'est pas supportée par notre logiciel pour l'instant.

_Changer l'état d'un ticket_ :

Vous pouvez changer l'état d'un ticket en cliquant sur le bouton "Fermer" ou "Ouvrir" permettant d'effectuer l'action associée.

_Consulter ses tickets_ :

Vous pouvez consulter vos tickets en bas de la page, en mode lecture. Dans les autres modes, vous verrez l'ensemble des tickets contenus dans la base.

## Bugs Connus

Aucun bug connu n'a été recensé à ce jour. Vous pourrez les trouver dans l'onglet [Issues](https://github.com/TechXplorerFR/ticketing/issues) une fois qu'il y en aura.

## Versionning

Vous pouvez retrouver les différentes versions dans l'onglet [déploiement](https://github.com/TechXplorerFR/ticketing/releases) de GitHub.

Version actuelle : v0.0.0
Latest version : v0.0.0
Latest stable version : null

## Contributing

Pour contribuer à notre projet, vous pouvez regarder nos [Instructions de contribution](./CONTRIBUTING.md).

## Licence

Ce projet n'a pas de licence particulière.
