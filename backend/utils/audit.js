const AuditLog = require('../models/AuditLog');

const audit = (req, action, targetType, targetId, diff = {}, metadata = {}) =>
  AuditLog.create({ actorId: req.user._id, action, targetType, targetId: String(targetId), diff, metadata }).catch(
    (error) => console.error('Audit log write failed:', error.message)
  );

module.exports = audit;
