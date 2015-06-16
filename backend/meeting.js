var mongoose = require('mongoose');

var MeetingSchema = new mongoose.Schema({
  title: String,
  admin: String,
  invited: [String],
  joined: [String],
  ended: Boolean,
  url: String,
  data: String
});

module.exports = mongoose.model('Meeting', MeetingSchema);
