/***********************************************************************
 
    search api and actual data Merge Process
 
 ***********************************************************************/

////////////////////// Base Variable //////////////////////
import fs from "fs";
import xlsx from "xlsx";
import * as convert from '../lib/convertString.js';
import { cfg_sitecode } from "./config.js";
var check = false;
var result;
var comment;
var rsData = new Array();
var rsJson = new Object();
var api_Buffer;
var api_String;
var api_Data;
var pf_Buffer;
var pf_String;
var pf_Data;


var guest_SC =  cfg_sitecode; 
//var include_SC = ["be"];
//var exclude_SC = ["be"];

await task("guest"); // mode : guest , include, exclude 


// Main Process
async function task(mode) {
    const workBook = xlsx.utils.book_new();
    if(mode == "guest") var siteCode = guest_SC;
    else if(mode == "include") var siteCode = include_SC;
    else if(mode == "exclude") var siteCode = exclude_SC;

    for(var t = 0; t < siteCode.length; t++) {
        rsJson = new Object();
        rsData = new Array();

        // Get Search API Result Data
        api_Buffer = fs.readFileSync('../result/Search_API_Result/Search_API_' + siteCode[t] + '.json');
        api_String = api_Buffer.toString();
        api_Data = JSON.parse(api_String);

        // Get PF,PD Result Data
        var SC = siteCode[t] + "_" + mode;
        pf_Buffer = fs.readFileSync('../result/Products_API_Result/' + siteCode[t] + '_' + mode +'_PD_output.json');
        pf_String = pf_Buffer.toString();
        pf_Data = JSON.parse(pf_String);
        
        // Find SKU to Mapping in puppeteer Data
        for(var n = 0; n < pf_Data.length; n++) {
            check = false;
            result = "";
            comment = "";

            // Mapping to API Data
            for(var i = 0; i < api_Data.length; i++) {
                var url = pf_Data[n].PF_URL;
                var type = api_Data[i].pviSubtypeName;
                if(api_Data[i].modelCode == pf_Data[n].SKU) {
                    // console.log("Find Mapping...");
                    compare(i, n, mode, siteCode[t]);
                    check = true;
                    break;              
                }
            }
       

            if(check == false) { // Mapping Failed SKU (OnlyAPI)
                // console.log("OnlyAPI");
                write_Onlyapi(n);
            }
        }
        // ---------------------------------------------------------

        // Creat Excel Sheet
        var workSheet = xlsx.utils.json_to_sheet(rsData);
        xlsx.utils.book_append_sheet(workBook, workSheet, siteCode[t] + "_" + mode);
    }

    xlsx.writeFile(workBook, "../result/Total_Result_" + mode + ".xlsx");
    console.log(mode + " Result File Saved!");
}

/***********************************************************************
 
    Function : Compare to API Data and puppeteer Data
    Process : compare(i, n, u, mode)

    Data    : 2022-04-07
 
 ***********************************************************************/
