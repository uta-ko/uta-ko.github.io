let recorder;
let res_canvas = document.getElementById("res_canvas");
let src_canvas = document.createElement('canvas'); 
let area_canvas = document.createElement("canvas");
let dst_canvas = document.createElement("canvas");

let cnt = 0;
let frame_no = 0;
let imgsrc = [];
let src_context = src_canvas.getContext("2d");
let res_context = res_canvas.getContext("2d");
let area_context = area_canvas.getContext("2d");
let dst_context = dst_canvas.getContext("2d");

const res_size = 40; //結果描画サイズ
const temp_size = 80; //解析対象範囲
const FPS = 30;
const FRAME_RATE = 1/FPS; 
const frameno = FPS*30; // フレーム枚数    
let seg_num_x;
let seg_num_y;
let model;
let posx, posy;

area_canvas.width = temp_size;
area_canvas.height = temp_size;

// モデルの読み込み
async function loadModel(){
    const path = "https://uta-ko.github.io/model.json"
    model = await tf.loadModel(path);
    };
loadModel();
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
    
	res_canvas.width = w ;
    res_canvas.height = h ;
    dst_canvas.width = w ;
    dst_canvas.height = h ;
    src_canvas.width = w ;
    src_canvas.height = h ;
    // 繰り返し回数の宣言
    seg_num_x = Math.floor(src_canvas.width/res_size);
    seg_num_y = Math.floor(src_canvas.height/res_size);
    
    
      };
    })
    .catch( (err) => {
      console.log(err.name + ": " + err.message);
    });
  };

let timer1;
let getImage = function(){
    async function run(){
        
        dst_context.drawImage(video,0,0);
        src_context.drawImage(video,0,0);
        // 処理開始時間の取得
        start = Date.now();
        var score_p = 0.0;
        var score_j = 0.0;
        var score_c = 0.0;
        var counter = 0.0;

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
                document.getElementById('test').textContent = "おっけ";
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
                            }
                
                }
                }

                // HTMLに数値を表示
                document.getElementById('P').textContent = 'P: '+ String(score_p/counter);
                document.getElementById('J').textContent = 'J: '+ String(score_j/counter);
                document.getElementById('C').textContent = 'C: '+ String(score_c/counter);

                // 解析結果画像を更新
                res_context.drawImage(dst_canvas,0,0);
                t = (Date.now()- start)/1000;
                console.log(t);
                proccesstime += t;
        };
            run();
                };
                   
// 開始ボタンを押したときの処理
document.getElementById("startbtn").onclick= () =>{
    timer1 = setInterval(getImage,1000);
    
};

// 停止ボタン
document.getElementById("endbtn").addEventListener("click",() =>{
    clearInterval(timer1);
    recorder.stop();
    
})




/*var stream = canvas.captureStream();
    //ストリームからMediaRecorderを生成
    recorder = new MediaRecorder(stream,{mimeType:'video/mov'});
    //ダウンロード用のリンクを準備
    var anchor = document.getElementById('downloadlink');
    //録画終了時に動画ファイルのダウンロードリンクを生成する処理
    recorder.ondataavailable = function(e) {
    var videoBlob = new Blob([e.data], { type: e.data.type });
    blobUrl = window.URL.createObjectURL(videoBlob);
    anchor.download ='movie.mov';
    anchor.href = blobUrl;
    anchor.style.display = 'block';
}
    //録画開始
    recorder.start();*/
