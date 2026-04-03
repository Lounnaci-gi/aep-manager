const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const crypto = require('crypto');
// ⚠️ SÉCURITÉ: Chargement des variables d'environnement pour les credentials MongoDB
require('dotenv').config({ path: '../.env' });

const app = express();
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0'; // Écouter sur toutes les interfaces réseau

// Configuration de sécurité - Protection anti-bruteforce
const MAX_ATTEMPTS = 3;
const BLOCK_DURATION = 15 * 60 * 1000; // 15 minutes en millisecondes

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ⚠️ SÉCURITÉ: Configuration MongoDB avec variables d'environnement
// Les credentials doivent être définis dans le fichier .env (non commité dans Git)
const uri = process.env.MONGODB_URI || '';
const dbName = process.env.MONGODB_DB || 'GestionEau';

let client;
let db;

async function connectToMongoDB() {
  try {
    client = new MongoClient(uri);
    await client.connect();
    db = client.db(dbName);
    
    // Créer les index nécessaires pour la gestion des tentatives de connexion
    await db.collection('login_attempts').createIndex({ username: 1 }, { unique: true });
    await db.collection('login_attempts').createIndex({ blockedUntil: 1 }, { expireAfterSeconds: 900 }); // TTL automatique après 15 min
    
    console.log('✅ Connecté à MongoDB Atlas');
    console.log(`   Base de données: ${dbName}`);
    console.log(`   Serveur API: http://localhost:${PORT}`);
    console.log(`   Accès réseau: http://${getLocalIPAddress()}:${PORT}`);
  } catch (err) {
    console.error('❌ Erreur de connexion MongoDB:', err.message);
    process.exit(1);
  }
}

