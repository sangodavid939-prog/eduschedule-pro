# 📅 EduSchedule Pro

> Système de gestion pédagogique — Emploi du temps, Pointage QR Code, Cahiers de texte & Vacations

**Institut Supérieur de Génie et d'Enseignement (ISGE) — Burkina Faso**  
Année universitaire 2025-2026 | Projet Informatique — Développement Web  
Encadrant : **Dr Wend-Panga Cédric BÉRÉ**

---

## 👥 Équipe de développement

| Nom | Rôle |
|-----|------|
| **SANGO Abdine David** | Développeur Full-Stack — Module Emploi du temps & Authentification & Tableau de bord|
| **HIEN Mwin Jessica** | Développeuse Full-Stack — Module Cahier de texte & Pointage QR |
| **MASBE Fidelia** | Développeuse Full-Stack — Module Vacation|

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

### Frontend
| Package | Version | Utilisation |
|---------|---------|-------------|
| `react` | 18.2.0 | Framework principal |
| `react-dom` | 18.2.0 | Rendu DOM |
| `react-router-dom` | 7.14.1 | Navigation entre pages |
| `bootstrap` | 5.3.8 | Design et mise en page |
| `react-bootstrap` | 2.10.10 | Composants Bootstrap pour React |
| `axios` | 1.15.1 | Requêtes HTTP vers l'API |
| `chart.js` | 4.5.1 | Graphiques du tableau de bord |
| `react-chartjs-2` | 5.3.1 | Intégration Chart.js dans React |
| `recharts` | 3.8.1 | Graphiques alternatifs |
| `jspdf` | 4.2.1 | Génération de fichiers PDF |
| `jspdf-autotable` | 5.0.7 | Tableaux PDF automatiques |
| `jsqr` | 1.4.0 | Scan QR Code via caméra |
| `signature_pad` | 5.1.3 | Signatures numériques canvas |
| `xlsx` | 0.18.5 | Export Excel des vacations |

### Backend
| Technologie | Version | Utilisation |
|-------------|---------|-------------|
| PHP | 8.1 | API REST |
| MySQL | 8.0 | Base de données |
| JWT | — | Authentification sécurisée |
| WampServer | 3.3.x | Serveur local (Apache + PHP + MySQL) |

---

## 🏗️ Architecture du projet

```
eduschedule_pro/
├── README.md
├── frontend/                  # Application React
│   ├── public/
│   ├── .env                   # GENERATE_SOURCEMAP=false
│   └── src/
│       ├── components/
│       │   ├── PrivateRoute.jsx
│       │   └── CreneauForm.jsx
│       ├── context/
│       │   └── AuthContext.jsx
│       ├── pages/
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
│       │   ├── UtilisateursPage.jsx
│       │   ├── MatieresPage.jsx
│       │   ├── SallesPage.jsx
│       │   └── RapportsPage.jsx
│       └── App.jsx
│
└── backend/                   # API REST PHP
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
    │   └── eduschedule_pro.sql  # ← Script SQL complet à importer
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

### ⚠️ Important — Lire avant de commencer

> Le projet doit **obligatoirement** être placé dans le dossier :
> ```
> C:\wamp64\www\eduschedule_pro\
> ```
> Si vous changez le nom du dossier ou le chemin, le proxy React ne fonctionnera pas.

---

### Prérequis

| Logiciel | Version | Lien de téléchargement |
|----------|---------|----------------------|
| WampServer | 3.3.x 64-bit | [wampserver.com](https://www.wampserver.com/) |
| Node.js | 18.x ou 20.x | [nodejs.org](https://nodejs.org/) |
| Git | Dernière version | [git-scm.com](https://git-scm.com/) |
| VS Code | Dernière version | [code.visualstudio.com](https://code.visualstudio.com/) |
| Navigateur | Chrome ou Firefox | — |

---

### Étape 1 — Cloner le projet

```bash
cd C:\wamp64\www
git clone https://github.com/sangodavid939-prog/eduschedule-pro.git eduschedule_pro
```

> ⚠️ Le dossier doit s'appeler exactement `eduschedule_pro`

---

### Étape 2 — Démarrer WampServer

1. Lancer **WampServer** (icône dans la barre des tâches)
2. Attendre que l'icône devienne **verte** 🟢
3. Vérifier que **Apache** et **MySQL** sont démarrés

**Activer les extensions PHP requises :**
- Clic gauche sur l'icône WampServer
- **PHP** → **Extensions PHP**
- Vérifier que ces extensions sont cochées :
  - `php_pdo_mysql`
  - `php_mbstring`
  - `php_json`

---

### Étape 3 — Base de données

1. Ouvrir **phpMyAdmin** → `http://localhost/phpmyadmin`
   - Login : `root`
   - Mot de passe : *(laisser vide)*
