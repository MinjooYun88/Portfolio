/*********************************************
    Cluster PD Crawling 
**********************************************/

const cluster = require('cluster');
const logger = require('../lib/logger.js');
var args = process.argv;

let modeList = new Array();

function getSiteList(){
    let siteList = new Array();    

    // 특정 모드와 사이트코드만 실행 (ex : node cluster_PD ru ph)
    if(args.length >= 3) {
        for(i=2;i<args.length;i++){
            if(args[i]=="Guest" || args[i]=="Include" || args[i]=="Exclude"){
                modeList.push(args[i]);
            }
            else siteList.push(args[i]);
        }
    }
    
    // 전 국가 실행 (node cluster_PD)
    else {
        siteList = ["ae", "ae_ar", "be", "be_fr", "de", "levant", "levant_ar", "nl", "nz", "ph", "ru"];
    }

    return siteList;
}

if(cluster.isMaster) {
    var nowG = 4;
    var nowI = 4;
    var nowE = 4;
    var arr = [];
    var workerList = new Object();
    siteList = getSiteList();
    var total = siteList.length;
    var workerG; var workerI; var workerE;

    // 모드설정 (node cluster_PD {site} Include Exclude)  > SMB 전용
    if(modeList.length>=1){
        for(var mode of modeList) {
            switch(mode) {
                case "Guest" : workerG = cluster.fork({'site': siteList[0], 'mode': 'Guest'});
                workerG.on('message', function (msg) {
                    if(msg.type == "end"){
                        arr[msg.mode] = [msg.site, "", -1, -1];
                        workerList[msg.pid] = msg.mode;
                        notice();
                    } else {
                        arr[msg.mode] = [msg.site, msg.url, msg.now, msg.total];
                        notice();
                    }
                });
                break;
                case "Include" : workerI = cluster.fork({'site': siteList[0], 'mode': 'Include'});
                workerI.on('message', function (msg) {
                    if(msg.type == "end"){
                        arr[msg.mode] = [msg.site, "", -1, -1];
                        workerList[msg.pid] = msg.mode;
                        notice();
                    } else {
                        arr[msg.mode] = [msg.site, msg.url, msg.now, msg.total];
                        notice();
                    }
                });
                break;
                case "Exclude" : workerE = cluster.fork({'site': siteList[0], 'mode': 'Exclude'});
                workerE.on('message', function (msg) {
                    if(msg.type == "end"){
                        arr[msg.mode] = [msg.site, "", -1, -1];
                        workerList[msg.pid] = msg.mode;
                        notice();
                    } else {
                        arr[msg.mode] = [msg.site, msg.url, msg.now, msg.total];
                        notice();
                    }
                });
                break;
            }
        }
    } 

    // Not setting mode
    else{
        for(var n = 0; n < 5; n++) {
            workerG = cluster.fork({'site': siteList[n], 'mode': 'Guest'});
            workerI = cluster.fork({'site': siteList[n], 'mode': 'Include'});
            workerE = cluster.fork({'site': siteList[n], 'mode': 'Exclude'});
        } 
        
        // Comunication with Worker
        workerG.on('message', function (msg) {
            if(msg.type == "end"){
                arr[msg.mode] = [msg.site, "", -1, -1];
                workerList[msg.pid] = msg.mode;
                notice();
            } else {
                arr[msg.mode] = [msg.site, msg.url, msg.now, msg.total];
                notice();
            }
        });

        workerI.on('message', function (msg) {
            if(msg.type == "end"){
                arr[msg.mode] = [msg.site, "", -1, -1];
                workerList[msg.pid] = msg.mode;
                notice();
            } else {
                arr[msg.mode] = [msg.site, msg.url, msg.now, msg.total];
                notice();
            }
        });

        workerE.on('message', function (msg) {
            if(msg.type == "end"){
                arr[msg.mode] = [msg.site, "", -1, -1];
                workerList[msg.pid] = msg.mode;
                notice();
            } else {
                arr[msg.mode] = [msg.site, msg.url, msg.now, msg.total];
                notice();
            }
        });

    }


    // Worker Start
    cluster.on('online', function(worker) {
        //console.log('Worker ID : ' + worker.process.pid);
    });

    // Worker End
    cluster.on('exit', (worker, code, signal) => {
        
        // if Worker worked well
        if(workerList[worker.process.pid] == "Guest") {
            nowG++;
            if(nowG < total) {
                createWorker(siteList[nowG], "Guest");
            }
            else {
                notice();
                console.log();
                console.log("Guest Working is done!!")
            }
        }
        else if(workerList[worker.process.pid] == "Include") {
            nowI++;
            console.log(nowI);
            if(nowI < total) {
                createWorker(siteList[nowI], "Include");
            }
            else {
                notice();
                console.log();
                console.log("Include Working is done!!")
            }
        }
        else if(workerList[worker.process.pid] == "Exclude") {
            nowE++;
            if(nowE < total) {
                createWorker(siteList[nowE], "Exclude");

            }
            else {
                notice();
                console.log();
                console.log("Exclude Working is done!!")
            }
        }        
    });

    function createWorker(site, mode) {
        var worker = cluster.fork({'site': site, 'mode': mode});
        worker.on('message', function (msg) {
            if(msg.type == "end"){
                arr[msg.mode] = [msg.site, "", -1, -1];
                workerList[msg.pid] = msg.mode;
                notice();
            } else {
                arr[msg.mode] = [msg.site, msg.url, msg.now, msg.total];
                notice();
            }
        });
    }

    ///////////////////////////////////////////////// Console Notice ////////////////////////////////////////////////////////////////
    function notice() {
        console.clear();
        console.log("--------------------------------- Progress ---------------------------------");
    
            if(arr.Guest != undefined && arr.Guest[3] != -1) console.log(arr.Guest[0] + " Guest (" + arr.Guest[2] + "/" + arr.Guest[3] + ") : " + arr.Guest[1]);
            if(arr.Guest != undefined && arr.Guest[3] == -1) console.log(arr.Guest[0] + " Guest (Done)");
            if(arr.Include != undefined && arr.Include[3] != -1) console.log(arr.Include[0] + " Include (" + arr.Include[2] + "/" + arr.Include[3] + ") : " + arr.Include[1]);
            if(arr.Include != undefined && arr.Include[3] == -1) console.log(arr.Include[0] + " Include (Done)");
            if(arr.Exclude != undefined && arr.Exclude[3] != -1) console.log(arr.Exclude[0] + " Exclude (" + arr.Exclude[2] + "/" + arr.Exclude[3] + ") : " + arr.Exclude[1]);
            if(arr.Exclude != undefined && arr.Exclude[3] == -1) console.log(arr.Exclude[0] + " Exclude (Done)");
 
        console.log("----------------------------------------------------------------------------");
        process.stdout.write("TargetSite >> ");
          
        for(var i = 0 ; i < siteList.length; i++) {
            process.stdout.write(siteList[i] + " | ");
        }    
    }
    /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

} else {
    process.setMaxListeners(50);
    var task = require("./S28_1301_pd.js");
    task(cluster.worker.process.env.site, cluster.worker.process.env.mode);   
}

