# 🔔 Notification d'Établissement de Devis - AEP Manager

## 🎯 Fonctionnalité Implémentée

**Objectif :** Afficher une notification (badge) **uniquement aux utilisateurs autorisés à créer des devis** (ADMIN, CHEF_CENTRE, TECHICO_COMMERCIAL) lorsqu'une demande d'établissement de devis quantitatif et estimatif a été générée.

---

## 📋 Modifications Apportées

### 1️⃣ **App.tsx** - Gestion des Notifications

#### **NOUVELLE Fonction : `getQuoteEstablishmentCount()`**

```typescript
const getQuoteEstablishmentCount = () => {
  if (!currentUser) return 0;
  
  // Seuls ces rôles voient la notification
  const canCreateQuotes = currentUser.role === UserRole.ADMIN || 
                         currentUser.role === UserRole.CHEF_CENTRE || 
                         currentUser.role === UserRole.TECHICO_COMMERCIAL;
  
  if (!canCreateQuotes) return 0;
  
  // Compter les demandes VALIDATED qui ont besoin d'un devis
  return requests.filter(req => {
    // Doit être au statut VALIDATED
    if (req.status !== RequestStatus.VALIDATED) return false;
    
    // Vérifier qu'il n'y a pas encore de devis créé
    const hasQuote = quotes.some(q => q.requestId === req.id);
    if (hasQuote) return false;
    
    // Vérifier que toutes les validations sont complètes
    if (req.assignedValidations && req.assignedValidations.length > 0) {
      const allValidated = req.assignedValidations.every(type => 
        req.validations?.find(v => v.type === type && v.status === 'validated')
      );
      return allValidated;
    }
    
    return true;
  }).length;
};
```

---

### 2️⃣ **Logique du Badge**

#### **Avant :**
```typescript
quotesBadgeCount={readyForQuoteCount}
// Affiche TOUJOURS le nombre de demandes prêtes
```

#### **Après :**
```typescript
quotesBadgeCount={
  readyForQuoteCount > 0 
    ? readyForQuoteCount 
    : quoteEstablishmentCount > 0 
      ? quoteEstablishmentCount 
      : 0
}
// Priorité aux demandes prêtes, sinon affiche les demandes d'établissement
```

---

## 🎨 Comportement Utilisateur

### **Scénario 1 : Un utilisateur génère une demande d'établissement**

```
Utilisateur (ex: AGENT) clique sur [📄 Document]
    ↓
Confirme la génération
    ↓
Le document "DEMANDE D'ÉTABLISSEMENT DE DEVIS" est imprimé
    ↓
La demande reste au statut VALIDATED
    ↓
Le badge apparaît SEULEMENT pour :
  ✅ ADMIN
  ✅ CHEF_CENTRE
  ✅ TECHICO_COMMERCIAL
```

### **Scénario 2 : Visualisation du Badge**

#### **Pour ADMIN / CHEF_CENTRE / TECHICO_COMMERCIAL :**
```
┌─────────────────────────────────────┐
│ Menu :                              │
│   Dashboard                         │
│   Demandes                    🔴 3  │ ← BADGE AFFICHÉ
│   Chantiers                         │
│   Articles                          │
│   ...                               │
└─────────────────────────────────────┘
```

#### **Pour CHEF_AGENCE / AGENT / JURISTE :**
```
┌─────────────────────────────────────┐
│ Menu :                              │
│   Dashboard                         │
│   Demandes                          │ ← PAS DE BADGE
│   Chantiers                         │
│   Articles                          │
│   ...                               │
└─────────────────────────────────────┘
```

---

## 📊 Règles d'Affichage du Badge

### **Conditions Requises :**

| Condition | Requis | Explication |
|-----------|--------|-------------|
| **Statut** | ✅ `VALIDATED` | La demande doit avoir été validée par tous |
| **Devis existant** | ❌ AUCUN | Aucun devis ne doit exister pour cette demande |
| **Validations** | ✅ COMPLÈTES | Toutes les validations assignées doivent être faites |
| **Rôle utilisateur** | ✅ SPÉCIFIQUE | ADMIN, CHEF_CENTRE ou TECHICO_COMMERCIAL uniquement |

