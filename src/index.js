const express = require('express');
const app = express();
const userController = require('./controllers/userController');

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Hello, Node!');
});

app.post('/users', userController.criarUsuario);
app.patch('/users/:googleUid', userController.atualizarCargoESenioridade);


app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
