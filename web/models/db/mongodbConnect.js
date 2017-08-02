var mongoose = require( 'mongoose' );
var utils = require( '../../utils/utils.js' );
var dbConf = utils.fileToJson( '/home/doorbell_admin/conf/mongodb.json', 'db' ), db;
var mongoOption = {
    "user" : dbConf.user,
    "pass" : dbConf.pass
};

exports.connectMongoDb = function(){
    var uri;
    if(dbConf.host2){
        uri = 'mongodb://' + dbConf.host1+':'+dbConf.port +','+dbConf.host2+':'+dbConf.port+ '/' + dbConf.dbName;
    }else{
        uri = 'mongodb://' + dbConf.host1+':'+dbConf.port + '/' + dbConf.dbName;
    }
    mongoose.connect(uri , mongoOption );
    db = mongoose.connection;
    db.on( 'error', function( err ){
        utils.consoleAndLogger( 'err:' + err );
        db.close();
    } );
    db.on( 'open', function(){
        utils.consoleAndLogger( 'init:Connect to mongodb:' + dbConf.host1 + '/' +dbConf.host2 + '/' + dbConf.dbName );
    } );
    db.on( 'close', function(){
        utils.consoleAndLogger( 'err:Mongodb closed.' );
    } );
    return db;
};