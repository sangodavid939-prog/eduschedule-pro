-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Hôte : 127.0.0.1:3306
-- Généré le : dim. 03 mai 2026 à 19:09
-- Version du serveur : 9.1.0
-- Version de PHP : 8.3.14

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Base de données : `eduschedule_pro`
--

-- --------------------------------------------------------

--
-- Structure de la table `cahiers_texte`
--

DROP TABLE IF EXISTS `cahiers_texte`;
CREATE TABLE IF NOT EXISTS `cahiers_texte` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_creneau` int UNSIGNED NOT NULL,
  `id_delegue` int UNSIGNED NOT NULL,
  `titre_cours` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `contenu_json` json DEFAULT NULL,
  `niveau_avancement` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `heure_fin_reelle` time DEFAULT NULL,
  `statut` enum('brouillon','en_cours','signe_delegue','cloture') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'brouillon',
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_cloture` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `un_cahier_creneau` (`id_creneau`),
  KEY `id_delegue` (`id_delegue`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `cahiers_texte`
--

INSERT INTO `cahiers_texte` (`id`, `id_creneau`, `id_delegue`, `titre_cours`, `contenu_json`, `niveau_avancement`, `heure_fin_reelle`, `statut`, `date_creation`, `date_cloture`) VALUES
(7, 66, 5, 'physique', '{\"points\": []}', 'chap2/12', '11:00:00', 'cloture', '2026-04-24 15:05:03', '2026-04-24 15:07:50'),
(8, 69, 5, 'algo', '{\"points\": []}', 'chapitre2', NULL, 'signe_delegue', '2026-04-26 18:03:31', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `classes`
--

DROP TABLE IF EXISTS `classes`;
CREATE TABLE IF NOT EXISTS `classes` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `niveau` enum('Licence 1','Licence 2','Licence 3','Master 1','Master 2','BTS','HND') COLLATE utf8mb4_unicode_ci NOT NULL,
  `annee_academique` varchar(9) COLLATE utf8mb4_unicode_ci NOT NULL,
  `effectif` tinyint UNSIGNED DEFAULT '30',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `classes`
--

INSERT INTO `classes` (`id`, `code`, `libelle`, `niveau`, `annee_academique`, `effectif`, `created_at`) VALUES
(1, 'L1-RST-2526', 'Licence 1 Réseaux et Télécoms', 'Licence 1', '2025-2026', 50, '2026-04-21 07:40:05'),
(2, 'L2-RST-2526', 'Licence 2 Réseaux et Télécoms', 'Licence 2', '2025-2026', 38, '2026-04-21 07:40:05'),
(3, 'L3-RST-2526', 'Licence 3 Réseaux et Télécoms', 'Licence 3', '2025-2026', 35, '2026-04-21 07:40:05'),
(4, 'M1-RST-2526', 'Master 1 Réseaux et Télécom', 'Master 1', '2025-2026', 25, '2026-04-21 07:43:00');

-- --------------------------------------------------------

--
-- Structure de la table `creneaux`
--

DROP TABLE IF EXISTS `creneaux`;
CREATE TABLE IF NOT EXISTS `creneaux` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_emploi_temps` int UNSIGNED NOT NULL,
  `id_matiere` int UNSIGNED NOT NULL,
  `id_enseignant` int UNSIGNED NOT NULL,
  `id_salle` int UNSIGNED NOT NULL,
  `jour` enum('lundi','mardi','mercredi','jeudi','vendredi','samedi') COLLATE utf8mb4_unicode_ci NOT NULL,
  `heure_debut` time NOT NULL,
  `heure_fin` time NOT NULL,
  `qr_token` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `qr_expire` datetime DEFAULT NULL,
  `qr_utilise` tinyint(1) NOT NULL DEFAULT '0',
  `qr_genere_le` datetime DEFAULT NULL,
  `statut` enum('planifie','en_cours','termine','annule') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'planifie',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_emploi_temps` (`id_emploi_temps`),
  KEY `id_matiere` (`id_matiere`),
  KEY `id_enseignant` (`id_enseignant`),
  KEY `id_salle` (`id_salle`)
) ENGINE=MyISAM AUTO_INCREMENT=94 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `creneaux`
--

INSERT INTO `creneaux` (`id`, `id_emploi_temps`, `id_matiere`, `id_enseignant`, `id_salle`, `jour`, `heure_debut`, `heure_fin`, `qr_token`, `qr_expire`, `qr_utilise`, `qr_genere_le`, `statut`, `created_at`) VALUES
(84, 1, 4, 3, 1, 'samedi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-23 11:16:11'),
(83, 5, 8, 3, 1, 'mercredi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'annule', '2026-04-21 14:04:50'),
(82, 1, 4, 5, 3, 'mardi', '15:00:00', '17:00:00', NULL, NULL, 0, NULL, 'annule', '2026-04-21 11:34:57'),
(81, 1, 2, 2, 5, 'mardi', '15:00:00', '17:00:00', NULL, NULL, 0, NULL, 'annule', '2026-04-21 11:33:28'),
(80, 2, 1, 1, 3, 'lundi', '08:00:00', '10:00:00', 'ODB8MTc3NzI4MTI2MnxkZGMwMzhhOTY1MGExMjkzYjgxNjNhNDFhOWU4ZmE3YTQ1NDk4MmRhYmY1MWY4NGM4NWNmMTNlMjJlNTQwOTg2', '2026-04-27 08:15:00', 0, '2026-04-27 09:14:22', 'annule', '2026-04-21 11:03:35'),
(79, 2, 2, 2, 2, 'lundi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'annule', '2026-04-21 11:03:35'),
(78, 2, 3, 3, 3, 'mardi', '08:00:00', '10:00:00', 'Nzh8MTc3NzUzNjA5OHwzYTVmMDJmNTE4YjcyZTdlNzNkMWEzNWQxNWE2YmI2NDRmYjdjNzZiNjM2MDVhZTFiZjI3YTIxM2Y2YjRkMzUw', '2026-04-27 08:15:00', 0, '2026-04-30 08:01:38', 'planifie', '2026-04-21 11:03:35'),
(77, 2, 4, 4, 3, 'mardi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'annule', '2026-04-21 11:03:35'),
(76, 2, 5, 5, 4, 'mercredi', '08:00:00', '10:00:00', 'NzZ8MTc3NzUzNjA4N3w2NzYzOGYyN2FlMjUyZDg1ZTVjYzgxOGIyMWFjNjg2NDg0ZmUyOWE3MWI3OWVmN2U0ODVmYmM5Njk2M2FmMjg3', '2026-04-27 08:15:00', 0, '2026-04-30 08:01:27', 'planifie', '2026-04-21 11:03:35'),
(75, 2, 6, 3, 2, 'jeudi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'annule', '2026-04-21 11:03:35'),
(74, 2, 7, 5, 3, 'jeudi', '10:30:00', '12:30:00', 'NzR8MTc3NzUzNjM2MnxmMzNkMzY2NmJmMjMwYjU1YWVkMzAyMTBiY2FlOTU4ZDQxYWMxY2JmM2YxOTdjOTk4YTY5YWI5NGVjYzIxMzIw', '2026-04-27 10:45:00', 0, '2026-04-30 08:06:02', 'planifie', '2026-04-21 11:03:35'),
(73, 2, 8, 4, 2, 'vendredi', '08:00:00', '10:00:00', NULL, NULL, 0, '2026-04-23 16:51:07', 'planifie', '2026-04-21 11:03:35'),
(72, 1, 8, 4, 2, 'vendredi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 11:01:49'),
(16, 2, 0, 0, 0, 'lundi', '14:00:00', '18:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(17, 2, 0, 0, 0, 'lundi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(18, 2, 1, 0, 0, 'mardi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(19, 2, 0, 0, 0, 'mardi', '16:30:00', '18:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(20, 2, 0, 0, 0, 'mercredi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(21, 2, 0, 0, 0, 'jeudi', '10:00:00', '14:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(22, 2, 0, 0, 3, 'jeudi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(23, 2, 0, 0, 3, 'vendredi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(24, 2, 0, 0, 0, 'mercredi', '14:00:00', '16:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(25, 2, 0, 0, 0, 'samedi', '08:00:00', '12:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(26, 2, 1, 0, 3, 'lundi', '09:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(27, 2, 0, 0, 0, 'lundi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(28, 2, 0, 0, 0, 'lundi', '09:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:28:05'),
(29, 2, 6, 3, 2, 'mardi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'annule', '2026-04-21 10:28:05'),
(30, 3, 0, 0, 0, 'lundi', '14:00:00', '18:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(31, 3, 0, 0, 0, 'lundi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(32, 3, 1, 0, 0, 'mardi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(33, 3, 0, 0, 0, 'mardi', '16:30:00', '18:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(34, 3, 0, 0, 0, 'mercredi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(35, 3, 0, 0, 0, 'jeudi', '10:00:00', '14:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(36, 3, 0, 0, 3, 'jeudi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(37, 3, 0, 0, 3, 'vendredi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(38, 3, 0, 0, 0, 'mercredi', '14:00:00', '16:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(39, 3, 0, 0, 0, 'samedi', '08:00:00', '12:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(40, 3, 1, 0, 3, 'lundi', '09:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(41, 3, 0, 0, 0, 'lundi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(42, 3, 0, 0, 0, 'lundi', '09:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(43, 3, 6, 3, 4, 'mardi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:38:52'),
(44, 4, 0, 0, 0, 'lundi', '14:00:00', '18:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(45, 4, 0, 0, 0, 'lundi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(46, 4, 1, 0, 0, 'mardi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(47, 4, 0, 0, 0, 'mardi', '16:30:00', '18:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(48, 4, 0, 0, 0, 'mercredi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(49, 4, 0, 0, 0, 'jeudi', '10:00:00', '14:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(50, 4, 0, 0, 3, 'jeudi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(51, 4, 0, 0, 3, 'vendredi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(52, 4, 0, 0, 0, 'mercredi', '14:00:00', '16:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(53, 4, 0, 0, 0, 'samedi', '08:00:00', '12:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(54, 4, 1, 0, 3, 'lundi', '09:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(55, 4, 0, 0, 0, 'lundi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(56, 4, 0, 0, 0, 'lundi', '09:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 10:51:32'),
(57, 4, 6, 3, 4, 'mardi', '08:00:00', '10:00:00', 'NTd8MTc3NzMwMzkwNXxjMWJmOGY4MWQxYjI4NDFlZTZiN2Q4YjU3MmJiYmI3N2I3NzMyNzg4M2MwZDExOGZjODdiNjg0YmM5ZWZhOTNk', '2026-05-11 08:15:00', 0, '2026-04-27 15:31:45', 'planifie', '2026-04-21 10:51:32'),
(71, 1, 7, 5, 3, 'jeudi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 11:01:49'),
(70, 1, 6, 3, 2, 'jeudi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 11:01:49'),
(69, 1, 5, 5, 4, 'mercredi', '08:00:00', '10:00:00', NULL, '2026-04-26 18:32:13', 0, '2026-04-26 18:02:13', 'en_cours', '2026-04-21 11:01:49'),
(68, 1, 4, 4, 3, 'mardi', '10:30:00', '12:30:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 11:01:49'),
(67, 1, 3, 3, 2, 'mardi', '08:00:00', '14:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-21 11:01:49'),
(66, 1, 2, 3, 1, 'lundi', '10:00:00', '11:00:00', NULL, '2026-04-24 15:34:38', 0, '2026-04-24 15:04:38', 'termine', '2026-04-21 11:01:49'),
(65, 1, 4, 3, 1, 'lundi', '10:00:00', '11:00:00', NULL, NULL, 0, '2026-04-23 16:48:25', 'planifie', '2026-04-21 11:01:49'),
(85, 2, 4, 3, 1, 'samedi', '08:00:00', '10:00:00', NULL, NULL, 0, NULL, 'annule', '2026-04-26 18:33:17'),
(91, 2, 3, 3, 2, 'mardi', '08:00:00', '14:00:00', NULL, NULL, 0, NULL, 'planifie', '2026-04-26 18:33:17'),
(92, 2, 2, 3, 1, 'lundi', '10:00:00', '11:00:00', NULL, NULL, 0, NULL, 'annule', '2026-04-26 18:33:17'),
(93, 2, 4, 3, 1, 'lundi', '10:00:00', '11:00:00', NULL, NULL, 0, NULL, 'annule', '2026-04-26 18:33:17');

-- --------------------------------------------------------

--
-- Structure de la table `emploi_temps`
--

DROP TABLE IF EXISTS `emploi_temps`;
CREATE TABLE IF NOT EXISTS `emploi_temps` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_classe` int UNSIGNED NOT NULL,
  `semaine_debut` date NOT NULL,
  `statut_publication` enum('brouillon','publie','archive') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'brouillon',
  `cree_par` int UNSIGNED NOT NULL,
  `date_creation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_modification` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_classe_semaine` (`id_classe`,`semaine_debut`),
  KEY `cree_par` (`cree_par`)
) ENGINE=MyISAM AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `emploi_temps`
--

INSERT INTO `emploi_temps` (`id`, `id_classe`, `semaine_debut`, `statut_publication`, `cree_par`, `date_creation`, `date_modification`) VALUES
(1, 1, '2026-04-20', 'publie', 1, '2026-04-21 09:11:32', '2026-04-21 09:11:32'),
(2, 1, '2026-04-27', 'publie', 1, '2026-04-21 10:28:05', '2026-04-21 10:28:05'),
(3, 1, '2026-05-04', 'publie', 1, '2026-04-21 10:38:52', '2026-04-21 10:38:52'),
(4, 1, '2026-05-11', 'publie', 1, '2026-04-21 10:51:32', '2026-04-21 10:51:32'),
(5, 2, '2026-04-20', 'publie', 1, '2026-04-21 14:04:50', '2026-04-21 14:04:50');

-- --------------------------------------------------------

--
-- Structure de la table `enseignants`
--

DROP TABLE IF EXISTS `enseignants`;
CREATE TABLE IF NOT EXISTS `enseignants` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `matricule` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `specialite` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('permanent','vacataire') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'vacataire',
  `taux_horaire` decimal(10,2) NOT NULL DEFAULT '5000.00',
  `grade` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `matricule` (`matricule`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `enseignants`
--

INSERT INTO `enseignants` (`id`, `matricule`, `nom`, `prenom`, `email`, `telephone`, `specialite`, `statut`, `taux_horaire`, `grade`, `actif`, `created_at`) VALUES
(1, 'ENS-001', 'BERE', 'Wend-Panga Cedric', 'c.bere@isge.bf', '', 'Développement Web', 'permanent', 8000.00, 'Docteur', 1, '2026-04-21 07:40:05'),
(2, 'ENS-002', 'OUEDRAOGO', 'Issa', 'i.ouedraogo@isge.bf', NULL, 'Algorithmique', 'permanent', 7500.00, 'Maitre-Assistant', 1, '2026-04-21 07:40:05'),
(3, 'ENS-003', 'KABORE', 'Fatimata', 'f.kabore@isge.bf', NULL, 'Bases de Données', 'vacataire', 6000.00, 'Charge de Cours', 1, '2026-04-21 07:40:05'),
(4, 'ENS-004', 'SAWADOGO', 'Boureima', 'b.sawadogo@isge.bf', '', 'Sécurité Réseaux', 'vacataire', 6500.00, 'Charge de Cours', 1, '2026-04-21 07:40:05'),
(5, 'ENS-006', 'ZONGO', 'Marie-Claire', 'm.zongo@isge.bf', '', 'Systèmes Exploitation', 'vacataire', 6500.00, 'Charge de Cours', 1, '2026-04-21 07:40:05'),
(6, 'QAA-774', 'TONE', 'nelly', 'tone@gmail.com', '72174714', 'systeme de base de donne', 'permanent', 5000.00, 'Maitres', 1, '2026-04-22 17:54:48'),
(7, 'QAS-56', 'KONATE', 'yacine', 'kon@gmail.com', '', 'Electricite', 'vacataire', 6000.00, 'ASSISTANT', 1, '2026-04-22 17:58:09'),
(8, '2225478', 'HIEN', 'Jessica', 'hie45@gmail.com', '00254465', 'anglais', 'vacataire', 6000.00, 'maitre', 0, '2026-04-23 11:35:27'),
(9, '55565', 'medmdh', 'xgts', 'jdggdx@mm', '', 'francais', 'vacataire', 6000.00, 'maitre', 0, '2026-04-23 11:37:34'),
(10, '222', 'leo', 'messi', 'leo@55', '', 'football', 'vacataire', 6000.00, 'goat', 1, '2026-04-23 11:53:46'),
(11, '665', 'abd', 'mos', 'ab@55', '', 'foot', 'permanent', 6000.00, 'prof', 1, '2026-04-23 12:00:05');

-- --------------------------------------------------------

--
-- Structure de la table `etudiants`
--

DROP TABLE IF EXISTS `etudiants`;
CREATE TABLE IF NOT EXISTS `etudiants` (
  `id` int NOT NULL AUTO_INCREMENT,
  `matricule` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `nom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `prenom` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `telephone` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT '',
  `id_classe` int NOT NULL,
  `actif` tinyint(1) DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `id_classe` (`id_classe`)
) ENGINE=MyISAM AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `etudiants`
--

INSERT INTO `etudiants` (`id`, `matricule`, `nom`, `prenom`, `email`, `telephone`, `id_classe`, `actif`, `created_at`) VALUES
(1, '254', 'Sango', 'David', 'etudiant@eduschedule.bf', '06968689', 1, 1, '2026-04-28 16:06:13');

-- --------------------------------------------------------

--
-- Structure de la table `logs_activite`
--

DROP TABLE IF EXISTS `logs_activite`;
CREATE TABLE IF NOT EXISTS `logs_activite` (
  `id` bigint UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_utilisateur` int UNSIGNED DEFAULT NULL,
  `action` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `details_json` json DEFAULT NULL,
  `ip` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `user_agent` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `date_heure` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_utilisateur` (`id_utilisateur`),
  KEY `idx_action` (`action`),
  KEY `idx_date` (`date_heure`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `matieres`
--

DROP TABLE IF EXISTS `matieres`;
CREATE TABLE IF NOT EXISTS `matieres` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `libelle` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `volume_horaire_total` smallint UNSIGNED NOT NULL DEFAULT '30',
  `coefficient` tinyint UNSIGNED NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `matieres`
--

INSERT INTO `matieres` (`id`, `code`, `libelle`, `volume_horaire_total`, `coefficient`, `created_at`) VALUES
(1, 'INF101', 'Algorithmique et Programmation', 45, 3, '2026-04-21 07:40:05'),
(2, 'INF201', 'Développement Web', 30, 2, '2026-04-21 07:40:05'),
(3, 'RST101', 'Réseaux Informatiques', 45, 3, '2026-04-21 07:40:05'),
(4, 'BDD101', 'Bases de Données', 30, 2, '2026-04-21 07:40:05'),
(5, 'SYS101', 'Systèmes d Exploitation', 30, 2, '2026-04-21 07:40:05'),
(6, 'RST201', 'Administration Systèmes', 30, 2, '2026-04-21 07:43:00'),
(7, 'MAT101', 'Mathématiques Informatique', 30, 3, '2026-04-21 07:43:00'),
(8, 'SEC201', 'Sécurité des Réseaux', 30, 3, '2026-04-21 07:43:00');

-- --------------------------------------------------------

--
-- Structure de la table `pointages`
--

DROP TABLE IF EXISTS `pointages`;
CREATE TABLE IF NOT EXISTS `pointages` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_creneau` int UNSIGNED NOT NULL,
  `id_enseignant` int UNSIGNED NOT NULL,
  `heure_pointage_reelle` datetime NOT NULL,
  `ip_source` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_utilise` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `statut` enum('valide','retard','invalide','expire') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'valide',
  `ecart_minutes` smallint DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `un_pointage_creneau` (`id_creneau`),
  KEY `id_enseignant` (`id_enseignant`)
) ENGINE=MyISAM AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `pointages`
--

INSERT INTO `pointages` (`id`, `id_creneau`, `id_enseignant`, `heure_pointage_reelle`, `ip_source`, `token_utilise`, `statut`, `ecart_minutes`, `created_at`) VALUES
(7, 66, 3, '2026-04-24 15:05:03', '::1', 'NjZ8MTc3NzA0MzA3OHxmMzRjZDZhMmRiYjFlNTk0NTZhNGRmNDVhZWYzNGRjZTRhOGQ5ZDUyOGM3YWIxNzljNzlkZGMwZGE5NTA1MWEz', 'valide', 0, '2026-04-24 15:05:03'),
(8, 69, 5, '2026-04-26 18:03:31', '::1', 'Njl8MTc3NzIyNjUzM3wzYmRhMmY4Nzc0OGQ4OTU1NTI2NDAwMjRlNjU5MzY2MTNlYWU0Nzg2Mjk4ZjI0YTllZjM1ODVhOWJjNWIyOTdm', 'valide', 0, '2026-04-26 18:03:31');

-- --------------------------------------------------------

--
-- Structure de la table `salles`
--

DROP TABLE IF EXISTS `salles`;
CREATE TABLE IF NOT EXISTS `salles` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `code` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `capacite` smallint UNSIGNED NOT NULL DEFAULT '50',
  `equipements` text COLLATE utf8mb4_unicode_ci,
  `batiment` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `disponible` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `code` (`code`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `salles`
--

INSERT INTO `salles` (`id`, `code`, `capacite`, `equipements`, `batiment`, `disponible`, `created_at`) VALUES
(1, 'AMPHI-Ac', 1208, 'Vidéoprojecteur, Climatisation', 'Bâtiment Principal', 0, '2026-04-21 07:40:05'),
(2, 'SALLE-101', 45, 'Tableau blanc, Vidéoprojecteur', 'Bâtiment A', 1, '2026-04-21 07:40:05'),
(3, 'SALLE-102', 75, 'Tableau blanc', 'Bâtiment A', 1, '2026-04-21 07:40:05'),
(4, 'LABO-INFO', 30, 'Ordinateurs, Internet', 'Bâtiment Informatique', 1, '2026-04-21 07:40:05'),
(7, 'salle SANGO', 75, '', 'batiment ouest', 1, '2026-04-30 19:18:47');

-- --------------------------------------------------------

--
-- Structure de la table `signatures`
--

DROP TABLE IF EXISTS `signatures`;
CREATE TABLE IF NOT EXISTS `signatures` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cahier` int UNSIGNED NOT NULL,
  `type_signataire` enum('delegue','enseignant') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_utilisateur` int UNSIGNED NOT NULL,
  `signature_base64` mediumtext COLLATE utf8mb4_unicode_ci NOT NULL,
  `horodatage` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `ip_source` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `un_signature_type` (`id_cahier`,`type_signataire`),
  KEY `id_utilisateur` (`id_utilisateur`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `signatures`
--

INSERT INTO `signatures` (`id`, `id_cahier`, `type_signataire`, `id_utilisateur`, `signature_base64`, `horodatage`, `ip_source`) VALUES
(13, 7, 'delegue', 5, 'data:image/png;base64,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', '2026-04-24 15:05:55', '::1'),
(14, 7, 'enseignant', 4, 'data:image/png;base64,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', '2026-04-24 15:07:50', '::1'),
(15, 8, 'delegue', 5, 'data:image/png;base64,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', '2026-04-26 18:13:29', '::1');

-- --------------------------------------------------------

--
-- Structure de la table `travaux_demandes`
--

DROP TABLE IF EXISTS `travaux_demandes`;
CREATE TABLE IF NOT EXISTS `travaux_demandes` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_cahier` int UNSIGNED NOT NULL,
  `description` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `date_limite` date DEFAULT NULL,
  `type` enum('devoir','exercice','projet','lecture','autre') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'devoir',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `id_cahier` (`id_cahier`)
) ENGINE=MyISAM DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Structure de la table `utilisateurs`
--

DROP TABLE IF EXISTS `utilisateurs`;
CREATE TABLE IF NOT EXISTS `utilisateurs` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `email` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `mot_de_passe_hash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `role` enum('administrateur','enseignant','delegue','surveillant','comptable','etudiant') COLLATE utf8mb4_unicode_ci NOT NULL,
  `id_lien` int UNSIGNED DEFAULT NULL,
  `nom_affichage` varchar(160) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `actif` tinyint(1) NOT NULL DEFAULT '1',
  `token_reset` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `token_reset_exp` datetime DEFAULT NULL,
  `dernier_login` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`)
) ENGINE=MyISAM AUTO_INCREMENT=16 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `utilisateurs`
--

INSERT INTO `utilisateurs` (`id`, `email`, `mot_de_passe_hash`, `role`, `id_lien`, `nom_affichage`, `actif`, `token_reset`, `token_reset_exp`, `dernier_login`, `created_at`) VALUES
(1, 'admin@eduschedule.bf', '$2y$10$H/f6k8NRo1vYTXoHzUumy.QNBRgDxAGhidkQdloHZjJmI96ACbIx2', 'administrateur', NULL, 'Administrateur', 1, NULL, NULL, '2026-05-03 15:53:05', '2026-04-21 07:40:05'),
(2, 'c.bere@isge.bf', '$2y$10$.Ky3Pybg/ZHPHrDgdYmRtugbz8M0fQexfOh6yGM1.WlNIMMIobNOO', 'enseignant', 1, 'Wend-Panga Cedric BERE', 1, NULL, NULL, '2026-05-03 19:02:54', '2026-04-21 07:40:05'),
(3, 'i.ouedraogo@isge.bf', '$2y$10$H/f6k8NRo1vYTXoHzUumy.QNBRgDxAGhidkQdloHZjJmI96ACbIx2', 'enseignant', 2, 'Issa OUEDRAOGO', 1, NULL, NULL, NULL, '2026-04-21 07:40:05'),
(4, 'f.kabore@isge.bf', '$2y$10$H/f6k8NRo1vYTXoHzUumy.QNBRgDxAGhidkQdloHZjJmI96ACbIx2', 'enseignant', 3, 'Fatimata KABORE', 1, NULL, NULL, '2026-04-28 09:41:16', '2026-04-21 07:40:05'),
(5, 'delegue.l1@eduschedule.bf', '$2y$10$H/f6k8NRo1vYTXoHzUumy.QNBRgDxAGhidkQdloHZjJmI96ACbIx2', 'delegue', NULL, 'Délégué L1-RST', 1, NULL, NULL, '2026-05-03 19:02:14', '2026-04-21 07:40:05'),
(6, 'delegue.l2@eduschedule.bf', '$2y$10$H/f6k8NRo1vYTXoHzUumy.QNBRgDxAGhidkQdloHZjJmI96ACbIx2', 'delegue', NULL, 'Délégué L2-RST', 1, NULL, NULL, '2026-04-27 15:33:46', '2026-04-21 07:40:05'),
(7, 'surveillant@eduschedule.bf', '$2y$10$H/f6k8NRo1vYTXoHzUumy.QNBRgDxAGhidkQdloHZjJmI96ACbIx2', 'surveillant', NULL, 'Surveillant Général', 1, NULL, NULL, '2026-05-03 08:23:41', '2026-04-21 07:40:05'),
(8, 'comptable@eduschedule.bf', '$2y$10$H/f6k8NRo1vYTXoHzUumy.QNBRgDxAGhidkQdloHZjJmI96ACbIx2', 'comptable', NULL, 'Responsable Comptable', 1, NULL, NULL, '2026-04-30 21:39:55', '2026-04-21 07:40:05'),
(9, 'b.sawadogo@isge.bf', '$2y$10$eD14KtVjxPQARts8giJ/heeY758RCY/NWDEkWIddvzb.KXqYZkLZa', 'enseignant', 4, 'Boureima SAWADOGO', 1, NULL, NULL, '2026-04-23 16:56:18', '2026-04-23 11:30:20'),
(10, 'm.zongo@isge.bf', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enseignant', 5, 'Marie-Claire ZONGO', 1, NULL, NULL, '2026-04-26 18:03:20', '2026-04-23 11:30:20'),
(11, 'tone@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enseignant', 6, 'nelly TONE', 1, NULL, NULL, NULL, '2026-04-23 11:30:20'),
(12, 'kon@gmail.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'enseignant', 7, 'yacine KONATE', 1, NULL, NULL, '2026-04-23 11:30:56', '2026-04-23 11:30:20'),
(13, 'leo@55', '$2y$10$Yodcmy8uaNzoDg8OcsEsOu8odNK3y25X4tM942FS9vMVs85yAawFG', 'enseignant', 10, 'messi leo', 1, NULL, NULL, '2026-04-23 11:54:06', '2026-04-23 11:53:46'),
(14, 'ab@55', '$2y$10$qehOh6CmkrhC.rsu6ILAnO9bwZAtZtzCY2w3/wUSgRUKwFc/duHRK', 'enseignant', 11, 'mos abd', 1, NULL, NULL, NULL, '2026-04-23 12:00:05'),
(15, 'etudiant@eduschedule.bf', '$2y$10$kHkRmhz4GcOLUlfxPrRG7e9GRFqoUbWPg6FhNhykG8tX8O8X6o5n2', 'etudiant', 1, 'David Sango', 1, NULL, NULL, '2026-05-03 19:02:06', '2026-04-28 16:06:13');

-- --------------------------------------------------------

--
-- Structure de la table `vacations`
--

DROP TABLE IF EXISTS `vacations`;
CREATE TABLE IF NOT EXISTS `vacations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_enseignant` int UNSIGNED NOT NULL,
  `mois` tinyint UNSIGNED NOT NULL,
  `annee` smallint UNSIGNED NOT NULL,
  `montant_brut` decimal(12,2) DEFAULT '0.00',
  `retenues` decimal(12,2) DEFAULT '0.00',
  `montant_net` decimal(12,2) DEFAULT '0.00',
  `statut` enum('generee','signee_enseignant','visee_surveillant','approuvee','payee') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'generee',
  `date_generation` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `date_paiement` date DEFAULT NULL,
  `observations` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  UNIQUE KEY `un_vacation_mois` (`id_enseignant`,`mois`,`annee`)
) ENGINE=MyISAM AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vacations`
--

INSERT INTO `vacations` (`id`, `id_enseignant`, `mois`, `annee`, `montant_brut`, `retenues`, `montant_net`, `statut`, `date_generation`, `date_paiement`, `observations`) VALUES
(4, 3, 4, 2026, 6000.00, 0.00, 6000.00, 'payee', '2026-04-24 15:08:08', '2026-04-24', NULL);

-- --------------------------------------------------------

--
-- Structure de la table `vacation_lignes`
--

DROP TABLE IF EXISTS `vacation_lignes`;
CREATE TABLE IF NOT EXISTS `vacation_lignes` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_vacation` int UNSIGNED NOT NULL,
  `id_creneau` int UNSIGNED NOT NULL,
  `duree_heures` decimal(5,2) NOT NULL,
  `taux` decimal(10,2) NOT NULL,
  `montant` decimal(12,2) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `id_vacation` (`id_vacation`),
  KEY `id_creneau` (`id_creneau`)
) ENGINE=MyISAM AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `vacation_lignes`
--

INSERT INTO `vacation_lignes` (`id`, `id_vacation`, `id_creneau`, `duree_heures`, `taux`, `montant`) VALUES
(7, 4, 66, 1.00, 6000.00, 6000.00);

-- --------------------------------------------------------

--
-- Structure de la table `validations`
--

DROP TABLE IF EXISTS `validations`;
CREATE TABLE IF NOT EXISTS `validations` (
  `id` int UNSIGNED NOT NULL AUTO_INCREMENT,
  `id_vacation` int UNSIGNED NOT NULL,
  `id_validateur` int UNSIGNED NOT NULL,
  `role_validateur` enum('enseignant','surveillant','comptable') COLLATE utf8mb4_unicode_ci NOT NULL,
  `visa_base64` mediumtext COLLATE utf8mb4_unicode_ci,
  `date_validation` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `commentaire` text COLLATE utf8mb4_unicode_ci,
  PRIMARY KEY (`id`),
  KEY `id_vacation` (`id_vacation`),
  KEY `id_validateur` (`id_validateur`)
) ENGINE=MyISAM AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Déchargement des données de la table `validations`
--

INSERT INTO `validations` (`id`, `id_vacation`, `id_validateur`, `role_validateur`, `visa_base64`, `date_validation`, `commentaire`) VALUES
(16, 4, 4, 'enseignant', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAa4AAAC0CAYAAADMz8jTAAAQAElEQVR4AeydCfwVVRXHzyXLFFQSFzQ1LAtRCRIzLUtQXMBS3AqkFJeUSsPUXFIJMsNcUVK0XFBJtNAIdyVFtFKywFxIW0RDW8QyCdM0yO/N+TcMb/s/5s3cmffz4/zfvFnunPnex5w5yz23y3L9JwIiIAIiIAIFItDF9J8IiIAIiIAIFIiAFFeBOqv0ouoGRUAERKABAlJcDUDSISIgAiIgAuEQkOIKpy8kiQiIQDgEJEnABKS4Au4ciSYCIiACIrAyASmulZloiwiIgAiIQMAE2k5xBdwXEk0EREAERKABAlJcDUDSISIgAiIgAuEQkOIKpy8kSdsR0A2LgAg0Q0CKqxlqOkcEREAERCA3AlJcuaHXhUVABEQgHAJFkkSKq0i9JVlFQAREQARMiks/AhEQAREQgUIRkOIqVHc1IaxOEQEREIGSEZDiKlmH6nZEQAREoOwEpLjK3sO6PxEIh4AkEYFUCEhxpYJRjYiACIiACGRFQIorK9K6jgiIgAhkRGDWrFl28cUX29e+9jXbddddbauttrLu3bubc8623nrrjKRo3WVSUVytE08ti4AIiIAI1CJw11132WmnnWaDBg3yisk5Z7vttpsdffTRNmHCBLvnnntswYIF9o9//MM388QTT9ijjz7q14v6R4qrqD0nuUVABNqOwCOPPGJjxoyxj3/84x1Kao899rAzzzzTZs+e3RCPDTbYwPr27WtF/k+Kq8i9J9krENAmESgPgVdffdWuueYaO/zww61Pnz7Wv39/u+iii+yBBx6oeZMcO3LkSPv6179uU6ZM8YqNE3AT3nDDDawWepHiKnT3SXgREIGyEVi8eLGhXIYMGWJrrLGGHXLIIXbllVfab37zm5Vudd1117WBAwfaKaecYt/97nft8ccft+XLlxvuwKlTp9pRRx1lTz/9tJ166ql24IEH2ne+8x1//EoNFWyDFFfBOkziioAIFIdAZyQlVoWVtP7669vw4cPtjjvuWOl0LKbPf/7zduutt9pzzz1nL774ot177732rW99y9hOEkb8pOOOO87Gjx9vp59+uu27776lUFrcnxQXFLSIgAiIQA4EUDxYSh/72MeMWNV11123ghQbbrihjRgxwmbMmGEvvfSSPfbYY96yGjp0qG288cYrHJv88tBDD9n111/vjzviiCN8O8ljivpdiquoPSe5RUAECksAlx5Zf7179/buvJ/97Gcd99K9e3efgHH33Xfbn//8Z0OZ7bPPPrbOOut0HFNvZenSpd5qc855t+Nmm21W75RC7Zfiaqa7dI4IiIAINEHgxhtv9JbPNtts48dZYXFFzRDTYv/zzz9vEydOtMGDB0e7Ov2Ji3DhwoU+JX6nnXbq9PmhnyDFFXoPST4REIFCE/jTn/5kKBLnnB1wwAHefWdv/devXz8fg3rhhRfstttus/32288nZLy1u6kPshBxP+6+++52/vnnN9VG6CdJcYXeQ5JPBGoT0N5ACZAFeNhhh/kY0wUXXLCClJ/5zGd8Svv8+fNt7Nixtt56662wv9kv999/v0+d32WXXbyLcbXVVmu2qaDPk+IKunsknAiIQNEIXHvttbbzzjv7cVdXXXVVh/hk/J1zzjm2ZMkSb3WRkNGxM4WVBx980D75yU8aVtz06dOtR48eKbQaZhNSXGH2i6QSAREoEAEsHdLRSaA4+OCDbc6cOV76rl27+jgTJZZIyDjhhBOsW7dufl+af/74xz96pbXddtv5a7/rXe9Ks/nG28roSCmujEDrMiIgAuUiQPWKY445xjbZZBP7xCc+YZdffrm9/PLL3u130kknGVmBxLcmTZpkJGO06u5xN37kIx8xSjlh4a255pqtulQw7UpxBdMVEkQERKAIBLCcyPijXiCVKBgIvPbaaxtK7M477zQSLc466yyfFbjWWmu19JYYtIzSHDVqlB/jVba092rwpLiqkdH2GAGtioAIQIBpQrCefvKTn/jsv+HDh/tsQCqvU0OQTD6Oy2IhXsagZUo5UZOwS5f2eZy3z51m8UvSNURABEpJAMtmiy228NOEcINkBWJ5TZs2zRh/xbYsF0o8nXjiiXbZZZfZFVdcYauvvnqWl8/9WlJcuXeBBBABEegMgSyPXbRoke2///6+HNPvf/9722ijjezmm2/2WYGbb755lqL4a1Et/thjj7UzzjjDW3pHHnmk395uf6S42q3Hdb8iIAINEfjGN75hm266qd10003+eKwcqlqQcu43ZPzn9ddfty9+8Yt+mpOZM2fmYullfMtVLyfFVRWNdoiACLQjAcouve997zPiRtz/rrvuaigspg7hex7LK6+84qu7IxsVNpjhOA85QrlmOIorFCKSQwREoC0JUOiWtHLKMv3hD3+wnj17enfcrFmzvIswLyh///vffcHcn/70p3b77bfbDjvskJcowVxXiiuYrpAgIiACeRCgAvtBBx1kVLKYO3euF4HUdsZg5ZF44QV468+8efMMi4/yUb/61a/sox/96Ft72vtDiqu9+193X5mAtrYBgcWLF9uFF15oH/jAB4zsQG75U5/6lD311FNGajvf81yIYzFGq3///l6mPJJB8rz/WteW4qpFR/tEQARKR4B40ZVXXmlbbrmlkaFH7UAGE+MSRFm8//3vz/2eyRok5Z6EEGTNXaDABJDiCqxDJI4IiEDrCFDZ4kMf+pCvoM5cWO9973vtRz/6ka/vh0vOcv4PpcoU+5SPIpsRl6XlLFOIl5fiCrFXJJMIiECqBIgPkXix5557ercbRWiZs4qxWcOGDUv1Ws029otf/MJbgRTMnT17dlunu9djKMVVj5D2i4AIBEHgr3/9q1G8FkukUYGeeeYZI/FiwIABRuIFCmvcuHH2t7/9zajm3mg7rT7ukksu8bUN9957b3v44Ydt8xwGN7f6HtNsX4orTZqdaksHi4AINEoAq2jDDTe0s88+21eyIBOw3rkTJkywrbfeuiPxYvTo0b4QbTQ+q975We3fb7/9jBqIEydONIr2ZnXdIl+nS5GFl+wiIALlJnDxxRfbuuuuaz/+8Y87bpQJEnv27NnxPblCAVzcgiiDpUuX2tChQ+3ZZ5+1yZMn+9mIk8fn9Z3YGvE2lPAvf/lLO/TQQ/MSpXDXleIqXJdJYBFIn0CILe61115+qhAG4EbykUBBLCj6nvwcO3asd7nhFuzbt69XeLfeeqsv3ZQ8Ns/vxx13nGFpUT6Kgc9U6shTnqJdW4qraD0meUWg5AQOOeQQc875qhXLly/3d4uFxSSJpKxXiv+wfauttvLFZ7t27erLNaEQiBn5BgL5c++993olescddxjykfYeiGiFEkOKq1DdJWFFoLwEUFKjRo3yRWTjd4llMmfOHGNffHu0TsyK2n0LFizwMw0/+OCDRgJGt27dokNy//znP//pyzYxwPmzn/2sPfHEE7bjjjvmLleYAtSXSoqrPiMdIQIi0GICpIBjSV199dUdV1p77bWNlHUKy1YaFMzkjcSFqOLevXt3P9XIo48+6pVXRyM5rzANCfNmrbXWWkYJKWJZJI3kLFbhLy/FVfgu1A2IQLEJoKxQTKSuR3dC0gJWVrWUdeJcffr0sSlTpth2221nKCwqTUTnh/BJxQsmn0Tx4hq87777rHfv3iGIVngZpLgK34WFuQEJKgIrEHjppZeMUkuj3nQPvvbaax37xowZYwwY7tevX8e2+Mp1111nu+yyi7dgOPfuu++2TTbZJH5IrutkNaJ4x48f79PcGeS8xx575CpT2S4uxVW2HtX9iEABCJDe/u53v9seeOCBDmlRPkzdMXHixI5tyZXjjz/eRo4cacuWLbMZM2YYCRu4CZPH5fEdhbXzzjvbiBEjbJ999jEqujPxYx6ylP2aUlxl72HdnwgERIBMOtyCw4YNM+ryRaKRSYjSqjZtB8kNpI6ff/75vqoEyQ0oh+j8Tn+meAIKi/sh8QJLkOryJIesscYaKV5FTcUJSHHFaWhdBESgJQRQWLjLmPPqd7/73QrXYGDwlDdjVZttttkK26MvL7zwgp88kfFYWFtM8vie97wn2p3bJwV7UcKDBw+27bff3peRIsMxFAswNzAZXFiKKwPIuoQItCsBLKMTTjjBT9LIGKY4B+bBYhulmOLb4+skXfTv39/Hs773ve/Z1KlT47tzWb/22muNKVH23HNPIyGEuodU6XjnO9+ZizzteNGSKa527ELdswiERwDX3qmnnmokKVBAlnjW66+/3iHoAQccYLgGBw4c2LEtuXLLLbf4KhiUfCLD8Igjjkgekul34nGDBg2yo446yqjgQTr+N7/5TaNwb6aC6GImxaUfgQiIQKoEZs+ebcxzxSSIxHzWXHNNe+655zquceaZZ9oPf/hDW2+99Tq2JVdIJSdmRDWM+++/3xfLTR6T1XeqtTMTMRmQFO3lXqihyDizrGTQdVYkIMW1Ig99E4HUCLRbQ9QUHD58uGGVEPthDBaxrRdffNGjIIaFUsOt5jdU+UMCxuGHH+5TyXEl5hEzovDt6aefbrgzd9ppJ/vgBz9ozz//vK/eLgurSsdluFmKK0PYupQIlJHAk08+aV/4whd8DT4y7C666CJDSRGTevnll/0tk5iB5US6uN9Q5Q+p5KS8k+aOZVblsJZtZs4vFOtGG21kKFAK/ZIMwnQjbGvZhdVwpwhIcXUKlw4WARGICFC+iLp7JCpceumltvvuuxtTdbB+/fXX+8NIWEARUDkCZeY3VvhDOSQqYBDX4txRo0ZVOKo1m4jHXXjhhYaSYs4vSjKdd955RjbjBRdcENRUKM0TKNeZUlzl6k/djQi0lMCSJUuM0kVf/vKXvUvw+9//vjH3Fdl/X/nKV3wlDDIJEWKDDTbwg4TrWU7nnnuud8mhNKgyQaYe57d6IS2fRAssqWOPPdbfFwkluDyZdoTYXKtlUPvNEZDiao6bzhKBlQhQKYHsOeecEaOZN2/eSscUdQMK65xzzvEKZuDAgTZp0iQj9vPII48Y1dhJViCBIbo/4lwkNeAijLYlP9lPGygLxj9RCQNllzwuze8U873mmmtsyJAhRhyOIr6rrbaanXTSSbZo0SIjSzCPmFqa99gObUlxFbuXJX3OBKibx0OQgq8sBPARiay4bbfd1s8rhSsNq4MHI/uKtMyfP99QPpRjoso5SQuHHXaYMYXIbbfdZqSqk22He5D7ogo6FtQ999zjY15sq7TAjcHI8KJgLmO93v72t1c6NJVtKEWqc+Cu5BPXJZM3onDJEjzrrLNMCisV1Jk0IsWVCWZdpCwEKOdz+eWX+9lrnXO+bh4PQaytavdI8sJpp51mJB1UOyak7UuXLjXkxYXGOKy77rrLSLIgAePZZ5+1K664wg/AxWWIcmZ8E/Kvv/76fmqRWvdJ3AhrjAoYKBCUFhl7nN+KhYocvXr1sn333bdjni/uiTgarkJqCcolaIX7T4qrcF0mgfMgQCVzJjRkSqq3vAAAEABJREFUWgrSvElCSMpBGaJjjjnGbr/9dqMy+LBhw1aoWo4bMXlOSN8ff/xxo4oFLjQsRKyrHj16GIkLzzzzjDGQeNNNNzUUG3Ng4TJEEXEPWJ1PPvmkDR06lK8VFxQ4pZFIiSep47LLLjPar3jwKmykWvyRRx7prd1DDz3UkJ3mGBOGQqbyfFZxNK6rJX0CUlzpM1WLJSOAu4yHXiVlRdbc5z73OcM1htVFKjilgMaOHesz7LbZZhv/AMXdhgstNDS46ohXUVYJWVEmUYYfluXixYuNRAxcbMiOi5CBwcSk+I61Qto7bsNa45uIjzF4F3fpV7/6VcMScs7RRCoLMuOuxJoiuxGZooZx1TLgGcV8xhlnRJv1WWACXQosu0QXgZYSoHo5QXsehjwYo4sRi+FNHhchZX8I9g8aNMhQYtExfPKQp6wRFRZ4cHfpEsY/NywfBtcSj8IKRDGRZIHMWCpYRLjwSDBhW7TgGsRiYlAw23bccUf7+c9/brVKMaEwsMaIj/3nP//xg4rPPvtse9vb3kYTq7zg7kORbrzxxn4sGS8ZUaMf/vCHvVuTJBlKTEXb9Vl8Ag38Syr+TeoORKCzBG688UYbMGCA8ZCNn0sJI1xoJF9gRb3jHe+I7+5Y58HPtBtk42GBYc107MxhhfmvmBZk88039/EpsucYv4QoTCWC1UWFCyyu5CBh3IEoalyD0TkkU1CtvVZ8aty4cfbpT3/aUPBcBxcrLlTWV2UhzsaLAIkhuDUZ+xVvD+uRgdBz5841EkmSLxTxY7VeTAJSXMXsN0ndIgIoGsb28IaO6y+6DFYWSoyHJA/MaHulTywWLJPf/va3/sFNNXHn0nOLVbpmchvjq1AUxNlw5/GJolm4cKE/FLcecSqqQmAVHn300T5D0O+M/WF8Ftl/U6ZM8Vux0nCZojhow2+s8IdxUJGSwq24fPlyI/W8wqENb0KpMkiYWCIWHOOt4ifjEsT6xcLiBSO+T+vlIiDFVa7+LP3dtPIGiecwFin5gMVVyMOQ2Ey9yQFJZIjchsRZbrjhBkPptVJu2mYsFSndJI8454zkB2JUWFr/+te/OMTX2yP2hsuPqThwF2KB+Z0V/lA1Ah4oYHYTy2MdJcj3agvxLs5l/4EHHmhYXqw3s6CcGBzsnPOJI7SdbAdXIRYWrllkTO7X9/IRkOIqX5/qjpoggDsMl1k8RkL8h7Rp3H4kFtRqFvchbisesrimpk+fXjP2U6utRvZhDZKmjisOS4N40ymnnGKk60fnY2mR5Ycyffrpp404FlYQyig6ptInlS9wAWI1kU1JjI7EB6wZqltUOie+Daso+l4rNT46ptLn7Nmzbf/99/dWIPJXOoYMTpTVzJkzTRZWJULl3SbFlVPfvvbaaz7rjAcJb+jOOZ99tsMOO/jYCvEIguO8FVM7jbf3V199NSdpy33ZN954w7AMsCaiOz3ooIMMhUXadL1EApTe3nvvbSQKoERQHvGHd9Tmqn6iPFAEWDwMdibGRvIDyRZR21SiwPIiaYK0ddyDJF8wlik6ptYnsjPXFC5CjsNNSIV33Kd8r7dgtUbHMG0J5aCi7/U+Ua6k4eOC5N/ETTfdtNIp3bp1s5NPPtnXESSDc8stt1zpmOw26Ep5EZDiypg8AzmZp4g4CeOCxr0ZwObtMhLjoYceMsaZ8MAhAYAgOkVKyfbCTeWc89lrFCQldkDgOwqYR23os3EC//73v40ae7jPOGv11Ve3MWPG2NSpU40BuGyrtaCsSL5AyfHJQ56xTrXOaWQf/c9vA8W5zjrr+JcaBgBTsRz3X9QGvyPkvfrqq40sSCqwkwnJC1B0TKOfyI6lhfUIh9GjRxuDi+tZm/H2UVbR97gSi7YlP4md8dKAO5Y5vBhnhZWXPI4qF5MnTzayO3mRi18neay+l5+AFFdGfcx0CVQKwNVCbTYeMvFLo5hQRHzGt1dax1qjMjfBdVKNCZgTsOb8WbNmGSnalc7TtpUJ/OAHP/BzLEV7sFaIzzjnok1VP3Gp7bbbbv5Fg4w7EiKwFqqeUGEHmXzEolA+9CW/D+ecYXFjjSMfLzvRqbSPOxJrA8XA+RMnTrSDDz7YeLGJjuvsJ6WPsK74bXEu1h2KgvVVWbAIk+cvXLjQzyLsnDOyFXGrxl208ePhS/IILwgoUiyu+H6ttycBKa6V+z31LWSjMYCVGEHc3UdxT7LXyLgiY4o3bD75zsK4F6wvxs2w8LDijZS4Be3FBSVFGEXGP3RqrjnnfNozLize1JEBl1b8nHZfhxnuWDhgYZDijQJxrr7Soj8Y6MpDGJcdtfewfmir1kISAQoJq4jECCwHsv/oW6xnXnDi5xM3wzJHmRLXIqmCdeI7aVWd4IWHrEKuS3yORI9Ro0bxtakFCyo6kRgcyglXN/fhnDPuO5kAEx3PJ2OyvvSlL/kxYsTxiD2yXYsIRASkuCISLfpEYfCQ4s04ugQPK0bwo0gqvZFGxzFgFRfKwIEDbeCbCw8rzsONRBUAXIT33Xef8SBjzFAye43Yx80332y8PSPDFltsYcxQS2bZX/7yl+gybflJWSaY4ioEAON96Cvn6istXHXUvqM4K7EsvifdilhJWG+4IXnR6Nmzp3f3DR482HhB4VooPa4dX7C4cA+iyB577DGfbMGYMqwsMgbjx67qOi9HvNTwwkNbzPZLbKszcSnOSy7JlyrcgXgSSKNPHhv/jsXHyx1TmzBxYzPuznh7Wi8vASmuFvdt/B8rRUj5h0kMAcupe/fuq3T1rl27GhliPNSofs1DmMwx3upx/fAmzRtvNFUED1PSs1F+PEjJ2iI2s0pCFPBkYoooE5IBIvFR5s7VV1pkuJEcgTsW1y/uNEo5Ma6IWFAUj+KTLD/ceCjJWi8KuPlQVFhb/DbIZOQlhfYsEjDlTxJSqHjBSw1Ncy1+N7zc8L3ZBbcf946l2EgbKHwUJ+PJiKeRzo7V18i5OqZ9CUhxtbjvo4cj1hPKhH+Y9bLUVkUkguukBlP1mjd7FBUPTR6Kd955p48t9O3b11+CrC0GyqLEcJHx8PA7SvwHJmSsRbeIWwvLAwbRNj4Z+8RDmEro3/72tw2XLg91XhLYz0JCBDX8eAlhQC4xL14O2FdrYRoQFCXFYBnwTDsoKl5sap2X5r7zzjvPSP6hTSwsfhtMXcL3zi64SYk/Oed8diZp9PEMzWR7pNfDEUVFrUQyZ3EfJo/TdxGoRkCKqxqZFLbzRo7SoKlly5ZZr169WM1kYdoI3maxBkjk4KFITIY37F//+tc+fkAcg2A/MvLGT+YW582ZMycTGbO+CJbW+PHjOy5LaSMy2RjAilsKhe6c8y49xkCh1LBKSL/GXYcLq+PkTqzgnqUfiFeiJOGLHLgN80g2IIGHe+IWnHN+8kTGrPG90QUrkhR5rCt+M8Rma53LfcKSyiNYq7i3cQ3WOkf7giMQjEBSXC3sCjLCouaxslAS0fdWflKpnLdg3E5UeyB13jnnB3MS1yG+whsx8RcexigtHtrIxHk80MlQI+2YNthehgUW8fsgPog1xcOUYQjElOL7m1nv16+fjyNiXUeKatq0aX4uLuKVzbSZ5jm4jkngidokhR8FGn2v9UnyyIgRI/xULbhaSbCoZWGi/DmemCzxXBI0iAnWuob2iUAjBKS4GqHU5DFxC4sMQR4QjENpsrmGT4uUUPIEyufwsCZRg7gKD1kGcOLGRNmhxHDhkORB9iPjx7DaOJagfbK9on3H0kxDZlxdKHfcvsQRSbDB7YU1RVo3igpXbQiKKn6/9COyRtt4sapUQinazyfuZOKozjkjXZ/4G0kp7Ku0MDSDLEkYoKx4EULJKW5ViZa2NUtAiqtZcg2cx/gcHnLRoUxoxz9+XHPRtlZ84hbEUmLwMu6uWpYesS9SoYnx4L4iu46qC7wZk66PfBSJJXZGRYUiJ3MgP/dTbSHtGoXEdBi4wDgOpQ4TEhdIn0c54erC7UiiDTEz4l+hu70YC0U/ck8sKC1+G6zHF343xOxQNry0kMDDoOb4Mcl1lBVuceJkWGBYYrhHsbiSx+q7CKRBQIorDYpV2uBhxhst/v3oELL+GFzKwy/a1opP0qoZ6MwDigA42Y24DKtdC4uQBzEKihJBxMNIY45bb1hlJHPwIGe9Wluhbqcv4EGMh3FYLFiZKCMWXIZMP4Jypn+If3EMCRokvKRRESMvNljS8WszTAJ3JoqJcWjEN3lRQVlRdokYFkosfk58neP5faHUUFb8VvjNxI/Rugi0ioAUV6vIvtUuyovyQQxwfWuTPfzww0acgcy1aFsrP3HTkMLNWzcPq2pzSEUyUPqHLEOsCWr2EYSP9vF51VVXGdYLSg7XEduKsmBlIDuxPhaUE7KTwMJgbfjwnerquEdxk/G96AtjtOL3gPWFpY0rkEG+ZJTy8hI/JrnOiw8lp4jdUckCi57aiMnjVu27zhaB+gSkuOozWuUjGBzMgMpoPBUN8laPi4lYEt+zWFBYxF4oFcRYrnoPHR5OjEUio46qB6RNx+XkwU7wncrkRVNg8fvgIY61QJyKweHEgbA+y+TqIiGHwcYk3cTvvd46yRvEqRjWwW+WhJ7QYnf17kH7y0dAiiujPiUVmEA+rpjokriuUGpRfbhoe6s/iUkQx8DNg/WHdUFCRrXrouh4M+etnNRxxi7Fj6VEEAqMQay0Gd8X8jrlk6hSQdIC61hXJFfwQuGcC1n0TstGuvsll1xiuEa5Z7JcKzVCfJSkE8aWwQSXIX0bTzSqdJ62iUCWBLJSXFneU7DXwtohJTtueeGm6d+/v1Uq/5PFjQwYMMCwOIjpMLYGWapdlywxYiNMl8HDL+7+5BwG4PLwJwZGOSq2hbpwH7gJiXk55wwXGAkXPOBDlTkNuXhxwjrmZYT4HUuUdEKcj2QdrE2Uea2knjRkURsi0CwBKa5myTV5Hq6WSZMmrTArLsVTt912Wz8QtMlmV/k0XEgE8LHAeJiR0kywvlLD1F2kIgfZd2ThkXkXP44YGPEvUu/j20NYx4ogzkU8C2WN8iJhhn5xrlxWVi3elBsjxsdS5KSTWveofeUlIMWVQ98yCJT06ngMhTFWlL7hIUI8rNKcRFmIiguJhxkpzaTtY4nESyTFZSAmxEKFddLp4/uIidAObkje5OP78lrHVUYB2OnTp/spQKg7yEDseOZkXrLpuiIgAo0TkOJqnFWqR1KvjkoNWC3xhhctWmTUrcNNg7smiwHL8evH15mmA0uE1HdcmUz7QRq0c/+3TMhEoyICCg+3Y1wZ0xZzVGFNksjB9zyWiDNTZeAKIwUcK4u0/6S1mId8uqYIiEDnCEhxdY5XqkdTWJTEBlKwKeCabJzYU69evYwpIVjP03JhokoKyTKdCrEg3IrRIF3kppoCKeW43pLJGyQ8MLiXgD/HZrXMmzfPcAliUeECRYFiIVI8t9Hq5VnJquu0LQHdeBMEpLiagAj9PAQAAAjDSURBVJbmKbzxk7RBOSKC4sSM4u0zVQkWDdYXx2IBkRwRPybLdRIySMAgkQNrENlQDs79zwrDuiHYn0xyIFmDor6k1bdaXhQrcSwUFUkYTEzI3Fi8JKBAW319tS8CItBaAlJcreXbcOskR5CGzEP3qaeeMgb/Ukcw2QDzO1GJg/gR1TCS+7P8jsyk+TORIi44yv7gMkQGLDA+o++ssyAzKdcUteV7WgsV18l0ZLA1MTmsKqqHMH6JbEfqM9ZK+U9LDrUjAiLQegJSXC1ivCrN4sZizBdxGKpYEJuJu+Vom4w9rBfnnFGdA9cdSo99eSwM3KXsD+5CqnRgHSIHMTA+4wup2CSoUNsuvr0z62QEzp0715jXCisQS5XUdsbEMbAaS5B4IcMPkuw6cx0dKwIiEB4BKa7w+qRDIipdUJWCLEMGjjL9CDXzkmnqKDcy5LA0nHPGORTMpUZhR2MZrVBxnsHKWFRkFGKVVbo07kQUHAOhK+2vto0yWSgmYm5U8qACCEqSyvvU2GOsGYOgsQSTnKq1qe0iIALFIiDFVZD+6tGjh882JI0et9zxxx9vlVyJ3A6xHFyNxJnIAmSdhzn7slicc0ZdOxJKaikwyl2hbKhETuX8arKhrLAmmVmXWXqpuUjsj7FmVHbALclswkzDguVXrZ323a47F4FyEZDiKmB/kip/7rnn2oIFC4xMwxkzZhiVuvv06bPS3VCmCeuLhArnnOGG5IHPIOFa1b9XaqjJDWT0ocAY1Iy1WKkZlA+JFNRGjO9nLNjJJ59svXv3NqxJEkIY2EzlB8a9MdaMWnqk7cfP07oIiEC5CUhxlaB/qXdIpW6SEJYsWWKTJ082EiVwpyVvD+XAPGGUZaL8j3POGNdE0gTKBSsoeU4a33HrYS2SOUmKf7JNKlqgnEiiICOQoQKk1jNDMS5P3I7E/JCRJAziWsk29F0ERCB8AmlIKMWVBsWA2iDjcPTo0UaiBIOGybbDVUgCRzUxiUmR6IFFREzKOWfOOaMtUt0ZWIyVRtV0xnJRTQPlN23aNMP6QWFWa3vZsmVGEgXuPaqMz58/37CSUKrJGBTJFGQBkhGI+495y7jOK6+84uspYm1Vu462i4AItA8BKa6S9zUVOshQZOAtbkUSOUhoGDJkiNWLBzFejHFQzL+EAiET8MQTTzTiaygy5uqicjhV4Z37n7Jz7v+fVKEnHR5ri4SKkSNH+mK2l156qRHTeuONN1ao2Rh1BdchhsW1KSdFkkq0T58iIAIiIMXVZr8BMg7J5GNKFTLwGDPGOsoN64q0cpI6Oo3lzROIn3F+tGy//fZGjIq2b7nlFsPNx4LCQomyoKCw3Bgk/GYT/n+UnF/RHxEQARGoQECKqwKUdtqEssH6wp3IQGKy93DZoVQ6u6AEOT9aiGlNmDDBD6bea6+9jEHTLFhhccbDhw830uNJIpk5c6ZRSSS+X+siIAIiECcgxRWnofXcCKDMGEzMRJWs5yaILlwGArqHkhOQ4ip5B+v2REAERKBsBKS4ytajuh8REAERKDmBQimukveFbk8EREAERKABAlJcDUDSISIgAiIgAuEQkOIKpy8kSaEISFgREIG8CEhx5UVe1xUBERABEWiKgBRXU9h0kgiIgAiEQ6DdJJHiarce1/2KgAiIQMEJSHEVvAMlvgiIgAi0GwEprpB7XLKJgAiIgAisRECKayUk2iACIiACIhAyASmukHtHsolAOAQkiQgEQ0CKK5iukCAiIAIiIAKNEJDiaoSSjhEBERABEQiGQJdgJJEgIiACIiACItAAAVlcDUDSISIgAiIgAuEQkOIKpy8kiQmBCIiACNQnIMVVn5GOEAEREAERCIiAFFdAnSFRREAEwiEgScIlIMUVbt9IMhEQAREQgQoEpLgqQNEmERABERCBcAm0n+IKty8kmQiIgAiIQAMEpLgagKRDREAEREAEwiEgxRVOX0iS9iOgOxYBEWiCgBRXE9B0igiIgAiIQH4EpLjyY68ri4AIiEA4BAokiRRXgTpLooqACIiACJhJcelXIAIiIAIiUCgCUlyF6q5mhNU5IiACIlAuAlJc5epP3Y0IiIAIlJ6AFFfpu1g3KALhEJAkIpAGASmuNCiqDREQAREQgcwISHFlhloXEgEREAERSINAOoorDUnUhgiIgAiIgAg0QECKqwFIOkQEREAERCAcAlJc4fSFJEmHgFoRAREoOQEprpJ3sG5PBERABMpGQIqrbD2q+xEBEQiHgCRpCQEprpZgVaMiIAIiIAKtIiDF1SqyalcEREAERKAlBKS4msKqk0RABERABPIiIMWVF3ldVwREQAREoCkCUlxNYdNJIhAOAUkiAu1GQIqr3Xpc9ysCIiACBScgxVXwDpT4IiACIhAOgWwkkeLKhrOuIgIiIAIikBIBKa6UQKoZERABERCBbAhIcWXDuehXkfwiIAIiEAwBKa5gukKCiIAIiIAINEJAiqsRSjpGBEQgHAKSpO0JSHG1/U9AAERABESgWASkuIrVX5JWBERABNqeQECKq+37QgBEQAREQAQaICDF1QAkHSICIiACIhAOASmucPpCkgREQKKIgAiES0CKK9y+kWQiIAIiIAIVCEhxVYCiTSIgAiIQDgFJkiQgxZUkou8iIAIiIAJBE5DiCrp7JJwIiIAIiECSgBRXkkh233UlERABERCBJghIcTUBTaeIgAiIgAjkR0CKKz/2urIIhENAkohAgQhIcRWosySqCIiACIiAmRSXfgUiIAIiIAIhEagrixRXXUQ6QAREQAREICQCUlwh9YZkEQEREAERqEtAiqsuIh2QFgG1IwIiIAJpEJDiSoOi2hABERABEciMgBRXZqh1IREQgXAISJIiE5DiKnLvSXYREAERaEMCUlxt2Om6ZREQAREoMoGyKa4i94VkFwEREAERaICAFFcDkHSICIiACIhAOASkuMLpC0lSNgK6HxEQgZYQkOJqCVY1KgIiIAIi0CoC/wUAAP//fk/EkAAAAAZJREFUAwDbUWjsLtFejQAAAABJRU5ErkJggg==', '2026-04-24 15:08:30', ''),
(17, 4, 7, 'surveillant', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAa4AAAC0CAYAAADMz8jTAAAQAElEQVR4AeydC7hNZRrH39XcDCqRpqKJSnQhDSOFXEKSSyWXlBLHLVMZg6KGY4RCRVNCUYxcSqYml8p9aihRIXLpolHRjTDFNNd+X+3z7I7D2eectfdea6+/51ln77X2Wt96v9/nWf/1ft/7vd9R/9M/ERABERABEQgRgaNM/0RABERABEQgRAQkXCFqrIw3VRUUAREQgQQISLgSgKRTREAEREAEgkNAwhWctpAlIiACwSEgSwJMQMIV4MaRaSIgAiIgAocSkHAdykRHREAEREAEAkwgcsIV4LaQaSIgAiIgAgkQkHAlAEmniIAIiIAIBIeAhCs4bSFLIkdAFRYBESgMAQlXYajpGhEQAREQgbQRkHClDb1uLAIiIALBIRAmSyRcYWot2SoCIiACImASLv0nEAEREAERCBUBCVeomqsQxuoSERABEcgwAhKuDGtQVUcEREAEMp2AhCvTW1j1E4HgEJAlIuALAQmXLxhViAiIgAiIQKoISLhSRVr3EQEREAER8IWAL8LliyUqRAREQAREQAQSICDhSgCSThEBERABEQgOAQlXcNpClvhCQIWIgAhkOgEJV6a3sOonAiIgAhlGQMKVYQ2q6oiACASHgCxJDgEJV3K4qtR8CGzcuNFGjx5tI0aMsJEjR9q4ceNswoQJtn79+nyu1M8iIAJRJyDhivr/gBTV/8CBA/bggw9a06ZNzfM8O/fcc23AgAF2xx132KBBg6xPnz7Wq1cvO++883J+v/zyy23o0KHuun//+98pslS3EQERCDoBCVdhWkjXJERg165dNmbMGPvlL39pxYsXt5tvvtkWLVqU0LV4ZAsWLLDs7Gx33c9+9jNr27at7dixI6HrdZIIiEDmEpBwZW7bpqVmeEbTpk2zatWq2UknnWT9+/f3RWz++9//2pw5c6xSpUp21113+VJmWgDppiIgAkUmIOEqMkIVAIE33njDLrvsMvvJT35iN9xwg23YsIHDORtC1qVLF+dBzZ0711asWGH//Oc/7X//+58dPHjQ7S9dutSGDRvmug4bNWpkNWrUyLk+9oVrfv/73zsBk/flqOiPCESOgIQrck3uX4W3bdtmAwcOtDPOOMN+9atf2fPPP59T+DnnnGO33Xabvfjii/af//zH1q1bZ5MnT7YhQ4bYlVdeaRdffLH99Kc/defTDch+w4YN7c4777Thw4fbkiVLbM2aNYawIWiU9Ytf/MKdzx8E7JlnnuFrqLcvvvjC5s+fb1lZWY7LRx99FOr6yHgRSAUBCVcqKGfYPd58801r3bq1nXnmmXb33Xfbu+++62r485//3Jo1a2bPPfecEyp+a9KkiR11VNH+myFolPX+++87z6xcuXLufgia+xKSP4z5Pfnkk9axY0cn3J7n2fHHH28tWrRwoo4QI9ghqY7MFIFDCaToyFEpuo9ukwEE8H4QkAsuuMD+8pe/5NSodu3adv/999vWrVtt4cKF7kH8ox/9KOd3v74gjHhmjRs3dmKIN0c3o1/lJ6Ocl156yVq2bGnHHHOMG/Nr3769zZw50zie+354lJdccknuw9oXARHIReCoXPvaFYE8CXz++eduzImuwW+++caKFStmV1xxhf3tb3+zVatWuXD28uXL53mt3wcvuugiI1jj66+/thkzZvhdfJHK2717tz3++OPWoEEDF9aP0M6bN8/279//g3I9z8vZJ+qSeuBRxrzJnB/1RQRE4BACEq5DkOhAbgILFy60s846ywjA4LeqVava4sWL7c9//rMhIhxL5RbfnYZQpPLeh7vX7NmzjXlnZcqUsRtvvNF1acafe8opp1iFChVyDv34xz92Y1pwfO+99+yaa64xPMqcE/RFBETgsAQkXIdFox8ggCfQvHlzw+PyPM95WXhYderU4eeUb3gljBNxYwJAfve73/E1LRtdlXT9lShRwjp06GDMO4sZctxxx7ku03bt2rlJ10RAbt++3U4//XTXrfrll18a0ZV0DSajWzVmhz5FIBMJSLgysVV9qNOmTZuc53DttdfmlMb4Fg9bHtQ5B1P8hewb3JKghrFjx7ruOPZTtdHth2fleZ5deumlhojSZcn9S5Ys6Zgx/nfPPffYypUr3e+vv/66E3wmX8OVLCFMyOYabQUnoCtEQMKl/wOHEODBizfz+LdjNfx48skn22OPPeZSNHmex6G0bJ988onLZ8jNW7VqZQRp8D3Z21tvveXqTncfgRbxnhVjfUROPv300/bhhx8agSu33nqrde/e3UhzVbduXZcthG5V7I1NAUi2zSpfBDKZgIQrk1u3EHXDGyDUPXYpaZaYLNy5c+fYobR8/utf/zJswLupWLGiIQ7JNOSFF16w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', '2026-04-24 15:08:48', ''),
(18, 4, 8, 'comptable', NULL, '2026-04-24 15:09:04', ''),
(19, 4, 8, 'comptable', NULL, '2026-04-24 15:09:10', 'Paiement effectue');
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
