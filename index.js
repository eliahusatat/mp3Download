const request = require('request');
const cheerio = require('cheerio');
const fs = require('fs')
const readline = require('readline');


// if you want to run it step by step:
// getAllFilesPages();
// textToJson();
// getMp3Links();
// textToJson('fullData', 2);
// sortAndFix();
// downloadAllFile();
// eliahu();

// for downloaD all the files run  part1() and after this finish run  downloadAllFile()
part1();
// downloadAllFile();
/*****************************************  part 1 - create json with all the data abut the files  *********************************************/


async function processLineByLine() {
    const fileStream = fs.createReadStream('./shabat/cors-logs-2022-12-28.txt');

    const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
    });
    // Note: we use the crlfDelay option to recognize all instances of CR LF
    // ('\r\n') in input.txt as a single line break.
   let arr = [];
    for await (const line of rl) {
        // Each line in input.txt will be successively available here as `line`.
        let data = JSON.parse(line);
        arr.push(data);
    }
    arr = arr.map(el => {
        return el.message.error.substring(8)
    })
    let uniqueArray = [...new Set(arr)];
    uniqueArray.sort();
    console.log(uniqueArray)
}



function eliahu() {
    fs.readFile('./shabat/cors-logs-2022-12-28.txt', function (error, content) {
        if (error) {
            console.log('error');
            console.log(error)
        } else {
            console.log('not error');
            let data = JSON.parse(content);
            data.forEach(el => {
                console.log(el)
                // getFileLink(el);
                // getFileLinkshortcut(el);
            })
        }
    })
}


/*
* in this part we create a json - with array of objects that each contain all the data we need abut the file
* id , name , link to the file.
* for example :
 {
    "id": "298",
    "fileName": "פרק 298  5 דקות בנין בית הכנסת ושיהיה גבוה - שוע סימן קנ' סעיפים ג' - ה'",
    "link": "https://meirtv.com/shiurim/shiur-45419/",
    "fileLink": "http://mp3.meirtv.co.il//Antebi/DailyHalacha/Idx%2045419.mp3"
  }
*/

async function part1(){
    console.log('--1--')
    await getAllFilesPages();
    console.log('--2--')
    await textToJson();
    console.log('--3--')
    await getMp3Links();
    console.log('--4--')
    await textToJson('fullData', 2);
    console.log('--5--')
    sortAndFix();
    console.log('--6--')

}

/**
 * in this function we run over the page of all the series and extract all the files pages and names.
 * this is the page : https://meirtv.com/shiurim-series/22763/
 * @returns {Promise<void>}
 */
async function getAllFilesPages() {
    let url = 'https://meirtv.com/shiurim-series/22763/?jsf=jet-engine&pagenum=';
    // let url = 'https://meirtv.com/shiurim-series/22914/?jsf=jet-engine&pagenum=';
    // from look in the page i know that there are 68 sub pages
    for (let i = 67; i  <68; i++) {
        await getFilesArray(url + i);
    }
}

/**
 * in this function we run over the sub page of the series and extract all the files pages and write them in file (with cheerio from the page html)
 * @param url of the sub page
 * @returns {Promise<void>}
 */
async function getFilesArray(url) {
    console.log(url)
    return new Promise((resolve, reject) => {
        // setTimeout(function(){
            request(url, async function (error, response, body) {
                if (!error && response.statusCode == 200) {
                    let $ = cheerio.load(body);
                    $('.jet-listing-grid__item').map(async function(i) {
                        let fileName = $(this).find('.jet-listing-dynamic-field__content').text();
                        let link = $(this).find('.elementor-row').children('div').attr('data-pafe-section-link');;
                        let  words = fileName.split(" ");
                        let id  = words[1];
                        let obj = {
                            id: id,
                            'fileName' : fileName,
                            'link' : link
                        };
                       await fs.writeFileSync('./shabat/part1.txt', JSON.stringify(obj, 'utf8' ) +',', { flag: 'a+' } ,
                            err => {
                            if (err) {
                                console.error(err)
                            }

                        })
                    }).get();
                    resolve(true)
                }else{
                    console.log('error' + error)
                    reject(error)
                }
            })
        // }, 200);
    })

}

function  textToJson(fileName = 'part1', numToRemove = 1) {
    return new Promise((resolve, reject) => {
        fs.readFile('./shabat/'+fileName+'.txt', async function (error, content) {
            if(error) {
                console.log(error)
                reject(error)
            } else{
                let data = '[' + content ;
                data = data.substr(0, data.length - numToRemove)
                data =data + ']';
                await fs.writeFileSync('./shabat/'+fileName+'.json', data , { flag: 'a+' } ,err => {
                    if (err) {
                        console.error(err)
                    }
                })
                resolve(true)
            }
        });
    })
}

/**
 * this function gets the the mp3 link for each file in part1.json
 */
function getMp3Links(){
    return new Promise((resolve, reject) => {
        fs.readFile('./shabat/part1.json', function (error, content) {
            if(error) {
                console.log(error)
            } else{
                let data = JSON.parse(content);
                data.forEach(el => {
                    // getFileLink(el);
                    getFileLinkshortcut(el);
                })
                resolve(true)
            }
        });
    })
}