function compare(i, n, mode, site) {
    var tg = 0;
    console.log("--------------------------------");
    console.log(api_Data[i]);
    console.log(pf_Data[n]);
    console.log("--------------------------------");
    // Compare SKU
    if(api_Data[i].modelCode != pf_Data[n].SKU) {
        comment += "| SKU ";
        tg++;
    }
    // Compare Display Name
    if(convert.replaceBlank(api_Data[i].displayName) != convert.replaceR(pf_Data[n].PF_DISPLAYNAME)) {
        comment += "| Display ";
        tg++;
    }
    // Compare Chip Option 1
    if(api_Data[i].fmyChipList != null && api_Data[i].fmyChipList != pf_Data[n].PF_COLOR && api_Data[i].fmyChipList2 != pf_Data[n].PF_COLOR) {
        comment += "| Chip1 ";
        tg++;
    }
    // Compare Chip Option 2 (if it exists)
    if(api_Data[i].fmyChipList == null && api_Data[i].fmyChipList2 != null && pf_Data[n].PF_COLOR != null && pf_Data[n].PF_MEMORY != null) {
        comment += "| Chip1 ";
        tg++;
    }
    if(api_Data[i].fmyChipList2 != null && api_Data[i].fmyChipList2 != pf_Data[n].PF_COLOR && api_Data[i].fmyChipList2 != pf_Data[n].PF_MEMORY) {
        comment += "| Chip2 ";
        tg++;
    }
    if(api_Data[i].fmyChipList != null && api_Data[i].fmyChipList2 == null && pf_Data[n].PF_COLOR != null && pf_Data[n].PF_MEMORY != null) {
        comment += "| Chip2 ";
        tg++;
    }
    // Compare Promotion Price
    var promotion_in = api_Data[i].promotionPriceDisplay;
    var promotion_ex = api_Data[i].taxExPriceDisplay;

    if(mode == "guest" && api_Data[i].promotionPriceDisplay != convert.replaceNA(pf_Data[n].PF_PRICE_PROMOTION)) {
        comment += "| PF_Promotion_Price[ " + api_Data[i].promotionPriceDisplay + " :: " + pf_Data[n].PF_PRICE_PROMOTION + " ] ";
        tg++;
    }
    else if(mode == "include") {
        if(api_Data[i].smbPromotionPriceDisplay != "" && api_Data[i].smbPromotionPriceDisplay != convert.replaceNA(pf_Data[n].PF_PRICE_PROMOTION)) {
            comment += "| PF_Promotion_Price[ " + api_Data[i].smbPromotionPriceDisplay + " :: " + pf_Data[n].PF_PRICE_PROMOTION + " ] ";        
            tg++;
        }
        else if(api_Data[i].smbPromotionPriceDisplay == "" && api_Data[i].tieredPriceDisplay != "" && api_Data[i].tieredPriceDisplay != convert.replaceNA(pf_Data[n].PF_PRICE_PROMOTION)) {
            comment += "| PF_Promotion_Price[ " + api_Data[i].tieredPriceDisplay + " :: " + pf_Data[n].PF_PRICE_PROMOTION + " ] ";      
            tg++;
        }
        else if(api_Data[i].smbPromotionPriceDisplay == "" && api_Data[i].tieredPriceDisplay == "" && api_Data[i].promotionPriceDisplay != "" && api_Data[i].promotionPriceDisplay != convert.replaceNA(pf_Data[n].PF_PRICE_PROMOTION)) {
            comment += "| PF_Promotion_Price[ " + api_Data[i].promotionPriceDisplay + " :: " + pf_Data[n].PF_PRICE_ORIGINAL_PROMOTION + " ] ";
            tg++;
        }
        if(api_Data[i].smbPromotionPriceDisplay != "") promotion_in = api_Data[i].smbPromotionPriceDisplay;
        else if(api_Data[i].smbPromotionPriceDisplay == "" && api_Data[i].tieredPriceDisplay != "") promotion_in = api_Data[i].tieredPriceDisplay;
        else if(api_Data[i].smbPromotionPriceDisplay == "" && api_Data[i].tieredPriceDisplay == "" && api_Data[i].promotionPriceDisplay != "") promotion_in = api_Data[i].promotionPriceDisplay;
    }
    else if(mode == "exclude") {
        if(site == "dk" && api_Data[i].promotionPriceDisplay != convert.replaceNA(pf_Data[n].PF_PRICE_ORIGINAL_PROMOTION)) {
            comment += "| PF_Promotion_Price[ " + api_Data[i].promotionPriceDisplay + " :: " + pf_Data[n].PF_PRICE_ORIGINAL_PROMOTION + " ] ";
            tg++;
        }
        else if (site != "dk" && api_Data[i].taxExPriceDisplay != convert.replaceNA(pf_Data[n].PF_PRICE_ORIGINAL_PROMOTION)){
            comment += "| PF_Promotion_Price[ " + api_Data[i].taxExPriceDisplay + " :: " + pf_Data[n].PF_PRICE_ORIGINAL_PROMOTION + " ] ";
            tg++;
        }

        if(site != "dk") promotion_in = api_Data[i].taxExPriceDisplay;
        if(api_Data[i].smbPromotionPriceDisplay != "") promotion_ex = api_Data[i].smbPromotionPriceDisplay;
        else if(api_Data[i].smbPromotionPriceDisplay == "" && api_Data[i].tieredPriceDisplay != "") promotion_ex = api_Data[i].tieredPriceDisplay;
        else if(api_Data[i].smbPromotionPriceDisplay == "" && api_Data[i].tieredPriceDisplay == "" && api_Data[i].promotionPriceDisplay != "") promotion_ex = api_Data[i].promotionPriceDisplay;
    }
    // Compare Display Price (only include mode)
    if(mode == "include" && api_Data[i].smbPromotionPriceDisplay != "" && convert.saveRemake(api_Data[i].priceDisplay) != convert.saveRemake(pf_Data[n].PF_PRICE_ORIGINAL)) {
        comment += "| PF_Price[ " + api_Data[i].priceDisplay + " :: " + pf_Data[n].PF_PRICE_ORIGINAL + " ] ";
        tg++;
    }
    // Compare Save Price (only include mode)
    if(mode == "include" && pf_Data[n].PF_PRICE_SAVE != "N/A" && api_Data[i].smbPromotionPriceDisplay != "") {
        var PF_Save = parseInt(convert.saveRemake(pf_Data[n].PF_PRICE_SAVE));
        var API_price = parseInt(convert.saveRemake(api_Data[i].priceDisplay));
        var API_minus = parseInt(convert.saveRemake(api_Data[i].smbPromotionPriceDisplay));

        if(API_price - API_minus != PF_Save) {
            comment += "| PF_Save_Price[ " + (API_price - API_minus) + " :: " + PF_Save + " ] ";
            tg++;
        }
    }
    // Compare PD Type in CTA 1
    if(api_Data[i].pviTypeName == "Mobile" && pf_Data[n].BUY_NOW_PD_TYPE != undefined && pf_Data[n].BUY_NOW_PD_TYPE != "STANDARD"){
        comment += "| CTA_1_PD_Type_Mismatch[ " + pf_Data[n].BUY_NOW_PD_TYPE + " ] ";
        tg++;
    }
    // Compare PD, Cart Price according to Stock
    if(api_Data[i].ctaType == "lowStock" || api_Data[i].ctaType == "inStock") {
        if(pf_Data[n].BUY_NOW_CTA_TYPE != "inStock") {
            comment += "| CTA1_Mismatch[ " + api_Data[i].ctaType + " :: " + pf_Data[n].BUY_NOW_CTA_TYPE + " ] ";
            tg++;
        }
        if(pf_Data[n].BUY_NOW_PD_TYPE == "MKT" || pf_Data[n].BUY_NOW_PD_TYPE == "PCD"){
            comment += "| Go_to_MKT/PCD(CTA1) "
            tg++;
        }
        if(mode == "include" && pf_Data[n].BUY_NOW_PD_TYPE != "MKT" && pf_Data[n].BUY_NOW_PD_TYPE != "PCD" && promotion_in != convert.cartRemake(pf_Data[n].Cart_Price)) {
            comment += "| CTA_1_Cart_Price[ " + promotion_in + " :: " + pf_Data[n].Cart_Price + " ] ";
            tg++;
        }
        else if(mode == "exclude" && pf_Data[n].BUY_NOW_PD_TYPE != "MKT" && pf_Data[n].BUY_NOW_PD_TYPE != "PCD" && promotion_ex != convert.cartRemake(pf_Data[n].Cart_Price)) {
            comment += "| CTA_1_Cart_Price[ " + promotion_ex + " :: " + pf_Data[n].Cart_Price + " ] ";
            tg++;
        }
        if(pf_Data[n].BUY_NOW_PD_TYPE != "MKT" && pf_Data[n].BUY_NOW_PD_TYPE != "PCD" && promotion_in != convert.replaceNA(pf_Data[n].BUY_NOW_Promotion_Price)) {
            comment += "| CTA_1_PD_Promotion_Price[ " + promotion_in + " :: " + pf_Data[n].BUY_NOW_Promotion_Price + " ] ";
            tg++;
        }
        if(pf_Data[n].BUY_NOW_PD_TYPE == "FEATURE" && promotion_in != convert.replaceNA(pf_Data[n].BUY_NOW_Promotion_Price)) {
            comment += "| CTA_1_Feature_PD_Promotion_Price[ " + promotion_in + " :: " + pf_Data[n].BUY_NOW_Promotion_Price + " ] ";
            tg++;
        }
        if(api_Data[i].pviTypeName == "Mobile" && pf_Data[n].LEARN_MORE_PD_TYPE == "MKT" || pf_Data[n].LEARN_MORE_PD_TYPE == "PCD"){
            comment += "| Go_to_MKT/PCD(CTA2) "
            tg++;
        }
        if(mode == "include" && api_Data[i].pviTypeName == "Mobile" && pf_Data[n].LEARN_MORE_PD_TYPE != "MKT" && pf_Data[n].LEARN_MORE_PD_TYPE != "PCD" && convert.replaceNA(promotion_in) != convert.cartRemake(pf_Data[n].Cart_Price)) {
            comment += "| CTA_2_Cart_Price[ " + promotion_in + " :: " + pf_Data[n].Cart_Price + " ] ";
            tg++;
        }
        else if(mode == "exclude" && api_Data[i].pviTypeName == "Mobile" && pf_Data[n].LEARN_MORE_PD_TYPE != "MKT" && pf_Data[n].LEARN_MORE_PD_TYPE != "PCD" && convert.replaceNA(promotion_ex) != convert.cartRemake(pf_Data[n].Cart_Price)) {
            comment += "| CTA_2_Cart_Price[ " + promotion_ex + " :: " + pf_Data[n].Cart_Price + " ] ";
            tg++;
        }
        if(api_Data[i].pviTypeName == "Mobile" && pf_Data[n].LEARN_MORE_PD_TYPE != "MKT" && pf_Data[n].LEARN_MORE_PD_TYPE != "PCD" && promotion_in != convert.replaceNA(pf_Data[n].LEARN_MORE_Promotion_Price)) {
            comment += "| CTA_2_PD_Promotion_Price[ " + promotion_in + " :: " + pf_Data[n].LEARN_MORE_Promotion_Price + " ] ";
            tg++;
        }
        if(pf_Data[n].LEARN_MORE_PD_TYPE == "FEATURE" && promotion_in != convert.replaceNA(pf_Data[n].LEARN_MORE_Promotion_Price)) {
            comment += "| CTA_2_Feature_PD_Promotion_Price[ " + promotion_in + " :: " + pf_Data[n].LEARN_MORE_Promotion_Price + " ] ";
            tg++;
        }
    }
    else if(api_Data[i].ctaType == "learnMore") {
        if(pf_Data[n].BUY_NOW_CTA_TYPE != undefined) {
            comment += "| CTA1_Mismatch[ " + api_Data[i].ctaType + " :: " + pf_Data[n].BUY_NOW_CTA_TYPE + " ] ";
            tg++;
        }
        if(api_Data[i].pviTypeName == "Mobile" && pf_Data[n].LEARN_MORE_PD_TYPE == "MKT" || pf_Data[n].LEARN_MORE_PD_TYPE == "PCD"){
            comment += "| Go_to_MKT/PCD(CTA2) "
            tg++;
        }
    }
    else if(api_Data[i].ctaType == "outOfStock") {
        if(pf_Data[n].BUY_NOW_CTA_TYPE != "outOfStock") {
            comment += "| CTA1_Mismatch[ " + api_Data[i].ctaType + " :: " + pf_Data[n].BUY_NOW_CTA_TYPE + " ] ";
            tg++;
        }
        if(pf_Data[n].BUY_NOW_PD_TYPE == "MKT" || pf_Data[n].BUY_NOW_PD_TYPE == "PCD"){
            comment += "| Go_to_MKT/PCD(CTA1) "
            tg++;
        }
        if(pf_Data[n].LEARN_MORE_PD_TYPE == "MKT" || pf_Data[n].LEARN_MORE_PD_TYPE == "PCD"){
            comment += "| Go_to_MKT/PCD(CTA2) "
            tg++;
        }
        else if(api_Data[i].pviTypeName == "Mobile" && pf_Data[n].LEARN_MORE_PD_TYPE != "FEATURE"){
            comment += "| CTA_2_PD_Type_Mismatch[ " + pf_Data[n].LEARN_MORE_PD_TYPE + " ] ";
            tg++;
        }
        else if(api_Data[i].pviTypeName != "Mobile" && pf_Data[n].LEARN_MORE_PD_TYPE != "STANDARD"){
            comment += "| CTA_2_PD_Type_Mismatch[ " + pf_Data[n].LEARN_MORE_PD_TYPE + " ] ";
            tg++;
        }
        if(pf_Data[n].LEARN_MORE_PD_TYPE != "MKT" && pf_Data[n].LEARN_MORE_PD_TYPE != "PCD" && promotion_in != convert.replaceNA(pf_Data[n].LEARN_MORE_Promotion_Price)) {
            comment += "| CTA_2_PD_Promotion_Price[ " + promotion_in + " :: " + pf_Data[n].LEARN_MORE_Promotion_Price + " ] ";
            tg++;
        }
        if(pf_Data[n].LEARN_MORE_PD_TYPE == "FEATURE" && promotion_in != convert.replaceNA(pf_Data[n].LEARN_MORE_Promotion_Price)) {
            comment += "| CTA_2_Feature_PD_Promotion_Price[ " + promotion_in + " :: " + pf_Data[n].LEARN_MORE_Promotion_Price + " ] ";
            tg++;
        }
    }

    // Compare PF API Tiered <-> PD API Tiered
    if(mode != "guest" && convert.replaceNull(pf_Data[n].PD_Tiered_Price) != "" && pf_Data[n].PD_Tiered_Min != "1/") {
        if(convert.tieredRemake(pf_Data[n].PF_TIERED_MIN) != convert.tieredRemake(pf_Data[n].PD_Tiered_Min) && ((pf_Data[n].PD_Tiered_Min).charAt(0) != "1" && (pf_Data[n].PD_Tiered_Min).charAt(1) != "/")) {
            comment += "| PF_Tiered_Mismatch[ " + pf_Data[n].PF_TIERED_MIN + " :: " + pf_Data[n].PD_Tiered_Min + " ] ";
            tg++;
        }
        if(pf_Data[n].BUY_NOW_PD_TYPE == "STANDARD" && convert.tieredRemake(pf_Data[n].PF_TIERED_MIN) !=convert.tieredRemake(pf_Data[n].PD_Tiered_Min)) {
            comment += "| PD_Tiered_Mismatch[ " + pf_Data[n].PD_Tiered_Min + " :: " + pf_Data[n].PD_Tiered_Min + " ] ";
            tg++;
        }
        else if(pf_Data[n].BUY_NOW_PD_TYPE != "STANDARD" && pf_Data[n].BUY_NOW_PD_TYPE != "MKT" && pf_Data[n].BUY_NOW_PD_TYPE != "PCD" && pf_Data[n].LEARN_MORE_PD_TYPE != "MKT" && pf_Data[n].LEARN_MORE_PD_TYPE != "PCD" && convert.tieredRemake(pf_Data[n].PF_TIERED_MIN) !=convert.tieredRemake(pf_Data[n].PD_Tiered_Min)) {
            comment += "| PD_Tiered_Mismatch[ " + pf_Data[n].PD_Tiered_Min + " :: " + pf_Data[n].PD_Tiered_Min + " ] ";
            tg++;
        }
        if(convert.replaceNull(pf_Data[n].PF_TIERED_PRICE) != convert.replaceNull(pf_Data[n].PD_Tiered_Price) && ((pf_Data[n].PD_Tiered_Min).charAt(0) != "1" && (pf_Data[n].PD_Tiered_Min).charAt(1) != "/")) {
            comment += "| PF_Tiered_Price_Mismatch[ " + pf_Data[n].PF_TIERED_PRICE + " :: " + pf_Data[n].PD_Tiered_Price + " ] ";
            tg++;
        }
        if(pf_Data[n].BUY_NOW_PD_TYPE == "STANDARD" && convert.replaceNull(pf_Data[n].PF_TIERED_PRICE) != convert.replaceNull(pf_Data[n].PD_Tiered_Price)) {
            comment += "| PD_Tiered_Price_Mismatch[ " + convert.tpRemake(pf_Data[n].PD_Tiered_Price) + " :: " + convert.replaceNull(pf_Data[n].PD_Tiered_Price) + " ] ";
            tg++;
        }
        else if(pf_Data[n].BUY_NOW_PD_TYPE != "STANDARD" && pf_Data[n].BUY_NOW_PD_TYPE != "MKT" && pf_Data[n].BUY_NOW_PD_TYPE != "PCD" && pf_Data[n].LEARN_MORE_PD_TYPE != "MKT" && pf_Data[n].LEARN_MORE_PD_TYPE != "PCD" && convert.replaceNull(pf_Data[n].PF_TIERED_PRICE) != convert.replaceNull(pf_Data[n].PD_Tiered_Price)) {
            comment += "| PD_Tiered_Price_Mismatch[ " + convert.tpRemake(pf_Data[n].PD_Tiered_Price) + " :: " + convert.replaceNull(pf_Data[n].PD_Tiered_Price) + " ] ";
            tg++;
        }
        
    }

    // Total Result
    if(tg == 0) {
        result = "Pass";
    } else {
        result = "Fail";
    }

    write_Result(i, n);

}

