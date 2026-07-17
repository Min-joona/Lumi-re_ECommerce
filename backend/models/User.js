const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, index: true },
    password: { type: String, required: true, minlength: 6, select: false },
    isAdmin: { type: Boolean, default: false },
    role: {
      type: String,
      enum: ['customer', 'super_admin', 'admin', 'manager', 'support', 'editor'],
      default: 'customer',
    },
    permissions: [{ type: String }],
    status: { type: String, enum: ['active', 'suspended', 'banned'], default: 'active' },
    refreshSessions: [{
      _id: String,
      tokenHash: { type: String, required: true },
      userAgent: String,
      ip: String,
      createdAt: { type: Date, default: Date.now },
      lastUsedAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, required: true },
    }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', userSchema);
