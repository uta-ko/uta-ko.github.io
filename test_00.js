var canvas = document.getElementById("canvas1");
var canvas2 = document.getElementById('canvas2');
const CLASSES = {0:'P', 1:'J', 2:'C'};
var ctx;
var ctx2;
let imagePath = "j_00.jpg";
var text;
var size = 80;
var res_size = 40;
var prediction;
let model ;

draw(canvas,canvas2,imagePath);

async function loadModel(){
    const path = "https://uta-ko.github.io/model.json"
    model = await tf.loadModel(path);
}
loadModel();

function draw(canvas,canvas2,imagePath){
    // imageが読み込まれた時の処理
    const image = new Image();
    image.addEventListener("load",function (){
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        canvas2.width = image.naturalWidth;
        canvas2.height = image.naturalHeight;
        ctx = canvas.getContext("2d");
        ctx2 = canvas2.getContext("2d");
        ctx.drawImage(image, 0, 0);
        ctx2.drawImage(canvas,0,0);
    });
    image.src = imagePath;
}

function crop_img(){
    // 画像切り取り
    ctx2 = canvas2.getContext( '2d' );
    ctx2.drawImage( canvas,
        posx, posy, size, size, 0, 0, size, size);
    imgdata = ctx2.getImageData(0,0,size,size);

}

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



async function predict(){
    //var posx = 0;
    //var posy = 0;
    // 処理開始時間の取得
    start = Date.now();

    for ( var i=0; i<canvas.width; i++){
        posx = i*(res_size);
        for ( var j=0; j<canvas.height; j++){
            posy = j*(res_size);
            centerx = posx + posx/2;
            centery = posy + posy/2;
            
            //結果出力用キャンバスに画像をセット
            canvas = document.createElement("canvas")
            context = canvas.getContext('2d');

            canvas.width = res_size;
            canvas.height = res_size;
            //フィルター処理
            srcData = ctx.getImageData(posx, posy, size, size);
            dstData = context.createImageData(res_size, res_size);
            src = srcData.data;
            dst = dstData.data;
            var bright = 0;

            // 輝度値の取得
            for (var k = 0; k < size; k++) {
                for (var l = 0; l < size; l++) {
                    var idx = (l + k * size) * 4;
                    var judge = 0;            
                    judge += src[idx];
                    judge += src[idx+2];
                    judge += src[idx+1];
                    bright += judge/3
                }
            }
            bright = bright/(size*size);
            //輝度値126以下の時 条件分岐
            if (bright > 126){
                var array = [];
                var fp = tf.fromPixels(srcData);
                var tensor = tf.image.resizeNearestNeighbor(fp,[16, 16]).toFloat();
                var offset = tf.scalar(255);
                var tensor_image = tensor.div(offset).expandDims();
                array.push(tensor_image)
                prediction = await model.predict(array).data();
                document.getElementById('first').innerHTML = 'P :' + prediction[0];
                document.getElementById('second').innerHTML = 'J : '+prediction[1];
                document.getElementById('third').innerHTML = 'C :' +prediction[2];
                filter(src, dst, canvas.width, canvas.height,prediction);
                //context.putImageData(dstData, 0, 0);
                ctx2.putImageData(dstData,(posx+(res_size/2)),(posy+(res_size/2)));
            
            }
        }
    }

    var end = Date.now();
    console.log('処理時間 : '+ ((end-start)/1000)+ 'sec.')
        
    }
        
