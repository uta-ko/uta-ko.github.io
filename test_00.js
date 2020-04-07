
const canvas = document.getElementById("canvas1");
const canvas2 = document.getElementById('canvas2');
let imagePath = "j_00.jpg";

draw(canvas,imagePath);

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
    const ctx2 = canvas2.getContext( '2d' );
    //ctx2.fillStyle = 'rgb(200, 200, 200)'
    //ctx2.fillRect( 0, 0, ow, oh )    // 背景を塗る
    ctx2.drawImage( canvas,
        300, 300, 80, 80, 0, 0, 80, 80)
}

function predict(){
    const path = 'http://uta-ko.github.io/model.json';//'model.json';
    const model = tf.loadLayersModel(path);
    const xs = canvas2;
    y_pred = Array.from(values);
    y_pred.print();
    const values = y_pred.data();
    const arr = Array.from(values);
    console.log(arr);

}
