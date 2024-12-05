/*********************************************
    B2C Scenario Test Main
    Process : S28_1302

    Date    : 2022-05-10
**********************************************/

const fs = require('fs');
const puppeteer = require('puppeteer');
const login = require('../lib/loginControl.js');
const eleControl = require('../lib/elementControl.js');
const urlList = JSON.parse(fs.readFileSync('../cfg/url.json'));
const settings = JSON.parse(fs.readFileSync('../cfg/settings.json'));
const logger = require('../lib/logger.js');

task("ae", "guest");

//-----RUN MAIN --------

function task(site, mode) {
    var promiseList = [];
    for(var i = 0; i < urlList[site].length; i++) {
        var pro_temp = main(urlList[site][i], mode, i);
        promiseList.push(pro_temp);       
    }
    Promise.allSettled(promiseList).then((data) => {

        //data = data.reduce(function(acc,cur) {
        //    return acc.concat(cur);
        //});
        var sc = "";
        data.forEach((e) => {
            if(e.status == "fulfilled" && e.value != "") {
                sc = catchSitecode(e.value[0].PF_URL);
                return false;
            }
            else if(e.status == "rejected") {
                sc = catchSitecode(e.reason.URL);
                return false;
            }
        })
        if(sc == "") sc = "ErrorSite";

        const result = JSON.stringify(data, null, 2);
        fs.writeFileSync('../outputs/' + sc + '_' + mode + '_PF_output.json',result);
        //process.send({ type : "end", from: process.pid});
        //process.exit(0);
    });
    
}


function catchSitecode(str) {
    var temp = str.indexOf("/", 10);
    var temp2 = str.indexOf("/", temp+1);
    return str.substring(temp+1, temp2);
}

//----------------------

async function main(url, mode, i){
    return new Promise(async (rs, rj) => {

        const browser = await puppeteer.launch({ 
            headless: false, 
            args: ['--start-maximized'],
            defaultViewport: {width: 1920,height:1080}
        });

        // const cookie = await browser.newPage();
        // await cookie.goto(settings.cookieURL);
    
        const page = await browser.newPage();
        await page.exposeFunction('checking', async (aem, smb, card, page, n, t) => {
            //process.send( { 'NUM': i, 'AEM': aem, 'SMB': smb, 'CARD': card, 'PAGE': page, 'now': n, 'total': t});
        });

        var getHeaders = await page.goto(url);  

        //process.send({ 'NUM': i, 'AEM': 2, 'SMB': 0, 'CARD': 0, 'PAGE': url, 'now': 0, 'total': 0 });
        
        if(!(await eleControl.check404page(page))){
            //process.send({ 'NUM': i, 'AEM': 2, 'SMB': 0, 'CARD': 3, 'PAGE': url, 'now': 0, 'total': 0 });
            rj({"URL": url, reason: "404"});
            logger.error(url+" is 404");
        }


        if(mode != "guest") {
            try{
                //process.send({ 'NUM': i, 'AEM': 2, 'SMB': 1, 'CARD': 0, 'PAGE': url, 'now': 0, 'total': 0 });
                await page.waitForSelector('.gnb__login-btn');
            }catch(e){
                //process.send({ 'NUM': i, 'AEM': 2, 'SMB': 3, 'CARD': 0, 'PAGE': url, 'now': 0, 'total': 0 });
                logger.error("CANNOT FIND LOGIN BUTTON: "+page.url());
            }
            await login.SMBUser(page);               
        }
        
        //process.send({ 'NUM': i, 'AEM': 2, 'SMB': 2, 'CARD': 1, 'PAGE': url, 'now': 0, 'total': 0 });

        if(await eleControl.waitingforCard(page)){
            await eleControl.closePOPUPs(page);        
            await eleControl.clickViewmore(page);
            //console.log("[Getting Data] " + url);
            if(mode=="exclude") {                
                await eleControl.setVATExclude(page); //옵션에 따른 조건문 추가    
            }
            var result = await page.evaluate(getPFCards);
            rs(result);
        }           
        else{
            // Not found Cards
            //process.send({ 'NUM': i, 'AEM': 2, 'SMB': 2, 'CARD': 3, 'PAGE': url, 'now': 0, 'total': 0 });
            rj({"URL": url, reason: "Not Found Cards"});
        }
        await browser.close();
    });
    
}




