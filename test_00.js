
const canvas = document.getElementById("canvas1");
const canvas2 = document.getElementById('canvas2');
const CLASSES = {0:'P', 1:'J', 2:'C'}
let imagePath = "j_00.jpg";
var imgdata;
draw(canvas,imagePath);

let model ;
async function loadModel(){

    const path = "https://uta-ko.github.io/model.json"
    model = await tf.loadModel(path);
}

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
       async function run(){
        // predict
        //var tensor = tf.browser.fromPixels(imgdata).resizeNearestNeighbor([16, 16]).toFloat();
        var fp = tf.fromPixels(imgdata);
        var tensor = tf.image.resizeNearestNeighbor(fp,[16, 16]).toFloat();
        var offset = tf.scalar(255);
        var tensor_image = tensor.div(offset).expandDims();
        //console.log(model.predict(tensor_image));
        let prediction = await model.predict(tensor_image).data();
        return prediction;
       }
       
       run();

    var accuracyScores = run();
	const accuraylists = accuracyScores.data();
	var index = 0
	accuraylists.then(function(e){
		const elements = document.querySelectorAll(".accuracy");
		elements.forEach(el => {
    el.parentNode.classList.remove('is-selected');
    const rowIndex = Number(el.dataset.rowIndex);
    if (index===rowIndex){
			el.parentNode.classList.add('is-selected');
		}
		el.innerText = e[index];
		index++;
	  });
	});


}

        
