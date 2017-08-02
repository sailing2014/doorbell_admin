var express = require( 'express' );
var router = express.Router();
var Result = require( '../Result' );
var utils = require( '../utils/utils.js' );
var user = utils.fileToJson( '/home/doorbell_admin/conf/admin.json', 'user' );
var MODULE_NAME = 'user';
/**
 * 登录
 * 数据来源：projectDAta.json user
 */
router.post( '/token', function( req, res ){
    var result = new Result();
    result.errorCode = 0;
    var user;
    var params = {
        "username" : req.body.uname,
        "password" : req.body.upwd
    };

    if( !utils.check_params( params, 'post /users/token' ) ){
        result.errorCode = 430001;
        result.errorMessage = 'params invalidate';
        utils.consoleAndLogger( MODULE_NAME + ' /token failed:' + result.errorMessage );
        res.status( 400 ).json( result );
    }

    //验证参数格式是否正确，验证用户名和密码是否正确，如果正确，生成token并更新到用户集合中；如果不正确，则直接返回错误结果
    User.findOne( {username : req.body.username, password : CryptoUtil.aesEncrypt( req.body.password )}, function( err, obj ){
        if( err ){
            utils.consoleAndLogger( 'err:' + MODULE_NAME + ' /token db query error' );
            result.errorCode = 500001;
            result.errorMessage = 'db query error';
            res.status( 500 ).json( result );
        }
        if( obj ){
            user = obj;
            var value = utils.enAccess_token( obj.username );
            if( obj.token ){
                var retToken = obj.token;
                //validate token is out of time or not
                var coast = parseInt( retToken.createTime ) + parseInt( retToken.expire );
                var nowTime = new Date().getTime();
                if( coast > nowTime ){
                    value = retToken.value;
                }
            }
            //验证如果token存在，并且没超过有效期的话
            user.token = {
                value : value,
                createTime : new Date().getTime(),
                expire : 60 * 60 * 1000//one hour
            };
            var update = {$set : {token : user.token}};
            User.update( {username : obj.username}, update, function( err, obj ){
                result.errorMessage = 'Login success.';
                result.data.token = user.token.value;
                utils.consoleAndLogger( MODULE_NAME + ' /token login success.' );
                res.status( 200 ).json( result );
            } );

        } else{
            result.errorCode = 410001;
            result.errorMessage = 'Login failed: incorrect username or password.';
            utils.consoleAndLogger( MODULE_NAME + ' /token ' + result.errorMessage );
            res.status( 400 ).json( result );
        }
    } );

} );

module.exports = router;