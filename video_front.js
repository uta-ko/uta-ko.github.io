const medias_f = {

  audio: false,

  video: {facingMode: "user"}

};

const video_front = document.getElementById("video_front");

const promise = navigator.mediaDevices.getUserMedia(medias_f);



promise.then(successCallback)

       .catch(errorCallback);



function successCallback(stream) {

  video_front.srcObject = stream;

};



function errorCallback(err) {

  alert(err);

};
