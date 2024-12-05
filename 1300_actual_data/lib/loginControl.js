const fs = require('fs');
const logger = require('./logger');
const eleControl = require('../lib/elementControl.js');
const accounts = JSON.parse(fs.readFileSync('../cfg/account.json'));

async function loginAEM(page){
    var currentURL = page.url();
    var check = true;
    var ret = 0;
    console.log("[Connecting AEM]" + currentURL);
    
    do {
        try{
            if(currentURL.indexOf('login')!=-1) {                
                await page.type('#username',accounts.AEM.ID);
                await page.type('#password',accounts.AEM.PW);
                await page.click('#submit-button');
                await page.waitForTimeout(1000);
                currentURL = await page.url();                
                if(currentURL.indexOf('login')!=-1){
                    console.log('[Connect Success] ' + currentURL);
                    check = false;
                }                
                
            }
            else {
                console.log('[already loggined] ' +  currentURL);
                check = false;
            }
        }catch(e){
            ret++;
            console.log('[AEM Connect Retry] ' + currentURL); 
            await page.evaluate(async() => {
                location.reload(true);
                await (new Promise(rs => setTimeout(rs, 500)));  
            })
        }

    } while(check && ret < 3)

    if(ret == 3) {
        console.log('[AEM Connect Error] ' + currentURL);
        logger.error("AEM Connect Error: "  + currentURL);
    }
}

async function loginSMBUser(page, mode){
    var currentURL = page.url();
    if(mode=="Guest" || mode=="Entire") return;        
    else{
        
        console.log("[LoginSMBUser]");        
        
        if(page.url().includes("/auth/")){
            try{
                await page.waitForTimeout(3000);
                await eleControl.closePOPUPs(page);    
                await eleControl.closePOPUPs(page);
                await page.click("[class='sign-in-component__content-footer'] > button");        

                await page.waitForNavigation();                                                  
                await page.waitForTimeout(2000);
    
                await page.type("[id='iptLgnPlnID']", accounts.EPP.ID);                
                await page.click("[id='signInButton']");                
                await page.waitForTimeout(2000);
                await page.type("[id='iptLgnPlnPD']", accounts.EPP.PW);                                
                await page.keyboard.press('Enter');
                await page.waitForTimeout(2000);

                try{
                    await page.waitForSelector('#btnNotNow');
                    await page.click('#btnNotNow');
                    await page.waitForTimeout(1000);
                }catch(e){
                }
                                        
                try{
                    await page.click("[id='terms']");    
                    await page.waitForTimeout(2000);
                    await page.goto(currentURL);
                    await page.waitForTimeout(3000);
                }catch(e){}            
                
                await page.waitForSelector('.gnb__logout-btn');


            }catch(e){
                console.log("login fail");
                logger.error("SMB Login Error: "+page.url());
            }

        }
        else{
            console.log("[EPP already loggined]");
        }


    }



}

module.exports.AEM = loginAEM;
module.exports.SMBUser = loginSMBUser;
