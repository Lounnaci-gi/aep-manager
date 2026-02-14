const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://lounnaci:hyhwarez@cluster0.l0q2v.mongodb.net/?appName=Cluster0';

async function clearLoginAttempts() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('GestionEau');
    
    // Supprimer les tentatives de connexion pour l'utilisateur Lounnaci
    const result = await db.collection('login_attempts').deleteMany({ username: 'Lounnaci' });
    console.log(`✅ Tentatives de connexion supprimées: ${result.deletedCount}`);
    
    // Supprimer aussi pour admin
    const result2 = await db.collection('login_attempts').deleteMany({ username: 'admin' });
    console.log(`✅ Tentatives admin supprimées: ${result2.deletedCount}`);
    
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await client.close();
  }
}

clearLoginAttempts();
