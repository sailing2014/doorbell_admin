var url = require('url'),
    querystring = require('querystring'),
    fs = require('fs'),
    util = require('util'),
    cryptoUtil = require('./cryptoUtil');
var MODULE_NAME = 'utils';
var PROJECT_NAME = 'doorbell_admin';
var logger = require('./logger.js' ).logger;
var config = require( '/home/doorbell_admin/conf/config.json' );

var validate = require('./validate');
/**
 * 输出到console
 */
exports.console=function(message){
    console.log(message);
}
/**
 * 输出到控制台和日志
 * @param message
 */
exports.consoleAndLogger=function(message){
    logger.info(PROJECT_NAME+'.'+message);
    console.log(PROJECT_NAME+'.'+message);

}
/**
 * 验证token是否有效
 * 从users集合中获取token，
 * 如果不存在，则直接返回错误；
 * 如果存在，验证是否在有效期内
 * @param token
 * @result
 * 0 token在有效期内
 * 1 token存在、但是超过有效期
 * 2 token不存在
 * 3 db query err
 */
exports.doAuth = function(token,cb){
    var ret = {
        "errorCode":400003,
        "errorMessage":''
    };
    User.findOne({"token.value":token},function(err,obj){
        if(err){
            logger.info(PROJECT_NAME+'.err.'+MODULE_NAME+' doAuth err:'+err);
            ret.errorCode = 400001;
            ret.errorMessage = 'Token query err';
            cb(null,ret);
        }
        if(obj){
            var retToken = obj.token;
            //validate token is out of time or not
            var coast = parseInt(retToken.createTime)+parseInt(retToken.expire);
            var nowTime = new Date().getTime();
            if(coast > nowTime){
                ret.errorCode = 0;
                cb(null,ret);
            }else{
                ret.errorCode = 400002;
                ret.errorMessage = 'Token out of time';
                cb(null,ret);
            }
        }else{
            ret.errorCode = 400001;
            ret.errorMessage = 'Token doesn\'t exist';
            cb(null,ret);
        }
    })
}


/**
 *json配置文件解析成json字段
 *@author zjy
 * @time 2014-12-08
 * @param filename
 * @param key
 * @returns {{}}
 */
exports.fileToJson = function(filename,key){
    var configJson = {};
    try{
        var str = fs.readFileSync(filename,'utf8');
        configJson = JSON.parse(str.toString());//str用str.toString，防止报异常
    }catch(e){
        util.debug(e);
    }
    return configJson[key];
}
/**
 * 生成access_token
 * 生成规则：用户id+100内的随机数
 * @param data
 * @returns {*}
 */
exports.enAccess_token = function(data){
    return cryptoUtil.aesEncrypt(data+Math.random().toString(36).substr(2).slice(0,2));
}

/**
 * 解析access_token
 * 生成规则：用户id+用户最后的一次时间戳
 * @param data
 * @returns {*}
 */
exports.deAccess_token = function(data){
    return cryptoUtil.aesEncrypt(data);
}


/**
 * 验证传入的参数是否满足要求
 * @param params
 * @param pattern
 *  * @returns boolean
 */
exports.check_params = function(params,pattern){
    try{
        if(pattern === 'post /users/token'){
            var username = params.username,
                password = params.password;
            if(username == undefined || password == undefined){
                return false;
            }
            if(validate.isUserName(username) && validate.isPsd(password)){
                return true;
            }else{
                return false;
            }
        }else if(pattern === 'delete /users/token'){
            var username = params.username;
            if(username == undefined){
                return false;
            }
            return validate.isUserName(username);
        }


    }catch (e){
        return false;
        console.log(e)
        util.debug('check_params____>'+e);
    }
}

/**
 * format timestamp. result format e.g "2010-10-20 10:00:00"
 * @param nS
 * @returns {string}
 */
exports.getLocalTime = function (nS) {
    var date = new Date(parseInt(nS) * 1000);
    var str = date.getFullYear()+'-'+(date.getMonth()+1)+'-'+date.getDate()+' '+date.getHours()+':'+date.getMinutes()+':'+date.getSeconds();
    return str;
}

/**
 *
 *
 * @param env
 * @returns {{api_key: *, api_secret: *, sdcp: *, doorbell: *}}
 */
exports.getConfigByEnv = function (env){
    var data = {
        "api_key":config.system.dev.api_key,
        "api_secret":config.system.dev.api_secret,
        "sdcp":config.sdcp.dev,
        "doorbell":config.doorbell.dev
    };

    switch (env){
        case 1:
            data = {
                "api_key":config.system.staging.api_key,
                "api_secret":config.system.staging.api_secret,
                "sdcp":config.sdcp.staging,
                "doorbell":config.doorbell.staging
            };
            break;

        case 2:
            data = {
                "api_key":config.system.pro1.api_key,
                "api_secret":config.system.pro1.api_secret,
                "sdcp":config.sdcp.pro1,
                "doorbell":config.doorbell.pro1
            };
            break;

        case 3:
            data = {
                "api_key":config.system.pro2.api_key,
                "api_secret":config.system.pro2.api_secret,
                "sdcp":config.sdcp.pro2,
                "doorbell":config.doorbell.pro2
            };
            break;
    }

    return data;
}