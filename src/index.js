const express = require('express');
const app = express();
const cors = require('cors');
const userController = require('./controllers/userController');
const questionSetsController = require('./controllers/questionSetsController');

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, Node!');
});

// User routes
app.post('/users', userController.criarUsuario);
app.put('/users/:googleUid', userController.atualizarUsuario);
app.patch('/users/:googleUid/position-seniority', userController.atualizarCargoESenioridade);

// Question Sets routes
app.post('/question-sets', questionSetsController.createQuestionSet);
app.get('/question-sets', questionSetsController.getAllQuestionSets);
app.get('/question-sets/filter', questionSetsController.getQuestionSetsByFromOrTo);
app.get('/question-sets/:id', questionSetsController.getQuestionSetById);
app.put('/question-sets/:id', questionSetsController.updateQuestionSet);
app.delete('/question-sets/:id', questionSetsController.deleteQuestionSet);

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