2. Créer une base de données :
   - Cliquer **"Nouvelle base de données"**
   - Nom : `eduschedule_pro`
   - Interclassement : `utf8mb4_general_ci`
   - Cliquer **Créer**
3. Importer le script SQL :
   - Cliquer sur `eduschedule_pro`
   - Onglet **Importer**
   - Cliquer **Choisir un fichier**
   - Sélectionner : `backend/database/eduschedule_pro.sql`
   - Cliquer **Exécuter**

---

### Étape 4 — Configuration backend

Vérifier le fichier `backend/config/database.php` :

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'eduschedule_pro');
define('DB_USER', 'root');
define('DB_PASS', '');  // Laisser vide par défaut avec WampServer
```

Vérifier le fichier `backend/config/constants.php` :

```php
define('JWT_SECRET', 'eduschedule_secret_2026');
define('JWT_EXPIRE', 86400);
define('CORS_ORIGIN', 'http://localhost:3000');
```

---

### Étape 5 — Frontend

Ouvrir un terminal dans le dossier `frontend` :

```bash
cd C:\wamp64\www\eduschedule_pro\frontend

# Installer toutes les dépendances
npm install

# Lancer l'application
npm start
```

> L'application s'ouvre automatiquement sur **http://localhost:3000**

---

### Étape 6 — Fichier .env (supprimer les warnings)

Créer un fichier `.env` dans `frontend/` avec ce contenu :

```
GENERATE_SOURCEMAP=false
```

---

### ✅ Vérification — L'application fonctionne si :

- La page de connexion s'affiche sur `http://localhost:3000`
- WampServer est vert 🟢
- La base de données est importée
- `npm start` tourne dans le terminal

---

## 🔑 Comptes de démonstration

> Tous les comptes utilisent le même mot de passe : **`Admin1234!`**

| Rôle | Email |
|------|-------|
| Administrateur | admin@eduschedule.bf |
| Enseignant | c.bere@isge.bf |
| Délégué | delegue.l1@eduschedule.bf |
| Surveillant | surveillant@eduschedule.bf |
| Comptable | comptable@eduschedule.bf |
| Étudiant | etudiant@eduschedule.bf |

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
- ✅ Navigation semaine précédente / suivante

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
- ✅ Export Excel (récapitulatif + stats par enseignant)

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

## 📁 API Endpoints principaux

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

## ❓ Problèmes fréquents

**L'application ne se lance pas :**
- Vérifier que WampServer est vert 🟢
- Vérifier que le dossier s'appelle exactement `eduschedule_pro`

**Erreur de connexion à la base de données :**
- Vérifier que MySQL est démarré dans WampServer
- Vérifier que la base `eduschedule_pro` existe dans phpMyAdmin
- Vérifier les identifiants dans `backend/config/database.php`

**Page blanche ou erreur 401 :**
- Vérifier que `npm start` tourne dans le terminal
- Vider le cache du navigateur (Ctrl+Shift+R)

**npm install échoue :**
- Vérifier la version de Node.js : `node --version` (doit être 18.x ou 20.x)
- Supprimer le dossier `node_modules` et relancer `npm install`

---

## 📞 Contact

- **SANGO Abdine David** — sangodavid939@gmail.com
- **HIEN Mwin Jessica** —  jessicahien35@gmail.com
- **MASBE Fidelia —**   —  masbefidelia3@gmail.com

---

*EduSchedule Pro — ITRST | Projet Informatique Développement Web — 2025-2026*