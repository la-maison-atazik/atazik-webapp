# AtazikWebapp

Ce projet est une application web développée avec Angular, intégrant Firebase pour la gestion des données et Node.js pour les fonctions backend. Il est structuré pour favoriser la modularité, la réutilisation et la scalabilité.

## Prérequis

- Node.js (>= 18)
- npm (>= 9)
- Angular CLI
- Compte Firebase

## Installation

Clonez le dépôt puis installez les dépendances:

```bash
npm install
```

Pour les fonctions Firebase:

```bash
cd functions
npm install
```

## Démarrage du serveur de développement

Lancez l’application Angular:

```bash
ng serve
```

Accédez à `http://localhost:4200/`.

## Structure du projet

- `src/app/`: code principal Angular (features, core, shared)
	- `core/`: services, modèles, gardes, mappers, constantes
	- `features/`: modules fonctionnels (ex: app, sign-in, sign-up)
	- `shared/`: composants réutilisables, validateurs
- `shared/`: utilitaires, modèles et enums partagés entre le front et le back
- `functions/`: fonctions backend Node.js pour Firebase
	- `lib/`: code source des fonctions, utils, modèles, enums
- `public/`: ressources statiques (ex: favicon)
- `environments/`: configuration des environnements (dev, prod, staging)

## Compilation

Pour compiler l’application:

```bash
ng build
```

Les fichiers compilés seront placés dans le dossier `dist/`.

## Tests

Tests unitaires:

```bash
ng test
```

Tests end-to-end (à configurer selon vos besoins):

```bash
ng e2e
```

## Déploiement Firebase

Pour déployer sur Firebase:

```bash
firebase deploy
```

## Utilisation de Firebase Emulator Suite

Pour éviter d’utiliser un projet Firebase de production ou de staging lors du développement local, il est recommandé d’utiliser la Firebase Emulator Suite. Cela permet de simuler les services Firebase (Firestore, Auth, Functions, etc.) sur votre machine.

### Installation

Assurez-vous d’avoir le CLI Firebase:

```bash
npm install -g firebase-tools
```

### Configuration

Initialisez les émulateurs dans le dossier du projet:

```bash
firebase init emulators
```

Sélectionnez les services à émuler (Firestore, Auth, Functions, etc.) et configurez les ports selon vos besoins.

### Lancement des émulateurs

Démarrez la suite d’émulateurs:

```bash
firebase emulators:start
```

Les services Firebase seront accessibles localement (par défaut: Firestore sur le port 8080, Auth sur 9099, Functions sur 5001, etc.).

### Connexion de l’application Angular

Dans vos fichiers d’environnement (`src/environments/environment.ts`), configurez les endpoints Firebase pour pointer vers les émulateurs locaux. Exemple:

```typescript
export const environment = {
	production: false,
	firebase: {
		projectId: 'demo-project',
		appId: '...',
		// ...autres configs
		useEmulator: true
	}
};
```

Dans votre code Angular, utilisez les méthodes de la SDK Firebase pour connecter les services à l’émulateur, par exemple:

```typescript
import {connectFirestoreEmulator} from 'firebase/firestore';
import {getFirestore} from 'firebase/firestore';

const db = getFirestore();
connectFirestoreEmulator(db, 'localhost', 8080);
```

Faites de même pour Auth et Functions si nécessaire.

### Points d’attention

- Les données des émulateurs sont locales et ne sont pas synchronisées avec Firebase en ligne.
- Pensez à adapter vos scripts de test pour utiliser les émulateurs.
- Les règles de sécurité Firestore et Auth sont appliquées dans l’émulateur.

## Bonnes pratiques

- Utilisez les dossiers `shared/` pour mutualiser les modèles, enums et utilitaires entre le front et le back.
- Respectez la structure Angular: `core/`, `features/`, `shared/`.
- Les fonctions backend sont dans `functions/`.
- Les environnements sont configurés dans `src/environments/`.

## Ressources

- [Angular CLI](https://angular.dev/tools/cli)
- [Firebase](https://firebase.google.com/docs)
- [Node.js](https://nodejs.org/)

---

