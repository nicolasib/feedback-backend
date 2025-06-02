const db = require('../db/firestore_init');

// Create a new feedback
exports.createFeedback = async (req, res) => {
  const { answers, from_user, to_user, open_feedback, tags } = req.body;

  // Validate required fields
  if (!answers || typeof answers !== 'object' || Object.keys(answers).length === 0) {
    return res.status(400).json({ error: 'answers is required and must be a non-empty object' });
  }

  if (!from_user) {
    return res.status(400).json({ error: 'from_user is required' });
  }

  if (!to_user) {
    return res.status(400).json({ error: 'to_user is required' });
  }

  try {
    // Validate that from_user exists
    const fromUserDoc = await db.collection('users').doc(from_user).get();
    if (!fromUserDoc.exists) {
      return res.status(400).json({ error: 'from_user does not exist' });
    }

    // Validate that to_user exists
    const toUserDoc = await db.collection('users').doc(to_user).get();
    if (!toUserDoc.exists) {
      return res.status(400).json({ error: 'to_user does not exist' });
    }

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

    const feedbackData = {
      answers,
      from_user,
      to_user,
      open_feedback: open_feedback || '',
      tags: tags || [],
      created_at: formattedDate,
      updated_at: formattedDate
    };

    const docRef = await db.collection('feedbacks').add(feedbackData);
    const newFeedback = await docRef.get();

    return res.status(201).json({
      id: docRef.id,
      ...newFeedback.data()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get all feedbacks
exports.getAllFeedbacks = async (req, res) => {
  try {
    const snapshot = await db.collection('feedbacks').get();
    const feedbacks = [];

    snapshot.forEach(doc => {
      feedbacks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json(feedbacks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get feedbacks by from_user or to_user
exports.getFeedbacksByUser = async (req, res) => {
  const { from_user, to_user } = req.query;

  if (!from_user && !to_user) {
    return res.status(400).json({ error: 'At least one of from_user or to_user parameters is required' });
  }

  try {
    let query = db.collection('feedbacks');

    if (from_user && to_user) {
      // If both parameters are provided, find feedbacks that match both
      query = query.where('from_user', '==', from_user).where('to_user', '==', to_user);
    } else if (from_user) {
      // If only from_user is provided
      query = query.where('from_user', '==', from_user);
    } else if (to_user) {
      // If only to_user is provided
      query = query.where('to_user', '==', to_user);
    }

    const snapshot = await query.get();
    const feedbacks = [];

    snapshot.forEach(doc => {
      feedbacks.push({
        id: doc.id,
        ...doc.data()
      });
    });

    return res.status(200).json(feedbacks);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Get a feedback by ID
exports.getFeedbackById = async (req, res) => {
  const { id } = req.params;

  try {
    const doc = await db.collection('feedbacks').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    return res.status(200).json({
      id: doc.id,
      ...doc.data()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Update a feedback
exports.updateFeedback = async (req, res) => {
  const { id } = req.params;
  const { answers, open_feedback, tags } = req.body;

  try {
    // Check if feedback exists
    const doc = await db.collection('feedbacks').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    // Only update fields that are provided
    const updateData = {};
    if (answers !== undefined && typeof answers === 'object' && Object.keys(answers).length > 0) {
      updateData.answers = answers;
    }
    if (open_feedback !== undefined) updateData.open_feedback = open_feedback;
    if (tags !== undefined && Array.isArray(tags)) updateData.tags = tags;

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
      await db.collection('feedbacks').doc(id).update(updateData);
    }

    // Get the updated feedback
    const updatedDoc = await db.collection('feedbacks').doc(id).get();

    return res.status(200).json({
      id: updatedDoc.id,
      ...updatedDoc.data()
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

// Delete a feedback
exports.deleteFeedback = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if feedback exists
    const doc = await db.collection('feedbacks').doc(id).get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Feedback not found' });
    }

    await db.collection('feedbacks').doc(id).delete();

    return res.status(200).json({ message: 'Feedback deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};