/***********************************************************************
 
    Function : Writing Result Data to JSON
    Process : write_Result(i, n)

    Data    : 2022-04-07
 
 ***********************************************************************/
function write_Result(i, n) {
    rsJson = new Object();
    // Writing API Data
    rsJson.API_familyRecord = api_Data[i].familyRecord;
    rsJson.API_diplayName = api_Data[i].displayName;
    rsJson.API_modelCode = api_Data[i].modelCode;
    rsJson.pviTypeName = api_Data[i].pviTypeName;
    rsJson.API_pviSubtypeName = api_Data[i].pviSubtypeName;
    rsJson.API_ctaType = api_Data[i].ctaType;
    rsJson.API_smbPromotionPriceDisplay = api_Data[i].smbPromotionPriceDisplay;
    rsJson.API_taxExPriceDisplay = api_Data[i].taxExPriceDisplay;
    rsJson.API_promotionPriceDisplay = api_Data[i].promotionPriceDisplay;
    rsJson.API_priceDisplay = api_Data[i].priceDisplay;
    rsJson.API_saveText = api_Data[i].saveText;
    rsJson.API_taxExTieredPriceDisplay = api_Data[i].taxExTieredPriceDisplay;
    rsJson.API_tieredPriceDisplay = api_Data[i].tieredPriceDisplay;
    rsJson.API_marketingpdpYN = api_Data[i].marketingpdpYN;
    rsJson.API_tradeIn = api_Data[i].tradeIn;
    rsJson.API_KeySummaryTitle = api_Data[i].KeySummaryTitle;
    rsJson.API_KeySummaryImgUrl = api_Data[i].KeySummaryImgUrl;
    rsJson.API_pdpUrl = api_Data[i].pdpUrl;
    rsJson.API_originPdpUrl = api_Data[i].originPdpUrl;
    rsJson.API_fmyChip1 = api_Data[i].fmyChipList;
    rsJson.API_fmyChip2 = api_Data[i].fmyChipList2;
    if(api_Data[i].fmyChipList2 == null) rsJson.API_fmyChip2 = "";

    // Writing puppeteer Data
    rsJson.PF_URL = pf_Data[n].PF_URL;
    rsJson.PF_SKU = pf_Data[n].SKU;
    rsJson.PF_Display_Name = pf_Data[n].PF_DISPLAYNAME;
    rsJson.PF_COLOR = pf_Data[n].PF_COLOR;
    rsJson.PF_MEMORY = pf_Data[n].PF_MEMORY;
    rsJson.PF_Promotion_Price = pf_Data[n].PF_PRICE_ORIGINAL_PROMOTION;
    rsJson.PF_Price = pf_Data[n].PF_PRICE_ORIGINAL;
    rsJson.PF_Save_Price = pf_Data[n].PF_PRICE_SAVE;
    rsJson.PF_Tiered_Min = pf_Data[n].PF_TIERED_MIN;
    rsJson.PF_Tiered_Price = pf_Data[n].PF_TIERED_PRICE;
    rsJson.CTA_1_Stock = pf_Data[n].BUY_NOW_CTA_TYPE;
    rsJson.CTA_1_URL = pf_Data[n].BUY_NOW_PD_URL;
    rsJson.CTA_1_PD_Type = pf_Data[n].BUY_NOW_PD_TYPE;
    rsJson.CTA_1_Feature_PD_Promotion_Price = pf_Data[n].BUY_NOW_Promotion_Price;
    rsJson.CTA_1_Feature_PD_Price = pf_Data[n].BUY_NOW_Original_Price;
    rsJson.CTA_1_Feature_PD_Save_Price = pf_Data[n].BUY_NOW_Save_Price;
    rsJson.CTA_1_PD_URL = pf_Data[n].BUY_NOW_PD_URL;
    rsJson.CTA_1_PD_Tiered_Min = pf_Data[n].PD_Tiered_Min;
    rsJson.CTA_1_PD_Tiered_Price = pf_Data[n].PD_Tiered_Price;
    rsJson.CTA_1_PD_Promotion_Price = pf_Data[n].BUY_NOW_Promotion_Price;
    rsJson.CTA_1_PD_Price = pf_Data[n].BUY_NOW_Original_Price;
    rsJson.CTA_1_PD_Save_Price = pf_Data[n].BUY_NOW_Save_Price;
    rsJson.CTA_1_Cart_Price = pf_Data[n].Cart_Price;
    rsJson.CTA_2_Stock = pf_Data[n].LEARN_MORE_CTA_TYPE;
    rsJson.CTA_2_URL = pf_Data[n].LEARN_MORE_PD_URL;
    rsJson.CTA_2_PD_Type = pf_Data[n].LEARN_MORE_PD_TYPE;
    rsJson.CTA_2_Feature_PD_Promotion_Price = pf_Data[n].LEARN_MORE_Promotion_Price;
    rsJson.CTA_2_Feature_PD_Price = pf_Data[n].LEARN_MORE_Original_Price;
    rsJson.CTA_2_Feature_PD_Save_Price = pf_Data[n].LEARN_MORE_Save_Price;
    rsJson.CTA_2_PD_URL = pf_Data[n].LEARN_MORE_PD_URL;
    rsJson.CTA_2_PD_Tiered_Min = pf_Data[n].PD_Tiered_Min;
    rsJson.CTA_2_PD_Tiered_Price = pf_Data[n].PD_Tiered_Price;
    rsJson.CTA_2_PD_Promotion_Price = pf_Data[n].LEARN_MORE_Promotion_Price;
    rsJson.CTA_2_PD_Price = pf_Data[n].LEARN_MORE_Original_Price;
    rsJson.CTA_2_PD_Save_Price = pf_Data[n].LEARN_MORE_Save_Price;
    rsJson.CTA_2_Cart_Price = pf_Data[n].Cart_Price;
    rsJson.TieredPrices_Value = pf_Data[n].PD_Tiered_Price;
    rsJson.TieredPrices_minQuantity = pf_Data[n].PD_Tiered_Min;

    // Writing Compare Result Data
    rsJson.Total_Result = result;
    rsJson.Comment = comment;

    rsData.push(rsJson);
    // console.log("Push OK...");
}

