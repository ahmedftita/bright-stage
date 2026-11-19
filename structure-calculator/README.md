# Structure & Truss Calculator Pro — Bright Stage

Calculateur technique autonome dédié aux structures aluminium, ponts truss, grils scéniques et arches goalpost.

## Fonctionnalités
- **Architectures supportées** : Grils scéniques multi-portées (Box Grid) & Arches autonomes (Goalpost avec stabilisateurs 2m).
- **Séries Truss professionnelles** :
  - **PT34** : Section 290mm, tubes Ø 50×2 mm, max span 12m, 4.8 kg/m.
  - **FT44** : Section 400mm, tubes Ø 50×2 mm, max span 16m, 6.8 kg/m.
  - **HT44** : Section 400mm renforcée, tubes Ø 50×3 mm, max span 16m, 8.2 kg/m.
  - **TT104** : Section monumental 1010, tubes Ø 60×5 mm, max span 40m, 70 kg/m.
- **Solveur de segments modulaires** : Décomposition automatique en tronçons standard 3.00m, 2.00m, 1.00m et 0.50m.
- **Calculs de charge & Abaques de sécurité** :
  - Poids propre en aluminium certifié 6082-T6.
  - Charge suspendue (Écran LED plein jour, projecteurs asservis, line array).
  - Charge ponctuelle par moteur / tour (Point load).
  - Validation temps réel selon les normes BGV-C1 / Eurocode 9.
- **Visualiseur 3D interactif** : Moteur Three.js / React Three Fiber avec vue 3D libre et vue en plan 2D top-down.
- **Nomenclature & Colisage (BOM)** : Liste exhaustive des poutres, box corners, jonctions en T, embases lourdes, charnières et palans 1T.
- **Fiche Technique / Export PDF** : Document prêt pour l'impression (A4) avec les deux plans techniques (vue en haut + vue de face), tableau des équipements et visa technique.
- **Sauvegarde d'événements** : Modèles synchronisés avec le backend Bright Stage et cache local offline.

## Démarrage en local

```bash
cd structure-calculator
npm.cmd install
npm.cmd run dev
```

L'application s'ouvre sur `http://localhost:5176`.
