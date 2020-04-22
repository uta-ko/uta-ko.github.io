/*@cc_on _d=document;eval('var document=_d')@*/
// ウィンドウを読み込んだ時にモデルを読み込む
window.onload = (ev)=>{
    loadModel()
    video = document.getElementById('v');
    cvs = document.getElementById('c');
    document.getElementById("c").style.display='none';
    
    res_size = 40;
    size = 80;
    frameRate = 1/30;
    video.load();
    

    //videoのサイズからcanvasのサイズを指定
    video.addEventListener("loadedmetadata",function(){
        cvs.width = video.videoWidth;
        cvs.height = video.videoHeight;
        document.getElementById('ok').innerHTML = 'ok';
        // 繰り返し回数の宣言
        forx = Math.floor(cvs.width/res_size);
        fory = Math.floor(cvs.height/res_size);
        ctx = cvs.getContext("2d")
        //console.log(video.duration());
        
    },false);
}

// モデルの読み込み
async function loadModel(){
    moedllodadtime_s = Date.now();
    const path = 'model.json'//"https://uta-ko.github.io/model.json"
    model = await tf.loadModel(path);
    modelloadtime_e = Date.now();
    console.log('model load time: '+(modelloadtime_e - moedllodadtime_s)/1000);
}

// 解析処理
var filter = function(src, dst, width, height, prediction){    
    for (var n = 0; n < height; n = (n+1)|0) {
        for (var m = 0; m < width; m= (m+1)|0) {
            var idx = (m + n * width) * 4;       
            dst[idx] = Math.round(255*prediction[1]);// r
            dst[idx + 1] = Math.round(255*prediction[0]);// g
            dst[idx + 2] = Math.round(255*prediction[2]);// b
            dst[idx + 3] = src[idx + 3];
        }
    }
};

// 予測処理
async function predict(){

    // 処理開始時間の取得
    start = Date.now();

    var score_p = 0.0;
    var score_j = 0.0;
    var score_c = 0.0;
    var counter = 0.0;
    
    for ( var i=0; i<forx; i=(i+1)|0){
        posx = i*(res_size);
        for ( var j=0; j<fory; j=(j+1)|0){
            posy = j*(res_size);
            centerx = posx + posx/2;
            centery = posy + posy/2;
        
            //結果画像の生成
            srcData = ctx.getImageData(posx, posy, size, size);
            src = srcData.data;
            
            var judge = 0; 
            // 輝度値の取得
            brightness_s = Date.now();
            for (var k = 0; k < size; k=(k+1)|0) {
                for (var l = 0; l < size; l=(l+1)|0) {
                    var idx = (l + k * size) * 4;
                    judge += src[idx] + src[idx+2] + src[idx+1];
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
                
                // 領域塗りつぶし
                ctx.fillStyle = 'rgb('+Math.floor(255*prediction[1])+','+Math.floor(255*prediction[0])+','+Math.floor(255*prediction[2])+')';
                ctx.fillRect((posx+(res_size/2)),(posy+(res_size/2)),res_size,res_size);
                counter += 1;        
                        }
                    }
    }
    
    //document.getElementById('time').textContent = String((end-start)/1000)+ 'sec.';
    document.getElementById('P').textContent = 'P: '+ String(score_p/counter);
    document.getElementById('J').textContent = 'J: '+ String(score_j/counter);
    document.getElementById('C').textContent = 'C: '+ String(score_c/counter);
    
    }

    // 開始ボタンを押したときの処理
    document.getElementById("startbtn").addEventListener("click",() =>{
        canvas = document.createElement("canvas");
        rescanvas = document.getElementById('c2');
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
        //start = Date.now();

        //録画開始
        recorder.start();
        var frameCnt = 0;
        async function run(){
            await video.play();
            proccesstime = 0;
            setTime = new Date();
            for(var frame = 0; frame<30*30; frame=(frame+1)|0){
                ctx.drawImage(video,0,0);
                if (frame%30 == 0){
                    while (new Date() - setTime < 1000*(frame/30));
                    await predict();
                    resctx.drawImage(cvs,0,0);
                    t = (Date.now()- start)/1000;
                    console.log(t);
                    proccesstime += t;
                }
                }
                frameCnt += 1; 
        };
        run();

        // videoが最後まで再生された時
        video.addEventListener("ended", function() {
            totaltime = (Date.now()-setTime)/1000;
            console.log('totaltime: '+ totaltime + "sec.");
            console.log('proccess time:'+ proccesstime);
            console.log(proccesstime/totaltime*100 + '%');
            recorder.stop();
            console.log('STOP!');  
            
        })

        // 停止ボタン
        document.getElementById("endbtn").addEventListener("click",() =>{
            recorder.stop();
            
        })

    });
