# 📝 Gestion des Motifs d'Annulation de Validation - AEP Manager

## 🎯 Fonctionnalité Implémentée

**Objectif :** Enregistrer et afficher systématiquement le motif lorsqu'un utilisateur annule sa validation.

---

## 🔧 Modifications Apportées

### 1️⃣ **WorkRequestList.tsx** - Fonction `handleCancelValidation`

#### **Avant :**
```typescript
const { value: text } = await Swal.fire({
  title: 'Motif d\'annulation',
  input: 'textarea',
  // ...
});

if (!text) return;

const updatedRequest = {
  ...req,
  rejectionReason: `Annulée: ${text}`
};
```

#### **Après :**
```typescript
const { value: cancellationReason } = await Swal.fire({
  title: 'Motif d\'annulation',
  input: 'textarea',
  inputLabel: 'Pourquoi annulez-vous la validation de cette demande ?',
  inputPlaceholder: 'Saisissez ici le motif d\'annulation (obligatoire)...',
  inputAttributes: {
    'aria-label': 'Motif d\'annulation'
  },
  showCancelButton: true,
  confirmButtonText: 'Annuler la validation',
  cancelButtonText: 'Ignorer',
  confirmButtonColor: '#dc2626',
  cancelButtonColor: '#6b7280',
  inputValidator: (value) => {
    if (!value || value.trim() === '') {
      return 'Le motif est obligatoire pour annuler une validation !'
    }
    return null;
  }
});

if (!cancellationReason || cancellationReason.trim() === '') return;

// Créer un enregistrement de validation pour tracer l'annulation
const cancellationRecord: ValidationRecord = {
  type: validationType,
  status: 'pending',
  userId: currentUser?.id || '',
  userName: currentUser?.fullName || 'Utilisateur inconnu',
  validatedAt: new Date().toISOString(),
  date: new Date().toISOString(),
  user: currentUser?.fullName || 'Utilisateur inconnu',
  reason: `❌ ANNULATION - ${cancellationReason.trim()}`
};

const updatedRequest = {
  ...req,
  validations: filteredValidations,
  status: RequestStatus.RECEIVED,
  rejectionReason: `⚠️ Validation annulée par ${currentUser?.fullName || 'Utilisateur'} : ${cancellationReason.trim()}`
};
```

---

### 2️⃣ **Affichage Amélioré dans le Tableau**

#### **Ancien Affichage :**
```
┌──────────────────────────────┐
│ Statut: Validée              │
│                              │
│ ❌ Motif:                    │
│ Annulée: Texte du motif      │
└──────────────────────────────┘
```

#### **Nouvel Affichage :**
```
┌──────────────────────────────┐
│ Statut: Validée              │
│                              │
│ 🔄 Motif d'annulation:       │
│ ⚠️ Validation annulée par    │
│ Jean Dupont : Document       │
│ incomplet                    │
│                              │
│ Validations:                 │
│ ✅ agency                    │
│ ✅ customer_service          │
│ ❌ lawyer (Document manquant)│
└──────────────────────────────┘
```

---

## 📊 Fonctionnalités Clés

### ✅ **Obligation du Motif**
- Le champ de saisie du motif est **maintenant obligatoire**
- Validation : `if (!value || value.trim() === '')`
- Message d'erreur : "Le motif est obligatoire pour annuler une validation !"

### ✅ **Traçabilité Complète**
Chaque annulation crée un enregistrement avec :
- **Type de validation** annulée
- **Utilisateur** qui a annulé
- **Date et heure** de l'annulation
- **Motif détaillé** de l'annulation
- **Statut** de l'annulation

### ✅ **Affichage Contextuel**
Le système distingue visuellement :

| Type | Couleur | Icône | Exemple |
|------|---------|-------|---------|
| **Annulation** | Amber (🟡) | 🔄 | "🔄 Motif d'annulation:" |
| **Rejet** | Rose (🔴) | ❌ | "❌ Motif de rejet:" |

### ✅ **Historique des Validations**
Affichage de toutes les validations avec leurs statuts :
- ✅ **Validée** (vert émeraude)
- ❌ **Rejetée** (rose)
- 📝 **Motif** affiché au survol ou directement

---

## 🎨 Interface Utilisateur

### **Formulaire d'Annulation**

```
┌─────────────────────────────────────────┐
│  Motif d'annulation                     │
│                                         │
│  Pourquoi annulez-vous la validation    │
│  de cette demande ?                     │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │ Saisissez ici le motif            │  │
│  │ d'annulation (obligatoire)...     │  │
│  │                                   │  │
│  │                                   │  │
│  └───────────────────────────────────┘  │
│                                         │
│     [Annuler la validation] [Ignorer]   │
└─────────────────────────────────────────┘
```

### **Exemple de Flux Complet**

#### **Étape 1 : Chef Agence valide**
```
Demande #2026/001/CTR
→ Chef Agence clique sur "Valider Chef Agence"
→ Statut: validation "agency" = ✅ validated
```

