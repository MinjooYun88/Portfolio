const logger = require('./logger');

async function waitAndClick(page,selector){
    try{
        await page.waitForSelector(selector);
        await page.click(selector);
        await page.waitForTimeout(500);
    }catch(e){
        logger.error("Click : "+e);
    }
    
}

async function clickViewmore(page){
    index = 0;
    try{
        await page.waitForSelector("[data-productidx='0']");                    
    }catch(e){
    }
    
    while(true){
        let beforeCount = await page.evaluate(()=>{
            return document.querySelectorAll("[data-productidx]").length;
        });        
        //console.log(page.url()+"current Count: "+beforeCount);

        const viewMoreStyle = await page.$eval("[class='pf-finder-v2__content-cta js-pf-cta-area']", element=> element.getAttribute("style"))
        // console.log(viewMoreStyle);
        if(viewMoreStyle.includes('none')) break;
        const viewMore = page.$("[class='pf-finder-v2__content-cta js-pf-cta-area']");        
        (await viewMore).click();
        await (new Promise(rs => setTimeout(rs, 3000)));
        try{            
            await page.waitForSelector("[data-productidx='"+(index)+"']",{timeout:5000}).then(() => index += 12);
        }catch(e){            
            await (new Promise(rs => setTimeout(rs, 10000)));        
            logger.info("cannot click Viewmore: "+page.url());
            
            let Aftercount = await page.evaluate(()=>{
                return document.querySelectorAll("[data-productidx]").length;
            });
            if(beforeCount==Aftercount) break;
        }    
    }
}

async function checkPDErrorPopup(page){
    const popup = await page.evaluate(()=>{
        try{
            var status = document.querySelector("[class='confirm-popup']").style.display;
            if(status=="block") return true; // block = 에러팝업 뜬상태
            else return false;
        }catch(e){
            return false;
        }    
    });
    return popup;
}
async function closePOPUPs(page){
    // console.log("closePOPUPs");
    
    const selectors = [
        "[id='truste-consent-button']",
        "[id='ins-web-opt-in-reminder-container'] [class='ins-element-content ins-editable-text ins-web-opt-in-reminder-button']",
        "[class='layer-popup__close login-leave-btn']",
        "[an-la='cookie bar:accept']",
        "[class='fa fa-times element-close-button']",
        "[class='smb-registration-popup__button'] > [class='cta cta--contained cta--black']",
        "[class='fa fa-times element-close-button']"
    ];
    
    for(const selector of selectors){
        try{            
            await page.click(selector,{timeout:1000});            
            //console.log(selector+": clicked");
            await page.waitForTimeout(500);
        }catch(e){
            // console.log(selector+": not clicked");
        }        
    }
}

async function waitingforCard(page){
    var currentURL = page.url();
    try{
        await page.waitForSelector("[data-productidx='0']");
        console.log('[Card found] ' + currentURL);
        return true;
    }catch(e){
        console.log('[Card not found] ' + currentURL);
        logger.info('Card not found: '+ page.url());
        return false;
    }
    
}
async function check404page(page){
    var errorPage = null;                        
    try{
        errorPage = await page.waitForSelector("[class='s-page-error']",{timeout:3000});
        console.log("ERRPAGE");
    }catch(e){             
    }                         
    if(errorPage==null) return true;
    else return false;
}

async function setVATExclude(page){
    // console.log("try to setVATtoExclude");
    try{
        const VATButton = await page.$("[class~='switch-v2__button']");
        let VATAttr = await VATButton.evaluate(el=>el.getAttribute("an-la"));
        if(VATAttr.includes(":off")) {
            await VATButton.click(); 
            await (new Promise(rs => setTimeout(rs, 1000)));        
        }
        
        // console.log("Success");
    }catch(e){
        // console.log("Not have VAT Option");
        logger.error(page.url()+" has not VAT Options");
        
    }
}


async function clickFilterOptions(page,mode){        
    const result = await page.evaluate((mode)=>{
        var Lists = document.querySelectorAll("[class='pd12-product-finder__filters-bar-wrap'] [class~='menu__list-option-wrap']");
        for(let list of Lists){
            var listOption = list.getAttribute("an-la")            
            listOption = listOption.replace(/sort:| /gm, "");                   
            if(listOption==mode) {
                list.click();            
                return listOption;
            }            
        }
        return null;
    },mode);

    return result;
}

module.exports.waitAndClick = waitAndClick;
module.exports.clickViewmore = clickViewmore;
module.exports.closePOPUPs = closePOPUPs;
module.exports.waitingforCard = waitingforCard;
module.exports.check404page = check404page;
module.exports.setVATExclude = setVATExclude;
module.exports.checkPDErrorPopup = checkPDErrorPopup;
module.exports.clickFilterOptions = clickFilterOptions;

