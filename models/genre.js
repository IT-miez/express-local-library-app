const mongoose = require("mongoose");

const Schema = mongoose.Schema;

const GenreSchemma = new Schema({
 name: { type: String, required: true, minLength: 3,maxLength: 100 },
});

// Virtual for bookinstance's URL
GenreSchemma.virtual("url").get(function () {
    // We don't use an arrow function as we'll need the this object
    return `/catalog/genre/${this._id}`;
  });

// Export model
module.exports = mongoose.model("Genre", GenreSchemma);
