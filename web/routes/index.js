var express = require('express');
var User = require( '../models/User' );
var utils = require( '../utils/utils.js' );
var CryptoUtil = require( '../utils/cryptoUtil' );
var Result = require( '../Result' );
var user = utils.fileToJson( '/home/doorbell_admin/conf/admin.json', 'user' );

var router = express.Router();
var MODULE_NAME = "index";

/* GET index page. */
router.get('/', function(req, res,next) {
    res.render('login', { title: 'Express' , message:' ' });    // 到达此路径则渲染index文件，并传出title值供 index.html使用
});

/* GET login page. */
router.route("/login").get(function(req,res){    // 到达此路径则渲染login文件，并传出title值供 login.html使用
    res.render("login",{title:'User Login' , message:' ' });
}).post(function(req,res){ 					   // 从此路径检测到post方式则进行post数据的处理操作
    var result = new Result();
    result.errorCode = 0;

    //get User info
    //这里的User就是从model中获取user对象，通过global.dbHandel全局方法（这个方法在app.js中已经实现)
    var uname = req.body.uname;				//获取post上来的 data数据中 uname的值
    User.findOne({username:uname},function(err,doc){   //通过此model以用户名的条件 查询数据库中的匹配信息        c
        if(err){ 										//错误就返回给原post处（login.html) 状态码为500的错误
            // res.send(500);
            // console.log(err);
            result.errorCode = 500001;
            result.errorMessage = 'db query error';
            utils.consoleAndLogger( 'err:' + MODULE_NAME + ' /login '+ result.errorMessage );
            res.status( 500 ).json( result );
        }else if(!doc){ 								//查询不到用户名匹配信息，则用户名不存在
            // req.session.error = '用户名不存在';
            // res.send(404);							//	状态码返回404
            //	res.redirect("/login");
            // console.log(err);
            result.errorCode = 410001;
            result.errorMessage = 'Login failed: incorrect username.';
            utils.consoleAndLogger( MODULE_NAME + ' /login ' + result.errorMessage );
            res.status( 400 ).json( result );
        }else{
            if(CryptoUtil.aesEncrypt(req.body.upwd) != doc.password){ 	//查询到匹配用户名的信息，但相应的password属性不匹配
                // req.session.error = "密码错误";
                // res.send(404);
                // console.log(err);
                result.errorCode = 410001;
                result.errorMessage = 'Login failed: incorrect password.';
                utils.consoleAndLogger( MODULE_NAME + ' /login ' + result.errorMessage );
                res.status( 400 ).json( result );
                //	res.redirect("/login");
            }else{ 									//信息匹配成功，则将此对象（匹配到的user) 赋给session.user  并返回成功
                // req.session.user = doc;
                user = doc;
                var value = utils.enAccess_token( doc.username );
                if( doc.token ){
                    var retToken = doc.token;
                    //validate token is out of time or not
                    var coast = parseInt( retToken.createTime ) + parseInt( retToken.expire );
                    var nowTime = new Date().getTime();
                    if( coast > nowTime ){
                        value = retToken.value;
                    }
                }

                //store session
                req.session.user = doc;

                //验证如果token存在，并且没超过有效期的话
                user.token = {
                    value : value,
                    createTime : new Date().getTime(),
                    expire : 20 * 60 * 1000//20 minutes
                };
                var update = {$set : {token : user.token}};
                User.update( {username : doc.username}, update, function( err, obj ){
                    result.errorMessage = 'Login success.';
                    result.data.token = user.token.value;
                    utils.consoleAndLogger( MODULE_NAME + ' /token login success.' );
                    res.status( 200 ).json( result );
                } );

            }
        }
    });
});

/* GET home page. */
router.get("/home",function(req,res){
    utils.consoleAndLogger( MODULE_NAME + ' /home' );
    if(!req.session.user){ 					//到达/home路径首先判断是否已经登录
        req.session.error = "请先登录"
        res.redirect("/login");				//未登录则重定向到 /login 路径
    }else {
        res.render("home", {title: 'Home', user: req.session.user});         //已登录则渲染home页面
    }
});

/* GET logout page. */
router.get("/logout",function(req,res){    // 到达 /logout 路径则登出， session中user,error对象置空，并重定向到根路径
    req.session.user = null;
    req.session.error = null;
    res.redirect("/");
});

module.exports = router;