async function getPFCards(){    
    const cards = Array.from(document.querySelectorAll('[data-productidx]'));  

    var rsData = new Array();

    await (async () => {
        var n=0;
        for(let card of cards){            
            n++;
            //window.testlog("(" + n + "/" + cards.length + ") : " + document.URL);
            window.checking(2, 2, 2, document.URL, n, cards.length);
            const checkColor = card.querySelector("[class='option-selector-v2__wrap option-selector-v2__wrap--color-chip']");
            const checkMemory = card.querySelector("[class='option-selector-v2__wrap option-selector-v2__wrap--capacity']");
            
            //COLOR: O , MEMORY: 0
            if(checkColor!=null && checkMemory!=null){
                const colorlen = card.querySelectorAll(".option-selector-v2__wrap--color-chip button").length;
                // window.testlog('colorlen: ' + colorlen);
                for(let i = 0; i < colorlen; i++){
                    const colors = Array.from(card.querySelectorAll(".option-selector-v2__wrap--color-chip button"));
                    colors[i].click();
                    await (new Promise(rs => setTimeout(rs, 500)));                    
                    
                    const memorylen = card.querySelectorAll(".option-selector-v2__wrap--capacity button:not([disabled])").length;
                    // window.testlog('memorylen: ' + memorylen);    
                    for(let j = 0 ; j < memorylen; j++){  
                        const memories = Array.from(card.querySelectorAll(".option-selector-v2__wrap--capacity button:not([disabled])")); 
                        memories[j].click();
                        await (new Promise(rs => setTimeout(rs, 500)));
                        
                        var rsJson = new Object();
                        rsJson.NUM = cards.indexOf(card)+1;
                        rsJson.PF_URL = document.URL;
                        rsJson = await writeCardData(card,rsJson);
                        rsData.push(rsJson);
                             
                    }                     
    
                }  
            }
            //COLOR: O, MEMORY : X
            else if(checkColor!=null && checkMemory==null){

                const colorlen = card.querySelectorAll(".option-selector-v2__wrap--color-chip button").length;
                // window.testlog('colorlen: ' + colorlen);
                for(let i = 0; i < colorlen; i++){
                    const colors = Array.from(card.querySelectorAll(".option-selector-v2__wrap--color-chip button"));
                    colors[i].click();
                    await (new Promise(rs => setTimeout(rs, 500)));        

                    var rsJson = new Object();
                    rsJson.NUM = cards.indexOf(card)+1;
                    rsJson.PF_URL = document.URL;
                    rsJson = await writeCardData(card,rsJson);
                    rsData.push(rsJson);
                                               
                }  

            }
            //COLOR: X, MEMORY : O
            else if(checkColor==null && checkMemory!=null){                                    
                const memorylen = card.querySelectorAll(".option-selector-v2__wrap--capacity button:not([disabled])").length;
                // window.testlog('memorylen: ' + memorylen);    
                for(let j = 0 ; j < memorylen; j++){  
                    const memories = Array.from(card.querySelectorAll(".option-selector-v2__wrap--capacity button:not([disabled])")); 
                    memories[j].click();
                    await (new Promise(rs => setTimeout(rs, 500)));
                    var rsJson = new Object();
                    rsJson.NUM = cards.indexOf(card)+1;
                    rsJson.PF_URL = document.URL;
                    rsJson = await writeCardData(card,rsJson);
                    rsData.push(rsJson);
                    
                }                     
                 
            }
            //COLOR : X , MEMORY : X
            else{
                await (new Promise(rs => setTimeout(rs, 100)));
                var rsJson = new Object();
                rsJson.NUM = cards.indexOf(card)+1;
                rsJson.PF_URL = document.URL;
                await writeCardData(card,rsJson);                               
                rsData.push(rsJson);
            }            
          
          //푸시  
          
        }
        
    })();

    async function writeCardData(card,rsJson){
        try{
            rsJson.PF_SKU = card.querySelector("[class='pd12-product-card__cta'] > a").getAttribute('data-modelcode');                
        }catch(e){

        }        
        try{
            rsJson.PF_DISPLAYNAME = card.querySelector('.pd12-product-card__name-text').innerText;                
        }catch(e){

        }
        try{
            rsJson.PF_COLOR = card.querySelector("[class='option-selector-v2__swiper-slide is-checked'] [class='option-selector-v2__color-code']").innerText;                        
        }catch(e){

        }

        try{
            rsJson.PF_MEMORY = card.querySelector("[class='option-selector-v2__swiper-slide is-checked'] [class='option-selector-v2__size-text']").innerText;                
        }catch(e){

        }          

        //init      
        rsJson.PF_PRICE_PROMOTION = "";
        rsJson.PF_PRICE_SAVE = ""; 
        rsJson.PF_PRICE_ORIGINAL= "";
        rsJson.PF_TIERED_MIN = "";
        rsJson.PF_TIERED_PRICE = "";

        rsJson.CTA_1_STOCK = "";
        rsJson.CTA_1_URL = "";

        rsJson.CTA_2_STOCK = "";
        rsJson.CTA_2_URL = "";
                        
        
        
        try{
            rsJson.PF_PRICE_PROMOTION = await card.querySelector("[class*='pd12-product-card__price-full js']").getAttribute("data-pricetext");
        }catch(e){}
        try{
            rsJson.PF_PRICE_ORIGINAL = await card.querySelector("[class='pd12-product-card__price-suggested'] > del").innerText;
        }catch(e){}
        try{
            rsJson.PF_PRICE_SAVE = await card.querySelector("[class='pd12-product-card__price-save js-tax-price']").innerText;
        }catch(e){}                             
        
                
        await getTieredPrice(rsJson,card);
               

        await getCTAurl(rsJson,card);

        // window.testlog(rsJson);

        return rsJson;        
    }

    async function getCTAurl(rsJson,card){
        const ctaCount = await card.querySelectorAll("[class='pd12-product-card__cta'] *").length;

        const firstChild = await card.querySelector("[class='pd12-product-card__cta'] :first-child");
        const lastChild = await card.querySelector("[class='pd12-product-card__cta'] :last-child");
        
        if(ctaCount==2){
            if(firstChild.tagName=='BUTTON'){

                rsJson.CTA_1_STOCK = convertStock(firstChild.getAttribute("an-ac"));
                //control(?)
                rsJson.CTA_2_STOCK = convertStock(lastChild.getAttribute("an-ac"));
                rsJson.CTA_2_URL = lastChild.getAttribute("href");
            }
            else{
                rsJson.CTA_1_STOCK = convertStock(firstChild.getAttribute("an-ac"));
                rsJson.CTA_1_URL =  firstChild.getAttribute("href");
        
                rsJson.CTA_2_STOCK = convertStock(lastChild.getAttribute("an-ac"));
                rsJson.CTA_2_URL = lastChild.getAttribute("href");
            }

        }
        //하나만
        else{
            rsJson.CTA_2_STOCK = convertStock(lastChild.getAttribute("an-ac"));
            rsJson.CTA_2_URL = lastChild.getAttribute("href");
        }

        function convertStock(stock){   
            if(stock!=null){
                console.log("CONVERTSTOCKBEFORE: " + stock);
                if(stock.includes("buy now")) return "inStock";    
                else if(stock.includes("pre order")) return "preOrder";    
                else if(stock.includes("stock alert")) return "outOfStock";                    
                else if(stock.includes("pf product card")) return "learnMore";  
                else return stock;  
            }     
            return stock;  
        }
    }

    async function getTieredPrice(rsJson,card){
        try{                        
            await card.querySelector("[class='pd12-product-card__sign-in js-tiered-layer-open']").click();        
            // window.testlog("gettieredPrice");
            await (new Promise(rs => setTimeout(rs, 1500)));            
            const tieredPopup = await card.querySelectorAll("[class='pd12-product-card__save-info-item']");
            let PF_Tiered_Min = "";
            let PF_Tiered_Price = "";                        
            for(let tiered of tieredPopup){                
                PF_Tiered_Min += await tiered.querySelector("[class='pd12-product-card__save-range']").innerText+"/";
                PF_Tiered_Price+= await tiered.querySelector("[class*='pd12-product-card__save-price-full']").innerText+"/";
            }                        
            rsJson.PF_TIERED_MIN = PF_Tiered_Min;
            rsJson.PF_TIERED_PRICE = PF_Tiered_Price;
            // window.testlog("PF_TIERED_MIN: "+ PF_Tiered_Min)
            // window.testlog("PF_TIERED_PRICE: "+ PF_Tiered_Price)

            await card.querySelector("[class='pd12-product-card__tiered-pricing-close']").click();            

        }catch(e){            
        }
                        
    }

    return rsData;
}


module.exports = task;
