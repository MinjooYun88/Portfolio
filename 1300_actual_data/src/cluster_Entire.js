/*********************************************
    Cluster_ B2B SMB Entire Mode
**********************************************/

const cluster = require('cluster');
var args = process.argv;

function getSiteList(){
    let siteList =new Array();
    for(i=2;i<args.length;i++){
        siteList.push(args[i]);
    }
    console.log("Target Site:"+siteList);
    return siteList;
}

if(cluster.isMaster) {
    getSiteList().forEach(function(e) {        
        cluster.fork({'site': e, 'mode': 'Entire'});
    });

    cluster.on('online', function(worker) {
        //console.log('Worker ID : ' + worker.process.pid);
    });

    cluster.on('exit', (worker, code, signal) => {
        //console.log(`${worker.process.pid} Worker End`);
    });

} else {
    process.setMaxListeners(50);
    var task = require("./S28_1301_pd.js");
    task(cluster.worker.process.env.site, cluster.worker.process.env.mode);   
}


