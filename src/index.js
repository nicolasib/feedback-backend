const express = require('express');
const app = express();
const cors = require('cors');
const userController = require('./controllers/userController');
const questionSetsController = require('./controllers/questionSetsController');
const feedbackController = require('./controllers/feedbackController');

app.use(express.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello, Node!');
});

// User routes
app.post('/users', userController.criarUsuario);
app.get('/users', userController.getAllUsers);
app.get('/users/:googleUid', userController.getUserById); 
app.put('/users/:googleUid', userController.atualizarUsuario);
app.patch('/users/:googleUid/position-seniority', userController.atualizarCargoESenioridade);

// Question Sets routes
app.post('/question-sets', questionSetsController.createQuestionSet);
app.get('/question-sets', questionSetsController.getAllQuestionSets);
app.get('/question-sets/filter', questionSetsController.getQuestionSetsByFromOrTo);
app.get('/question-sets/:id', questionSetsController.getQuestionSetById);
app.put('/question-sets/:id', questionSetsController.updateQuestionSet);
app.delete('/question-sets/:id', questionSetsController.deleteQuestionSet);

// Feedback routes
app.post('/feedbacks', feedbackController.createFeedback);
app.get('/feedbacks', feedbackController.getAllFeedbacks);
app.get('/feedbacks/filter', feedbackController.getFeedbacksByUser);
app.get('/feedbacks/:id', feedbackController.getFeedbackById);
app.put('/feedbacks/:id', feedbackController.updateFeedback);
app.delete('/feedbacks/:id', feedbackController.deleteFeedback);

app.listen(3001, () => {
  console.log('Servidor rodando na porta 3001');
});
