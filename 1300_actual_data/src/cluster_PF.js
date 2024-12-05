/*********************************************
    Cluster PF Crawling 
**********************************************/
const fs = require('fs');
const cluster = require('cluster');
const task = require("./S28_1301_pf.js");
const urlList = JSON.parse(fs.readFileSync('../cfg/url.json'));

if(cluster.isMaster) {
    // var sitearr = Object.keys(urlList);
    var sitearr = ["ae"];
    var checkarr = new Object();
    var now = 0;
    var total = 0;
    
    for(var Tsite of sitearr) {
        checkarr[Tsite] = "Ready";
        total++;
    }

    var worker = cluster.fork({'site': sitearr[now], 'mode': 'guest'});

    // When worker is created
    cluster.on('online', function(worker) {
        //console.log('Worker ID : ' + worker.process.pid);
        checkarr[Object.keys(checkarr)[now]] = "Loading";
    });

    // When worker is dead
    cluster.on('exit', (worker, code, signal) => {
        // if Worker worked well
        if(checkarr[Object.keys(checkarr)[now]] == "Done") {
            now++;
            if(now != total) createWorker(sitearr[now], 'guest');
            else {
                notice();
                console.log();
                console.log("All Working is done!!")
            }
        }
        // if Worker couldn't work, Retry same working
        else if(checkarr[Object.keys(checkarr)[now]] == "Ready") {
            checkarr[Object.keys(checkarr)[now]] = "Retry";
            worker = cluster.fork({'site': sitearr[now], 'mode': 'guest'});
        }
        // if Retrying work also couldn't work, Skip and go to next work
        else {
            checkarr[Object.keys(checkarr)[now]] = "Error";
            now++;
            if(now != total) createWorker(sitearr[now], 'guest');
            else {
                notice();
                console.log("All Working is done!!")
            }
        }
    });
    
    /////////////////////////////////////// Create Worker Funtion ///////////////////////////////////////////
    function createWorker(site, mode) {
        var worker = cluster.fork({'site': site, 'mode': mode});
        worker.on('message', function (msg) {
            if(msg.type == "end"){
                checkarr[Object.keys(checkarr)[now]] = "Done";
            } else {
                arr[msg.NUM] = [msg.AEM, msg.SMB, msg.CARD, msg.PAGE, msg.now, msg.total];
                notice();
            }
        });
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////

    ////////////////////////////////////////// Notice Function //////////////////////////////////////////////
    var k = 0;
    var arr = [];
    for(var j = 0; j < Object.values(urlList)[0].length; j++) {
        arr[j] = [0,0,0,"",0,0];
    }

    //   In Arr         0           1            2             3            4          5
    // { 'NUM': i, 'AEM': aem, 'SMB': smb, 'CARD': card, 'PAGE': page, 'now': n, 'total': t }
    // Wating : 1 / Success : 2 / Fail : 3

    worker.on('message', function (msg) {
        if(msg.type == "end"){
            checkarr[Object.keys(checkarr)[now]] = "Done";
        } else {
            arr[msg.NUM] = [msg.AEM, msg.SMB, msg.CARD, msg.PAGE, msg.now, msg.total];
            notice();
        }
    });

    function notice() {
        console.clear();
        console.log("--------------------------------- Progress ---------------------------------");
        for( k = 0; k < arr.length; k++){
            if(arr[k][0] == 1 && arr[k][2] == 0) console.log("[Connection AEM] " + arr[k][3]);
            else if(arr[k][0] == 2 && arr[k][2] == 0) console.log("[AEM Connect Success] " + arr[k][3]);
            else if(arr[k][0] == 3 && arr[k][2] == 0) console.log("[Connecting Fail] " + arr[k][3]);
            else if(arr[k][1] == 1 && arr[k][2] == 0) console.log("[Try SMB Login] " + arr[k][3]);
            else if(arr[k][1] == 2 && arr[k][2] == 0) console.log("[SMB Login Success] " + arr[k][3]);
            else if(arr[k][1] == 3 && arr[k][2] == 0) console.log("[SMB Login Fail] " + arr[k][3]);
            else if(arr[k][2] == 1) console.log("[Searching Cards] " + arr[k][3]);
            else if(arr[k][2] == 2) console.log("(" + arr[k][4] + "/" + arr[k][5] + ") : " + arr[k][3]);
            else if(arr[k][2] == 3) console.log("[Not Found Cards] " + arr[k][3]);
        }
        console.log("----------------------------------------------------------------------------");
        process.stdout.write(" | ");
          
        for(var i = 0 ; i < Object.keys(checkarr).length; i++) {
            process.stdout.write(Object.keys(checkarr)[i] + " : " + Object.values(checkarr)[i] + " | ");
        }    
        
    }
////////////////////////////////////////////////////////////////////////////////////////////////////////////

} else {
    process.setMaxListeners(50);
    task(cluster.worker.process.env.site, cluster.worker.process.env.mode);   
}
