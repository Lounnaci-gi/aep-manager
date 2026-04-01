# 📄 Demande d'Établissement de Devis Quantitatif et Estimatif - AEP Manager

## 🎯 Fonctionnalité Implémentée

**Objectif :** Lorsqu'une demande est **validée par tous les utilisateurs concernés** (statut = `VALIDATED`), générer automatiquement un document officiel **"DEMANDE D'ÉTABLISSEMENT DE DEVIS QUANTITATIF ET ESTIMATIF"** en format A4.

---

## 📋 Modifications Apportées

### 1️⃣ **QuoteEstablishmentRequestPrint.tsx** - NOUVEAU COMPOSANT

**Fichier créé :** `components/QuoteEstablishmentRequestPrint.tsx`

Ce composant génère un document officiel en format A4 avec :

#### **Structure du Document :**

```
┌─────────────────────────────────────────────┐
│ [Logo ADE]    DEMANDE D'ÉTABLISSEMENT       │
│                 DE DEVIS                    │
│               QUANTITATIF                   │
│              ET ESTIMATIF                   │
│                                             │
│ Réf: REQ-2026-XXXX                          │
│ Date: 31/03/2026                            │
└─────────────────────────────────────────────┘

1. DEMANDEUR / ABONNÉ
   - Nom et prénom
   - Pièce d'identité
   - Qualité
   - Adresse et coordonnées

2. OBJET DE LA DEMANDE DE DEVIS
   - Nature des travaux
   - Localisation
   - Description détaillée

3. SPÉCIFICATIONS TECHNIQUES (si branchement)
   - Usage
   - Diamètre
   - Débit
   - Type

4. VALIDATIONS ADMINISTRATIVES OBTENUES
   ┌──────────────────────────────────┐
   │ Service Validateur │ Statut     │
   ├──────────────────────────────────┤
   │ Chef d'Agence      │ ✅ Validé  │
   │ Relation Clientèle │ ✅ Validé  │
   │ Direction/Juriste  │ ✅ Validé  │
   └──────────────────────────────────┘

5. DÉCISION ET ÉTABLISSEMENT DU DEVIS
   "IL EST DEMANDÉ À M./MME LE(CHEF CENTRE / 
   RESPONSABLE COMMERCIAL) DE BIEN VOULOIR 
   ÉTABLIR UN DEVIS QUANTITATIF ET ESTIMATIF..."
   
   Signature et Cachet
```

---

### 2️⃣ **WorkRequestList.tsx** - Bouton de Génération

#### **Ajout du Bouton :**

```typescript
// Uniquement si le statut est VALIDATED
{req.status === RequestStatus.VALIDATED && (
  <button 
    onClick={() => {
      Swal.fire({
        title: 'Générer la Demande d\'Établissement de Devis',
        text: `Cette action va générer un document officiel...`,
        icon: 'info',
        showCancelButton: true,
        confirmButtonColor: '#059669',
        confirmButtonText: '✅ Générer le document'
      }).then((result) => {
        if (result.isConfirmed) {
          setPrintingQuoteEstablishment(req);
        }
      });
    }} 
    className="text-emerald-600 hover:text-emerald-700 ..."
    title="Générer la demande d'établissement de devis"
  >
    📄 Document
  </button>
)}
```

#### **Caractéristiques :**
- ✅ **Couleur :** Vert émeraude (`text-emerald-600`)
- ✅ **Icône :** Document officiel
- ✅ **Condition :** Uniquement si `status === VALIDATED`
- ✅ **Confirmation :** SweetAlert2 avant génération
- ✅ **Titre :** "Générer la demande d'établissement de devis quantitatif et estimatif"

---

### 3️⃣ **App.tsx** - Transmission du State

Le state `printingQuoteEstablishment` est géré dans `WorkRequestList.tsx` :

```typescript
const [printingQuoteEstablishment, setPrintingQuoteEstablishment] = useState<WorkRequest | null>(null);
```

---

## 🎨 Interface Utilisateur

### **Dans le Registre des Demandes**

#### **Avant Validation Complète :**
```
┌─────────────────────────────────────────────┐
│ Demande #REQ-2026-0001                      │
│ Statut: EN_ATTENTE_VALIDATION               │
│                                             │
│ Actions:                                    │
│   [📄 Imprimer]                             │
│   (Bouton devis NON visible)                │
└─────────────────────────────────────────────┘
```

#### **Après Validation Complète :**
```
┌─────────────────────────────────────────────┐
│ Demande #REQ-2026-0001                      │
│ Statut: VALIDÉE ✅                          │
│                                             │
│ Actions:                                    │
│   [📄 Imprimer]                             │
│   [📄 Document] ← NOUVEAU BOUTON            │
│      (Vert, pour générer la demande         │
│       d'établissement de devis)             │
└─────────────────────────────────────────────┘
```

---

## 🔄 Workflow Complet

### **Étape 1 : Création de la Demande**
```
Utilisateur crée une demande
    ↓
Demande enregistrée avec statut "REÇUE"
    ↓
Assignation des validations nécessaires
```

