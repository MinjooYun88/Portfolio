/*********************************************
    B2C Scenario Test 
    PF - PD - Cart Normal Jouney
    Process : S28_1302

    Date    : 2022-05-23
**********************************************/

const fs = require('fs');
const puppeteer = require('puppeteer');
const login = require('../lib/loginControl.js');
const eleControl = require('../lib/elementControl.js');
const settings = JSON.parse(fs.readFileSync('../cfg/settings.json'));
const logger = require('../lib/logger.js');
const getDate  = require('../lib/getDate.js');

function task(site, mode) {    
    main(site, mode).then((data) => {
        const result = JSON.stringify(data, null, 2);
        fs.writeFileSync('../outputs/' + site + '_' + mode + '_PD_output.json',result);
        console.log(site + " " + mode + " PD Output Save!");
        process.send({ type : "end", 'mode' : mode, 'pid': process.pid, 'site': site});
        process.exit(0);
    });

}

async function main(site,mode){     
    let setheadless = false;
    if(mode=="Entire") setheadless = true;
    return new Promise (async(rs, rj) => {
        const browser = await puppeteer.launch({ 
            // headless: setheadless, 
            args: ['--start-maximized'],
            defaultViewport: {width: 1920, height:1080}
        });

        let [pages] = await browser.pages();
        await pages.goto(settings.cookieURL);            
        let testTarget = readSearchAPI(site,mode);         

        var now = 1;
        var total = testTarget.length;
        const PF_PAGE = await browser.newPage();
        let currentPFURL;
        //window.testlog
        await PF_PAGE.exposeFunction('testlog', async (msg) => {
            console.log(msg);
        });   

        //API에서 가져온 데이터가 끝날떄까지 돌리기
        let result =new Array();
        while(testTarget.length!=0){ 
            const SKU = testTarget[0].modelCode;
            process.send( { 'site': site, 'mode': mode, 'url': testTarget[0].PFURL, 'now': now, 'total': total})

            let productData = new Object();

            //INIT

            //PF
            productData.PF_URL ="";
            productData.SKU = SKU;
            productData.PF_NUM = "";
            productData.PF_DISPLAYNAME = "";
            productData.PF_COLOR = "";
            productData.PF_MEMORY = "";
            productData.PF_PRICE_PROMOTION = "";
            productData.PF_PRICE_SAVE = "";
            productData.PF_PRICE_ORIGINAL = "";
            productData.PF_TIERED_MIN = "";
            productData.PF_TIERED_PRICE = "";
                                   
            //PD            

            //BUYNOW
            productData.BUY_NOW_PD_URL = "";
            productData.BUY_NOW_CTA_TYPE ="";
            productData.BUY_NOW_PD_TYPE ="";
        
            productData.BUY_NOW_Promotion_Price ="";
            productData.BUY_NOW_Original_Price ="";
            productData.BUY_NOW_Save_Price ="";

            //LEARNMORE
            productData.LEARN_MORE_PD_URL = "";
            productData.LEARN_MORE_CTA_TYPE ="";
            productData.LEARN_MORE_PD_TYPE ="";
            productData.LEARN_MORE_Promotion_Price ="";
            productData.LEARN_MORE_Original_Price ="";
            productData.LEARN_MORE_Save_Price ="";

            //COMMON
            productData.PD_Tiered_Min = "";
            productData.PD_Tiered_Price = "";

            productData.Cart_Price ="";
            productData.Cart_Quantity ="";
            productData.Comment = "";

            console.log(testTarget[0]);
            var checkError = false;
            var status;
            if(testTarget[0].PFURL!=PF_PAGE.url()) {
                PF_PAGE.setDefaultTimeout(60000);
                PF_PAGE.setDefaultNavigationTimeout(60000);
                await PF_PAGE.goto(testTarget[0].PFURL).catch(error=> {
                    checkError = true;
                    console.log(error);
                }) ;              
                
                if(checkError == true) {
                    status = 0;
                }
                else {
                    PF_PAGE.on('response', response => {
                        status = response.status();
                    })
                }

                // await login.AEM(PF_PAGE);                
                currentPFURL = PF_PAGE.url();
                await PF_PAGE.waitForTimeout(4000);
            }               
            
            if(!(await eleControl.check404page(PF_PAGE))){                
                productData.PF_URL = PF_PAGE.url();
                productData.Comment = "PF_404";
                testTarget.shift();
                continue;
            }

            await eleControl.closePOPUPs(PF_PAGE);
            console.log("mode: "+mode);
            await login.SMBUser(PF_PAGE, mode);      
            
            let CTALinks = await findCTAlink(PF_PAGE,testTarget[0].familyRecord,testTarget[0].modelCode,testTarget[0].fmyChipList,testTarget[0].fmyChipList2);              
            productData.PF_URL = PF_PAGE.url();

            if(CTALinks.length == 0 || CTALinks=="ONLY_API"){
                console.log("ERROR");
                logger.error("OnlyAPI SKU: "+SKU+": PF_URL: " +PF_PAGE.url());
                productData.Comment = "OnlyAPI";
                result.push(productData);                               
                testTarget.shift(); 
                continue;
            }
            else if(CTALinks=="EMPTY_PF"){
                logger.error(SKU+": EMPTY_PF: " +PF_PAGE.url());
                productData.Comment = "EMPTY_PF";
                result.push(productData);                               
                testTarget.shift(); 
                continue;
            }
            else {                      
                const VATButton_Style = 
                await PF_PAGE.evaluate(() => {
                     return document.querySelector("[class='pd12-product-finder__filters-bar-vat js-pd12-vat-switch-area']").style.display;                      
                });
                            
                if(VATButton_Style=="none" && mode=="Guest"){                                                                                                                                                                                                               
                    //정상 결과임                    
                    
                }
                else if(VATButton_Style=="none" && mode!="Guest" && mode!="Entire"){                                        
                    //게스트가 아닌데 VAT옵션이 없음
                    logger.error(PF_PAGE.url() + "HAS NO VAT OPTION");
                    productData.Comment = "VATOption is not Applied";
                    result.push(productData);                       
                    testTarget.shift(); 
                    continue;
                }
                else{
                    //정상결과임(Login)
                    if(mode=="Exclude") await eleControl.setVATExclude(PF_PAGE);                                            
                }                
                
                let familyRecord = (testTarget[0].familyRecord-1); 
                productData.PF_NUM = familyRecord+1;
                productData = await PF_PAGE.evaluate(async(productData,familyRecord)=>{                                            
                    try{
                        productData.PF_DISPLAYNAME = await document.querySelector("[data-productidx='"+familyRecord+"'] [class='pd12-product-card__name-text']").innerText;                
                    }catch(e){}
                    try{
                        productData.PF_COLOR = await document.querySelector("[data-productidx='"+familyRecord+"'] [class='option-selector-v2__swiper-slide is-checked'] [class='option-selector-v2__color-code']").innerText;                        
                    }catch(e){}
                    try{
                        productData.PF_MEMORY = await document.querySelector("[data-productidx='"+familyRecord+"'] [class='option-selector-v2__swiper-slide is-checked'] [class='option-selector-v2__size-text']").innerText;                
                    }catch(e){}
                    try{
                        productData.PF_PRICE_PROMOTION = await document.querySelector("[data-productidx='"+familyRecord+"'] [class*='pd12-product-card__price-full js']").getAttribute("data-pricetext");
                    }catch(e){}
                    try{
                        productData.PF_PRICE_ORIGINAL = await document.querySelector("[data-productidx='"+familyRecord+"'] [class='pd12-product-card__price-suggested'] > del").innerText;
                    }catch(e){}
                    try{
                        productData.PF_PRICE_SAVE = await document.querySelector("[data-productidx='"+familyRecord+"'] [class='pd12-product-card__price-save js-tax-price']").innerText;
                    }catch(e){}      

                    try{
                        await document.querySelector("[data-productidx='"+familyRecord+"'] [class='pd12-product-card__sign-in js-tiered-layer-open']").click();                            
                        await (new Promise(rs => setTimeout(rs, 3000)));            
                        const tieredPopup = await document.querySelectorAll("[data-productidx='"+familyRecord+"'] [class='pd12-product-card__save-info-item']");
                        let PF_Tiered_Min = "";
                        let PF_Tiered_Price = "";                        
                        for(let tiered of tieredPopup){                
                            PF_Tiered_Min += await tiered.querySelector("[class='pd12-product-card__save-range']").innerText+"/";
                            PF_Tiered_Price+= await tiered.querySelector("[class*='pd12-product-card__save-price-full']").innerText+"/";
                        }                        
                        productData.PF_TIERED_MIN = PF_Tiered_Min;
                        productData.PF_TIERED_PRICE = PF_Tiered_Price;
                    
                        await document.querySelector("[data-productidx='"+familyRecord+"'] [class='pd12-product-card__tiered-pricing-close']").click();   

                    }catch(e){
                        //티어없음
                    }

                    return productData;
                },productData,familyRecord);

                console.log(productData);
                                
                //CTA 전부 찾음
                for(let CTALink of CTALinks){

                    console.log("SKU: " + SKU);
                    console.log((CTALinks.indexOf(CTALink)+1)+"번째 CTA"); //디버그 용도     
                    console.log("CTATYPE: "+CTALink.TYPE);
                    console.log("CONVERT: "+isLearnmoreCTA(CTALink.TYPE));
                    console.log(isLearnmoreCTA(CTALink.TYPE)); //디버그 용도

                    //순서에 관계없이 체크
                    
                    //링크가 있을경우
                    if(CTALink.LINK!=null && CTALink.LINK.includes("/business/")){
                        var checkError = false;
                        const PDP = await browser.newPage();
                        const PDPURL = settings.TargetServer.live+CTALink.LINK;
                        await PDP.goto(PDPURL).catch(error=> {
                            checkError = true;
                            console.log(error);
                        });              
                        
                        if(checkError == true) {
                            status = 0;
                        }
                        else {
                            PF_PAGE.on('response', response => {
                                status = response.status();
                            })
                        }      

                        if(PDP.url().includes("/samsung/login/")){
                            // await login.AEM(PDP);
                            // await login.SMBUser(PDP,mode);
                        }
                        await eleControl.closePOPUPs(PDP);
                        //실제 페이지 타입에 따른 컨트롤
                        const PDTYPE = await getPDType(PDP,testTarget[0].sitecode);                       

                        productData[isLearnmoreCTA(CTALink.TYPE)+"_CTA_TYPE"] = convertStock(CTALink.TYPE);
                        productData[isLearnmoreCTA(CTALink.TYPE)+"_PD_TYPE"] = PDTYPE;                    
                        productData[isLearnmoreCTA(CTALink.TYPE)+"_PD_URL"] = PDP.url(); 
                        
                        productData = await getPDData(PDP,PDTYPE,productData,isLearnmoreCTA(CTALink.TYPE),SKU,isIMProduct(testTarget[0].pviTypeName),mode);                      

                        await PDP.close();                                                  
                    
                    }else{
                        //링크가 없을경우에 기록
                        productData[isLearnmoreCTA(CTALink.TYPE)+"_CTA_TYPE"] = convertStock(CTALink.TYPE);                    
                        productData[isLearnmoreCTA(CTALink.TYPE)+"_PD_URL"] = null;
                    }
                            
                }
                result.push(productData);   
                console.log(productData);
            }

            now++;                            
            testTarget.shift();   
            console.log("Remaining Product: " +testTarget.length);
            
        }
        rs(result);
        await browser.close();  

    });
         
}

