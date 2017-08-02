var express = require('express');
var async = require('async');
var sha1 = require( 'sha1' );
var request = require( 'request' );
var utils = require('../utils/utils');
var Result = require( '../Result' );

var time = parseInt( Math.round( new Date().getTime() / 1000 ) );

var router = express.Router();

/**
 * get devices by username
 *
 */

router.get('/',function(req,res){
    utils.consoleAndLogger( 'data /devices ');
    var username = decodeURIComponent(req.query.uname);
    var env = parseInt(req.query.env);
    var system_config = utils.getConfigByEnv(env);
    var api_key = system_config.api_key;
    var api_secret = system_config.api_secret;
    var sdcp = system_config.sdcp;

    var result = new Result();
    result.errorCode = 0;
    result.errorMessage = 'success';

    if( !req.session.user ){
        result.errorCode = 400003;
        result.errorMessage = 'Session doesn\'t exist, please login first.';
        utils.consoleAndLogger( 'data /devices ' + result.errorMessage );
        res.status( 400 ).json( result );
        return;
    }
    //    console.log(msg);
    async.waterfall([function(cb){
        //根据username获取uid
        var option = {
            url :  sdcp +'/user/get_by_name',
            "Content-type" : "application/json",
            "method" : 'POST',
            "json" : {
                "api_key" : api_key,
                "api_token" : sha1( api_secret + time ),
                "time" : time,
                "username":username
            }
        };

        request( option, function( err, res, body ){
            if(err){
                utils.consoleAndLogger('sdcp.user/get_by_name err' + err);
            }else if(body){
                if(body._status._code != 200 ){
                    result.errorCode = 40001;
                    result.errorMessage = "User name doesn't exist";
                    cb(result.errorMessage ,result);
                }else{
                    var uid = body.user.uid;
                    cb(null,uid);
                }
            }

        } );
    },function(uid,cb){
        var option = {
            url :  sdcp +'/devicedata/getList',
            "Content-type" : "application/json",
            "method" : 'POST',
            "json" : {
                "api_key" : api_key,
                "api_token" : sha1( api_secret + time ),
                "time" : time,
                "view_table":"getDevicesByUid",
                "condition":{"uid":uid},
                "page":1,
                "size":20
            }
        };
        request( option, function( err, res, body ){
            if(err){
                utils.consoleAndLogger('sdcp.deviceData/getList err' + err);
            }else if(body._status._code != 200 ){
                result.errorCode = 40002;
                result.errorMessage = "User has no device.";
                cb(result.errorMessage ,null);
            }else{
                var rows = body.data.rows;
                var device = [];
                for(var i=0;i<rows.length;i++){
                    var item  = {
                                    uid: rows[i]["value"].uid,
                                    cid: rows[i]["value"].cid
                                };
                    // device[i].uid = ;
                    // device[i]["cid"] = rows[i]["value"].cid;
                    device.push(item);
                }

                result.data = {
                    "uid":uid,
                    "devices":device
                };
                cb(null,result);
            }
        } );
    }],function(err,data){
        res.status( 200 ).json( data );
        return;
    });
});

router.get('/appcmd/:cid',function(req,res){
    utils.consoleAndLogger( 'data /devices/appcmd ');
    var cid = req.params.cid;
    var result = new Result();
    result.errorCode = 0;
    result.errorMessage = 'success';

    if( !req.session.user ){
        result.errorCode = 400003;
        result.errorMessage = 'Session doesn\'t exist, please login first.';
        utils.consoleAndLogger( 'data /devices ' + result.errorMessage );
        res.status( 400 ).json( result );
        return;
    }

    var env = parseInt(req.query.env);
    var system_config = utils.getConfigByEnv(env);
    var api_key = system_config.api_key;
    var api_secret = system_config.api_secret;
    var sdcp = system_config.sdcp;

    //    console.log(msg);
    async.waterfall([function(cb){
        //根据username获取uid
        var option = {
            url :  sdcp +'/devicedata/getbydocid',
            "Content-type" : "application/json",
            "method" : 'POST',
            "json" : {
                "api_key" : api_key,
                "api_token" : sha1( api_secret + time ),
                "time" : time,
                "doc_id":"cmd:log:device::" + cid
            }
        };

        request( option, function( err, res, body ){
            if(err){
                utils.consoleAndLogger('sdcp.devicedata/getbydocid err' + err);
            }else if(body){
                if(body._status._code != 200 ){
                    result.errorCode = 40001;
                    result.errorMessage = "cid log doesn't exist";
                    cb(result.errorMessage ,null);
                }else{
                    var rows = body.data.logs;
                    var logs = [];
                    for(var i=0;i<rows.length;i++){
                        var item  = {
                            text: rows[i].text,
                            time: utils.getLocalTime(rows[i].time)
                        };
                        logs.push(item);
                    }

                    result.data = {
                        "cid":cid,
                        "logs":logs
                    };
                    cb(null,result);
                }
            }

        } );
    }],function(err,data){
        if(data) {
            res.render("log", {env: env, cid: cid, data: data});
        }else{
            res.render("log", {env: env, cid: cid, data: {}});
        }
        return;
    });
});