// Fonction pour obtenir l'adresse IP locale
function getLocalIPAddress() {
  const os = require('os');
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// ⚠️ SÉCURITÉ: Fonction de hashage SHA-256 avec salt pour les mots de passe
// Le salt est généré de manière unique pour chaque utilisateur
function hashPassword(password, salt) {
  return crypto.createHash('sha256').update(password + salt).digest('hex');
}

// Collections MongoDB utilisées par l'application
const COLLECTIONS = [
  'users',
  'units',
  'centres',
  'agencies',
  'clients',
  'requests',
  'quotes',
  'work_types',
  'articles'
];

// ⚠️ SÉCURITÉ: Route d'authentification avec gestion des tentatives échouées
// Protection contre le bruteforce : blocage après 3 échecs pendant 15 minutes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'Nom d\'utilisateur et mot de passe requis' });
    }
    
    // Vérifier si l'utilisateur est bloqué
    const loginAttempts = db.collection('login_attempts');
    const attempt = await loginAttempts.findOne({ username });
    
    if (attempt && attempt.blockedUntil && new Date(attempt.blockedUntil) > new Date()) {
      const remaining = new Date(attempt.blockedUntil) - new Date();
      return res.status(403).json({ 
        error: 'Compte temporairement bloqué',
        blocked: true,
        remainingTime: remaining
      });
    }
    
    // Rechercher l'utilisateur
    const users = db.collection('users');
    const user = await users.findOne({ username });
    
    if (!user) {
      // ⚠️ SÉCURITÉ: Incrémenter les tentatives même pour utilisateur inexistant
      // Cela empêche l'énumération des noms d'utilisateurs
      await loginAttempts.updateOne(
        { username },
        { 
          $inc: { attempts: 1 },
          $set: { updatedAt: new Date() }
        },
        { upsert: true }
      );
      
      const currentAttempt = await loginAttempts.findOne({ username });
      const remaining = MAX_ATTEMPTS - (currentAttempt?.attempts || 1);
      
      if (remaining <= 0) {
        const blockedUntil = new Date(Date.now() + BLOCK_DURATION);
        await loginAttempts.updateOne(
          { username },
          { 
            $set: { blockedUntil, attempts: MAX_ATTEMPTS, updatedAt: new Date() }
          }
        );
        return res.status(403).json({ 
          error: 'Trop de tentatives échouées. Accès bloqué pour 15 minutes.',
          blocked: true,
          blockedUntil: blockedUntil.getTime()
        });
      }
      
      return res.status(401).json({ 
        error: `Identifiants incorrects. Il vous reste ${remaining} tentative${remaining > 1 ? 's' : ''}.`,
        remainingAttempts: remaining
      });
    }
    
    // ⚠️ SÉCURITÉ: Vérification du mot de passe avec support de migration
    // Format actuel: salt:hash (sécurisé)
    // Ancien format: texte brut (pour migration uniquement)
    let isValid = false;
    if (user.password && user.password.includes(':')) {
      // Nouveau format: salt:hash
      const [salt, storedHash] = user.password.split(':');
      const inputHash = hashPassword(password, salt);
      isValid = inputHash === storedHash;
    } else {
      // Ancien format: mot de passe en texte brut
      isValid = user.password === password;
    }
    
    if (!isValid) {
      const newAttempts = (attempt?.attempts || 0) + 1;
      await loginAttempts.updateOne(
        { username },
        { 
          $set: { attempts: newAttempts, updatedAt: new Date() },
          $unset: { blockedUntil: "" }
        },
        { upsert: true }
      );
      
      const remaining = MAX_ATTEMPTS - newAttempts;
      
      if (newAttempts >= MAX_ATTEMPTS) {
        const blockedUntil = new Date(Date.now() + BLOCK_DURATION);
        await loginAttempts.updateOne(
          { username },
          { 
            $set: { blockedUntil, attempts: MAX_ATTEMPTS, updatedAt: new Date() }
          }
        );
        return res.status(403).json({ 
          error: 'Trop de tentatives échouées. Accès bloqué pour 15 minutes.',
          blocked: true,
          blockedUntil: blockedUntil.getTime()
        });
      }
      
      return res.status(401).json({ 
        error: `Identifiants incorrects. Il vous reste ${remaining} tentative${remaining > 1 ? 's' : ''}.`,
        remainingAttempts: remaining
      });
    }
    
    // ⚠️ SÉCURITÉ: Connexion réussie - réinitialiser les tentatives
    await loginAttempts.updateOne(
      { username },
      { 
        $set: { attempts: 0, updatedAt: new Date() },
        $unset: { blockedUntil: "" }
      },
      { upsert: true }
    );
    
    // Retourner l'utilisateur sans le mot de passe (sécurité)
    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword });
    
  } catch (err) {
    console.error('Erreur auth:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Route pour vérifier le statut de blocage
app.get('/api/auth/status/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const attempt = await db.collection('login_attempts').findOne({ username });
    
    if (!attempt) {
      return res.json({ blocked: false, attempts: 0 });
    }
    
    if (attempt.blockedUntil && new Date(attempt.blockedUntil) > new Date()) {
      const remaining = new Date(attempt.blockedUntil) - new Date();
      return res.json({ 
        blocked: true, 
        blockedUntil: attempt.blockedUntil,
        remainingTime: remaining,
        attempts: attempt.attempts
      });
    }
    
    res.json({ blocked: false, attempts: attempt.attempts || 0 });
  } catch (err) {
    console.error('Erreur status:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Routes pour chaque collection
COLLECTIONS.forEach(colName => {
  // GET - Récupérer tous les documents
  app.get(`/api/${colName}`, async (req, res) => {
    try {
      const data = await db.collection(colName).find({}).toArray();
      res.json(data);
    } catch (err) {
      console.error(`Erreur GET ${colName}:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // POST - Créer ou mettre à jour un document
  app.post(`/api/${colName}`, async (req, res) => {
    try {
      let doc = req.body;
      if (!doc || !doc.id) {
        return res.status(400).json({ error: 'Document doit avoir un id' });
      }
      
      // Logique spéciale pour la génération d'ID incrémental pour les demandes
      if (colName === 'requests' && doc.id.startsWith('TEMP-')) {
        // Extraire les infos du format TEMP-timestamp-prefix-year
        const parts = doc.id.split('-');
        if (parts.length >= 4) {
          const timestamp = parts[1];
          const prefix = parts[2];
          const year = parts[3];
          
          // Trouver le dernier numéro utilisé pour ce centre et cette année
          const regex = new RegExp(`^\\d{4}/${prefix}/${year}$`);
          const latestRequests = await db.collection('requests')
            .find({ id: regex })
            .sort({ id: -1 })
            .limit(1)
            .toArray();
          
          let maxNum = 0;
          if (latestRequests.length > 0) {
            const idParts = latestRequests[0].id.split('/');
            maxNum = parseInt(idParts[0]) || 0;
          }
          
          // Générer le nouvel ID incrémental
          const nextNum = maxNum + 1;
          const newId = `${nextNum.toString().padStart(4, '0')}/${prefix}/${year}`;
          doc = { ...doc, id: newId };
        }
      }
      
      // ⚠️ SÉCURITÉ: Vérification spécifique pour les utilisateurs
      // Empêcher la création de multiples administrateurs
      if (colName === 'users') {
        // Vérifier si c'est une création d'administrateur alors qu'un existe déjà
        if (doc.role === 'Administrateur') {
          const existingAdmins = await db.collection('users').find({ role: 'Administrateur' }).toArray();
          const isAdminUpdate = existingAdmins.some(user => user.id === doc.id);
          
          if (existingAdmins.length > 0 && !isAdminUpdate) {
            return res.status(403).json({ 
              error: 'Un administrateur existe déjà dans le système. Vous ne pouvez pas créer un second administrateur.' 
            });
          }
        }
      }
      
      // Supprimer le champ _id s'il existe pour éviter l'erreur MongoDB
      const { _id, ...docToSave } = doc;
      
      await db.collection(colName).updateOne(
        { id: doc.id },
        { $set: docToSave },
        { upsert: true }
      );
      
      res.json({ success: true, id: doc.id });
    } catch (err) {
      console.error(`Erreur POST ${colName}:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE - Supprimer un document par ID
  app.delete(`/api/${colName}/:id`, async (req, res) => {
    try {
      const { id } = req.params;
      await db.collection(colName).deleteOne({ id });
      res.json({ success: true });
    } catch (err) {
      console.error(`Erreur DELETE ${colName}:`, err.message);
      res.status(500).json({ error: err.message });
    }
  });
});

// Route de statut pour vérifier la santé du serveur
app.get('/api/status', (req, res) => {
  res.json({ 
    status: 'connected', 
    database: dbName,
    timestamp: new Date().toISOString()
  });
});

// Route pour les statistiques (nombre de documents par collection)
app.get('/api/stats', async (req, res) => {
  try {
    const stats = {};
    for (const colName of COLLECTIONS) {
      const count = await db.collection(colName).countDocuments();
      stats[colName] = count;
    }
    res.json(stats);
  } catch (err) {
    console.error('Erreur stats:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// Démarrer le serveur avec connexion à MongoDB
async function start() {
  await connectToMongoDB();
  
  app.listen(PORT, HOST, () => {
    console.log('\n🚀 Serveur API démarré');
    console.log('--------------------------');
  });
}

start();

// ⚠️ SÉCURITÉ: Gestion propre de l'arrêt du serveur pour fermer les connexions
process.on('SIGINT', async () => {
  console.log('\n⚠️ Arrêt du serveur...');
  if (client) {
    await client.close();
    console.log('✅ Connexion MongoDB fermée');
  }
  process.exit(0);
});

