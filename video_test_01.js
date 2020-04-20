// ウィンドウを読み込んだ時にモデルを読み込む
window.onload = (ev)=>{
    loadModel()
    video = document.getElementById('v');
    cvs = document.getElementById('c');
    res_size = 40;
    size = 80;
    video.load();
    video.playbackRate = 1/10000;

    //videoのサイズからcanvasのサイズを指定
    video.addEventListener("loadedmetadata",function(){
        cvs.width = video.videoWidth;
        cvs.height = video.videoHeight;
        console.log(cvs.height);
        document.getElementById('ok').innerHTML = 'ok';
        forx = Math.floor(cvs.width/res_size);
        fory = Math.floor(cvs.height/res_size);
        ctx = cvs.getContext("2d")
    },false);
}

function sleep(waitMsec) {
    var startMsec = new Date();
   console.log("sleep");
    // 指定ミリ秒間だけループさせる（CPUは常にビジー状態）
    while (new Date() - startMsec < waitMsec);
  }

// playボタンを押したときの処理
function play(){
    

    //結果出力用キャンバスに画像をセット
    canvas = document.createElement("canvas")
    context = canvas.getContext('2d');
    dstData = context.createImageData(res_size, res_size);
    dst = dstData.data;
    canvas.width = res_size;
    canvas.height = res_size;
    video.play();
    // 処理開始時間の取得
    start = Date.now();
    //タイマーでフレームレート毎に処理を行う
    timer1 = setInterval(function(){
        video.pause();
        // canvasにvideo要素を書き込む
        ctx.drawImage(video,0,0);
        predict();
        video.play();
    },6000/1);

    video.addEventListener("ended", function() {
        clearInterval(timer1);
        console.log('STOP!')    
        })
    }

// モデルの読み込み
async function loadModel(){
    const path = "https://uta-ko.github.io/model.json"
    model = await tf.loadModel(path);
}

// 解析処理
var filter = function(src, dst, width, height, prediction){    
    for (var n = 0; n < height; n++) {
        for (var m = 0; m < width; m++) {
            var idx = (m + n * width) * 4;       
            dst[idx] = Math.floor(255*prediction[1]);//r
            dst[idx + 1] = Math.floor(255*prediction[0]);//g
            dst[idx + 2] = Math.floor(255*prediction[2]);//b
            dst[idx + 3] = src[idx + 3];
        }
    }
};

// 予測処理
async function predict(){
    
    // 繰り返し回数の宣言
    var score_p = 0;
    var score_j = 0;
    var score_c = 0;
    var counter = 0;
    
    for ( var i=0; i<forx; i++){
        posx = i*(res_size);
        for ( var j=0; j<fory; j++){
            posy = j*(res_size);
            centerx = posx + posx/2;
            centery = posy + posy/2;
        
            //結果画像の生成
            srcData = ctx.getImageData(posx, posy, size, size);
            src = srcData.data;
            
            var judge = 0; 
            // 輝度値の取得
            for (var k = 0; k < size; k++) {
                for (var l = 0; l < size; l++) {
                    var idx = (l + k * size) * 4;
                    judge += src[idx];
                    judge += src[idx+2];
                    judge += src[idx+1];
                }
            }
            var bright = judge/(size*size*3);
            
            //輝度値126以上の時 条件分岐
            if (bright > 126){
                var array = [];
                var fp = tf.fromPixels(srcData);
                var tensor = tf.image.resizeNearestNeighbor(fp,[16, 16]).toFloat();
                var offset = tf.scalar(255);
                var tensor_image = tensor.div(offset).expandDims();
                array.push(tensor_image)
                prediction = await model.predict(array).data();
                score_p += prediction[0];
                score_j += prediction[1];
                score_c += prediction[2];
                
                filter(src, dst, canvas.width, canvas.height,prediction);
                ctx.putImageData(dstData,(posx+(res_size/2)),(posy+(res_size/2)));
                counter += 1;
            
            }
        }
    }

    var end = Date.now();
    document.getElementById('time').innerHTML = 'time :' +((end-start)/1000)+ 'sec.';
    //document.getElementById('first').innerHTML = 'P :' + score_p/counter;
    //document.getElementById('second').innerHTML = 'J : '+ score_j/counter;
    //document.getElementById('third').innerHTML = 'C :' + score_c/counter;
        
    }

    // 開始ボタンを押したときの処理
    document.getElementById("startbtn").addEventListener("click",() =>{
        

        canvas = document.createElement("canvas")
        rescanvas = document.createElement("canvas")
        context = canvas.getContext('2d');
        resctx = rescanvas.getContext('2d');
        dstData = context.createImageData(res_size, res_size);
        dst = dstData.data;

        canvas.width = res_size;
        canvas.height = res_size;
        rescanvas.width = cvs.width;
        rescanvas.height = cvs.height;
        

        //ctx.drawImage(video,0,0);
        var stream = rescanvas.captureStream();
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
        
        // 処理開始時間の取得
        start = Date.now();

        //録画開始
        recorder.start();
        //video.play();
        //timer2 = setInterval(function(){
        //    video.pause();
            // canvasにvideo要素を書き込む
       //     ctx.drawImage(video,0,0);
       //     predict();
            //video.play();
        //},5000);
        var vc = true;
       
        async function run(){
            video.play()
            while(vc=true){         
                await video.play();
                sleep(34);
                await video.pause();
                await ctx.drawImage(video,0,0);
                await predict();
                console.log(ctx);
                await resctx.drawImage(cvs,0,0);
            }
        };
        run();

        video.addEventListener("ended", function() {
            vc=false;
            //clearInterval(timer2);
            console.log('STOP!')    
            })
  
      })

      // 停止ボタン
      document.getElementById("endbtn").addEventListener("click",() =>{
        vc=false;  
        //clearInterval(timer2);
        recorder.stop();
        
      })