/**
 * get user info by cid
 */
router.get('/user/:cid',function(req,res){
    utils.consoleAndLogger( 'data /devices/user ');
    var cid = req.params.cid;
    var result = new Result();
    result.errorCode = 0;
    result.errorMessage = 'success';

    if( !req.session.user ){
        result.errorCode = 400003;
        result.errorMessage = 'Session doesn\'t exist, please login first.';
        utils.consoleAndLogger( 'data /devices ' + result.errorMessage );
        res.status( 400 ).json( result );
        return;
    }
    //    console.log(msg);

    var env = parseInt(req.query.env);
    var system_config = utils.getConfigByEnv(env);
    var api_key = system_config.api_key;
    var api_secret = system_config.api_secret;
    var sdcp = system_config.sdcp;

    async.waterfall([function(cb){
        //根据username获取uid
        var option = {
            url :  sdcp+'/devicedata/getbydocid',
            "Content-type" : "application/json",
            "method" : 'POST',
            "json" : {
                "api_key" : api_key,
                "api_token" : sha1( api_secret + time ),
                "time" : time,
                "doc_id":"device::" + cid
            }
        };

        request( option, function( err, res, body ){
            if(err){
                utils.consoleAndLogger('sdcp.devicedata/getbydocid err' + err);
            }else if(body){
                if(body._status._code != 200 ){
                    result.errorCode = 40001;
                    result.errorMessage = "cid device doesn't exist";
                    cb(result.errorMessage ,null);
                }else{
                    var uid = body.data.uid;
                    option = {
                        url: sdcp + '/user/get',
                        "Content-type": "application/json",
                        "method": 'POST',
                        "json": {
                            "api_key": api_key,
                            "api_token": sha1(api_secret + time),
                            "time": time,
                            "uid": uid
                        }
                    };
                    request( option, function( err, res, body ){
                            if(err){
                                utils.consoleAndLogger('sdcp.usercenter/user get err' + err);
                            }else{
                                var user = {"uid":uid};

                                var user_phone = body.user.phone;
                                user.username = user_phone;
                                if(!user_phone){
                                    user.username = body.user.email;
                                }

                                user.regtime = utils.getLocalTime(body.user["reg_time"]);

                                var result = {"cid":cid,"user":user};
                                cb(null,result);
                            }
                    });
                    }


                }


        } );
    }],function(err,data){
        res.status( 200 ).json( data );
        return;
    });
});

/**
 * unbind device by cid
 */
router.delete('/:cid',function(req,res){
    var cid = req.params.cid;
    utils.consoleAndLogger( 'data /devices/'+ cid);
    var result = new Result();
    result.errorCode = 0;
    result.errorMessage = 'success';

    if( !req.session.user ){
        result.errorCode = 400003;
        result.errorMessage = 'Session doesn\'t exist, please login first.';
        utils.consoleAndLogger( 'data /devices ' + result.errorMessage );
        res.status( 400 ).json( result );
        return;
    }
    //    console.log(msg);

    var env = parseInt(req.query.env);
    var system_config = utils.getConfigByEnv(env);
    var api_key = system_config.api_key;
    var api_secret = system_config.api_secret;
    var doorbell = system_config.doorbell;

    async.waterfall([function(cb){
        //根据username获取uid
        var option = {
            "url" :  doorbell+'/v1/devices/intl/device::'+cid,
            "Content-type" : "application/json",
            "method" : 'DELETE',
            "headers" : {
                "apikey" : api_key,
                "apitoken" : sha1( api_secret + time ),
                "time" : time
            }
        };

        request( option, function( err, res, body ){
            if(err){
                utils.consoleAndLogger('doorbell.devices/intl DELETE err' + err);
            }else if(body){
                body = JSON.parse(body);
                if(body.errorCode !=0){
                    result.errorCode = 40001;
                    result.errorMessage = body.errorMessage;
                    utils.consoleAndLogger( 'data /devices ' + result.errorMessage );
                    cb(result.errorMessage ,null);
                }else{
                    utils.consoleAndLogger( 'data /devices ' + "internally unbind device success");
                    cb(null,result);
                }
            }

        } );
    }],function(err,data){
        if(data) {
            res.status(200).json(data);
        }else{
            data = {"errorCode":1,"errorMessage":err};
            res.status(200).json(data);
        }
        return;
    });
});

module.exports = router;