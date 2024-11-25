const request = require('request');
const fs = require('fs')


downloadAllFile();

async function downloadAllFile(){
    let start = 2;
    let end = 114;
    for( let i = start ; i< end; i++){
        let obj = {
            fileLink : `https://files.daf-yomi.com/files/tshingel/sanhedrin/sanhedrin${i}.mp3?download`,
            fileName : `sanhedrin${i}`
        };
        await downloadFile(obj);
    }  
}


/**
 * this function download the the file in the object url
 * @param obj : object the contains id of the file , name of the file and url of the file
 * @returns {Promise<boolean>}
 */
async function downloadFile(obj){
    return new Promise((resolve, reject) => {
        setTimeout(function(){
            request.get(obj.fileLink)
            .on('error', function(err) {console.log(err)})
            .pipe(fs.createWriteStream('./data/dafYomi/'+obj.fileName+'.mp3'));
            resolve(true)
        }, 1500);
    })
}