async function getPDData(page,PDTYPE,productData,CTAHandler,SKU,isIMProduct,mode){

    if(PDTYPE=="STANDARD"){
        console.log("STANDARD PD CHECK");
        
        if(isIMProduct==false && productData.BUY_NOW_Promotion_Price!=""){
            console.log("Not IM.. Data Already writed")
        }
        else{
            await getLNBPrice(page,CTAHandler,false); //IM 제품군에 상관없이 Buynow
        }
    }

    else if(PDTYPE=="FEATURE"){
        console.log("FEATURE PD CHECK");     

        await getLNBPrice(page,CTAHandler,true);

        if(isIMProduct==true && productData.BUY_NOW_Promotion_Price!=""){
            console.log("IM Product...")
            console.log("STANDARD 중복 검증 SKIP")
        }
        else{
            console.log("NON-IM Product...or IM STANDARD Fail");            
            if(productData.BUY_NOW_Promotion_Price=="") await getLNBPrice(page,CTAHandler,false); //IM제품이고, Buynow(BC)에서 가격을 가져오지 못했을때만 BC로 재진입        
        }                        
                
    }
    else{
        //나올수 없는 경우
        // logger.error("코드 재확인 "+SKU+"/"+page.url());
        console.log("OTHERS...SKIP");
    }

    async function getLNBPrice(page,CTAHandler,isFeaturePD){
        // await login.AEM(page);
        await page.waitForTimeout(4500);
        console.log(CTAHandler+"//"+isFeaturePD);
        try{        
            
            const Promotion_Price = await page.waitForSelector("[class='pd-buying-price__new-price']",{timeout:1000});
            const Promotion_Price_Value = await Promotion_Price.evaluate(el => el.textContent);            
            if(CTAHandler=="BUY_NOW" && isFeaturePD==true) console.log("BUYNOW - > FEATURE"); 
            else productData[CTAHandler+"_Promotion_Price"] = Promotion_Price_Value;                                    
        }catch(e){
            productData[CTAHandler+"_Promotion_Price"] = "";
        }

        try{
            const Original_Price = await page.waitForSelector("[class='pd-buying-price__was'] > del",{timeout:1000});
            const Original_Price_Value = await Original_Price.evaluate(el => el.textContent);             
            if(CTAHandler=="BUY_NOW" && isFeaturePD==true) console.log("BUYNOW - > FEATURE");
            else productData[CTAHandler+"_Original_Price"] = Original_Price_Value;                                                     
        }catch(e){
            productData[CTAHandler+"_Original_Price"] = "";
        }
        
        try{
            const Save_Price = await page.waitForSelector("[class='pd-buying-price__save']",{timeout:1000});
            const Save_Price_Value = await Save_Price.evaluate(el => el.textContent);     
            if(CTAHandler=="BUY_NOW" && isFeaturePD==true) console.log("BUYNOW - > FEATURE");                    
            else productData[CTAHandler+"_Save_Price"] = Save_Price_Value;                                                     
        }catch(e){
            productData[CTAHandler+"_Save_Price"] = "";
        }

        await eleControl.closePOPUPs(page);
        await getTieredPrice();
        await clickLNBCTA(isFeaturePD);

        async function getTieredPrice(){

            //티어프라이스 관련내용 
            let tieredPrice;
            try{
                tieredPrice = await page.waitForSelector("[class='save-info__item result-price']",{timeout:3000});
            }catch(e){
                tieredPrice = null;
            }
            if(tieredPrice!=null){
                console.log("티어프라이스 있음");
                var tieredprices = await page.evaluate(()=>{                    
                    var arr = new Array();
                    var rows = document.querySelectorAll("[class='save-info__item result-price']");
                    let quantityResult='';
                    let priceResult='';
                    for(let row of rows){    
                        var quantity = row.querySelector("[class='save-info__quantity-range']").innerText;    
                        var quantity_hidden = document.querySelector("[class='save-info__quantity-range'] [class='hidden']").innerText;
                        quantity = quantity.replace(/\n/g, "");
                        var quantemp = quantity.replace(quantity_hidden,'');
                        quantityResult+=quantemp+"/";
                        var price = row.querySelector("[class='save-info__total-price']").innerText;    
                        var pricehidden = document.querySelector("[class='save-info__total-price'] [class='hidden']").innerText;
                        price = price.replace(/\n/g, "");
                        var pricetemp = price.replace(pricehidden,'');
                        priceResult+=pricetemp+"/";                        
                    }                    
                    arr.push(quantityResult);
                    arr.push(priceResult);  
                    return arr;
                })
                if(tieredprices[0]!='' && tieredprices[1]!=''){
                    productData.PD_Tiered_Min = tieredprices[0];
                    productData.PD_Tiered_Price = tieredprices[1];
                }
            }
            else{
                console.log("티어프라이스 없음");
            }
        }
    }

    

    async function clickLNBCTA(isFeaturePD){

        let LNB_CTA = await page.$("[class='pd-buying-price__cta'] > a");
        let LNB_CTA_attr = await LNB_CTA.evaluate(el=>el.getAttribute("an-la"));
        console.log(LNB_CTA_attr);
        
        if(LNB_CTA_attr!=null){   
            if(LNB_CTA_attr.includes("stock")) {
                if(isFeaturePD==false) productData["Cart_Price"] = "Get Stock Alert";
            }
            else if(LNB_CTA_attr.includes("contact")) {
                if(isFeaturePD==false) productData["Cart_Price"] = "Contact Us";
            }
            else{                
                try{                    
                    await LNB_CTA.click();    
                    // await login.AEM(page);                
                    await page.waitForTimeout(3000); //여기 딜레이 조정
                    
                    if(await eleControl.checkPDErrorPopup(page)){                        
                        productData["Cart_Price"] = "Error Popup";
                        logger.error(page.url()+":"+SKU+" cart Error popup");                        
                    }
                    else{
                        if(isFeaturePD==false) {
                            console.log("GOTOCART")          
                            await eleControl.closePOPUPs(page);  
                            if(mode!="Entire") productData = await gotoCart(page,productData);
                        }
                    }
                    
                    
                    
                }catch(e){                            
                    productData["Cart_Price"] = "Cannot Click";
                    logger.info(page.url()+" CANNOT CLICK LNB CTA");                    
                }
                
            }                

        }
        
    }

    return productData;
}



