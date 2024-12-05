/***********************************************************************
 
    Function : Get PD API Data
    Process : getPDAPI(sku, targetsite)

    Data    : 2022-07-06

 ***********************************************************************/
// Get PDAPI data
import { getFetch } from '../.vscode/lib/getFetch.js';
import { cookie } from "../src/config.js";
import { logger } from "../src/logger.js";
import { arrayPDApi } from '../.vscode/lib/arrayPDAPI.js';
import { makeURL } from '../.vscode/lib/makePDAPI.js';

export async function getPDAPI(sku, targetsite) {

    var resultList = new Array();
    let data;
    var retry = 0;
    var check = true;
    var URL = makeURL(targetsite, sku);

    // Check Request
    var response = await getFetch(URL, cookie, "PD");

    // Check Response API
    if(response.ok) {
        do { 
            try{
                if(retry > 0) {
                    logger.info("Retry Get Json [Retry: " + retry + "] : " + URL);
                }
                data = await response.json();
                console.log(URL + " : Get Json OK...");
                // if(data.response.statusCode >= 300) throw "connectError";
                check = false;
                if(retry > 0) {
                    logger.info("Get Json retry Pass : " + URL);
                    retry = 0;
                }
            } catch (e) {
                retry++;
                if(e == "connectError") logger.error("Connection Failed [" + data.response.statusCode + "] : " + URL);   
                else logger.error("Get Json error : " + URL);
                var response = await getFetch(URL, "PD");
                check = true;
            } 
        } while(check && retry < 5);
        
        if(retry != 0) {
            logger.error("Cannot Save API Data : " + URL);
            retry = 0;
        }
        else console.log(targetsite + "_" + sku + "_Status OK...");

    }
    resultList.push(arrayPDApi(targetsite, sku, data));

    return resultList;

}