### **Étape 2 : Cycle de Validation**
```
Chef d'Agence valide ✅
    ↓
Relation Clientèle valide ✅
    ↓
Direction/Juriste valide ✅
    ↓
Statut passe à "VALIDÉE"
```

### **Étape 3 : Génération du Document**
```
Utilisateur voit le bouton [📄 Document]
    ↓
Clique sur le bouton
    ↓
Confirmation SweetAlert2
    ↓
Ouverture du formulaire A4
    ↓
Impression ou PDF
```

---

## 📊 Exemple Concret

### **Scénario : Demande de Branchement**

**Données de la demande :**
```json
{
  "id": "REQ-2026-0042",
  "clientName": "Dupont Jean",
  "serviceType": "Branchement eau potable",
  "installationAddress": "Lot 123, Cité Les Pins",
  "installationCommune": "Alger Centre",
  "status": "VALIDATED",
  "validations": [
    {
      "type": "AGENCY",
      "status": "validated",
      "userName": "Ahmed Benali",
      "validatedAt": "2026-03-28T10:30:00Z"
    },
    {
      "type": "CUSTOMER_SERVICE",
      "status": "validated",
      "userName": "Fatima Zahra",
      "validatedAt": "2026-03-29T14:15:00Z"
    },
    {
      "type": "LAWYER",
      "status": "validated",
      "userName": "Pierre Martin",
      "validatedAt": "2026-03-30T09:45:00Z"
    }
  ]
}
```

**Document généré :**

```
═══════════════════════════════════════════
   ALGÉRIENNE DES EAUX
   Unité de Alger-Est
   Agence : Bab Ezzouar
   
   DEMANDE D'ÉTABLISSEMENT
   DE DEVIS QUANTITATIF
   ET ESTIMATIF
   
   Réf : REQ-2026-0042
   Date : 31/03/2026
═══════════════════════════════════════════

1. DEMANDEUR / ABONNÉ
─────────────────────
Nom et Prénom : DUPONT Jean
Pièce d'Identité : Carte N° 192837465
Qualité : Particulier
Adresse : Lot 123, Cité Les Pins, Alger Centre
Tél : 0550123456

2. OBJET DE LA DEMANDE DE DEVIS
────────────────────────────────
Nature : Branchement eau potable
Localisation : Lot 456, Rue des Frères Bouguerra
Commune : Hydra, Alger

3. SPÉCIFICATIONS TECHNIQUES
────────────────────────────
Usage : Domestique
Diamètre : 25 mm
Débit : 3 m³/h

4. VALIDATIONS ADMINISTRATIVES OBTENUES
───────────────────────────────────────
Service              │ Statut │ Validé Par
─────────────────────┼────────┼────────────
Chef d'Agence        │ ✅     │ Ahmed Benali
                     │        │ Le 28/03/2026
─────────────────────┼────────┼────────────
Relation Clientèle   │ ✅     │ Fatima Zahra
                     │        │ Le 29/03/2026
─────────────────────┼────────┼────────────
Direction / Juriste  │ ✅     │ Pierre Martin
                     │        │ Le 30/03/2026
─────────────────────┴────────┴────────────

✅ TOUTES LES VALIDATIONS SONT COMPLÈTES
   DOSSIER ÉLIGIBLE À L'ÉTABLISSEMENT DU DEVIS

5. DÉCISION ET ÉTABLISSEMENT DU DEVIS
─────────────────────────────────────
Vu la demande ci-dessus et les validations obtenues,

IL EST DEMANDÉ À M./MME LE(CHEF CENTRE / RESPONSABLE 
COMMERCIAL) DE BIEN VOULOIR ÉTABLIR UN DEVIS 
QUANTITATIF ET ESTIMATIF POUR LA RÉALISATION 
DES TRAVAUX MENTIONNÉS.

Fait à Alger, le ___/___/______


_____________________           _____________________
Signature et Cachet                  Le Demandeur
                                     (Signature)

═══════════════════════════════════════════
Document généré par ADE-MANAGER le 31/03/2026 10:30
www.ade.dz
═══════════════════════════════════════════
```

---

## 🔍 Conditions d'Affichage

### **Le Bouton Apparaît Si :**

```typescript
✅ req.status === RequestStatus.VALIDATED
```

### **Le Bouton N'Apparaît PAS Si :**

```typescript
❌ req.status === RequestStatus.RECEIVED
❌ req.status === RequestStatus.UNDER_STUDY
❌ req.status === RequestStatus.REJECTED
❌ req.status === RequestStatus.QUOTED (déjà devisé)
```

---

## 🎨 Design du Document

### **Caractéristiques Visuelles :**

| Section | Couleur | Style |
|---------|---------|-------|
| **En-tête** | Bleu ADE + Vert émeraude | Logo + Titre encadré |
| **Section 1** | Dégradé bleu | Bandeau coloré |
| **Section 2** | Dégradé vert émeraude | Bandeau coloré |
| **Section 3** | Dégradé ambre | Bandeau coloré (si branchement) |
| **Section 4** | Dégradé violet | Tableau des validations |
| **Section 5** | Dégradé rouge | Décision et signature |

