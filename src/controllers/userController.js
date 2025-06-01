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
      let userData = null;
      
      if (!userDoc.exists) {
        // User doesn't exist, create new user with null values
        userData = {
          name,
          email,
          picture: picture || null,
          position: null,
          seniority: null,
          createdAt: Date.now(),
          isAdmin: req.body.isAdmin || false
        };
        
        await db.collection('users').doc(googleUid).set(userData);
        isFirstLogin = true;
      } else {
        // User exists, check if position and seniority are null
        userData = userDoc.data();
        
        if (userData.position === null || userData.seniority === null) {
          isFirstLogin = true;
        }
        
        // No need to update user data here - we're separating create and update
      }
  
      return res.status(200).json({ 
        user: { 
          googleUid, 
          name: userData.name, 
          email: userData.email,
          picture: userData.picture,
          position: userData.position,
          seniority: userData.seniority,
          isAdmin: userData.isAdmin || false
        },
        isFirstLogin
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };

// New function to update user profile information
exports.atualizarUsuario = async (req, res) => {
  const { googleUid } = req.params;
  const { name, email, picture, isAdmin } = req.body;

  if (!googleUid) {
    return res.status(400).json({ error: 'googleUid é obrigatório' });
  }

  try {
    // Check if user exists
    const userDoc = await db.collection('users').doc(googleUid).get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    // Only update fields that are provided
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (picture !== undefined) updateData.picture = picture;
    if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

    // Only update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      await db.collection('users').doc(googleUid).update(updateData);
    }

    // Get the updated user data
    const updatedUserDoc = await db.collection('users').doc(googleUid).get();
    const userData = updatedUserDoc.data();

    return res.status(200).json({ 
      user: { 
        googleUid, 
        ...userData 
      }
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
  