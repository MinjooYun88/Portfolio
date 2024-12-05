/***********************************************************************
 
    Function : Convert Price String
    Process : replace00A0(tempString)

    Data    : 2022-04-07
 
 ***********************************************************************/
// Find 0A00 Space in String + price 0 to null
function replace00A0(tempString) {
    if(tempString == null) {
        return "";
    } else if(tempString == "0") {
        return "";
    } else {
        return tempString.replaceAll(" ", " ");
    }
}

/***********************************************************************
 
    Function : Convert Display Name String
    Process : replaceBr(tempString)

    Data    : 2022-04-08
 
 ***********************************************************************/
// Find Html Tag in String
function replaceBr(tempString) {
    tempString = replace00A0(tempString);
    tempString = replaceBlank(tempString);
    tempString = tempString.replace(/<sup>/g, '');
    tempString = tempString.replaceAll("</sup>", "");
    tempString = tempString.replace(/ <br> /g, '');
    return tempString.replace(/<br>/g, '');
}

/***********************************************************************
 
    Function : Delete Blank in Display Name
    Process : replaceBlank(tempString)

    Data    : 2022-04-18
 
 ***********************************************************************/
// Find double blank and blank at the end 
function replaceBlank(tempString) {
    tempString = replaceR(tempString);
    tempString = tempString.replace(/  /g, ' ');
    tempString = tempString.replace(/  /g, ' ');
    tempString = tempString.replace(/ $/, '');
    return tempString.replace(/ $/, '');
}

/***********************************************************************
 
    Function : Delete newline in Display Name
    Process : replaceR(tempString)

    Data    : 2022-04-19
 
 ***********************************************************************/
// Delete newline
function replaceR(tempString) {
    tempString = tempString.replace(/(\r\n|\n|\r|\t)/gm, ""); 
    return tempString.replace(/(\r\n|\n|\r|\t)/gm, "");
}

/***********************************************************************
 
    Function : Convert Tiered for Match
    Process : tieredRemake(tiered)

    Data    : 2022-04-20
 
 ***********************************************************************/
// Convert Tiered
function tieredRemake(tiered) {
    if(tiered == undefined) tiered = "";
    tiered = tiered.replace(/(\r\n|\n|\r)/gm, "");
    tiered = tiered.replace(/[^\w\-/]+/g, "");
    tiered = tiered.replace(/[a-z ]+/gi, "");

    var rsDash = new Array();
    var rsSlash = new Array();
    var PF_Dash = 0;
    var PF_Slash = 0;
    var string_Temp = "";
    var PF_Dash_Temp = tiered.indexOf('-');
    var PF_Slash_Temp = tiered.indexOf('/');

    if(tiered.charAt(tiered.length -1) == "/") tiered = tiered.slice(0, -1);

    while(PF_Dash_Temp !== -1) {
        rsDash[PF_Dash] = PF_Dash_Temp;
        PF_Dash++; 
        PF_Dash_Temp = tiered.indexOf('-', PF_Dash_Temp + 1);  
    }
    while(PF_Slash_Temp !== -1) {
        rsSlash[PF_Slash] = PF_Slash_Temp;
        PF_Slash++;
        PF_Slash_Temp = tiered.indexOf('/', PF_Slash_Temp + 1);
    }

    if(rsSlash.length == rsDash.length) {
        for(var u = rsDash.length; u > 0; u--) {
            string_Temp = tiered.substring(rsSlash[u-1]);
            tiered = tiered.substring(0, rsDash[u-1]);
            tiered = tiered + string_Temp;
        }
    }
    else {
        for(var u = rsDash.length; u > 0; u--) {
            string_Temp = tiered.substring(rsSlash[u]);
            tiered = tiered.substring(0, rsDash[u-1]);
            tiered = tiered + string_Temp;
        }
    }

    if(tiered != "") {
        tiered = tiered + "/";
    }
    
    return tiered;
}

