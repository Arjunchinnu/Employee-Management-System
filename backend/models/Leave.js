const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
{
employee: {
type: mongoose.Schema.Types.ObjectId,
ref: "Employee",
required: true,
index: true
},


leaveType: {
  type: String,
  enum: ["casual", "sick", "earned", "unpaid"],
  required: true
},

startDate: {
  type: String,
  required: true
},

endDate: {
  type: String,
  required: true
},

reason: {
  type: String,
  required: true,
  trim: true,
  maxlength: 500
},

status: {
  type: String,
  enum: ["pending", "approved", "rejected"],
  default: "pending"
},

reviewedBy: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Admin",
  default: null
},

reviewedAt: {
  type: Date,
  default: null
},

adminComment: {
  type: String,
  trim: true,
  maxlength: 500,
  default: ""
}


},
{ timestamps: true }
);

module.exports = mongoose.model("Leave", leaveSchema);
