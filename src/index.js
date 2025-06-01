const express = require('express');
const app = express();
const cors = require('cors');
const userController = require('./controllers/userController');

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, Node!');
});

app.post('/users', userController.criarUsuario);
app.put('/users/:googleUid', userController.atualizarUsuario); // New route for updating user profile
app.patch('/users/:googleUid/position-seniority', userController.atualizarCargoESenioridade); // Updated path for clarity


app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
