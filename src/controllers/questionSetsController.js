const db = require('../db/firestore_init');

// Create a new question set
exports.createQuestionSet = async (req, res) => {
  const { criteria, from, to, weight } = req.body;

  // Validate required fields
  if (!criteria || !Array.isArray(criteria) || criteria.length === 0) {
    return res.status(400).json({ error: 'criteria is required and must be a non-empty array' });
  }

  if (!from) {
    return res.status(400).json({ error: 'from is required' });
  }

  if (!to) {
    return res.status(400).json({ error: 'to is required' });
  }

  try {
    const now = new Date();
    const formattedDate = now.toLocaleString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    });

    const questionSetData = {
      criteria,
      from,
      to,
      weight: weight || 0,
      created_at: formattedDate,
      updated_at: formattedDate
    };

    const docRef = await db.collection('question_sets').add(questionSetData);
    const newQuestionSet = await docRef.get();

    return res.status(201).json({
      id: docRef.id,
      ...newQuestionSet.data()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all question sets
exports.getAllQuestionSets = async (req, res) => {
  try {
    const snapshot = await db.collection('questions_sets').get();
    const questionSets = [];

    snapshot.forEach(doc => {
      questionSets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json(questionSets);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get question sets by from or to
exports.getQuestionSetsByFromOrTo = async (req, res) => {
  const { from, to } = req.query;

  if (!from && !to) {
    return res.status(400).json({ error: 'At least one of from or to parameters is required' });
  }

  try {
    let query = db.collection('question_sets');

    if (from && to) {
      // If both parameters are provided, find question sets that match both
      query = query.where('from', '==', from).where('to', '==', to);
    } else if (from) {
      // If only from is provided
      query = query.where('from', '==', from);
    } else if (to) {
      // If only to is provided
      query = query.where('to', '==', to);
    }

    const snapshot = await query.get();
    const questionSets = [];

    snapshot.forEach(doc => {
      questionSets.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json(questionSets);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get a question set by ID
exports.getQuestionSetById = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection('question_sets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    return res.status(200).json({
      id: doc.id,
      ...doc.data()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update a question set
exports.updateQuestionSet = async (req, res) => {
  const { id } = req.params;
  const { criteria, from, to, weight } = req.body;

  try {
    // Check if question set exists
    const doc = await db.collection('question_sets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    // Only update fields that are provided
    const updateData = {};
    if (criteria !== undefined && Array.isArray(criteria) && criteria.length > 0) {
      updateData.criteria = criteria;
    }
    if (from !== undefined) updateData.from = from;
    if (to !== undefined) updateData.to = to;
    if (weight !== undefined) updateData.weight = weight;

    // Add updated timestamp
    const now = new Date();
    const formattedDate = now.toLocaleString('pt-BR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      timeZoneName: 'short'
    });
    updateData.updated_at = formattedDate;

    // Only update if there are fields to update
    if (Object.keys(updateData).length > 0) {
      await db.collection('question_sets').doc(id).update(updateData);
    }

    // Get the updated question set
    const updatedDoc = await db.collection('question_sets').doc(id).get();

    return res.status(200).json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete a question set
exports.deleteQuestionSet = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if question set exists
    const doc = await db.collection('question_sets').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Question set not found' });
    }

    await db.collection('question_sets').doc(id).delete();

    return res.status(200).json({ message: 'Question set deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};