# Stage Calculator Pro 🎭

> **Calculateur Technique Autonome pour Scènes & Podiums Événementiels**  
> Dérivé et séparé de la suite Bright Stage.

Ce projet est un module **100% indépendant** conçu pour configurer, dimensionner et estimer précisément le matériel nécessaire pour tout type de scène modulaire (praticables, pieds, côtés, escaliers d'accès, jupes ignifugées, et charges admissibles).

---

## 🚀 Fonctionnalités Clés

- **Paramétrage Modulaire Précis** :
  - Choix des dimensions en modules (Longueur et Largeur) avec conversion métrique en temps réel.
  - Support de plusieurs standards de praticables :
    - Standard Pro `1.22 × 1.22 m` (4ft × 4ft)
    - Standard Européen `2.00 × 1.00 m`
    - Praticable Carré `1.00 × 1.00 m`
- **Gestion Avancée de la Hauteur & des Piètements** :
  - Hauteurs standards : 20 cm, 40 cm, 60 cm, 80 cm, 1.00 m, 1.20 m et pieds télescopiques.
  - Implantation économique à **pieds partagés** ou mode **4 pieds par module**.
- **Accessoires & Sécurité** :
  - Calcul automatique du nombre de marches d'escalier selon la hauteur.
  - Calcul du jupage de scène ignifugé M1 (3 côtés ou 4 côtés).
  - Garde-corps de sécurité selon les normes ERP.
  - Colliers de contreventement pour les scènes de hauteur supérieure ou égale à 80 cm.
- **Visualisation Interactive** :
  - **Vue en Plan (2D)** avec numérotation des praticables, marqueurs des pieds aux intersections, repères Face Public / Régie, et zooms.
  - **Vue Élévation (Profil)** avec aperçu du plancher, de la jupe de scène, des pieds et des marches d'escalier.
- **Outils d'Exportation Professionnels** :
  - 📋 **Copie Rapide** pour transmission instantanée sur WhatsApp ou email.
  - 🖨️ **Impression & Export PDF** avec mise en page dédiée pour les fiches techniques.
  - 📊 **Téléchargement CSV** pour importation directe dans Excel ou votre logiciel ERP.

---

## 🛠️ Installation et Démarrage

### Prérequis
- [Node.js](https://nodejs.org/) (version 18 ou supérieure)
- npm ou yarn

### 1. Installation des dépendances
Dans le dossier `stage-calculator` :
```bash
npm install
```

### 2. Lancer en mode développement
```bash
npm run dev
```
L'application démarre immédiatement sur **http://localhost:5174**.

### 3. Compiler pour la production
```bash
npm run build
```
Les fichiers statiques prêts pour le déploiement seront générés dans le dossier `dist/`.

---

## 📂 Structure du Projet

```
stage-calculator/
├── index.html              # Point d'entrée HTML
├── package.json            # Dépendances & scripts npm
├── vite.config.js          # Configuration Vite
├── public/                 # Favicon, logos et assets statiques
└── src/
    ├── main.jsx            # Point d'entrée React
    ├── App.jsx             # Conteneur principal
    ├── index.css           # Thème sombre moderne & styles d'impression
    ├── components/
    │   ├── StageCalculator.jsx      # Interface principale & contrôles
    │   ├── StageVisualizer.jsx      # Visualiseur interactif 2D & élévation
    │   └── ExportSummaryModal.jsx   # Modal de fiche technique, impression & CSV
    └── utils/
        └── stageCalcLogic.js        # Moteur de calcul pur découplé (logique métier)
```

---

## 🌐 Déploiement

Cette application étant totalement autonome et basée sur Vite + React, elle peut être hébergée en un clic sur :
- **Vercel** (`vercel --prod`)
- **Netlify**
- **GitHub Pages**
- **Serveur web statique (Nginx, Apache, S3)**
