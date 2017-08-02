//初始化后台用户数据
var utils = require( '../utils/utils.js' );
var cryptoUtil = require( '../utils/cryptoUtil' );
var MODULE_NAME = 'initUserList';
var User = require( './../models/User' );
var user = utils.fileToJson( '/home/doorbell_admin/conf/admin.json', 'user' );
//先清空
User.remove(function(err,obj){
    if(err){
        utils.consoleAndLogger('remove err:'+MODULE_NAME+' '+err);
        return;
    }
    utils.consoleAndLogger(MODULE_NAME+' users remove all.')
});

var user = new User( {
    "username" : user.username,
    "password" : cryptoUtil.aesEncrypt( user.password )
} );
user.save( function( err, obj ){
    if(err){
        utils.consoleAndLogger('save err:'+MODULE_NAME+' '+err);
        return;
    }
    utils.consoleAndLogger(MODULE_NAME+' user insert ok.')
} );