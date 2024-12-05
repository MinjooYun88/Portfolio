/***********************************************************************
 
    searchAPI Request Process
    Process : S28_1201_rq.js

    Data    : 2022-04-06
 
 ***********************************************************************/

import fs from "fs";
import xlsx from "xlsx";
import { get_API } from "../lib/getAPI.js";
import { sitecode, APItype } from "./config.js";
import { getCurrentDate } from "../lib/getDate.js"
var at = 0;
var today = getCurrentDate();

// Check Directory
const dir = fs.existsSync("../result/Search_API_Result");
if(!dir) fs.mkdirSync("../result/Search_API_Result");

// main
for(var site = 0; site < sitecode.length; site++) {
    var promiseList = [];
    for(var at = 0; at < APItype.length; at++) {
        var api_temp = get_API(APItype[at], sitecode[site]);
        if(api_temp != "")  promiseList.push(api_temp);
    }

    Promise.all(promiseList).then((data) => {
        const workBook = xlsx.utils.book_new();

        data = data.reduce(function(acc,cur) {
            return acc.concat(cur);     
        });
        
        data = data.reduce(function(acc,cur) {
            return acc.concat(cur);     
        });

        const result = JSON.stringify(data, null, 2);
        var cur_sc = data[0].sitecode;

        // Creat Json File
        fs.writeFileSync('../result/Search_API_Result/Search_API_' + cur_sc + '.json', result);
        //fs.writeFileSync('Y:/smb/type_2/hardlaunch/data/' + today + '_data/SearchAPI_Result/Search_API_' + cur_sc + '.json', result);
        console.log("SearchAPI_" + cur_sc + "_JSON File Saved!");

        // Creat Excel File
        var workSheet = xlsx.utils.json_to_sheet(data);
        xlsx.utils.book_append_sheet(workBook, workSheet, cur_sc);
        xlsx.writeFile(workBook, "../result/SearchAPI_" + cur_sc + ".xlsx");
    });
}
