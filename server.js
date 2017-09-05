var express = require('express');
var app = express();
var path = require('path');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var request = require("request");
var fs = require("fs");
var Client = require('ssh2-sftp-client');
var sftp = new Client();

var credential = {
    host: 'wematters.brickftp.com',
    port: '22',
    username: 'vt30071990@gmail.com',
    password: 'vaibhav123'
}

var port = process.env.PORT || 3000;

app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())


app.use(session({ secret: 'meanstack402', saveUninitialized: true, resave: true})); // session secret
//app.use(express.static( path.join(__dirname + '/app')));
app.use(flash()); // use connect-flash for flash messages stored in session

app.get("/", function(request, response){
	response.send("hello world");
});



function uploadToFTP( filedetails ){
	var filename = filedetails.name;
	var filetype = filedetails.filetype;
	var fileurl = filedetails.fileurl;
	var fileid = filedetails.id;

	sftp.connect(credential).then(() => {
	    //return sftp.list('/pa_sftp_test');
	    return sftp.put(__dirname + "/" + filename, "/pa_test/" + filename);

	}).then((data) => {
	    //console.log(data, 'the data info');
	    console.log('file with id : '+ fileid + " uploaded successfully");
	}).catch((err) => {
	    console.log(err, 'catch error');
	});
}

function saveFile(filedetails){
	var filename = filedetails.name;
	var filetype = filedetails.filetype;
	var fileurl = filedetails.fileurl;
	var fileid = filedetails.id;
	
	if( fileurl && filename ){
		request(fileurl).pipe(fs.createWriteStream("./uploads/"+filename));

		return true;
	}
	return false;
}


app.post("/sftp", function(req, res){
	var fileObj = req.body.filedetails;
	var savesuccess = saveFile( fileObj );
	var uploadsuccess = false;
	if ( savesuccess ) {
		uploadsuccess = uploadToFTP( fileObj );
		if ( uploadsuccess ) {
			res.json({
				code:'NA200',
				details: "file with id : " + fileObj.id + " uploaded successfully."
			});
		}
		res.json({
			code:"NA402",
			details:"Not able to save it on ftp"
		});
	}
	res.json({
		code:"NA401",
		details:"Not able to save locally"
	});
});
/*
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});*/

app.listen(port, function(){
	console.log('listening @ port : ' + port);
});

module.exports = app;