/***********************************************************************
 
    Function : Writing OnlyAPI Data to JSON
    Process : write_Onlyapi(i)

    Data    : 2022-04-07
 
 ***********************************************************************/
function write_Onlyapi(i) {
    rsJson = new Object();
    // Writing API Data
    rsJson.API_familyRecord = api_Data[i].familyRecord;
    rsJson.API_diplayName = api_Data[i].displayName;
    rsJson.API_modelCode = api_Data[i].modelCode;
    rsJson.pviTypeName = api_Data[i].pviTypeName;
    rsJson.API_pviSubtypeName = api_Data[i].pviSubtypeName;
    rsJson.API_ctaType = api_Data[i].ctaType;
    rsJson.API_smbPromotionPriceDisplay = api_Data[i].smbPromotionPriceDisplay;
    rsJson.API_taxExPriceDisplay = api_Data[i].taxExPriceDisplay;
    rsJson.API_promotionPriceDisplay = api_Data[i].promotionPriceDisplay;
    rsJson.API_priceDisplay = api_Data[i].priceDisplay;
    rsJson.API_saveText = api_Data[i].saveText;
    rsJson.API_taxExTieredPriceDisplay = api_Data[i].taxExTieredPriceDisplay;
    rsJson.API_tieredPriceDisplay = api_Data[i].tieredPriceDisplay;
    rsJson.API_marketingpdpYN = api_Data[i].marketingpdpYN;
    rsJson.API_tradeIn = api_Data[i].tradeIn;
    rsJson.API_KeySummaryTitle = api_Data[i].KeySummaryTitle;
    rsJson.API_KeySummaryImgUrl = api_Data[i].KeySummaryImgUrl;
    rsJson.API_pdpUrl = api_Data[i].pdpUrl;
    rsJson.API_originPdpUrl = api_Data[i].originPdpUrl;
    rsJson.API_fmyChip1 = api_Data[i].fmyChipList;
    rsJson.API_fmyChip2 = api_Data[i].fmyChipList2;
    if(api_Data[i].fmyChipList2 == null) rsJson.API_fmyChip2 = "";

    // Writing Null in puppeteer Data
    rsJson.PF_URL = "";
    rsJson.PF_SKU = "";
    rsJson.PF_Display_Name = "";
    rsJson.PF_COLOR = "";
    rsJson.PF_MEMORY = "";
    rsJson.PF_Promotion_Price = "";
    rsJson.PF_Price = "";
    rsJson.PF_Save_Price = "";
    rsJson.PF_Tiered_Min = "";
    rsJson.PF_Tiered_Price = "";
    rsJson.CTA_1_Stock = "";
    rsJson.CTA_1_URL = "";
    rsJson.CTA_1_PD_Type = "";
    rsJson.CTA_1_Feature_PD_Promotion_Price = "";
    rsJson.CTA_1_Feature_PD_Price = "";
    rsJson.CTA_1_Feature_PD_Save_Price = "";
    rsJson.CTA_1_PD_URL = "";
    rsJson.CTA_1_PD_Tiered_Min = "";
    rsJson.CTA_1_PD_Tiered_Price = "";
    rsJson.CTA_1_PD_Promotion_Price = "";
    rsJson.CTA_1_PD_Price = "";
    rsJson.CTA_1_PD_Save_Price = "";
    rsJson.CTA_1_Cart_Price = "";
    rsJson.CTA_2_Stock = "";
    rsJson.CTA_2_URL = "";
    rsJson.CTA_2_PD_Type = "";
    rsJson.CTA_2_Feature_PD_Promotion_Price = "";
    rsJson.CTA_2_Feature_PD_Price = "";
    rsJson.CTA_2_Feature_PD_Save_Price = "";
    rsJson.CTA_2_PD_URL = "";
    rsJson.CTA_2_PD_Tiered_Min = "";
    rsJson.CTA_2_PD_Tiered_Price = "";
    rsJson.CTA_2_PD_Promotion_Price = "";
    rsJson.CTA_2_PD_Price = "";
    rsJson.CTA_2_PD_Save_Price = "";
    rsJson.CTA_2_Cart_Price = "";
    rsJson.TieredPrices_Value = "";
    rsJson.TieredPrices_minQuantity = "";

    rsJson.Total_Result = "N/A";
    rsJson.Comment = "OnlyAPI"
    
    rsData.push(rsJson);
    // console.log("OnlyAPI Push OK...");
}

