var fs          = require('fs');
var request     = require('request');
var _           = require('underscore');
var Promise     = require('promise');
var streamingS3 = require('streaming-s3');

var apiUrls = require('../config/apiurls.json');
var config  = require('../config/config.json');


var newExport = function(data){
	
    var app = data.app, io  = data.io;
	
    app.get('/', function(req, res){
        res.render('index.jade');
        
        _.each(apiUrls.showsUrls, function(url){
            console.log('Hitting show api : ' + url + '\n\n');
            
            /* To send info to browser - which Show API is being hit,
             * remove the below comment. */
            //io.sockets.emit('makeAnAlert', {data:'Hitting show url : '+url});
            callApi(url).then(function(showsData){
                for(var val in showsData.data){
                    videoApiUrl = apiUrls.fullVideoApi.replace('__SHOW_ID__', showsData.data[val].id).replace('__CurrentTimeStamp__', new Date().toISOString());
                    workWithVideoApiUrl(videoApiUrl);
                }
            });
        });
        
        /* To upload video file to S3*/
        //sampleFileUpload();
    });
	
    /**
     * To hit the video API, and get the Permalinks.
     * @param {string} videoApiUrl
     * @returns {undefined}
     */
    function workWithVideoApiUrl(videoApiUrl){
        console.log('Hitting video api : '+videoApiUrl);
        callApi(videoApiUrl).then(function(videosData){
            for(var val in videosData.data){
                /* Remove the below comment to send info to browser 
                 * that which permalink is being hit. */
                //io.sockets.emit('appendPermaLink', {'permalink':videosData.data[val].attributes.permalink});
                hitPermalink(videosData.data[val].attributes.permalink +'?'+new Date().toISOString()).then(function(result){
                    console.log('Success hitting Perma link : '+result);
                });
            }
        });
    }
    
}

/**
 * To hit the Permalink
 * @param {string} url - Permalink
 */
function hitPermalink(url) {
    return new Promise(function(resolve, reject){
        console.log('.');
        request(url, function(err, response, body){
            if(!err && response.statusCode == 200) {
                resolve(url);
            } else {
                console.log('Error while hitting Permalink : ' + err +', Status code : '+response.statusCode+'\n');
                reject(err);
            }
        });
    });
}

/**
 * 
 * @param {string} url - API
 * @returns {Promise}
 */
function callApi(url){
    return new Promise(function(resolve, reject){
        request(url, function(err, response, body){
            if(!err && response.statusCode == 200) {
                resolve(JSON.parse(body));
            } else {
                console.log('Error while hitting show/video API : '+ err +', Status code : '+response.statusCode+'\n');
                reject(err);
            }
        });
    });
}

/**
 * To upload video files to S3 (for future purpose)
 */
function sampleFileUpload(){
    var fStream = fs.createReadStream('public/testvideo.mp4');
    var uploader = new streamingS3(fStream, {accessKeyId: config.myAccessKeyId, secretAccessKey: config.mySecretAccessKey, region: config.region},
                    {
                        Bucket: config.myPersonnelBucket,
                        Key: 'testvideo.mp4',
                        ContentType: 'video/mp4'
                    }
    );

    uploader.begin(); // Important if callback not provided. 

    uploader.on('data', function (bytesRead) {
      console.log(bytesRead, ' bytes read.');
    });

    uploader.on('part', function (number) {
      console.log('Part ', number, ' uploaded.');
    });

    // All parts uploaded, but upload not yet acknowledged. 
    uploader.on('uploaded', function (stats) {
      console.log('Upload stats: ', stats);
    });

    uploader.on('finished', function (resp, stats) {
      console.log('Upload finished: ', resp);
    });

    uploader.on('error', function (e) {
      console.log('Upload error: ', e);
    });
}


module.exports = newExport; 
