import xlsx from "xlsx-js-style";
import { excIndex } from "./excIndex.js";

export function makeSheet(name, jsoninfo, workBook, header1, cnt1, header2, cnt2, header3, cnt3, header4, cnt4, header5, cnt5, header6, cnt6) {
    xlsx.utils.book_append_sheet(workBook, {}, name);  
    var ws = xlsx.utils.sheet_add_json(workBook.Sheets[name], jsoninfo, { origin : "A2"});

    try {
        var prodStCol = Object.keys(jsoninfo[0]).length;
        var prodStRow = Object.keys(jsoninfo).length;
        var trg = 0;

        for(var n = 65; n < 65 + prodStCol; n++) {
            for(var m = 1; m < prodStRow + 3; m++) {
                var t = excIndex(n);
                var p = String(m);
                
                // Header
                if(m == 1 && n == 65) { ws[t+p] = {t: 's', v: header1, s: {font: {bold: true}, fill: {fgColor: {rgb: "FFFF33"}}, border: {bottom: {style: "thin"}}}};  trg = 1;}
                else if(m == 1 && n == 65+cnt1) { ws[t+p] = {t: 's', v: header2, s: {font: {bold: true}, fill: {fgColor: {rgb: "E0E0E0"}}, border: {bottom: {style: "thin"}}}};  trg = 2;}
                else if(m == 1 && n == 65+cnt1+cnt2) { ws[t+p] = {t: 's', v: header3, s: {font: {bold: true}, fill: {fgColor: {rgb: "99FFCC"}}, border: {bottom: {style: "thin"}}}};  trg = 3;}
                else if(m == 1 && n == 65+cnt1+cnt2+cnt3) { ws[t+p] = {t: 's', v: header4, s: {font: {bold: true}, fill: {fgColor: {rgb: "FFCCE5"}}, border: {bottom: {style: "thin"}}}};  trg = 4;}
                else if(m == 1 && n == 65+cnt1+cnt2+cnt3+cnt4) { ws[t+p] = {t: 's', v: header5, s: {font: {bold: true}, fill: {fgColor: {rgb: "FFCD28"}}, border: {bottom: {style: "thin"}}}};  trg = 5;}
                else if(m == 1 && n == 65+cnt1+cnt2+cnt3+cnt4+cnt5) { ws[t+p] = {t: 's', v: header6, s: {font: {bold: true}, fill: {fgColor: {rgb: "d2d2d2"}}, border: {bottom: {style: "thin"}}}};  trg = 6;}
                else if(m == 2 && n >= 65 && n < 65+cnt1) ws[t+p] = {t: 's', v: ws[t+p].v, s: {font: {bold: true}, fill: {fgColor: {rgb: "FFFF33"}}, border: {bottom: {style: "thin"}, right: {style: "thin"}}}};
                else if(m == 2 && n >= 65+cnt1 && n < 65+cnt1+cnt2) ws[t+p] = {t: 's', v: ws[t+p].v, s: {font: {bold: true}, fill: {fgColor: {rgb: "E0E0E0"}}, border: {bottom: {style: "thin"}, right: {style: "thin"}}}};
                else if(m == 2 && n >= 65+cnt1+cnt2 && n < 65+cnt1+cnt2+cnt3) ws[t+p] = {t: 's', v: ws[t+p].v, s: {font: {bold: true}, fill: {fgColor: {rgb: "99FFCC"}}, border: {bottom: {style: "thin"}, right: {style: "thin"}}}};
                else if(m == 2 && n >= 65+cnt1+cnt2+cnt3 && n < 65+cnt1+cnt2+cnt3+cnt4) ws[t+p] = {t: 's', v: ws[t+p].v, s: {font: {bold: true}, fill: {fgColor: {rgb: "FFCCE5"}}, border: {bottom: {style: "thin"}, right: {style: "thin"}}}};
                else if(m == 2 && n >= 65+cnt1+cnt2+cnt3+cnt4 && n < 65+cnt1+cnt2+cnt3+cnt4+cnt5) ws[t+p] = {t: 's', v: ws[t+p].v, s: {font: {bold: true}, fill: {fgColor: {rgb: "FFCD28"}}, border: {bottom: {style: "thin"}, right: {style: "thin"}}}};
                else if(m == 2 && n >= 65+cnt1+cnt2+cnt3+cnt4+cnt5 && n < 65+cnt1+cnt2+cnt3+cnt4+cnt5+cnt6) ws[t+p] = {t: 's', v: ws[t+p].v, s: {font: {bold: true}, fill: {fgColor: {rgb: "d2d2d2"}}, border: {bottom: {style: "thin"}, right: {style: "thin"}}}};

                // Data
                else {
                    try {
                        ws[t+p] = {t: 's', v: ws[t+p].v, s: {border: {bottom: {style: "thin"}, right: {style: "thin"}}}};
                    } catch(e) {
                        ws[t+p] = {t: 's', v: '', s: {border: {bottom: {style: "thin"}, right: {style: "thin"}}}};
                    }
                }
            }       
        }

        var merge = new Array();
        switch(trg) {
            case 6 :
                merge.push({s: {r:0, c:cnt1+cnt2+cnt3+cnt4+cnt5}, e: {r:0, c:cnt1+cnt2+cnt3+cnt4+cnt5+cnt6-1}});
            case 5 :
                merge.push({s: {r:0, c:cnt1+cnt2+cnt3+cnt4}, e: {r:0, c:cnt1+cnt2+cnt3+cnt4+cnt5-1}});
            case 4 :
                merge.push({s: {r:0, c:cnt1+cnt2+cnt3}, e: {r:0, c:cnt1+cnt2+cnt3+cnt4-1}});
            case 3 :
                merge.push({s: {r:0, c:cnt1+cnt2}, e: {r:0, c:cnt1+cnt2+cnt3-1}});
            case 2 :
                merge.push({s: {r:0, c:cnt1}, e: {r:0, c:cnt1+cnt2-1}});
            case 1 :
                merge.push({s: {r:0, c:0}, e: {r:0, c:cnt1-1}});
                break;
            default:
                break;
        };

        ws["!merges"] = merge;

    } catch(e) {
        // if not exist Fail Data
    }
}