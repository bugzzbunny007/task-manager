const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    body:   { type: String, required: true, trim: true, maxlength: [2000, 'Comment must be 2000 characters or fewer'] },
    author: { type: String, default: 'You', trim: true, maxlength: 60 },
  },
  { timestamps: true }
);

const taskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: [true, 'Title is required'], trim: true, maxlength: [120, 'Title must be 120 characters or fewer'] },
    description: { type: String, trim: true, maxlength: 1000, default: '' },
    status:      { type: String, enum: ['todo', 'in-progress', 'done'], default: 'todo', index: true },
    priority:    { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
    dueDate:     { type: Date, default: null },
    comments:    { type: [commentSchema], default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Task', taskSchema);
