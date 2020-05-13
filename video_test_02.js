// 解析結果グラフ表示OK
// 解析速度1sec/frame
// 瞬き検出ok

let video = document.getElementById('video');
let src_canvas = document.getElementById('src_canvas');
let dst_canvas = document.createElement("canvas");
let area_canvas = document.createElement("canvas"); 
let res_canvas = document.getElementById('res_canvas'); 
let graph_canvas = document.getElementById('graph');
document.getElementById("src_canvas").style.display='none';
let res_size = 40;
let temp_size = 80;
let graph_h = 200; // グラフの高さ
let graph_w = 1200; // グラフの横幅

const FPS = 30;
const FRAME_RATE = 1/FPS; 
const frameno = FPS*30; // フレーム枚数    
let seg_num_x;
let seg_num_y;
let src_context;
let dst_context;
let area_context;
let res_context;
let graph_context;
let model;
let posx, posy;
let range_w = Math.round(graph_w/30); // グラフに描写する横幅

// ウィンドウを読み込んだ時にモデルを読み込む
window.onload = (ev)=>{
    loadModel()
    video.load();

    //videoのサイズからcanvasのサイズを指定
    video.onloadedmetadata = (e)=>{
        src_canvas.width = video.videoWidth;
        src_canvas.height = video.videoHeight;
        graph_canvas.width = graph_w;
        graph_canvas.height = graph_h;

        // 繰り返し回数の宣言
        seg_num_x = Math.floor(src_canvas.width/res_size);
        seg_num_y = Math.floor(src_canvas.height/res_size);
        src_context = src_canvas.getContext("2d");

        // 解析範囲切り出し用のcanvasの宣言
        dst_canvas.width = video.videoWidth;
        dst_canvas.height = video.videoHeight;
        dst_context = dst_canvas.getContext('2d')
        document.getElementById('video_loaded').innerHTML = 'Loaded';
        
    };
};

// モデルの読み込み
async function loadModel(){
    moedllodadtime_s = Date.now();
    const path = 'model.json'//"https://uta-ko.github.io/model.json"
    model = await tf.loadModel(path);
    modelloadtime_e = Date.now();
    console.log('model load time: '+(modelloadtime_e - moedllodadtime_s)/1000);
};