async function gotoCart(page,productData){
    
    try{
        await page.evaluate(()=>{
            document.querySelector("[class='product-bought-together__summary-cta'] > a").click();
        })
    }catch(e){
        console.log("CONTINUE X");
    }
    //

    const SKU = productData.SKU;

    await page.waitForTimeout(6000);
    await eleControl.closePOPUPs(page);  
    if(await page.url().includes("cart")){
        console.log("CART 진입");                                
        await eleControl.closePOPUPs(page);

        //카트 url 기록 logger;
        console.log("SKU:" +SKU);                
        const cartPriceselectors = [
            "[data-modelcode='"+SKU+"'] [class='item-price']"
        ];         
        //get CARTPRICE       
        for(const cartPriceselector of cartPriceselectors){
            try{
                const cartPriceValue = await page.$eval(cartPriceselector, el => el.innerText);
                if(cartPriceValue!=null) productData["Cart_Price"] = cartPriceValue;   

                console.log('CARTPRICE: '+cartPriceValue);
            }catch(e){
                
            }        
        }

        //xpath로 한번더 시도
        if(productData["Cart_Price"]==''){
            try{
                productData["Cart_Price"] = await page.evaluate(async(SKU)=>{
                    return document.evaluate(".//span[@data-variant-sku='"+SKU+"']/../../..//div[@class='item-price']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.innerText;
                },SKU)
            }catch(e){
                productData["Cart_Price"] = "PRICE ERROR";
            }            
        }

        //카트 수량 얼마나
        try{
            productData["Cart_Quantity"] = await page.evaluate(async(SKU)=>{
                return document.evaluate(".//span[@data-variant-sku='"+SKU+"']/../../../../div[@class='cart-top-actions']//input[@name='quantity']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue.value;
            },SKU)
        }catch(e){
            productData["Cart_Quantity"] = "";
        }            
        

        const cartRemoveselectors = [
            "[data-modelcode='"+SKU+"'] [class*='cart-top-actions'] [class*='desk'] > button",
            "[class='cart-top-actions'] [class~='visible-inline-desktop'] button[data-variant-sku='"+SKU+"']"
        ];

        for(const cartRemoveselector of cartRemoveselectors){
            try{                        
                await page.click(cartRemoveselector);
                await page.waitForTimeout(2000);
                console.log("Cart deleted");
            }catch(e){
                console.log(cartRemoveselector+" X");
            }        
        }
                                        
    }
    else{
        productData["Cart_Price"] = "PAGE ERROR";

    }     
    return productData;                               
}


async function findCTAlink(page,cardnum,sku,chip1,chip2){   

    try{
        let CTAINFO = new Array();
        if(await eleControl.waitingforCard(page)){
            await eleControl.closePOPUPs(page);        
            await eleControl.clickViewmore(page);
                
            console.log("------------")
            console.log("CARDNUM:"+cardnum);
            console.log("SKU:"+sku);            
            console.log(chip1+"/"+chip2);
                                        
            await page.evaluate(async(cardnum,chip1,chip2)=>{                                    
                const card = document.querySelector("[data-productidx='"+(cardnum-1)+"']");
                if(chip1!=null ||chip1!="") {                       
                    const chip_one = card.querySelector("[class='pd12-product-card__option-selector'] [an-la*='"+chip1+"']");
                    if(chip_one!=null) await chip_one.click();                
                }
                await (new Promise(rs => setTimeout(rs, 1000)));
                if(chip2!=null || chip2!="") {
                    const chip_two = card.querySelector("[class='pd12-product-card__option-selector'] [an-la*='"+chip2+"']");
                    if(chip_two!=null) await chip_two.click();                            
                }              
                await (new Promise(rs => setTimeout(rs, 1000)));
            },cardnum,chip1,chip2);
                        
            await (new Promise(rs => setTimeout(rs, 1000)));

            CTAINFO = await page.evaluate((cardnum,sku) =>{            
                const CTAs = document.querySelectorAll("[data-productidx ='"+(cardnum-1)+"'] [class='pd12-product-card__cta'] *");            
                let arr = new Array();
                
                for(CTA of CTAs){                   
                    if(CTA.getAttribute('data-modelcode')==sku){
                        let obj = new Object();
                        obj.TYPE = CTA.getAttribute("an-la");
                        obj.LINK = CTA.getAttribute("href");
                        arr.push(obj);                                     
                    }                       
                }
                return arr;
            },cardnum,sku);
            
            console.log(CTAINFO);        
            return CTAINFO;
        }
        else{        
            console.log("PF CARD 비어있음");
            return "EMPTY_PF";
        }

    }catch(e){        
        return "ONLY_API";
    }
    
}




async function getPDType(page,sitecode){

    let pdNAVbar = null;     
    try{
        pdNAVbar = await page.waitForSelector("[class='pd11-anchor-nav bg-black']",{timeout:1000});
    }catch(e){
        console.log('pdnavbar X');
    }

    let buyConfigurator = null;
    try{        
        buyConfigurator = await page.waitForSelector("[class~='bu-pd-g-product-detail-kv']",{timeout:1000});
    }catch(e){
        console.log('buyConfigurator X');
    }
    
    if(pdNAVbar!=null & buyConfigurator!=null){
        return "STANDARD";
    }
    else if(pdNAVbar!= null & buyConfigurator==null){
        return "FEATURE";
    }
    else{

        //PCD
        var PCDList = [
            settings.TargetServer.live+"/"+sitecode+"/business/smartphones/",
            settings.TargetServer.hshopfront+"/"+sitecode+"/business/smartphones/",
            settings.TargetServer.live+"/"+sitecode+"/smartphones/",
            settings.TargetServer.hshopfront+"/"+sitecode+"/smartphones/"
        ]
        for(PCD of PCDList){
            if(page.url()==PCD) return "PCD";
        }        
        //PF?


        //MKT 
        try{
            let mktBar = await page.waitForSelector("[class='floating-navigation__button-wrap']",{timeout:1000});
            console.log('MKT');
            return "MKT";
        }catch(e){
            console.log('MKT X');
        }      

        
        if((await eleControl.check404page(page))==false){
            console.log('404');
            return "404";
        }    
        
        
        
        //OTHER
        return "OTHER";
    }

}

function isIMProduct(pviTypeName){
    if(pviTypeName.includes("Mobile")) return true;
    else return false;
}

function isLearnmoreCTA(CTAType){
    if(CTAType.includes("learn")) return "LEARN_MORE";
    else return "BUY_NOW";
}

function convertStock(stock){   
    if(stock!=null){
        console.log("CONVERTSTOCK: " + stock);
        if(stock.includes("buy now")) return "inStock";    
        else if(stock.includes("pre order")) return "preOrder";    
        else if(stock.includes("stock alert")) return "outOfStock";    
        else if(stock.includes("learn more")) return "learnMore";  
        else return stock;  
    }     
    return stock;  
}

function readSearchAPI(site,mode){    
    var testTarget = new Array();
                            
    // const searchAPI = JSON.parse(fs.readFileSync("Y:/smb/type_2/sit/data/2022-06-14_data/SearchAPI_Result/Search_API_"+site+'.json'));      
    const searchAPI = JSON.parse(fs.readFileSync("Y:/smb/type_2/hardlaunch/data/"+getDate.getCurrentDate()+"_data/SearchAPI_Result/Search_API_"+site+'.json'));      
    console.log(getDate.getCurrentDate());  
    for(i = 0 ; i < searchAPI.length ; i++){            
        let obj = new Object();

        if(searchAPI[i].promotionPriceDisplay!="" || (mode==="Entire" && searchAPI[i].pviTypeName == "Mobile")) {   
        
            const familyRecord = searchAPI[i].familyRecord;                
            const sitecode = searchAPI[i].sitecode;                
            const APICode = searchAPI[i].APIType;                
            const modelCode = searchAPI[i].modelCode;
            const pviTypeName = searchAPI[i].pviTypeName;
            const fmyChipList = searchAPI[i].fmyChipOptionName1;                
            const fmyChipList2 = searchAPI[i].fmyChipOptionName2;
                            
            let PFURL = getPFURL(settings.TargetServer.live+"/",sitecode,APICode);
            
            obj.sitecode = sitecode;
            obj.familyRecord = familyRecord;                
            obj.modelCode = modelCode;
            obj.pviTypeName = pviTypeName;
            obj.fmyChipList = fmyChipList;
            obj.fmyChipList2 = fmyChipList2;
            obj.PFURL = PFURL;                
            testTarget.push(obj);                
            }

        
        
    }        
   
    // console.log(testTarget);    

    function getPFURL(stage,sitecode,apiCode){
        const apicodeList = JSON.parse(fs.readFileSync('../cfg/apicode.json'));             
        return stage+sitecode+"/business"+apicodeList[apiCode].url;    
    }

    return testTarget;

    
}

module.exports = task;

