function getCurrentDate(){
    var date = new Date();    
    var yyyy = date.getFullYear();     
    var MM = ((date.getMonth() + 1) < 10 ? '0' : '') + (date.getMonth() + 1);    
    var dd = (date.getDate() < 10 ? '0' : '') + date.getDate();            
    return (yyyy + "-" +  MM + "-" + dd);
 }

module.exports.getCurrentDate = getCurrentDate;