---

## 🔄 Workflow Complet

### **Étape 1 : Validation Complète**
```
Demande créée → Statut: REÇUE
    ↓
Chef d'Agence valide ✅
    ↓
Relation Clientèle valide ✅
    ↓
Juriste valide ✅
    ↓
Statut passe à: VALIDATED
```

### **Étape 2 : Génération Demande d'Établissement**
```
Utilisateur autorisé voit [📄 Document]
    ↓
Clique et confirme
    ↓
Document A4 généré et imprimé
    ↓
La demande RESTE au statut VALIDATED
    ↓
BADGE APPARAÎT pour ADMIN/CHEF_CENTRE/TECHICO_COMMERCIAL
```

### **Étape 3 : Création du Devis**
```
ADMIN/CHEF_CENTRE/TECHICO_COMMERCIAL voit le badge 🔴
    ↓
Clique sur "Demandes" dans le menu
    ↓
Voit la demande avec le bouton [📄 Établir Devis]
    ↓
Crée le devis
    ↓
Statut passe à: QUOTED
    ↓
BADGE DISPARAÎT (ou diminue)
```

---

## 💡 Exemples Concrets

### **Exemple 1 : Ahmed (ADMIN)**

```
Contexte:
- 2 demandes prêtes à être devisées (readyForQuoteCount = 2)
- 1 demande avec établissement généré (quoteEstablishmentCount = 1)

Résultat:
Badge affiché: 🔴 2 (priorité à readyForQuoteCount)
```

### **Exemple 2 : Fatima (CHEF_CENTRE)**

```
Contexte:
- 0 demandes prêtes (readyForQuoteCount = 0)
- 3 demandes avec établissement généré (quoteEstablishmentCount = 3)

Résultat:
Badge affiché: 🔴 3 (affiche quoteEstablishmentCount)
```

### **Exemple 3 : Pierre (TECHICO_COMMERCIAL)**

```
Contexte:
- 0 demandes prêtes (readyForQuoteCount = 0)
- 5 demandes avec établissement généré (quoteEstablishmentCount = 5)

Résultat:
Badge affiché: 🔴 5 (affiche quoteEstablishmentCount)
```

### **Exemple 4 : Mohamed (CHEF_AGENCE)**

```
Contexte:
- 0 demandes prêtes (readyForQuoteCount = 0)
- 5 demandes avec établissement généré (quoteEstablishmentCount = 5)

Résultat:
Badge affiché: AUCUN (rôle non autorisé à créer des devis)
```

---

## 🔍 Logique de Priorité

```
┌──────────────────────────────────────────┐
│ PRIORITÉ 1: readyForQuoteCount > 0       │
│                                          │
│ Si des demandes sont prêtes à être       │
│ devisées, afficher ce nombre en priorité │
└──────────────────────────────────────────┘
              ↓ (sinon)
┌──────────────────────────────────────────┐
│ PRIORITÉ 2: quoteEstablishmentCount > 0  │
│                                          │
│ Si aucune demande prête mais qu'il y a   │
│ des demandes d'établissement, afficher   │
│ ce nombre                                │
└──────────────────────────────────────────┘
              ↓ (sinon)
┌──────────────────────────────────────────┐
│ PRIORITÉ 3: 0                            │
│                                          │
│ Aucun badge affiché                      │
└──────────────────────────────────────────┘
```

---

## 📝 Code de Priorité

```typescript
quotesBadgeCount = 
  readyForQuoteCount > 0 
    ? readyForQuoteCount           // Priorité 1
    : quoteEstablishmentCount > 0 
      ? quoteEstablishmentCount     // Priorité 2
      : 0                           // Priorité 3
```

---

## 🎯 Rôles et Permissions

### **Utilisateurs voyant le badge :**

