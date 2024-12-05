const fs = require("fs");

function readFileCode(){
    let arr = new Array();
    fs.readdir("../file/", (err, filelist) => {
        filelist.forEach(file => {             
            temp = file.replace("Search_API_","")
            temp = temp.replace(".json","");
            //console.log(temp);       
            arr.push(temp); 
        })
    
    })
    return arr;
}






