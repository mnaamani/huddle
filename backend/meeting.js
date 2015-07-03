var mongoose = require('mongoose');

var MeetingSchema = new mongoose.Schema({
  title: String,
  admin: String,
  invited: [String],
  public: Boolean
});

module.exports = mongoose.model('Meeting', MeetingSchema);
