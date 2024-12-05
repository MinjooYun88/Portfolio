/***********************************************************************
 
    Make PD API URL
    Process : makePDAPI.js

    Data    : 2022-07-06
 
 ***********************************************************************/

export function makeURL(sitecode, sSKU) {
    var url = "";
    switch (sitecode) {
        case 'sa_en':
            url = 'https://dummy/sasme/products/'+ sSKU +'/**?fields=SIMPLE_INFO&lang=en_SA';
            break;
        case 'sa':
            url = 'https://dummy/sasme/products/'+ sSKU +'/**?fields=SIMPLE_INFO&lang=ar_SA';
            break;
        case 'pt':
            url = 'https://dummy/ptsme/products/'+ sSKU +'/**?fields=SIMPLE_INFO';
            break;
        case 'pl':
            url = 'https://dummy/v2/plsme/products/'+ sSKU +'/**?fields=SIMPLE_INFO';
            break;
        case 'sg':
            url = 'https://dummy/v2/sgsme/products/'+ sSKU +'/**?fields=SIMPLE_INFO';
            break;
        case 'eg':
            url = 'https://dummy/v2/egsme/products/'+ sSKU +'/**?fields=SIMPLE_INFO';
            break;
        default:
            break;
    }

    return url;
}