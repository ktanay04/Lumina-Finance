const mongoose = require('mongoose');

const aiMessageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
  },
  { _id: false },
);

const aiConversationSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    title: { type: String, default: 'Ask AI conversation', trim: true, maxlength: 160 },
    messages: { type: [aiMessageSchema], default: [] },
  },
  { timestamps: true },
);

aiConversationSchema.index({ user: 1, updatedAt: -1 });

module.exports = mongoose.model('AiConversation', aiConversationSchema);
