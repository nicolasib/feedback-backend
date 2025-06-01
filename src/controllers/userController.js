const db = require('../db/firestore_init'); 

exports.criarUsuario = async (req, res) => {
    console.log(req.body)
    const { googleUid, name, email, picture } = req.body;
  
    if (!googleUid || !name || !email) {
      return res.status(400).json({ error: 'googleUid, nome e email são obrigatórios' });
    }
  
    try {
      // Check if user already exists
      const userDoc = await db.collection('users').doc(googleUid).get();
      let isFirstLogin = false;
      
      if (!userDoc.exists) {
        // User doesn't exist, create new user with null values
        await db.collection('users').doc(googleUid).set({
          name,
          email,
          picture: picture || null,
          position: null,
          seniority: null,
          createdAt: Date.now(),
        });
        isFirstLogin = true;
      } else {
        // User exists, check if position and seniority are null
        const userData = userDoc.data();
        if (userData.position === null || userData.seniority === null) {
          isFirstLogin = true;
        }
        
        // Update user data if needed
        await db.collection('users').doc(googleUid).update({
          name,
          email,
          picture: picture || null,
          // Don't update position and seniority if they already exist
        });
      }
  
      return res.status(201).json({ 
        user: { googleUid, name, email },
        isFirstLogin
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };

  
  exports.atualizarCargoESenioridade = async (req, res) => {
    const { googleUid } = req.params;
    const { position, seniority } = req.body;
  
    if (!position && !seniority) {
      return res.status(400).json({ error: 'Informe cargo ou senioridade para atualizar' });
    }
  
    try {
      const updateData = {};
      if (position) updateData.position = position;
      if (seniority) updateData.seniority = seniority;
  
      await db.collection('users').doc(googleUid).update(updateData);
  
      const user = await db.collection('users').doc(googleUid).get();
  
      return res.json(user.data());
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
  