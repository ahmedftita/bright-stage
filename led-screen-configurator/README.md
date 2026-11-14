# LED Screen Configurator Pro 📺

> **Configurateur Professionnel Autonome pour Écrans Géants & Murs Vidéo LED**  
> Dérivé et séparé de la suite Bright Stage.

Ce projet est un module **100% indépendant** conçu pour concevoir, cartographier, calculer la puissance électrique et tracer les chemins de câblage réseau et d'alimentation pour les murs vidéo LED de tournée, festival, conférence et installation fixe.

---

## 🚀 Fonctionnalités Clés

- **Topologies d'Écrans Multiples** :
  - **Mur Plat Standard (16:9 / 21:9)** : réglage précis des colonnes et rangées avec conversion métrique instantanée.
  - **Angle en L (90°)** : Façade principale + retour d'angle immersif.
  - **Multi-Écrans Complexes** : positionnement libre par glisser-déposer (Drag & Drop) pour configurations déstructurées (Scène principale, façade régie DJ, totems latéraux).
- **Standards de Caissons Professionnels** :
  - `P3.9 Outdoor` (500×500 mm, IP65, 4500 nits, 8.5 kg, 140W max)
  - `P2.6 Indoor HD` (500×500 mm, IP30, 1200 nits, 7.5 kg, 110W max)
  - `P4.8 Tour Grade` (500×1000 mm, IP65, 5000 nits, 14.0 kg, 260W max)
  - `P1.9 Broadcast Studio` (500×500 mm, 800 nits, 7.0 kg, 100W max)
- **Câblage Signal (Data RJ45 Gigabit)** :
  - Gestion jusqu'à 8 ports réseau Gigabit distincts avec suivi de charge en temps réel.
  - Plafond de sécurité à **650 000 pixels / 10 m²** par port RJ45 (Norme NovaStar MCTRL / VX).
  - Algorithmes de routage automatique **Snake Horizontal** et **Snake Vertical** (Zig-Zag).
  - Navigation au clavier (Flèches directionnelles + Retour arrière pour annuler).
- **Distribution Électrique (Power 230V)** :
  - Calcul de la puissance crête ($W_{max}$) et de la puissance moyenne en exploitation.
  - Calcul de l'intensité d'appel en ampères ($A$) à 230V.
  - Recommandation du nombre de disjoncteurs divisionnaires 16A et calcul de la limite de chaînage (*Daisy-Chain* PowerCon).
- **Visualisation Interactive Haute Définition** :
  - Grille vectorielle avec indicateurs de position et pastilles numérotées des étapes de câblage.
  - Repère d'échelle humaine réaliste (**1.80 m**) pour évaluer la taille relative sur scène.
  - Commandes de zoom (40% à 200%) et centrage.
- **Outils d'Exportation & Production** :
  - 📸 **Export Image PNG Haute Définition** : capture du schéma de câblage avec flèches vectorielles pour l'équipe technique.
  - 💾 **Export JSON NovaStar / Processeur** : cartographie complète (coordonnées, offsets, dalles, ports et résolutions).
  - 📋 **Copie Rapide** pour transmission instantanée sur WhatsApp, e-mail ou devis technique.
  - 🖨️ **Impression & PDF** avec feuille de style épurée pour fiches techniques de production.

---

## 🛠️ Installation et Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- npm ou yarn

### 1. Installation des dépendances
Dans le dossier `led-screen-configurator` :
```bash
npm install
```

### 2. Lancer en mode développement
```bash
npm run dev
```
L'application démarre immédiatement sur **http://localhost:5175**.

### 3. Compiler pour la production
```bash
npm run build
```
Les fichiers statiques optimisés seront générés dans le dossier `dist/`.

---

## 📂 Structure du Projet

```
led-screen-configurator/
├── package.json              # Dépendances & scripts npm
├── vite.config.js            # Configuration Vite (Port 5175)
├── index.html                # Point d'entrée HTML avec polices pro
├── README.md                 # Guide technique & documentation
├── public/                   # Logos et assets statiques
└── src/
    ├── main.jsx              # Point d'entrée React
    ├── App.jsx               # Conteneur racine
    ├── index.css             # Thème sombre haute précision & styles d'impression
    ├── components/
    │   ├── LedConfigurator.jsx   # Interface principale & contrôles
    │   ├── LedCanvas.jsx         # Canvas interactif avec overlay SVG de câblage
    │   └── LedExportModal.jsx    # Fiche technique, Export Image PNG & JSON NovaStar
    └── utils/
        └── ledCalcLogic.js       # Moteur autonome de calcul photométrique & électrique
```

---

## 🌐 Déploiement

Cette application étant totalement autonome et basée sur Vite + React, elle peut être déployée en un clic sur :
- **Vercel** (`vercel --prod`)
- **Netlify**
- **Docker / Serveur Nginx statique**
