const db = require('../db/firestore_init'); 

exports.criarUsuario = async (req, res) => {
    console.log(req.body)
    const { googleUid, name, email, picture } = req.body;
  
    if (!googleUid || !name || !email) {
      return res.status(400).json({ error: 'googleUid, nome e email são obrigatórios' });
    }
  
    try {
      await db.collection('users').doc(googleUid).set({
        name,
        email,
        picture: picture || null,
        position: null,
        seniority: null,
        createdAt: Date.now(),
      });
  
      return res.status(201).json({ message: 'Usuário criado com sucesso!' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };

  
  exports.atualizarCargoESenioridade = async (req, res) => {
    const { googleUid } = req.params;
    const { cargo, senioridade } = req.body;
  
    if (!cargo && !senioridade) {
      return res.status(400).json({ error: 'Informe cargo ou senioridade para atualizar' });
    }
  
    try {
      const updateData = {};
      if (cargo) updateData.cargo = cargo;
      if (senioridade) updateData.senioridade = senioridade;
  
      await db.collection('users').doc(googleUid).update(updateData);
  
      const user = await db.collection('users').doc(googleUid).get();
  
      return res.json(user.data());
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
  