/***********************************************************************
 
    Function : Check PD Type
    Process : PDType(i, site)

    Data    : 2022-04-19
 
 ***********************************************************************/
// Check PD Type
function PDType(i, site) {
    if(api_Data[i].ctaType == "inStock" || api_Data[i].ctaType == "lowStock") {
        var url = api_Data[i].pdpUrl;
        var model = api_Data[i].modelCode;
        model = model.replace("/","-");
        model = model.toLowerCase();
        if(url.includes("/" + site + "/business/smartphones/")) {
            if(url == "/" + site + "/business/smartphones/") {
                return "PCD"; 
            }
            else if(url == "/" + site + "/business/smartphones/all-smartphones/") {
                return "PF";
            }
            else if(url.includes(model)) {
                if(url.includes("/buy/")) return "STANDARD";
                return "FEATURE";
            }
            return "MKT";
        }
        else if(url.includes("/" + site + "/business/tablets/")) {
            if(url == "/" + site + "/business/tablets/") {
                return "PCD"; 
            }
            else if(url == "/" + site + "/business/tablets/all-tablets/") {
                return "PF";
            }
            else if(url.includes(model)) {
                if(url.includes("/buy/")) return "STANDARD";
                return "FEATURE";
            }
            return "MKT";
        }
        else if(url.includes("/" + site + "/business/watches/")) {
            if(url == "/" + site + "/business/watches/") {
                return "PCD"; 
            }
            else if(url == "/" + site + "/business/watches/all-watches/") {
                return "PF";
            }
            else if(url.includes(model)) {
                if(url.includes("/buy/")) return "STANDARD";
                return "FEATURE";
            }
            return "MKT";
        }
        else {
            if(url.includes(model)) {
                return "STANDARD";
            }
            return "NOT PD";
        }
    }
    else if(api_Data[i].ctaType == "outOfStock") {
        return "STOCKALERT";
    }
    else if(api_Data[i].ctaType == "preOrder") {
        return "CART";
    }
}