#### **Étape 2 : Chef Agence annule sa validation**
```
→ Formulaire s'ouvre : "Motif d'annulation"
→ Saisie : "Le client n'a pas fourni tous les documents"
→ Confirmation
→ Statut: validation "agency" = ❌ ANNULATION
→ rejectionReason: "⚠️ Validation annulée par Jean Dupont : 
   Le client n'a pas fourni tous les documents"
→ Statut demande: "Reçue"
```

#### **Étape 3 : Affichage dans le tableau**
```
┌───────────────────────────────────────────┐
│ Réf: 2026/001/CTR                         │
│ Statut: Reçue                             │
│                                           │
│ 🔄 Motif d'annulation:                    │
│ ⚠️ Validation annulée par Jean Dupont :   │
│    Le client n'a pas fourni tous les      │
│    documents                              │
│                                           │
│ Validations:                              │
│ ❌ agency (❌ ANNULATION - Le client...)  │
└───────────────────────────────────────────┘
```

---

## 🔍 Structure des Données

### **ValidationRecord (avec annulation)**
```typescript
interface ValidationRecord {
  type: ValidationType;        // 'agency', 'customer_service', 'lawyer'
  status: 'pending' | 'validated' | 'rejected';
  userId: string;
  userName: string;
  validatedAt: string;         // ISO date string
  date?: string;
  user?: string;
  reason?: string;             // Motif (rejet ou annulation)
}
```

### **Exemple d'enregistrement après annulation**
```json
{
  "type": "agency",
  "status": "pending",
  "userId": "USR-001",
  "userName": "Jean Dupont",
  "validatedAt": "2026-03-31T14:30:00.000Z",
  "date": "2026-03-31T14:30:00.000Z",
  "user": "Jean Dupont",
  "reason": "❌ ANNULATION - Le client n'a pas fourni tous les documents"
}
```

---

## 💡 Bonnes Pratiques

### **Pour les Utilisateurs :**

1. **Soyez précis dans le motif :**
   - ✅ "Document CNI manquant"
   - ✅ "Adresse incomplète dans le dossier"
   - ✅ "Client doit fournir justificatif de domicile"
   - ❌ "Pas bon" (trop vague)

2. **Consultez l'historique :**
   - Passez la souris sur les motifs tronqués
   - Vérifiez toutes les validations avant de créer un devis

3. **Respectez le workflow :**
   - Une annulation retourne la demande au statut "Reçue"
   - Toutes les validations doivent être refaites

---

## 🛠️ Avantages de la Solution

### **Avant :**
- ❌ Motif peu clair ("Annulée: texte")
- ❌ Pas de traçabilité de qui a annulé
- ❌ Pas d'historique des validations
- ❌ Affichage uniforme rejets/annulations

### **Après :**
- ✅ **Motif obligatoire** et bien formaté
- ✅ **Traçabilité complète** (qui, quand, pourquoi)
- ✅ **Historique complet** des validations dans le tableau
- ✅ **Distinction visuelle** claire entre rejet et annulation
- ✅ **Notification améliorée** avec affichage du motif

---

## 📈 Impact sur le Workflow

### **Workflow Normal :**
```
Soumission → Validation Agency → Validation CS → Validation Lawyer 
→ Devis
```

### **Workflow avec Annulation :**
```
Soumission → Validation Agency → Validation CS → Validation Lawyer 
→ Annulation Lawyer (motif enregistré)
→ Retour à "Reçue"
→ Nouvelle validation Agency → Nouvelle validation CS → Nouvelle validation Lawyer
→ Devis
```

---

## 🔒 Sécurité et Audit

### **Pistes d'audit :**
Chaque annulation laisse une trace avec :
- ✅ Qui a annulé (userId, userName)
- ✅ Quand (timestamp)
- ✅ Pourquoi (reason)
- ✅ Quelle validation (type)

### **Imputabilité :**
- Les annulations sont signées électroniquement
- Impossible d'annuler sans motif
- Historique conservé dans la base de données

---

## 🎯 Cas d'Usage

### **Cas 1 : Document Manquant**
```
Utilisateur: Chef Agence
Motif: "CNI du client non fournie"
Résultat: Demande retournée pour complément
```

### **Cas 2 : Erreur de Saisie**
```
Utilisateur: Relation Clientèle
Motif: "Erreur sur le type de branchement -应该是 PEC instead of PEHD"
Résultat: Correction et nouvelle soumission
```

### **Cas 3 : Non-Conformité**
```
Utilisateur: Juriste
Motif: "Dossier ne respecte pas la norme NF EN 805"
Résultat: Mise en conformité requise
```

---

## 📊 Statistiques et Suivi

Les motifs d'annulation permettent :
- D'analyser les erreurs récurrentes
- D'améliorer les processus
- De former les utilisateurs
- De réduire les délais de traitement

---

**Dernière mise à jour :** 31 Mars 2026  
**Version :** 1.0.0  
**Fichier modifié :** `components/WorkRequestList.tsx`