/***********************************************************************
 
    Function : Convert Tiered Price for Match
    Process : tpRemake(price)

    Data    : 2022-04-20
 
 ***********************************************************************/
// Convert Tiered Price
function tpRemake(price) {
    if(price == undefined) price = "";
    price = price.replace(/(\r\n|\n|\r)/gm, "");
    price = price.replaceAll("total price", "");
    price = price.replaceAll(" ", "");
    price = price.replaceAll(" ", "");
    
    if(price != "") {
        price = price + "/";
    }
    return price;
}

/***********************************************************************
 
    Function : Delete Blank for Null
    Process : replaceNull(tempString)

    Data    : 2022-04-20
 
 ***********************************************************************/
// Delete Blank for Null 
function replaceNull(tempString) {
    if(tempString == undefined) tempString = "";
    tempString = tempString.replaceAll(" ", "");
    return tempString.replaceAll(" ", "");
}

/***********************************************************************
 
    Function : Convert Save Price for Match
    Process : tpRemake(price)

    Data    : 2022-04-25
 
 ***********************************************************************/
// Convert Save Price
function saveRemake(price) {
    if(price == undefined) price = "";
    if(price == "N/A") price = "";
    price = price.replace(/(\r\n|\n|\r)/gm, "");
    price = price.replace(/[^\w\-/]+/g, "");
    price = price.replace(/[a-zA-Z  ,.]+/g, "");

    return price;
}

/***********************************************************************
 
    Function : Convert N/A Price and Delete 00A0
    Process : replaceNA(tempString)

    Data    : 2022-04-12
 
 ***********************************************************************/
// Find 00A0 and N/A in Price
function replaceNA(price) {
    if(price == undefined) price = "";
    price = price.replaceAll(" ", " ");
    price = Comma(price);
    return price.replace("N/A", "");
}

/***********************************************************************
 
    Function : Convert Cart Price for Match
    Process : tpRemake(price)

    Data    : 2022-04-26
 
 ***********************************************************************/
// Convert Cart Price
function cartRemake(price) {
    if(price == undefined) price = "";
    if(price == "N/A") price = "";
    price = replaceNA(price);

    if(price.includes("\n")) {
        var line_index = price.indexOf('\n');

        price = price.substring(0, line_index);
    }
    return price;
}

/***********************************************************************
 
    Function : Convert to low letter
    Process : lowLetter(str)

    Data    : 2022-05-26
 
 ***********************************************************************/
// Convert to low letter
function lowLetter(str) {
    if(str == undefined) str = "";
    str = str.toLowerCase();
    return str;
}

/***********************************************************************
 
    Function : Remove monetary unit
    Process : removeUnit(price)

    Data    : 2022-06-03
 
 ***********************************************************************/
// Remove monetary unit
function removeUnit(price) {
    price = price.replaceAll("€", "");
    price = replaceNull(price);
    return price;
}

function removeU200(str) {
    str = str.replace(/[\u200E]/g, "");
    return str;
}

function SEBNprice(price) {
    price = removeUnit(price);
    price = replaceNull(price);
    price = price.replace("-", "00");
    return price;
}

function convertChip(str) {
    str = str.replace(/\"/g, "");
    return str;
}

function FnkrNum(str) {
    str = cartRemake(str);
    if(str == "") str = "0";
    str = str.replace(/[^0-9]+/gm, "");
    return str;
}

function BnkrNum(str) {
    if(str == "" || str==undefined) str = "0";    
    str = str.replace(/[^0-9]+/gm, "");
    return str;
}

function Comma(str) {
    str = str.replaceAll("٬", ",");
    return str;
}

export { replace00A0, replaceBr, replaceBlank, replaceR, tieredRemake, tpRemake, replaceNull, saveRemake, replaceNA, cartRemake, lowLetter, removeUnit, removeU200, SEBNprice, convertChip, FnkrNum, BnkrNum, Comma };
