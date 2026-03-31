# 📋 Workflow de Validation et Création de Devis - AEP Manager

## 🎯 Vue d'Ensemble

Ce document décrit le processus complet de validation des demandes et de création des devis dans AEP Manager.

---

## 🔄 Workflow de Validation

### **Étape 1 : Soumission de la Demande**
- **Qui ?** Agent ou Chef-Agence
- **Action :** Crée une nouvelle demande de travaux
- **Statut initial :** `Reçue`
- **Validations assignées :** Selon le type de prestation

---

### **Étape 2 : Validations Multi-Niveaux**

Selon le type de demande, les validations suivantes sont requises :

#### **Niveau 1 - Chef Agence** (Obligatoire)
- **Rôle :** `CHEF_AGENCE`
- **Type de validation :** `agency`
- **Action :** Valide ou rejette la demande
- **Boutons :** 
  - ✅ "Valider Chef Agence" (vert)
  - ❌ "Rejeter" (rouge)

#### **Niveau 2 - Relation Clientèle** (Si assigné)
- **Rôle :** `AGENT` (Relation Clientèle)
- **Type de validation :** `customer_service`
- **Action :** Valide ou rejette la demande
- **Boutons :**
  - ✅ "Valider Relation Clientèle" (émeraude)
  - ❌ "Rejeter" (rouge)

#### **Niveau 3 - Juriste** (Si assigné)
- **Rôle :** `JURISTE`
- **Type de validation :** `lawyer`
- **Action :** Valide ou rejette la demande
- **Boutons :**
  - ✅ "Valider Juriste" (violet)
  - ❌ "Rejeter" (rouge)

---

### **Étape 3 : Suivi des Validations**

#### **Pour chaque validateur :**
- Les demandes en attente apparaissent avec des boutons d'action
- Les demandes déjà validées montrent un bouton "Annuler Validation" (ambre)
- Le système compte automatiquement les validations en attente

#### **Filtres disponibles :**
- 🔵 **Tous** : Toutes les demandes
- 🟡 **En attente** : Demandes avec validations non terminées
- 🟢 **Validés** : Demandes entièrement validées

---

## 📝 Création du Devis

### **Condition Requise**
✅ **TOUTES** les validations doivent être terminées (statut = `validated`)

### **Utilisateurs Autorisés**
Seuls ces rôles peuvent créer un devis :
- `TECHICO_COMMERCIAL` (Technico-Commercial)
- `CHEF_CENTRE` (Chef-Centre)

### **Indicateurs Visuels**

#### ✅ **Quand les validations sont terminées :**
```
┌─────────────────────────────────────┐
│ [📄 Établir Devis]                  │
│ Bouton vert - Visible uniquement    │
│ par TECHICO_COMMERCIAL et CHEF_CENTRE│
└─────────────────────────────────────┘
```

#### ⏳ **Quand les validations sont en cours :**
```
┌─────────────────────────────────────┐
│ ⚠️ En attente de validations        │
│ Badge amber - Pour TECHICO_COMMERCIAL│
│ et CHEF_CENTRE                       │
└─────────────────────────────────────┘
```

---

## 🎨 Interface Utilisateur

### **Dans le Registre des Demandes**

#### **Ligne de tableau pour chaque demande :**

| Réf / Agence | Abonné | Prestation | Statut | Actions |
|--------------|--------|------------|--------|---------|
| 2026/001/CTR | M. Dupont | Branchement eau | À l'étude | [Boutons de validation] |

#### **Exemple de flux :**

**Cas 1 : Validation Chef Agence requise**
```
[Valider Chef Agence] [Rejeter]
→ Chef Agence clique sur "Valider"
→ La validation est enregistrée
→ Le bouton devient "Annuler Validation"
```

**Cas 2 : Toutes validations terminées**
```
Demande avec 3 validations (agency, customer_service, lawyer)
Toutes sont au statut "validated"

→ TECHICO_COMMERCIAL voit : [📄 Établir Devis]
→ CHEF_CENTRE voit : [📄 Établir Devis]
→ Autres rôles ne voient pas le bouton
```

**Cas 3 : Validations en cours**
```
Demande avec 2 validations sur 3 terminées

→ TECHICO_COMMERCIAL voit : ⚠️ En attente de validations
→ CHEF_CENTRE voit : ⚠️ En attente de validations
→ Le bouton "Établir Devis" est masqué
```

---

## 🔧 Fonctionnalités Techniques

