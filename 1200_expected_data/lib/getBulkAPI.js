/***********************************************************************
 
    Function : Get Bulk API Data
    Process : get_BulkAPI()

    Data    : 2022-05-12
 
 ***********************************************************************/
// Get API data
import { getFetch } from './getFetch.js';
import { logger } from "../src/logger.js";
import { arrayBulkApi } from './arrayBulkAPI.js';
import { cookie } from "../src/config.js";

export function get_BulkAPI(baseURL, sc) {
    return new Promise(async (rs, rj) => {
        var resultList = new Array();
        var productList = new Array()
        var total = 1;
        var retry = 0;
        var check = true;

        var front = baseURL.substring(0, baseURL.indexOf("currentPage=") + 12);
        var back = baseURL.substr(baseURL.indexOf("currentPage=") + 13);

        for(var u = 1; u - 1 < total/100; u++) {
            var URL = front + u + back; 
        
            // Check Fetch
            console.log("[Loading] " + URL);
            var response = await getFetch(URL, cookie, "PD");

            // Check Response API
            if(response.ok) {
                do {
                    let data;
                    try{
                        if(retry > 0) {
                            logger.info("Retry Get Json [Retry: " + retry + "] : " + URL);
                        }
                        console.log("[Convert] " + URL);
                        data = await response.json();
                        productList = data.products;
                        total = data.pagination.totalResults;
                        
                        if(response.status >= 300) throw "connectError";
                        check = false;
                        if(retry > 0) {
                            logger.info("Get Json retry Pass : " + URL);
                            retry = 0;
                        }
                    } catch (e) {
                        retry++;
                        if(e == "connectError") { logger.error("Connection Failed [" + data.response.statusCode + "] : " + URL); }
                        else { 
                            console.log(e);
                            logger.error("Get Json error : " + URL); 
                        }
                        response = await getFetch(URL, cookie, "PD");
                        check = true;
                    } 
                } while(check && retry < 5);
                
                if(retry != 0) {
                    console.log("[Fail] " + URL);
                    logger.error("Cannot Save Bulk API Data : " + URL);
                    retry = 0;
                }
                else  console.log("[OK] " + URL);

                resultList.push(arrayBulkApi(productList, sc));

            }
            else {
                console.log("[Fail] " + URL);
                logger.error("Cannot Connected Bulk API : " + URL);
            }        

        }     
        
        rs(resultList);
    });
}