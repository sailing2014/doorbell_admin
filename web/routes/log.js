var express = require('express');
var async = require('async');
var sha1 = require( 'sha1' );
var request = require( 'request' );
var utils = require('../utils/utils');
var Result = require( '../Result' );

var time = parseInt( Math.round( new Date().getTime() / 1000 ) );

var router = express.Router();

/**
 * get logs by cid
 */
router.get('/:type/:cid',function(req,res){
    var type = req.params.type;
    var cid = req.params.cid;
    utils.consoleAndLogger( 'log /'+ type + '/' + cid);
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

    async.waterfall([function(cb){
        //根据 type 获取 log doc_id
        var doc_id = "";
        switch (parseInt(type)){
            case 1:
                doc_id = "cmd:log:device::";
                break;
            case 2:
                doc_id = "notify:log:device::";
                break;
            case 3:
                doc_id = "http:log:";
                break;
            case 4:
                doc_id = "heartbeat:log:";
                break;
            case 5:
                doc_id = "device:connect:log:";
                break;
            default:
                doc_id = "cmd:log:device::";
                break;
        }

        var env = parseInt(req.query.env);
        var system_config = utils.getConfigByEnv(env);
        var api_key = system_config.api_key;
        var api_secret = system_config.api_secret;
        var sdcp = system_config.sdcp;

        var option = {
            url :  sdcp + '/devicedata/getbydocid',
            "Content-type" : "application/json",
            "method" : 'POST',
            "json" : {
                "api_key" : api_key,
                "api_token" : sha1( api_secret + time ),
                "time" : time,
                "doc_id": doc_id + cid
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
        res.status(200).json(result);
        return;
    });
});


module.exports = router;