### **Dans WorkRequestList.tsx**

#### **Détection automatique :**
```typescript
// Vérifie si TOUTES les validations sont terminées
req.validations.every(v => v.status === 'validated')
```

#### **Affichage conditionnel :**
```typescript
// Bouton visible seulement pour :
- TECHICO_COMMERCIAL
- CHEF_CENTRE
- Quand toutes validations sont "validated"
- Statut ≠ QUOTED et ≠ REJECTED
```

#### **Message d'attente :**
```typescript
// Affiché quand :
- Il y a des validations (req.validations.length > 0)
- Mais toutes ne sont pas terminées
```

---

## 📊 États du Système

### **Statuts de Demande (RequestStatus)**

| Statut | Signification | Étape |
|--------|---------------|-------|
| `Reçue` | Demande soumise | Initiale |
| `À l'étude` | En cours d'analyse | Intermédiaire |
| `Validée` | Toutes validations OK | Prête pour devis |
| `Devis établi` | Devis créé | Finale |
| `Rejetée` | Demande refusée | Finale |

### **Statuts de Validation**

| Statut | Signification |
|--------|---------------|
| `pending` | En attente de validation |
| `validated` | Validée par l'utilisateur concerné |
| `rejected` | Rejetée par l'utilisateur concerné |

---

## 🎯 Notifications

### **Quand un devis est créé :**
```
┌─────────────────────────────────────┐
│ ℹ️ Création de Devis                │
│ Toutes les validations sont         │
│ terminées. Vous pouvez maintenant   │
│ créer le devis.                     │
└─────────────────────────────────────┘
```

### **Après validation réussie :**
```
┌─────────────────────────────────────┐
│ ✅ Validation Enregistrée           │
│ Notification toast en haut à droite │
└─────────────────────────────────────┘
```

---

## 🛠️ Rôles et Permissions

### **Récapitulatif des Actions par Rôle**

| Action | AGENT | CHEF_AGENCE | JURISTE | TECHICO_COMMERCIAL | CHEF_CENTRE |
|--------|-------|-------------|---------|-------------------|-------------|
| Créer demande | ✅ | ✅ | ❌ | ❌ | ❌ |
| Valider (Agency) | ❌ | ✅ | ❌ | ❌ | ❌ |
| Valider (Customer Service) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Valider (Lawyer) | ❌ | ❌ | ✅ | ❌ | ❌ |
| **Créer devis** | ❌ | ❌ | ❌ | ✅ | ✅ |
| Modifier demande | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 📈 Améliorations Apportées

### **Avant :**
- ❌ Bouton "Établir Devis" peu visible
- ❌ Pas d'indication quand les validations sont en cours
- ❌ Pas de notification lors de la création de devis

### **Après :**
- ✅ Bouton "Établir Devis" avec titre explicite
- ✅ Message "En attente de validations" clair
- ✅ Notification toast lors de la création de devis
- ✅ Meilleure visibilité du statut des validations
- ✅ UX améliorée avec couleurs et icônes

---

## 💡 Bonnes Pratiques

### **Pour les Utilisateurs :**

1. **Vérifiez les validations :**
   - Consultez le filtre "En attente" pour voir vos validations à faire
   - Le badge de notification dans le menu indique le nombre de validations en attente

2. **Attendez la validation complète :**
   - Ne créez un devis que quand TOUTES les validations sont vertes
   - Le message "En attente de validations" vous guide

3. **Utilisez les bons boutons :**
   - "Valider" → Confirme la demande
   - "Rejeter" → Refuse la demande (avec motif)
   - "Annuler Validation" → Annule votre validation précédente

---

## 🔍 Dépannage

### **Le bouton "Établir Devis" n'apparaît pas ?**

**Vérifications :**
1. ✅ Toutes les validations sont-elles au statut "validated" ?
2. ✅ Êtes-vous TECHICO_COMMERCIAL ou CHEF_CENTRE ?
3. ✅ Le statut de la demande n'est-il pas "Rejetée" ?
4. ✅ Un devis n'a-t-il pas déjà été créé (statut "Devis établi") ?

### **Message "En attente de validations" affiché ?**
- Attendez que tous les validateurs concernés aient terminé
- Contactez les utilisateurs qui n'ont pas encore validé
- Vérifiez le filtre "En attente" pour voir qui doit valider

---

**Dernière mise à jour :** 31 Mars 2026  
**Version :** 1.0.0
