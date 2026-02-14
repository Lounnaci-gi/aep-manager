const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI || 'mongodb+srv://lounnaci:hyhwarez@cluster0.l0q2v.mongodb.net/?appName=Cluster0';

async function resetPassword() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('GestionEau');
    
    // Mettre à jour le mot de passe en texte brut pour migration
    const result = await db.collection('users').updateOne(
      { username: 'Lounnaci' },
      { $set: { password: '123456' } }
    );
    console.log(`✅ Mot de passe réinitialisé: ${result.modifiedCount} document(s)`);
    
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await client.close();
  }
}

resetPassword();
