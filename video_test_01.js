var video = document.getElementById('v');
var cvs = document.getElementById('c');
res_size = 40;
size = 80;
//videoのサイズからcanvasのサイズを指定
cvs.width = video.videoWidth;
cvs.height = video.videoHeight;

// ウィンドウを読み込んだ時にモデルを読み込む
window.onload = (ev)=>{
    loadModel()
}

// playボタンを押したときの処理
function play(){
    video.play();

    //タイマーでフレームレート毎に処理を行う
    setInterval(function(){
        // canvasにvideo要素を書き込む
        ctx = cvs.getContext("2d")
        ctx.drawImage(video,0,0);
        //predict();
    },1000/30);
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
            dst[idx] = Math.floor(255*prediction[1]);//src[idx];
            dst[idx + 1] = Math.floor(255*prediction[0]);//src[idx+2];
            dst[idx + 2] = Math.floor(255*prediction[2]);//src[idx+1];
            dst[idx + 3] = src[idx + 3];
        }
    }
};

// 予測処理
async function predict(){
    // 処理開始時間の取得
    start = Date.now();
    // 繰り返し回数の宣言
    var forx = Math.floor(cvs.width/res_size);
    var fory = Math.floor(cvs.height/res_size);

    var score_p = 0;
    var score_j = 0;
    var score_c = 0;
    var counter = 0;
    //結果出力用キャンバスに画像をセット
    canvas = document.createElement("canvas")
    context = canvas.getContext('2d');

    canvas.width = res_size;
    canvas.height = res_size;
    
    for ( var i=0; i<forx; i++){
        posx = i*(res_size);
        for ( var j=0; j<fory; j++){
            posy = j*(res_size);
            centerx = posx + posx/2;
            centery = posy + posy/2;
        
            //結果画像の生成
            srcData = ctx.getImageData(posx, posy, size, size);
            dstData = context.createImageData(res_size, res_size);
            src = srcData.data;
            dst = dstData.data;
        
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
            
            //輝度値126以下の時 条件分岐
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
    document.getElementById('first').innerHTML = 'P :' + score_p/counter;
    document.getElementById('second').innerHTML = 'J : '+ score_j/counter;
    document.getElementById('third').innerHTML = 'C :' + score_c/counter;
        
    }
