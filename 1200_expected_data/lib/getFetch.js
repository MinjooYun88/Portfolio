/***********************************************************************
 
    Function : Fetch API Url
    Process : getFetch(URL)
 
 ***********************************************************************/
// Get API data in fetch
import fetch from 'node-fetch';
import { logger } from "../src/logger.js";

export async function getFetch(URL, cookie, trg) {
    var retry = 0;
    var check = true;
    var cook = cookie;

    do {
        try {
            if(trg == "Search") var response = await fetch(URL, { insecureHTTPParser: true });
            else if(trg == "PD") var response = await fetch(URL, {
                                                                    headers: {
                                                                        Cookie: cook,
                                                                        Credential: "include"
                                                                    }
                                                                });
            // console.log("PD Fetch OK...")
            check = false;
            if(retry > 0) {
                logger.info("Fetch retry Pass");
                retry = 0;
            }
        }
        catch(e) {
            console.error(e);
            retry++;
            logger.error("Fetch error [Retry: " + retry + "] : " + URL);
            check = true;
        }

    } while(check);

    return response;
}
