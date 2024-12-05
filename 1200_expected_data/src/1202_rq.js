/***********************************************************************
 
    BulkAPI Request Process
    Process : S28_1202_rq.js

 ***********************************************************************/

import fs from "fs";
import xlsx from "xlsx";
import { get_BulkAPI } from "../lib/getBulkAPI.js";

// Check Directory
const dir = fs.existsSync("../result/Bulk_API_Result");
if(!dir) fs.mkdirSync("../result/Bulk_API_Result");

var URL = { "pt" : "https://dummytest.com/",
        };


for(var key in URL) {
    get_BulkAPI(URL[key], key).then((data) => 
    {
        data = data.reduce(function(acc,cur) {
            return acc.concat(cur);
        });
        const workBook = xlsx.utils.book_new();
        const result = JSON.stringify(data, null, 2);
        try{
            var cur_sc = data[0].sitecode;
            fs.writeFileSync('../result/Bulk_API_Result/Bulk_API_' + cur_sc + '.json', result);
            console.log("BulkAPI_" + cur_sc + "_JSON File Saved!");
            
            // Creat Excel File
            var workSheet = xlsx.utils.json_to_sheet(result);
            xlsx.utils.book_append_sheet(workBook, workSheet, cur_sc);
            xlsx.writeFile(workBook, "../result/Bulk_API_Result/Bulk_API_" + cur_sc + ".xlsx");
        
        }catch(e){
            console.log("Not Exist Data : " + e);
        }       
    });
}
