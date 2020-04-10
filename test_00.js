
const canvas = document.getElementById("canvas1");
const canvas2 = document.getElementById('canvas2');
const CLASSES = {0:'P', 1:'J', 2:'C'}
let imagePath = "p_00.jpg";
var imgdata;
var text;
draw(canvas,imagePath);
var posx = 300;
var posy = 300;
var prediction;

let model ;
async function loadModel(){

    const path = "https://uta-ko.github.io/model.json"
    model = await tf.loadModel(path);
    //model.summary();
}
loadModel();

function draw(canvas,imagePath){
    console.log("draw");
    const image = new Image();
    image.addEventListener("load",function (){
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(image, 0, 0);
        console.log("load!");
    });
    image.src = imagePath;
}

function crop_img(){
    // 画像切り取り
    ctx2 = canvas2.getContext( '2d' );
    //ctx2.fillStyle = 'rgb(200, 200, 200)'
    //ctx2.fillRect( 0, 0, ow, oh )    // 背景を塗る
    ctx2.drawImage( canvas,
        posx, posy, 80, 80, 0, 0, 80, 80);
    imgdata = ctx2.getImageData(0,0,80,80);

}

var filter = function(src, dst, width, height, prediction){
    console.log(prediction[1]);
    for (var i = 0; i < height; i++) {
        for (var j = 0; j < width; j++) {
            var idx = (j + i * width) * 4;
            //var val = [0,0,0];
            
            dst[idx] = Math.floor(255*prediction[1]);//src[idx];
            dst[idx + 1] = Math.floor(255*prediction[0]);//src[idx+2];
            dst[idx + 2] = Math.floor(255*prediction[2]);//src[idx+1];
            dst[idx + 3] = src[idx + 3];
        }
    }
};

function test(){
    var img = null; 
    var canvas = document.createElement("canvas");

        //     //キャンバスに画像をセット
             var context = canvas.getContext('2d');

             canvas.width = canvas1.width;
             canvas.height = canvas1.height;
             context.drawImage(canvas1, 0, 0);
        //     console.log(canvas);

            //フィルター処理
            var srcData = ctx2.getImageData(0, 0, canvas.width, canvas.height);
            var dstData = context.createImageData(canvas.width, canvas.height);
            var src = srcData.data;
            var dst = dstData.data;
            
            filter(src, dst, canvas.width, canvas.height,prediction);
            context.putImageData(dstData, 0, 0);
            
            console.log(dstData);
            //画像タグに代入して表示
            var dataurl = canvas.toDataURL();
            document.getElementById("output").innerHTML = "<img src='" + dataurl + "'>";
        }


async function predict(){
    // predict
    //var tensor = tf.browser.fromPixels(imgdata).resizeNearestNeighbor([16, 16]).toFloat();
    var array = [];
    
    var fp = tf.fromPixels(imgdata);
    var tensor = tf.image.resizeNearestNeighbor(fp,[16, 16]).toFloat();
    var offset = tf.scalar(255);
    var tensor_image = tensor.div(offset).expandDims();
    array.push(tensor_image)
    prediction = await model.predict(array).data();
    document.getElementById('first').innerHTML = 'P :' + prediction[0];
    document.getElementById('second').innerHTML = 'J : '+prediction[1];
    document.getElementById('third').innerHTML = 'C :' +prediction[2];

    test();

}

        
