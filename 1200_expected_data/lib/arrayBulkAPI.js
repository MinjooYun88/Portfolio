/***********************************************************************
 
    Function : Array Bulk API Data
    Process : arrayBulkApi(targetsite, productList, start)

    Data    : 2022-05-16
 
 ***********************************************************************/
// Get Bulk API data
import { replace00A0, replaceBr } from './convertString.js';

export function arrayBulkApi(productList, sc) {
    var rsData = new Array();
    
    for(var i = 0 ; i < productList.length; i++) {
            
        var rsJson = new Object();  // Object Reset
        var line = "";
        var value = "";

        rsJson.sitecode = sc;
        rsJson.bulkModelCode = productList[i].code;
        rsJson.bulkStock = productList[i].stock.stockLevelStatus;
        if(productList[i].priceInfos != "") {
            productList[i].priceInfos[0].prices.forEach(function(e){
                if(e.priceType == "SPECIAL") rsJson.bulkPromotionPrice = replace00A0(e.formattedValue);
                else rsJson.bulkSMBPrice = replace00A0(e.formattedValue);
            });
            
            if(productList[i].priceInfos[1] != undefined) rsJson.bulkGuestPrice = replace00A0(productList[i].priceInfos[1].prices[0].formattedValue);
            else rsJson.bulkGuestPrice = "";

            // tiered Price Area
            if(productList[i].priceInfos[0].tieredPrices == "") {
                rsJson.bulkTieredPrice = "";
                rsJson.bulkTiered = "";
            }
            else {
                var obj = productList[i].priceInfos[0].tieredPrices;
                try{
                    obj.forEach(function(element){
                        line = line + element.minQuantity;
                        value = value + replace00A0(element.formattedValue);
                        if(element.maxQuantity != undefined) {
                            line = line + "-" + element.maxQuantity + "/";
                            value = value + "/";
                        }
                    });
                }catch(e){

                }
                
                rsJson.bulkTiered = line;
                rsJson.bulkTieredPrice = value;
            }
        }

        if(rsJson != "")  rsData = [...rsData, rsJson];
        
    }
    return rsData;
}
