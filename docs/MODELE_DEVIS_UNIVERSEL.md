# 📋 Modèle de Devis Universel - AEP Manager

## 🎯 Vue d'Ensemble

Le composant `QuoteForm.tsx` a été transformé en un **modèle de devis universel professionnel** adaptable automatiquement à tous les types de travaux de l'entreprise AEP.

---

## ✨ Fonctionnalités Implémentées

### 1️⃣ **Détection Intelligente du Type de Travaux**

Le système détecte automatiquement le type de travaux et adapte le devis en conséquence :

```typescript
// Types de travaux supportés
const workTypeConfig = {
  isBranchement: true,        // Branchement eau potable / assainissement
  isReparation: true,         // Réparation fuite
  isChangement: true,         // Changement compteur
  isDeménagement: true,       // Déménagement branchement
  isFermeture: true,          // Fermeture compte
  isRésiliation: true,        // Résiliation contrat
  isAudit: true,              // Audit technique
  isAssainissement: true      // Branchement assainissement
}
```

---

### 2️⃣ **Champs Techniques Conditionnels**

Selon le type de travaux, des champs spécifiques apparaissent automatiquement :

#### **Pour les Branchements :**
- ✅ Type de branchement (Domestique, Immeuble, Commercial, etc.)
- ✅ Diamètre (mm)
- ✅ Débit (m³/h)
- ✅ Précisions si "Autres"

#### **Pour les Changements :**
- ✅ Diamètre (mm)

#### **Pour les Réparations/Audits :**
- ✅ Durée estimée des travaux
- ✅ Description détaillée

---

### 3️⃣ **En-tête Dynamique**

Le document imprimé affiche automatiquement les informations pertinentes :

```
OBJET : Branchement eau potable
Désignation : Installation branchement eau potable - Lot 125
Description : Travaux de raccordement au réseau d'eau potable
Type de branchement : Domestique (Maison individuelle)
Diamètre : 25 mm
Débit : 1.5 m³/h
```

---

### 4️⃣ **Durée de Validité Adaptative**

La validité du devis change selon le type de travaux :

| Type de Travaux | Validité |
|-----------------|----------|
| **Audit technique** | 3 mois |
| **Réparation fuite** | 2 mois |
| **Branchement** | 1 mois |
| **Autres** | 1 mois (par défaut) |

---

### 5️⃣ **Signatures Dynamiques**

Le bloc de signatures s'adapte selon le type de travaux et le workflow de validation :

#### **Branchement / Réparation / Changement / Déménagement :**
```
LE CHEF D'AGENCE COMMERCIALE
(Nom, Signature et Cachet)
```

#### **Audit / Résiliation / Fermeture :**
```
LE CHEF DE CENTRE
(Nom, Signature et Cachet)
```

#### **Audit Technique (signature supplémentaire) :**
```
LE RESPONSABLE TECHNIQUE
(Nom, Signature et Cachet)
```

#### **Type non reconnu (fallback) :**
```
LE RESPONSABLE
(Nom, Signature et Cachet)
```

---

## 📐 Architecture Technique

### **Structure du Formulaire**

```
QuoteForm
├── Header (En-tête du devis)
│   ├── Numéro automatique
│   ├── Date d'établissement
│   └── Statut
│
├── Company Info (Informations AEP)
│   ├── Unité
│   ├── Centre
│   └── Coordonnées
│
├── Client Info (Informations Client)
│   ├── Données personnelles
│   ├── Adresse
│   └── Contact
│
├── Technical Fields (Champs Conditionnels) ⭐
│   ├── Type de branchement
│   ├── Diamètre
│   ├── Débit
│   └── Précisions
│
├── Quote Items (Lignes du Devis)
│   ├── Articles avec auto-complétion
│   ├── Prix dynamiques (Fourniture/Pose/Combiné)
│   └── Calculs automatiques
│
├── Footer (Pied de Page)
│   ├── Conditions de paiement
│   ├── Totaux (HT, TVA, TTC)
│   └── Montant en lettres
│
└── Signatures (Dynamiques) ⭐
    └── Selon type de travaux
```

---

## 🔄 Workflow d'Utilisation

### **Étape 1 : Sélection de la Demande**
```
L'utilisateur sélectionne une demande de travail
    ↓
Le système détecte automatiquement le type
    ↓
Les champs techniques appropriés apparaissent
```

### **Étape 2 : Saisie des Informations**
```
Formulaire standard + Champs conditionnels
    ↓
Auto-complétion depuis la demande source
    ↓
Saisie manuelle possible
```

### **Étape 3 : Ajout des Articles**
```
Recherche d'articles
    ↓
Sélection du type de prix (F/P/F+P)
    ↓
Calcul automatique des totaux
```

### **Étape 4 : Aperçu et Validation**
```
Aperçu du document (Tab "Preview")
    ↓
Vérification des informations techniques
    ↓
Validation et enregistrement
```

### **Étape 5 : Impression (si approuvé)**
```
Vérification des validations requises
    ↓
Si toutes les validations OK → Impression autorisée
    ↓
Sinon → Message "Impression bloquée"
```

---

## 📊 Exemples Concrets

### **Exemple 1 : Branchement Eau Potable**

**Formulaire affiché :**
- ✅ Champ "Type de branchement"
- ✅ Champ "Diamètre (mm)"
- ✅ Champ "Débit (m³/h)"

**Document imprimé :**
```
OBJET : Branchement eau potable
Type de branchement : Domestique (Maison individuelle)
Diamètre : 25 mm
Débit : 1.5 m³/h

---

Total : 45,000.00 DA
Quarante-cinq mille dinars algériens.

Nb: Ce devis est valable pour une durée de 01 mois...

---

LE CHEF D'AGENCE COMMERCIALE
```

