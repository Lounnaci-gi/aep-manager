const { MongoClient } = require('mongodb');
const crypto = require('crypto');

const uri = process.env.MONGODB_URI || 'mongodb+srv://lounnaci:hyhwarez@cluster0.l0q2v.mongodb.net/?appName=Cluster0';

async function securePasswords() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('GestionEau');
    const users = db.collection('users');
    
    // Récupérer tous les utilisateurs
    const allUsers = await users.find({}).toArray();
    
    for (const user of allUsers) {
      // Si le mot de passe n'est pas déjà hashé (format salt:hash)
      if (user.password && !user.password.includes(':')) {
        const salt = user.id;
        const hash = crypto.createHash('sha256').update(user.password + salt).digest('hex');
        const hashedPassword = salt + ':' + hash;
        
        await users.updateOne(
          { id: user.id },
          { $set: { password: hashedPassword } }
        );
        console.log(`✅ Password sécurisé pour: ${user.username} (${user.id})`);
      }
    }
    
    console.log('✅ Tous les mots de passe sont maintenant sécurisés!');
    
  } catch (err) {
    console.error('Erreur:', err.message);
  } finally {
    await client.close();
  }
}

securePasswords();
