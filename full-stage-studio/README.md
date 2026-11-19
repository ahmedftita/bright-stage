# Studio de Conception Scénique 3D Complète — Bright Stage

Module unifié de conception scénique 3D haute fidélité combinant les 4 piliers d'une production live :
1. **Scène (Stage & Podiums modulaires 1.22m)** : Dimensions réelles, hauteur (55cm, 75cm, 1m), plaques 18mm, pieds vérins, côtés, escaliers, jupe de scène ignifugée M1.
2. **Structure (Ponts Truss Aluminium)** : Grils scéniques multi-portées (Box Grid 4+ tours) ou Arches (Goalpost avec stabilisateurs 2m), séries PT34, FT44, HT44, TT104, palans 1T.
3. **Écran LED (Mur Vidéo fond de scène)** : Pitch P2.6, P2.9, P3.9, P4.8, calcul du nombre de cabinets, résolution en pixels, suspension truss ou posé au sol, poids suspendu.
4. **Éclairage Scénique (Show Light & Asservis)** : Parc projecteurs (Beams 7R/10R, Spots Profile LED, Washes RGBW, Barres LED, Blinders 4-Lite, Hazer), visualisation des faisceaux volumétriques 3D, univers DMX.

## Bilans Techniques Intégrés
- **Bilan des charges mécaniques** : Poids total suspendu sur les moteurs, charge ponctuelle par tour (*Point load*), certification BGV-C1.
- **Bilan électrique** : Puissance totale en kW, ampérage 380V Triphasé et 220V Monophasé, recommandation d'armoire électrique (63A / 32A).
- **Nomenclature Globale (BOM)** : Tableau de colisage consolidé de toutes les pièces.
- **Fiche Technique / PDF Officiel** : Document prêt à imprimer (A4) avec les 2 plans techniques (Plan 2D Top + Vue de face élévation).
- **Sauvegarde d'événements** : Persistance avec nom de l'événement via l'API `/api/stage-conceptions` et stockage local.

## Lancement en local
```bash
cd full-stage-studio
npm.cmd install
npm.cmd run dev
```
Accessible sur `http://localhost:5177`.