---

### **Exemple 2 : Audit Technique**

**Formulaire affiché :**
- ❌ Pas de champs techniques de branchement
- ✅ Champ "Durée estimée"
- ✅ Champ "Description détaillée"

**Document imprimé :**
```
OBJET : Audit technique
Description : Audit complet du réseau d'eau potable

---

Total : 120,000.00 DA
Cent vingt mille dinars algériens.

Nb: Ce devis est valable pour une durée de 03 mois...

---

LE CHEF DE CENTRE

LE RESPONSABLE TECHNIQUE
```

---

### **Exemple 3 : Réparation Fuite**

**Formulaire affiché :**
- ❌ Pas de champs techniques de branchement
- ✅ Champ "Durée estimée"

**Document imprimé :**
```
OBJET : Réparation fuite
Description : Réparation fuite sur canalisation principale

---

Total : 28,500.00 DA
Vingt-huit mille cinq cents dinars algériens.

Nb: Ce devis est valable pour une durée de 02 mois...

---

LE CHEF D'AGENCE COMMERCIALE
```

---

## 🎨 Avantages de Cette Approche

| Aspect | Ancien Système | Nouveau Système |
|--------|----------------|-----------------|
| **Flexibilité** | ❌ Modèle unique | ✅ Adaptatif par type |
| **Précision** | ❌ Champs génériques | ✅ Champs spécifiques |
| **Professionnalisme** | ❌ Standard | ✅ Personnalisé |
| **Maintenabilité** | ❌ Code dupliqué | ✅ Un seul composant |
| **Évolutivité** | ❌ Complexe | ✅ Facile à étendre |
| **Cohérence** | ⚠️ Variables multiples | ✅ Source unique |

---

## 🛠️ Comment Étendre le Modèle

### **Ajouter un Nouveau Type de Travaux**

1. **Mettre à jour la détection :**
```typescript
const workTypeConfig = useMemo(() => {
  // ... autres types
  const isNouveauType = formData.serviceType.toLowerCase().includes('nouveau');
  
  return {
    // ... autres configs
    isNouveauType,
    showNouveauChamp: isNouveauType,
  };
}, [formData.serviceType]);
```

2. **Ajouter les champs dans le state :**
```typescript
const [formData, setFormData] = useState({
  // ... champs existants
  nouveauChamp: initialData?.nouveauChamp || '',
});
```

3. **Ajouter le champ conditionnel dans le formulaire :**
```typescript
{workTypeConfig.showNouveauChamp && (
  <div>
    <label>Nouveau Champ</label>
    <input
      value={formData.nouveauChamp}
      onChange={e => setFormData({ ...formData, nouveauChamp: e.target.value })}
    />
  </div>
)}
```

4. **Personnaliser l'affichage imprimé :**
```typescript
{workTypeConfig.showNouveauChamp && formData.nouveauChamp && (
  <div>
    <span>Nouveau Champ :</span>
    <span>{formData.nouveauChamp}</span>
  </div>
)}
```

5. **Configurer la signature appropriée :**
```typescript
{workTypeConfig.isNouveauType && (
  <div className="flex justify-end">
    <div className="text-center w-64">
      <p>LE TITRE DU SIGNATAIRE</p>
      <div>(Nom, Signature et Cachet)</div>
    </div>
  </div>
)}
```

---

## 📝 Cohérence avec le Système

Ce modèle universel s'intègre parfaitement avec :

- ✅ **Workflow dynamique** : Validation multi-niveaux par type
- ✅ **Système de permissions** : Rôles configurables par type
- ✅ **Gestion des articles** : Base de données centralisée
- ✅ **Impression sécurisée** : Blocage si validations incomplètes
- ✅ **Auto-complétion** : Depuis les demandes sources
- ✅ **Assistant IA** : Recommandations intelligentes

---

## 🎯 Bonnes Pratiques

### **Pour les Développeurs :**
1. Toujours utiliser `workTypeConfig` pour les conditions
2. Ne pas dupliquer le code pour chaque type
3. Tester avec différents types de travaux
4. Vérifier l'affichage imprimé pour chaque type

### **Pour les Administrateurs :**
1. Configurer correctement les types de travaux
2. Définir les rôles de validation appropriés
3. Tester le workflow complet avant déploiement
4. Former les utilisateurs aux nouveaux champs

### **Pour les Utilisateurs :**
1. Remplir tous les champs techniques requis
2. Vérifier l'aperçu avant validation
3. Contrôler les informations avant impression
4. Signaler tout problème au support

---

## 📊 Résumé des Modifications

| Élément | Avant | Après |
|---------|-------|-------|
| **Champs techniques** | ❌ Aucun | ✅ Conditionnels |
| **Durée validité** | ❌ Fixe (1 mois) | ✅ Adaptative |
| **Signatures** | ❌ Unique | ✅ Dynamiques |
| **Détection type** | ❌ Manuelle | ✅ Automatique |
| **Auto-complétion** | ⚠️ Partielle | ✅ Complète |
| **Documentation** | ❌ Absente | ✅ Complète |

---

## 🔍 Fichiers Modifiés

| Fichier | Modifications | Impact |
|---------|---------------|--------|
| `QuoteForm.tsx` | + Champs techniques conditionnels<br>+ Signatures dynamiques<br>+ Durée adaptative<br>+ Détection automatique | Formulaire principal |
| `types.ts` | ✅ Déjà compatible | Aucun changement |
| `workflowConfig.ts` | ✅ Déjà compatible | Aucun changement |

---

**Dernière mise à jour :** 11 Avril 2026  
**Version :** 3.0.0 - Modèle Universel Professionnel  
**Développeur :** Assistant IA AEP Manager  
**Statut :** ✅ Production Ready
