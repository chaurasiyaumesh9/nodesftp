var express = require('express');
var app = express();
var path = require('path');
var flash = require('connect-flash');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');
var request = require("request");
var fs = require("fs");
var Sftp = require('sftp-upload');
var logger    = require('yocto-logger');
var sftp      = require('yocto-sftp')(logger);
var rp = require('request-promise');

var cors = require('cors')

/*var credential = {
    host: 'wematters.brickftp.com',
    port: '22',
    path: __dirname + '/uploads',
    remoteDir: '/pa_test',
    username: 'vt30071990@gmail.com',
    password: 'vaibhav123',
    algorithms  : {
	    serverHostKey: [ 'ssh-rsa', 'ssh-dss' ],
	  },
	 agent: process.env.SSH_AUTH_SOCK
}*/


var credential = {
    host: 'primary.brickftp.com',
    port: '22',
    path: __dirname + '/uploads',
    remoteDir: '/Test Backup/NodeTest',
    username: 'pchoksi',
    password: 'uu8MBYAV*80',
    algorithms  : {
	    serverHostKey: [ 'ssh-rsa', 'ssh-dss' ],
	  },
	 agent: process.env.SSH_AUTH_SOCK
}
//sftp = new Sftp(credential);



function uploadAll(){
	sftp.load(credential).then(function () {
	  console.log('\n --> config success ... ');
	 	
	 	fs.readdir(__dirname + '/uploads', (err, files) => {
		  files.forEach(file => {
		    //console.log(file);
		    sftp.put(__dirname + '/uploads/' + file, '/Test Backup/NodeTest/' + file).then(function (list) {
			    console.log('\n --> ls success \n', list);
			    fs.appendFile(__dirname + '/results/success.txt', file +'\n', function (err) {
				  if (err) throw err;
				  //console.log('Saved!');
				});
			 
			  }).catch(function (error) {
			    console.log('\n --> ls failed ', error);
			    fs.appendFile(__dirname + '/results/failure.txt', file +'\n', function (err) {
				  if (err) throw err;
				  //console.log('Saved!');
				});
			  });
		  });
		});
	}).catch(function (error) {
	  console.log('\n --> error : ', error);
	});
}


var port = process.env.PORT || 3000;

app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json());
app.use(cors());


app.use(session({ secret: 'meanstack402', saveUninitialized: true, resave: true})); // session secret
//app.use(express.static( path.join(__dirname + '/app')));
app.use(flash()); // use connect-flash for flash messages stored in session

app.get("/", function(request, response){
	//response.send("hello world");
	//response.render(__dirname + '/index.html');
	response.sendFile(path.join(__dirname + '/index.html'));

});


function uploadToFTP( filedetails ){
	var filename = filedetails.name;
	var fileurl = filedetails.url;
	var fileid = filedetails.id;

	return sftp.connect(credential).then(() => {
	    //return sftp.list('/pa_sftp_test');
	    return sftp.put(__dirname + "/uploads/" + filename, "/pa_test/" + filename);

	});
}

function saveFile(filedetails){
	var filename = filedetails.name;
	var fileurl = filedetails.url;
	var fileid = filedetails.id;

	if( fileurl && filename ){
		request
		  .get(fileurl)
		  .on('response', function(response) {
		    console.log(response.statusCode) // 200
		    console.log(response.headers['content-type']) // 'image/png'
		  })
		  .pipe(fs.createWriteStream("./uploads/"+filename));
		//request(fileurl).pipe(fs.createWriteStream("./uploads/"+filename));

		return true;
	}
	return false;
}

app.post('/upload',function(req, res){
	var filesArray = JSON.parse(req.body.filesarray);

	if(filesArray && filesArray.length > 0){
		for(var i=0;i<filesArray.length; i++){
			var filename = filesArray[i]['columns']['name'];
			var fileurl = filesArray[i]['columns']['url'];
			request
			  .get(fileurl)
			  .on('response', function(response) {
			    //console.log(response.statusCode) // 200
			    console.log(response.headers['content-type']) // 'image/png'
			  })
			  .pipe(fs.createWriteStream("./uploads/" + filename));
			//request(fileurl).pipe(fs.createWriteStream("./uploads/"+filename));
			
		}

		setTimeout(function(){
			uploadAll();
		},5000);
	}
	//res.json(filesArray);
});


app.post("/sftp", function(req, res){
	var fileObj = JSON.parse(req.body.filedetails);
	
	var savesuccess = saveFile( fileObj );
	if ( savesuccess ) {
		uploadToFTP( fileObj ).then((data) => {
			console.log("file with id : " + fileObj.id + " uploaded successfully.");
		   	res.json({
				code:'NA200',
				details: "file with id : " + fileObj.id + " uploaded successfully."
			});
		}).catch((err) => {
		    //console.log(err, 'catch error');
		    res.json({
				code:"NA402",
				details:"Not able to save it on ftp" + err
			});
		});;		
	}else{
		res.json({
			code:"NA401",
			details:"Not able to save locally"
		});
	}
	
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