/**
 * this function get for the single file in the object -the mp3 link for that file (with cheerio from the page html)
 * @param obj
 */
function getFileLink(obj){
    request(obj.link, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            let $ = cheerio.load(body);
            $('.jet-listing-dynamic-link').map(function(i) {
                let fileName = $(this).children('a').attr('href');
                if(fileName.includes('mp3')){
                    fileName = fileName.replace(" ", "%20");
                    let newObj = { ...obj, fileLink: fileName }
                    fs.writeFileSync('./data/fullData.txt', JSON.stringify(newObj, 'utf8' ) +',', { flag: 'a+' } ,err => {
                        if (err) {
                            console.error(err)
                        }
                    })
                }
            }).get();
        }
    })
}

function getFileLinkshortcut(obj){
    let fileNumber = obj.link.slice(-6,-1)
    // fileLink = `http://mp3.meirtv.co.il//Antebi/DailyHalacha/Idx%20${fileNumber}.mp3`;
    fileLink = `http://mp3.meirtv.co.il//Engelman/Shabat/Idx%20${fileNumber}_AC.mp3`;
    let newObj = { ...obj, fileLink: fileLink }
    fs.writeFileSync('./shabat/fullData.txt', JSON.stringify(newObj, 'utf8' ) +',' + '\n', { flag: 'a+' } ,err => {
        if (err) {
            console.error(err)
            return
        }
    })
}

/**
 * this function test the function getFileLink or getFileLinkshortcut
 */
function testForGetFileLink(){
    let vid =  {
        "id": "1",
        "fileName": "פרק 1  7 דקות מתחילים ללמוד הלכה יומית - שולחן ערוך סימן א' - הנהגת האדם בבוקר",
        "link": "https://meirtv.com/shiurim/shiur-23970/",
        "file_link" : 'http://mp3.meirtv.co.il//Antebi/DailyHalacha/idx%2023970.mp3'
    };
    getFileLink(vid);
    // getFileLinkshortcut(vid);
}


/**
 * this function sort all the files by id and fix the name of the file for the downloads
 */
function sortAndFix(){
    fs.readFile('./shabat/fullData.json', function (error, content) {
        if(error) {
            console.log(error)
        } else{
            let data = JSON.parse(content);
            data.sort(function(a, b) {
                return parseInt(a.id) - parseInt(b.id);
            });
            data.map( el => {
                el.fileName = el.fileName.replace(/[\"\\\/:\|\<\>\*\?]/g, '');// not valid chars in windows folders names
                return el
            })
                fs.writeFileSync('./shabat/part2.json', JSON.stringify(data, 'utf8') , {flag: 'a+'}, err => {
                    if (err) {
                        console.error(err)
                        return
                    }
            })
        }
    });
}






/*****************************************  part 2 - download the files  **************************************************************/

/**
 * this function run over all the files in the JSON and download them
 * @returns {Promise<void>}
 */
async function downloadAllFile(){
    // fs.readFile('./fix2.json', async function (error, content) {
    fs.readFile('./shabat/part2.json', async function (error, content) {
        if(error) {
            console.log(error)
        } else{
            let data = JSON.parse(content);
            for( let i = 5 ; i< 12/*data.length*/; i++){// for good result -run 100 each time
                // for( let i = 201 ; i< 301; i++){
                console.log((i/data.length).toFixed(3) + ' %' )
                await downloadFile(data[i]);
            }
        }
    });
}



/**
 * this function download the the file in the object url
 * @param obj : object the contains id of the file , name of the file and url of the file
 * @returns {Promise<boolean>}
 */
async function downloadFile(obj){
    return new Promise((resolve, reject) => {
        setTimeout(function(){
            const dirName = getFolderNameById(obj.id)
            request.get(obj.fileLink).on('error', function(err) {console.log(err)}).pipe(fs.createWriteStream('./'+dirName+'/'+obj.fileName+'.mp3'));
            resolve(true)
        }, 1500);
    })
}

/**
 * this function  return to path in witch you going to save the file and create the folders if not exist
 * according to the id  the numberOfFilePerFolder and the generalFolderName
 * for example in id = 57 and generalFolderName = downloads , = numberOfFilePerFolder = 50
 * will returns 'downloads/[50-100]'
 * @param id : id of the file
 * @param numberOfFilePerFolder : number
 * @param generalFolderName : string
 * @returns {string}
 */
function getFolderNameById(id,numberOfFilePerFolder = 100, generalFolderName = 'downloads_shabat') {
    if (!fs.existsSync(generalFolderName)){
        fs.mkdirSync(generalFolderName);
    }
    const delta = (Number(id) - 1) % numberOfFilePerFolder;
    const fromNumber = Number(id) - 1 - delta;
    const toNumber = fromNumber + numberOfFilePerFolder;
    const dirName =  '[' + fromNumber + '-' + toNumber + ']';
    const fullPath = generalFolderName +'/' + dirName;
    if (!fs.existsSync(fullPath)){
        fs.mkdirSync(fullPath);
    }
    return fullPath
}