| Rôle | Voit le badge | Peut créer devis | Peut générer établissement |
|------|---------------|------------------|---------------------------|
| **ADMIN** | ✅ OUI | ✅ OUI | ✅ OUI |
| **CHEF_CENTRE** | ✅ OUI | ✅ OUI | ✅ OUI |
| **TECHICO_COMMERCIAL** | ✅ OUI | ✅ OUI | ✅ OUI |

### **Utilisateurs NE voyant PAS le badge :**

| Rôle | Voit le badge | Peut créer devis | Peut générer établissement |
|------|---------------|------------------|---------------------------|
| **CHEF_AGENCE** | ❌ NON | ❌ NON | ✅ OUI (si autorisé par type) |
| **AGENT** | ❌ NON | ❌ NON | ✅ OUI (si autorisé par type) |
| **JURISTE** | ❌ NON | ❌ NON | ❌ NON |

---

## 🔄 Cohérence avec le Système

### **Liens avec autres fonctionnalités :**

```
Génération Document A4
    ↓
Statut reste VALIDATED
    ↓
Notification-badge déclenché
    ↓
Seuls rôles autorisés voient
    ↓
Cliquent sur Demandes (avec badge)
    ↓
Voient bouton [📄 Établir Devis]
    ↓
Créent le devis
    ↓
Statut passe à QUOTED
    ↓
Badge diminue/disparaît
```

---

## 🛠️ Comment Tester

### **Test 1 : En tant qu'ADMIN**

1. **Se connecter** en tant qu'ADMIN
2. **Trouver** une demande VALIDATED sans devis
3. **Générer** la demande d'établissement de devis
4. **Vérifier** que le badge apparaît sur le menu "Demandes"
5. **Cliquer** sur "Demandes" et voir la liste avec le bouton de création de devis

### **Test 2 : En tant qu'AGENT**

1. **Se connecter** en tant qu'AGENT
2. **Générer** une demande d'établissement de devis
3. **Vérifier** que le badge N'APPARAÎT PAS (normal, AGENT ne peut pas créer de devis)

### **Test 3 : En tant que CHEF_CENTRE**

1. **Se connecter** en tant que CHEF_CENTRE
2. **Voir** le badge rouge sur "Demandes"
3. **Cliquer** et **trouver** la demande avec [📄 Établir Devis]
4. **Créer** le devis
5. **Vérifier** que le badge a diminué ou disparu

---

## 📊 Résumé des Fichiers Modifiés

| Fichier | Type | Modifications |
|---------|------|---------------|
| `App.tsx` | 🔄 MODIFIÉ | + Fonction `getQuoteEstablishmentCount()`<br>+ Logique de priorité badge |

---

## 💡 Avantages de Cette Approche

| Aspect | Avantage |
|--------|----------|
| **Ciblage** | ✅ Seuls les utilisateurs concernés voient la notification |
| **Clarté** | ✅ Pas de confusion pour les rôles non autorisés |
| **Efficacité** | ✅ Les décideurs sont immédiatement notifiés |
| **Workflow** | ✅ Enchaînement naturel : Génération → Notification → Création |
| **Flexibilité** | ✅ Gère à la fois les demandes prêtes et les établissements générés |

---

## 🎨 Visuel du Badge

```css
/* Dans Layout.tsx */
<span className="ml-1.5 flex h-4 w-4 items-center justify-center 
                 rounded-full bg-rose-600 text-[9px] sm:text-[10px] 
                 font-black text-white ring-2 ring-white animate-pulse">
  {count}
</span>
```

**Caractéristiques :**
- 🔴 **Couleur :** Rouge rose (`bg-rose-600`)
- ⚡ **Animation :** Pulsation (`animate-pulse`)
- 📏 **Taille :** 4x4 (16px)
- 🔤 **Police :** 9-10px, gras

---

**Dernière mise à jour :** 31 Mars 2026  
**Version :** 4.0.0 - Avec notification d'établissement de devis  
**Fichiers modifiés :** `App.tsx`
