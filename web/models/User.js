var mongoose = require( 'mongoose' ), Schema = mongoose.Schema;

var UserSchema = new Schema( {
    username : String,
    password : String,
    token : {
        value : String,
        createTime : Number,
        expire : Number
    }
} );

var User = mongoose.model( 'user', UserSchema );
module.exports = User;

