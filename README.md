# 📅 EduSchedule Pro

> Système de gestion pédagogique — Emploi du temps, Pointage QR Code, Cahiers de texte & Vacations

**Institut Supérieur de Génie et d'Enseignement (ISGE) — Burkina Faso**  
Année universitaire 2025-2026 | Projet Informatique — Développement Web  
Encadrant : **Dr Wend-Panga Cédric BÉRÉ**

---

## 👥 Équipe de développement

| Nom | Rôle |
|-----|------|
| **SANGO Abdine David** | Développeur Full-Stack — Module Emploi du temps & Authentification & Tableau de bord |
| **HIEN Mwin Jessica** | Développeuse Full-Stack — Module Cahier de texte & Pointage QR |
| **MASBE Fidelia** | Développeuse Full-Stack — Module Vacation |

---

## 📋 Description du projet

**EduSchedule Pro** est une application web full-stack de gestion pédagogique développée avec **React.js** (frontend) et **PHP** (backend API REST). Elle permet de :

- Planifier et gérer les emplois du temps hebdomadaires
- Pointer les séances via QR Code sécurisé
- Tenir les cahiers de texte numériques avec signatures
- Calculer et valider les fiches de vacation des enseignants
- Suivre les statistiques pédagogiques en temps réel

---

## 🛠️ Technologies utilisées

| Couche | Technologie |
|--------|-------------|
| Frontend | React.js 18, Bootstrap 5, SheetJS |
| Backend | PHP 8.1, API REST |
| Base de données | MySQL 8.0 |
| Authentification | JWT (JSON Web Token) |
| Signatures | Signature Pad JS |
| QR Code | jsQR (scan), api.qrserver.com (génération) |
| Serveur local | WampServer 64 |

---

## 🏗️ Architecture du projet

```
eduschedule_pro/
├── frontend/                  # Application React
│   ├── public/
│   └── src/
│       ├── components/        # Composants réutilisables
│       │   ├── PrivateRoute.jsx
│       │   └── CreneauForm.jsx
│       ├── context/
│       │   └── AuthContext.jsx  # Gestion de l'authentification
│       ├── pages/             # Pages de l'application
│       │   ├── LoginPage.jsx
│       │   ├── DashboardAdmin.jsx
│       │   ├── DashboardEnseignant.jsx
│       │   ├── DashboardDelegue.jsx
│       │   ├── DashboardEtudiant.jsx
│       │   ├── EmploiTempsPage.jsx
│       │   ├── PointagePage.jsx
│       │   ├── CahierPage.jsx
│       │   ├── VacationPage.jsx
│       │   ├── ClassesPage.jsx
│       │   ├── EnseignantsPage.jsx
│       │   ├── EtudiantsPage.jsx
│       │   ├── MatieresPage.jsx
│       │   ├── SallesPage.jsx
│       │   └── RapportsPage.jsx
│       └── App.jsx            # Routing principal
│
└──└── backend/                   # API REST PHP
    ├── api/
    │   ├── auth.php
    │   ├── emploi_temps.php
    │   ├── pointages.php
    │   ├── cahiers.php
    │   └── vacations.php
    ├── config/
    │   ├── database.php
    │   └── constants.php
    ├── database/
    │   └── eduschedule_pro.sql  # Script SQL complet
    └── middleware/
        └── auth.php
```

---

## 👤 Acteurs et rôles

| Acteur | Rôle | Permissions |
|--------|------|-------------|
| **Administrateur** | Gestion globale | CRUD complet, paramètres système |
| **Enseignant** | Pointage et validation | Scan QR, signature séance, vacation |
| **Délégué de classe** | Cahier de texte | Saisie contenu, signature délégué |
| **Surveillant général** | Contrôle et supervision | Vérification fiches, rapports |
| **Responsable comptable** | Vacations | Validation finale, paiement |
| **Étudiant** | Consultation | Lecture seule — emploi du temps |

---

## 🚀 Installation et lancement

### Prérequis

