/***********************************************************************
 
    Function : Array PD API Data
    Process : arrayPDApi(targetsite, productList, start)

    Data    : 2022-07-07
 
 ***********************************************************************/
// Get API data
export function arrayPDApi(targetsite, sku, data) {
    var rsData = new Array();
    var rsJson = new Object();
    var exTieredPrice = "";
    var exTieredQuantity = "";
    var TieredPrice = "";
    var TieredQuantity = "";
    var price = "";

    try {
        for (var g = 0; g < data.exVatTieredPrices.length; g++) {
          var tempP = data.exVatTieredPrices[g].formattedValue;
          exTieredPrice = exTieredPrice + tempP + "/";

          var tempQ = data.exVatTieredPrices[g].minQuantity;
          exTieredQuantity = exTieredQuantity + tempQ + "/";
        }   
    } catch (e) {
        //console.log("Not Exist exVatPrice!");
    }

    try {
        for (var t = 0; t < data.tieredPrices.length; t++) {
            var tempP = data.tieredPrices[t].formattedValue;
            TieredPrice = TieredPrice + tempP + "/";

            var tempQ = data.tieredPrices[t].minQuantity;
            TieredQuantity = TieredQuantity + tempQ + "/";
        }
    } catch (e) {
        //console.log("Not Exist VatPrice!");
    }

    try {
        price = data.price.formattedValue;
    } catch (e) {
        //console.log("Not Exist Data!");
    }

    // rsJson.Site = targetsite;
    // rsJson.SKU = sku;
    rsJson.exVatTieredPrices_value = exTieredPrice;
    rsJson.exVatTieredPrices_minQuantity = exTieredQuantity;
    rsJson.TieredPrices_value = TieredPrice;
    rsJson.TieredPrices_minQuantity = TieredQuantity;
    rsJson.price_formattedValue = price;
    
    rsData.push(rsJson);


    return rsData;
}