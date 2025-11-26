# GitHub Copilot – Instructions for This Project (Frontend Natif)

## 🎯 Objectif du projet
Ce projet utilise **HTML + CSS + JavaScript natif**, sans framework.  
L’objectif est d’obtenir un code **simple, propre, maintenable et réutilisable**.

---

## ⚙️ Règles générales pour Copilot

### ✔ 1. Code minimal et lisible  
- Toujours proposer un code **court**, **clair** et **modulaire**.  
- Pas de sur-optimisation ni de complexité inutile.  
- Éviter les “one-liners” illisibles.

### ✔ 2. Pas de frameworks ni de librairies  
**Interdit :**
- React
- Vue
- Angular
- jQuery
- Tailwind
- Bootstrap

**Uniquement :**
- HTML5
- CSS3 (vanilla)
- JavaScript ES6+

---

## 🧱 Structure HTML attendue
Copilot doit respecter :
- HTML sémantique (**header, main, footer, section, nav, article**)
- Classes courtes, en **kebab-case**
- Respect strict de l'accessibilité ARIA

Éviter :
- Les divs inutiles (`divitis`)
- Les IDs sauf pour des cas très précis
- Les classes générées automatiquement

---

## 🎨 Style CSS attendu
### ✔ Style recommandé : simple, moderne, type “Apple”
- Beaucoup d'espace (padding/margin)
- Backgrounds légers (#f8f8f8)
- Ombres subtiles
- Radius léger (4–10px)
- Pas d’effets flashy

## 🍏 Style Apple — Règles supplémentaires

Copilot doit toujours générer un design inspiré de Apple.com et iOS :

### 🎨 Couleurs
- Utiliser une palette très simple :
  - Blanc (#FFFFFF)
  - Gris très clair (#F5F5F7)
  - Gris moyen (#A1A1A6)
  - Noir léger (#1D1D1F)
- Jamais de couleurs flashy.
- Accent discret possible (#007AFF) comme sur iOS.

### 🧩 Typographie
- Toujours utiliser :
```css
font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;


### ✔ Organisation du CSS
- 1 fichier global : `styles.css`
- Utiliser des sections : 
  - `/* Layout */`
  - `/* Components */`
  - `/* Utilities */`

### ✔ Bonnes pratiques CSS
- Utiliser **flexbox** ou **grid**, pas float
- Utiliser les variables CSS si possible
  ```css
  :root {
    --primary: #000;
    --secondary: #444;
    --radius: 8px;
  }
