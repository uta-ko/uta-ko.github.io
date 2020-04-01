
var recorder;
var canvas = document.getElementById("picture");
var cnt = 0;
var frame_no = 0;
var imgsrc = [];
var ctx2 = canvas.getContext("2d");

window.onload = () => {
	const video  = document.querySelector("#camera");
	
    /** カメラ設定 */
    const constraints = {
      audio: false,
      video: {
        //facingMode: "user"   // フロントカメラを利用する
        facingMode: { exact: "environment" }  // リアカメラを利用する場合
      }
    };
  
    /*カメラを<video>と同期*/
    navigator.mediaDevices.getUserMedia(constraints)
    .then( (stream) => {
	video.srcObject = stream;
	video.onloadedmetadata = (e) => {
     	video.play();
	let w = video.offsetWidth ;
	let h = video.offsetHeight ;
	canvas.width = w ;
	canvas.height = h ;
      };
    })
    .catch( (err) => {
      console.log(err.name + ": " + err.message);
    });
  
    let timer1;
    let getImage = function(){
        ctx2.drawImage(video,0,0);
        //imgsrc.push(ctx2);
        //cnt ++
        
        
    };
  
    // 開始ボタン
    document.getElementById("startbtn").addEventListener("click",() =>{
	
      var stream = canvas.captureStream();
	    arert("ok");
	    //ストリームからMediaRecorderを生成
	    recorder = new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp9'});
	    //ダウンロード用のリンクを準備
	    var anchor = document.getElementById('downloadlink');
    	//録画終了時に動画ファイルのダウンロードリンクを生成する処理
    	recorder.ondataavailable = function(e) {
	  	var videoBlob = new Blob([e.data], { type: e.data.type });
	  	blobUrl = window.URL.createObjectURL(videoBlob);
	    anchor.download ='movie.webm';
	    anchor.href = blobUrl;
      anchor.style.display = 'block';
    }
      //録画開始
      recorder.start();
      timer1 = setInterval(getImage,33);
      

    })
    // 停止ボタン
    document.getElementById("endbtn").addEventListener("click",() =>{
      clearInterval(timer1);
      recorder.stop();
      
      
    })
  
  };