### **Format :**
- ✅ **Largeur :** 210mm (A4 standard)
- ✅ **Marges :** Optimisées pour impression
- ✅ **Police :** Hiérarchie claire (titres, sous-titres, contenu)
- ✅ **Icônes :** SVG pour qualité optimale

---

## 💡 Avantages de Cette Fonctionnalité

| Aspect | Bénéfice |
|--------|----------|
| **Automatisation** | ✅ Génération instantanée du document |
| **Professionalisme** | ✅ Format standardisé et cohérent |
| **Traçabilité** | ✅ Toutes les validations sont listées |
| **Conformité** | ✅ Respect des procédures administratives |
| **Efficacité** | ✅ Plus de saisie manuelle nécessaire |
| **Flexibilité** | ✅ Impression ou export PDF |

---

## 🛠️ Comment Utiliser

### **Pour un Utilisateur Autorisé :**

1. **Accéder au** : Registre des Demandes
2. **Identifier** : Une demande avec statut "VALIDÉE" ✅
3. **Cliquer sur** : [📄 Document] (bouton vert)
4. **Confirmer** : Dans la fenêtre SweetAlert2
5. **Vérifier** : Le document s'ouvre en grand format
6. **Imprimer** : Ou exporter en PDF

---

## 📝 Structure Détaillée du Document

### **Page A4 Complète :**

```
╔══════════════════════════════════════════════════════╗
║  [Logo ADE]                                          ║
║                                                      ║
║  ALGÉRIENNE DES EAUX                                 ║
║  Unité de [Centre]                                   ║
║  Agence : [Nom Agence]                               ║
║                                                      ║
║                    DEMANDE D'ÉTABLISSEMENT           ║
║                    DE DEVIS QUANTITATIF              ║
║                    ET ESTIMATIF                      ║
║                                                      ║
║  Réf : REQ-XXXX                                      ║
║  Date : JJ/MM/AAAA                                   ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  1. DEMANDEUR / ABONNÉ                               ║
║     ─────────────────                                ║
║     • Nom et prénom                                  ║
║     • Pièce d'identité                               ║
║     • Qualité                                        ║
║     • Adresse                                        ║
║     • Coordonnées                                    ║
║                                                      ║
║  2. OBJET DE LA DEMANDE DE DEVIS                     ║
║     ─────────────────────────────                    ║
║     • Nature des travaux                             ║
║     • Localisation                                   ║
║     • Description                                    ║
║                                                      ║
║  3. SPÉCIFICATIONS TECHNIQUES (si applicable)        ║
║     ───────────────────────────────                  ║
║     • Usage                                          ║
║     • Diamètre                                       ║
║     • Débit                                          ║
║                                                      ║
║  4. VALIDATIONS ADMINISTRATIVES                      ║
║     ─────────────────────────                        ║
║     ┌──────────────────────────────────┐             ║
║     │ Service │ Statut │ Validé Par   │             ║
║     ├─────────┼────────┼──────────────┤             ║
║     │ Chef    │   ✅   │ Nom + Date   │             ║
║     │ Client  │   ✅   │ Nom + Date   │             ║
║     │ Juriste │   ✅   │ Nom + Date   │             ║
║     └──────────────────────────────────┘             ║
║                                                      ║
║  5. DÉCISION                                         ║
║     ──────────                                       ║
║     "IL EST DEMANDÉ À..."                            ║
║                                                      ║
║     Signature et Cachet                              ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
```

---

## 🔄 Intégration avec le Système

### **Liens avec Autres Fonctionnalités :**

```
Validation Workflow
    ↓
Statut VALIDATED
    ↓
Bouton [📄 Document] apparaît
    ↓
Génération QuoteEstablishmentRequestPrint
    ↓
Impression / PDF
    ↓
Transmission au service concerné
    ↓
Création du devis (étape suivante)
```

---

## 📊 Résumé des Fichiers Modifiés

| Fichier | Type | Modifications |
|---------|------|---------------|
| `QuoteEstablishmentRequestPrint.tsx` | ✨ NOUVEAU | Composant d'impression A4 |
| `WorkRequestList.tsx` | 🔄 MODIFIÉ | + Bouton + State + Import |
| `types.ts` | ✅ INCHANGÉ | Types existants utilisés |

---

## 🎯 Prochaines Étapes (Suggérées)

1. **Enregistrement automatique** : Changer le statut à `QUOTED` après génération
2. **Numérotation** : Ajouter un numéro unique au document de devis
3. **Historique** : Tracer qui a généré le document et quand
4. **Email automatique** : Envoyer le document par email au service concerné
5. **Template personnalisable** : Permettre de modifier le texte du document

---

**Dernière mise à jour :** 31 Mars 2026  
**Version :** 3.0.0 - Avec génération de demande d'établissement de devis  
**Fichiers créés :** `components/QuoteEstablishmentRequestPrint.tsx`  
**Fichiers modifiés :** `components/WorkRequestList.tsx`
