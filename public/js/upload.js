// document.getElementById('imageUpload').onclick = function () {
//     var imageStatus = document.getElementById('imageStatus')
//     var selectedImage = document.getElementById('selectedImage')
//     var progressDiv = document.getElementById('progressDiv')
//     var progressBar = document.getElementById('progressBar')
//     var uploadResult = document.getElementById('uploadResult')

//     let request = new XMLHttpRequest()

//     request.onreadystatechange = function () {
//         if (request.status == 200) {
//             imageStatus.innerHTML = "Upload image successfully"
//             uploadResult.innerHTML = this.responseText
//         } else {
//             imageStatus.innerHTML = 'Server side Error...!'
//         }
//     }

    
//     request.open('POST', '/dashboard/image-upload')

//     request.upload.onprogress = function (e) {
//         if(e.lengthComputable) {
//             let result = Math.floor((e.loaded / e.total) * 100)
//             progressDiv.innerHTML = result + '%'
//             progressBar.style.width = result + '%'
//         }else {
//             progressDiv.style.display = "none"
//         }
//     }

//     let formData = new FormData()
//     if(selectedImage.files[0] > 0) {
//         progressDiv.style.display = "none"
//         formData.append("image", selectedImage.files[0])
//     } else{
//         imageStatus.innerHTML = "Please choice image for upload"
//     }

//     request.send(formData)
// }