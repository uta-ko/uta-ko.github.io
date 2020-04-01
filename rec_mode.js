var recorder;
var canvas = document.getElementById("picture");
var cnt = 0;
var frame_no = 0;
var imgsrc = [];
var ctx2 = canvas.getContext("2d");

const medias = {
  audio: false,
  video: {facingMode: {exact : 'environment'}}
};
const video = document.getElementById("camera");
const promise = navigator.mediaDevices.getUserMedia(medias);

promise.then(successCallback)
       .catch(errorCallback);

function successCallback(stream) {
  video.srcObject = stream;
};

function errorCallback(err) {
  alert(err);
};

//recボタンを押したとき
function startVideo(){
  var stream = canvas.captureStream();
	    //ストリームからMediaRecorderを生成
	    recorder = new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});
	    //ダウンロード用のリンクを準備
	    var anchor = document.getElementById('downloadlink');
    	//録画終了時に動画ファイルのダウンロードリンクを生成する処理
    	recorder.ondataavailable = function(e) {
	  	var videoBlob = new Blob([e.data], { type: e.data.type });
	  	blobUrl = window.URL.createObjectURL(videoBlob);
	    anchor.download = 'movie.webm';
	    anchor.href = blobUrl;
      anchor.style.display = 'block';
    }
      //録画開始
      recorder.start();
      timer1 = setInterval(getImage,33);
};

function stopVideo(){
  clearInterval(timer1);
      recorder.stop();
};