// 開始ボタンを押したときの処理
document.getElementById("startbtn").onclick = (e) =>{
    
    res_canvas.width = src_canvas.width;
    res_canvas.height = src_canvas.height;
    res_context = res_canvas.getContext('2d');
    graph_context = graph_canvas.getContext("2d");
    var frame_number = 0;
    dstData = src_context.createImageData(res_size, res_size);
    dst = dstData.data;

    var stream = res_canvas.captureStream();
    //ストリームからMediaRecorderを生成
    var recorder = new MediaRecorder(stream,{mimeType:'video/webm;codecs=vp8'});    
    //ダウンロード用のリンクを準備
    var anchor = document.getElementById('downloadlink');
    //録画終了時に動画ファイルのダウンロードリンクを生成する処理
    recorder.ondataavailable = (e)=> {
        var videoBlob = new Blob([e.data], { type: e.data.type });
        blobUrl = window.URL.createObjectURL(videoBlob);
        anchor.download = 'movie.webm';
        anchor.href = blobUrl;
        anchor.style.display = 'block';
    };

    //録画開始
    recorder.start();

    async function run(){
        proccesstime = 0;
        await video.play();
        setTime = new Date(); //videoを再生し始めて時間
        for(var frame = 0; frame<frameno; frame=(frame+1)|0){
            if (frame%30 == 0){
                while (Date.now() - setTime < 1000*(frame/30));
                dst_context.drawImage(video,0,0);
                src_context.drawImage(video,0,0);
                // 処理開始時間の取得
                start = Date.now();
                var score_p = 0.0;
                var score_j = 0.0;
                var score_c = 0.0;
                var counter = 0.0;
                // 瞬き検出
                var blinkJudge = 0;
                blinkJudgeRange_w = (src_canvas.width-temp_size)/2
                blinkJudgeRange_h = (src_canvas.height-temp_size)/2
                
                var j_srcData = src_context.getImageData(blinkJudgeRange_w,blinkJudgeRange_h,temp_size,temp_size);
                var j_src = j_srcData.data;
                for (var k = 0; k < temp_size; k+=1) {
                    for (var l = 0; l < temp_size; l+=1) {
                        var idx = (l + k * temp_size) * 4;
                        blinkJudge += j_src[idx] + j_src[idx+2] + j_src[idx+1];
                    }
                }
                
                var blinkJudge_res = blinkJudge/(temp_size*temp_size*3);
                
                if (blinkJudge_res > 64){
                   

                for ( var i=0; i<seg_num_x; i=(i+1)|0){
                    posx = i*(res_size);
                    for ( var j=0; j<seg_num_y; j=(j+1)|0){
                        posy = j*(res_size);
                        centerx = posx + posx/2;
                        centery = posy + posy/2;

                        //解析範囲の切り出し
                        srcData = src_context.getImageData(posx, posy, temp_size, temp_size);
                        src = srcData.data;
                        
                        // 輝度値の取得
                        var judge = 0;
                        for (var k = 0; k < temp_size; k=(k+1)|0) {
                            for (var l = 0; l < temp_size; l=(l+1)|0) {
                                var idx = (l + k * temp_size) * 4;
                                judge += src[idx] + src[idx+2] + src[idx+1];
                            }
                        }

                        var bright = judge/(temp_size*temp_size*3);
                        
                        //輝度値126以上の時 条件分岐
                        if (bright > 126){
                            var fp = tf.fromPixels(srcData);
                            var tensor = tf.image.resizeNearestNeighbor(fp,[16, 16]).toFloat();
                            var offset = tf.scalar(255);
                            var tensor_image = tensor.div(offset).expandDims();
                            prediction = await model.predict([tensor_image]).data();
                            score_p += prediction[0];
                            score_j += prediction[1];
                            score_c += prediction[2];
                            
                            // 領域塗りつぶし
                            dst_context.fillStyle = 'rgb('+String(Math.round(255*prediction[1]))+','+String(Math.round(255*prediction[0]))+','+String(Math.round(255*prediction[2]))+')';
                            dst_context.fillRect((posx+(res_size/2)),(posy+(res_size/2)),res_size,res_size);
                            counter += 1;        
                                    };
                        
                        };
                        };};
                        if (blinkJudge_res <= 64){
                            console.log('blink');
                        }
                
                        let res_p = Math.round((score_p/counter)*100)/100;
                        let res_j = Math.round((score_j/counter)*100)/100;
                        let res_c = Math.round((score_c/counter)*100)/100;

                        // HTMLに数値を表示
                        document.getElementById('P').textContent = 'P: '+ String(res_p);
                        document.getElementById('J').textContent = 'J: '+ String(res_j);
                        document.getElementById('C').textContent = 'C: '+ String(res_c);

                        // グラフを表示
                        graph_context.fillStyle = 'green';
                        graph_context.fillRect(frame_number*range_w,graph_h-res_p*graph_h,range_w,res_p*graph_h);
                        graph_context.fillStyle = 'red';
                        graph_context.fillRect(frame_number*range_w,(graph_h-res_p*graph_h)-res_j*graph_h,range_w,res_j*graph_h);
                        graph_context.fillStyle = 'blue';
                        graph_context.fillRect(frame_number*range_w,0,range_w,res_c*graph_h);
                        

                        frame_number += 1;
                        
                        // 解析結果画像を更新
                        res_context.drawImage(dst_canvas,0,0);
                        t = (Date.now()- start)/1000;
                        console.log(t);
                        proccesstime += t;
                }
                }
            };
    run();

    // videoが最後まで再生された時
    video.onended = (e) => {
        totaltime = (Date.now()-setTime)/1000;
        console.log('totaltime: '+ totaltime + "sec.");
        console.log('proccess time:'+ proccesstime);
        console.log(proccesstime/totaltime*100 + '%');
        recorder.stop();
        console.log('STOP!');  
        
    };

    // 停止ボタン
    document.getElementById("endbtn").onclick = (e) =>{
        totaltime = (Date.now()-setTime)/1000;
        console.log('totaltime: '+ totaltime + "sec.");
        console.log('proccess time:'+ proccesstime);
        console.log(proccesstime/totaltime*100 + '%');
        recorder.stop();
        console.log('STOP!'); 
         
        
    };

};
