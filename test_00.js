
const canvas = document.getElementById("canvas1");
const canvas2 = document.getElementById('canvas2');
let imagePath = "j_00.jpg";
var imgdata;
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
        300, 300, 80, 80, 0, 0, 80, 80);
    imgdata = ctx2.getImageData(0,0,80,80);

}

function predict(){
    /*const path = 'https://uta-ko.github.io/model.json';//'model.json';
    //const model= tf.loadModel(path);
    async function load_model() {   
        var model = await tf.loadModel(path);
        console.log(model);
        return model;
        }
    
    //console.log(model.predict(imagedata));
    
    async function run(){
        // load model
        const path = "https://uta-ko.github.io/model.json"
        const model = await tf.loadModel(path);
       
        // predict
        y_pred = await model.predict(imgdata);
        y_pred.print();
       
        // convert to array
        const values = await y_pred.data();
        const arr = await Array.from(values);
        console.log(arr);
       }
       
       run();*/

       async function run(){
        // load model
        const path = "https://uta-ko.github.io/model.json"
        const model = await tf.loadModel(path);
       
        // predict
        var tensor = tf.browser.fromPixels(imgdata).resizeNearestNeighbor([16, 16]).toFloat();
		var offset = tf.scalar(255);
		var tensor_iamge = tensor.div(offset).expandDims();
		return model.predict(tensor_iamge);
       }
       
       run();


}

        
