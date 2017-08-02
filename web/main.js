var express = require( "express" );
var favicon = require( 'serve-favicon' );
var bodyParser = require( 'body-parser' );
var cookieParser = require( 'cookie-parser' );
var path = require( 'path' );
var index = require( './routes/index' );
var users = require( './routes/users' );
var data = require( './routes/data' );
var log = require( './routes/log' );
var utils = require( './utils/utils.js' );
var logger = require('./utils/logger');
var Result = require( './Result' );

//init mongodb data when first publish
var initUser = require('./initData/initUserList');
var mongodbConnect = require( './models/db/mongodbConnect' );
var db = mongodbConnect.connectMongoDb();

//store session to mongodb as server count will not be one
var session = require('express-session');
var MongoStore = require('connect-mongo/es5')(session);
var app = express();

app.use(session({
           //secret recommand 128 bytes random string
    secret:'6b785262428c38ca155fe7062e578c527962907f3cf8e40d9cdf9f22497a74426fa60b08c7ad96438ba3cc0ab70eb93760cd62dabf2621f421ed0b1f3888f317',
    saveUninitialized: false, // don't create session until something stored
    resave: false, //don't save session if unmodified
    store: new MongoStore({
                            mongooseConnection: db ,
                            ttl: 20*60  //20 minutes expiration date
                        })
}));

app.set( 'views', path.join( __dirname, 'views' ) );
app.engine("html",require("ejs").__express); // or   app.engine("html",require("ejs").renderFile);
//app.set("view engine","ejs");
app.set('view engine', 'html');
logger.use(app);

// for parsing application/json
app.use( bodyParser.json() );
// for parsing application/x-www-form-urlencoded
app.use( bodyParser.urlencoded( { extended : true } ) );

app.use( '/public', express.static( path.join( __dirname, './public' ) ) );
app.use( favicon( __dirname + '/public/favicon.ico' ) );

//router info
app.use('/', index);  // 即为为路径 / 设置路由
app.use('/users', users); // 即为为路径 /users 设置路由
app.use('/login',index); // 即为为路径 /login 设置路由
app.use('/home',index); // 即为为路径 /home 设置路由
app.use("/logout",index); // 即为为路径 /logout 设置路由
app.use("/devices", data);
app.use("/logs", log);

// catch 404 and forward to error handler
app.use( function( req, res ){
    var result = new Result();
    result.errorCode = 400004;
    result.errorMessage = 'URL not found:' + req.url;
    res.status( 404 ).json( result );
} );

var server = app.listen(60730,function(){
    var host = server.address().address;
    var port = server.address().port;

    console.log("server address http://%s:%s",host, port);
});