const mongoose = require('mongoose');

const vaultItemSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  encryptedData: { type: Object, required: true } 
});

module.exports = mongoose.model('VaultItem', vaultItemSchema);