- [WampServer](https://www.wampserver.com/) 3.x (PHP 8.1 + MySQL 8.0)
- [Node.js](https://nodejs.org/) 18+ et npm
- Navigateur moderne (Chrome, Firefox, Edge)

### Étape 1 — Cloner / copier le projet

```bash
# Copier le dossier dans le répertoire WampServer
C:\wamp64\www\eduschedule_pro\
```

### Étape 2 — Base de données

1. Démarrer WampServer
2. Ouvrir **phpMyAdmin** → `http://localhost/phpmyadmin`
3. Créer une base de données nommée `eduschedule_pro`
4. Importer le fichier SQL :
   ```
   backend/database/eduschedule_pro.sql
   ```

### Étape 3 — Configuration backend

Vérifier le fichier `backend/config/database.php` :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'eduschedule_pro');
define('DB_USER', 'root');
define('DB_PASS', '');
```

Vérifier le fichier `backend/config/constants.php` :

```php
define('JWT_SECRET', 'votre_secret_jwt');
define('JWT_EXPIRE', 86400); // 24 heures
define('CORS_ORIGIN', 'http://localhost:3000');
```

### Étape 4 — Frontend

```bash
cd C:\wamp64\www\eduschedule_pro\frontend
npm install
npm start
```

L'application sera disponible sur **http://localhost:3000**

---

## 🔑 Comptes de démonstration

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Administrateur | admin@eduschedule.bf | Admin1234! |
| Enseignant | c.bere@isge.bf | Admin1234! |
| Délégué | delegue.l1@eduschedule.bf | Admin1234! |
| Surveillant | surveillant@eduschedule.bf | Admin1234! |
| Comptable | comptable@eduschedule.bf | Admin1234! |
| Étudiant | etudiant@eduschedule.bf | Admin1234! |

---

## 📱 Fonctionnalités principales

### Module 1 — Emploi du temps
- ✅ Création et gestion hebdomadaire par classe
- ✅ Détection automatique des conflits (enseignant / salle)
- ✅ Duplication vers la semaine suivante
- ✅ Export PDF de l'emploi du temps
- ✅ Filtres dynamiques (enseignant, salle, matière)
- ✅ Gestion des jours fériés (Burkina Faso 2026)
- ✅ Génération de QR Code par séance

### Module 2 — Pointage QR Code
- ✅ Génération de QR Code sécurisé avec token
- ✅ Scan QR Code par l'enseignant (jsQR)
- ✅ Validation temporelle (expiration configurable)
- ✅ Pointage manuel par le surveillant
- ✅ Log complet des pointages

### Module 3 — Cahier de texte
- ✅ Saisie du contenu de séance par le délégué
- ✅ Signature numérique (canvas) du délégué et enseignant
- ✅ Workflow de validation (délégué → enseignant)
- ✅ Export PDF du cahier de texte
- ✅ Historique des séances

### Module 4 — Fiche de vacation
- ✅ Calcul automatique des heures et montants
- ✅ Chaîne de validation en 4 étapes
- ✅ Signatures numériques enseignant + surveillant
- ✅ Export PDF de la fiche comptable
- ✅ **Export Excel** (2 feuilles : récapitulatif + stats)

### Module 5 — Tableau de bord
- ✅ Graphiques évolution des séances par semaine
- ✅ Indicateurs heures planifiées vs réalisées
- ✅ Avancement des programmes par matière
- ✅ Alertes séances non pointées
- ✅ Derniers pointages et vacations

---

## 🗄️ Structure de la base de données

| Table | Description |
|-------|-------------|
| `utilisateurs` | Comptes de connexion avec rôles |
| `enseignants` | Référentiel des enseignants |
| `etudiants` | Référentiel des étudiants |
| `classes` | Référentiel des classes |
| `matieres` | Référentiel des matières |
| `salles` | Référentiel des salles |
| `emploi_temps` | Planning hebdomadaire par classe |
| `creneaux` | Créneaux de cours |
| `pointages` | Log des pointages QR |
| `cahiers_texte` | Cahiers de texte numériques |
| `vacations` | Fiches de vacation |

---

## 🔒 Sécurité

- Authentification par **JWT** (JSON Web Token)
- Vérification du rôle sur chaque endpoint PHP (`exigerRole()`)
- Protection des routes React par `PrivateRoute`
- Tokens QR Code avec expiration temporelle
- Hachage des mots de passe avec `password_hash()` (bcrypt)

---

## 📁 API Endpoints

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| POST | `/api/auth.php` | Connexion — retourne un JWT |
| GET | `/api/emploi_temps.php?id_classe=X` | Planning d'une classe |
| POST | `/api/emploi_temps.php?action=creer_enseignant` | Créer un enseignant |
| GET | `/api/pointages.php?action=generer_qr` | Générer un QR Code |
| POST | `/api/pointages.php?action=pointer` | Enregistrer un pointage |
| GET | `/api/vacations.php?action=liste` | Liste des vacations |
| POST | `/api/vacations.php?action=generer` | Générer une fiche |
| POST | `/api/cahiers.php?action=sauvegarder` | Sauvegarder un cahier |

---

## 📞 Contact

Pour toute question relative au projet :

- **SANGO Abdine David** — sangodavid939@gmail.com
- **HIEN Mwin Jessica** — jessicahien35@gmail.com
- **MASBE Fidelia** — masbefidelia3@gmail.com

---

*EduSchedule Pro — ITRST | Projet Informatique Développement Web — 2025-2026*
