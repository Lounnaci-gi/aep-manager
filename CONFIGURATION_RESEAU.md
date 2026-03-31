# 📋 Guide de Configuration Réseau - AEP Manager

## 🔧 Problème d'Accès Réseau RÉSOLU

### **Problème**
Quand vous accédez à l'application via `http://192.168.1.39:3000/` depuis un autre ordinateur, le login s'affiche mais la connexion échoue avec le message :
> "Impossible de se connecter au serveur. Vérifiez que le backend est en cours d'exécution."

### **Cause**
Le frontend utilisait `localhost` pour se connecter au backend, ce qui ne fonctionne pas en accès réseau.

---

## ✅ Solution Intelligente Appliquée

### **Détection Automatique de l'Hôte**
- Fichier modifié : `services/dbService.ts`
- Le frontend détecte automatiquement l'adresse utilisée pour y accéder
- Si vous accédez via `http://192.168.1.39:3000/`, il se connectera automatiquement à `http://192.168.1.39:5000/api`
- Plus besoin de modifier `.env` !

---

## 🚀 Instructions de Démarrage (SIMPLIFIÉ)

### **Étape 1 : Trouver votre adresse IP locale**

**Sur Windows :**
```powershell
ipconfig
```
Cherchez "Adresse IPv4" dans la section "Carte réseau sans fil Wi-Fi" ou "Ethernet"

Exemple : `192.168.1.39`

---

### **Étape 2 : Démarrer les services**

#### Terminal 1 - Backend :
```bash
cd backend
npm start
```

Vous devriez voir :
```
✅ Connecté à MongoDB Atlas
   Base de données: GestionEau
   Serveur API: http://localhost:5000
   Accès réseau: http://192.168.1.39:5000
🚀 Serveur API démarré
```

#### Terminal 2 - Frontend :
```bash
npm run dev
```

Vous devriez voir :
```
VITE v6.x.x ready in xxx ms

➜  Local:   http://localhost:3000/
➜  Network: http://192.168.1.39:3000/
```

---

### **Étape 3 : Tester l'accès**

**Depuis votre machine :**
- Local : `http://localhost:3000/` ✅
- Réseau : `http://192.168.1.39:3000/` ✅

**Depuis un autre ordinateur du même réseau :**
- `http://192.168.1.39:3000/` ✅

**C'EST TOUT !** La connexion se fait automatiquement. ✨

---

## 🔒 Pare-feu Windows

Si l'accès réseau ne fonctionne toujours pas, autorisez Node.js dans le pare-feu :

### **Via PowerShell (Admin) :**
```powershell
New-NetFirewallRule -DisplayName "Node.js Server" -Direction Inbound -Protocol TCP -LocalPort 5000 -Action Allow
New-NetFirewallRule -DisplayName "Vite Dev Server" -Direction Inbound -Protocol TCP -LocalPort 3000 -Action Allow
```

### **Ou manuellement :**
1. Panneau de configuration → Pare-feu Windows
2. "Autoriser une application via le pare-feu"
3. Ajouter `node.exe` pour les ports 3000 et 5000

---

## 🛠️ Dépannage

### **Le backend ne démarre pas ?**
Vérifiez que le port 5000 n'est pas utilisé :
```bash
netstat -ano | findstr :5000
```

### **Le frontend ne se connecte pas ?**
1. Vérifiez que le backend tourne sur le port 5000
2. Testez l'API : `http://192.168.1.39:5000/api/status`
3. Vérifiez la console du navigateur (F12) pour les erreurs CORS

### **Erreur CORS ?**
Le backend est déjà configuré avec CORS activé. Si problème, vérifiez dans `backend/server.js` :
```javascript
app.use(cors()); // Doit être présent
```

---

## 📝 Résumé des Fichiers Modifiés

| Fichier | Modification |
|---------|-------------|
| `services/dbService.ts` | Détection automatique de l'hôte (localhost ou IP réseau) |
| `backend/server.js` | Ajout `HOST = '0.0.0.0'` et fonction `getLocalIPAddress()` |
| `.env` | Commentaires explicatifs mis à jour |

---

## ✨ Fonctionnalités

- ✅ **Détection automatique IP** : Le frontend utilise automatiquement la bonne URL API
- ✅ **Multi-accès** : Supporte localhost ET l'accès réseau simultanément
- ✅ **Aucune config requise** : Tout est automatique en mode développement
- ✅ **CORS activé** : Toutes les origines sont autorisées (développement)
- ✅ **Logs détaillés** : Adresses locales et réseau affichées au démarrage

---

## 🎯 Comment Ça Marche ?

### En Mode Développement (`npm run dev`) :
```
Utilisateur accède à → http://192.168.1.39:3000/
                            ↓
Frontend détecte → hostname = "192.168.1.39"
                            ↓
Frontend se connecte à → http://192.168.1.39:5000/api
                            ↓
✅ Connexion réussie !
```

### En Mode Production (après build) :
La variable `VITE_API_URL` du fichier `.env` est utilisée.

---

**Dernière mise à jour :** 31 Mars 2026  
**Version :** 2.0.0 - Avec détection automatique
