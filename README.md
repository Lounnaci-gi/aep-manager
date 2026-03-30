# AEP Manager - Système de Gestion des Travaux d'Eau

Cette application est un système de gestion complet pour les travaux d'eau (AEP), incluant la gestion des clients, des demandes de branchement, et des devis.

## Architecture du Projet

Le projet est divisé en deux parties :
- **Frontend** : Application React moderne avec Vite et TypeScript (Dossier racine).
- **Backend** : API REST avec Node.js, Express et MongoDB (Dossier `/backend`).

## Pré-requis

- **Node.js** (v18+)
- **MongoDB** (Local ou instance Atlas)

## Installation

1. **Installation du Frontend** :
   ```bash
   npm install
   ```

2. **Installation du Backend** :
   ```bash
   cd backend
   npm install
   cd ..
   ```

## Configuration

Configurez votre fichier `.env` à la racine du projet :
```env
# API Keys (Google Gemini)
GEMINI_API_KEY=votre_cle_ici

# MongoDB Configuration
MONGODB_URI=mongodb+srv://...
MONGODB_DB=GestionEau

# Frontend API URL
VITE_API_URL=http://localhost:5000/api
```

## Lancement

Pour lancer l'application, vous devez démarrer les deux services parallèlement :

1. **Démarrer le Backend** :
   ```bash
   cd backend
   npm start
   ```

2. **Démarrer le Frontend** :
   ```bash
   # Ouvrez un second terminal à la racine
   npm run dev
   ```

## Fonctionnalités Clés

- **Tableau de Bord** : Vue d'ensemble des statistiques et demandes en cours.
- **Gestion des Demandes** : Suivi rigoureux des demandes de branchement.
- **Gestion des Devis** : Génération et impression automatique de devis professionnels.
- **Sécurité** : Système d'authentification robuste avec blocage anti-bruteforce.
- **AI Integration** : Assistant IA intégré pour faciliter la saisie et l'analyse.
