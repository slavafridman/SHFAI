// exceljs.js
//Author: Yuval Ovadia
//Date: 27.05.2009


<!--input type="button" value="excel (IE only)" onclick="startExcel();"-->
function startExcel(repName) {

 var agree;

 agree=confirm(" ? האם אתה בטוח שברצונך לשמור לקובץ");

 if(!agree){ 
    return; 
	}


 var xls = new ActiveXObject ( "Excel.Application" );
 xls.visible = false;
 var newBook = xls.Workbooks.Add;
 newBook.Worksheets.Add;
 newBook.Worksheets(1).Activate;
 for(i=myHeader.length;i!=0;i--){
 		newBook.Worksheets(1).Cells(1,myHeader.length-i+1).Interior.ColorIndex="15";
		newBook.Worksheets(1).Cells(1,myHeader.length-i+1).value=myHeader[i-1].replace("&nbsp;","");
 	}

 for(l=0;l<myData.length;l++){
	for(i=myHeader.length;i!=0;i--){
		dataValue = myData[l][i-1];
		dataValue = dataValue.replace("&nbsp;","");
		for(w=0;w<3;w++){
		if ( (dataValue.indexOf(">")) != (-1) ){
				dataValue = dataValue.substring((dataValue.indexOf(">"))+1, (dataValue.lastIndexOf("</")));
				dataValue = dataValue.replace('BUB', '');
				
			} 
		}
		newBook.Worksheets(1).Cells(l+2,myHeader.length-i+1).value=dataValue;
	}
 } 	

 
 newBook.Worksheets(1).Name=repName;
 var d=new Date();
 fileName="SHF-"+repName+"-"+d.getDate()+"-"+(d.getMonth()+1)+"_"+d.getHours()+"-"+d.getMinutes()+".xls";
 newBook.Worksheets(1).SaveAs("H:\\" + fileName);
 alert( "H:"+ " נשמר בהצלחה בתיקיה הפרטית שלך תחת כונן " + fileName+" הקובץ"   );

}

function startForeCastExcel(repName) {
//yuval - clean header & data from special caracter
	 var agree;

	 agree=confirm(" ? האם אתה בטוח שברצונך לשמור לקובץ");

	 if(!agree){ 
	    return; 
		}


	 var xls = new ActiveXObject ( "Excel.Application" );
	 xls.visible = false;
	 var newBook = xls.Workbooks.Add;
	 newBook.Worksheets.Add;
	 newBook.Worksheets(1).Activate;
	 for(i=myHeader.length;i!=0;i--){
	 		newBook.Worksheets(1).Cells(1,myHeader.length-i+1).Interior.ColorIndex="15";
	 		headerValue = myHeader[i-1].replace("&nbsp;","");
	 		headerValue = headerValue.replace("<br>", " ");
			newBook.Worksheets(1).Cells(1,myHeader.length-i+1).value=headerValue;
	 	}

	 for(l=0;l<myData.length;l++){
		for(i=myHeader.length;i!=0;i--){
			dataValue = myData[l][i-1];
			dataValue = dataValue.replace("&nbsp;","");
			for(w=0;w<3;w++){
			if ( (dataValue.indexOf(">")) != (-1) ){
					dataValue = dataValue.substring((dataValue.indexOf(">"))+1, (dataValue.lastIndexOf("</")));
					dataValue = dataValue.replace('BUB', '');
				} 
			}
			newBook.Worksheets(1).Cells(l+2,myHeader.length-i+1).value=dataValue;
		}
	 } 	

	 
	 newBook.Worksheets(1).Name=repName;
	 var d=new Date();
	 fileName="SHF-"+repName+"-"+d.getDate()+"-"+(d.getMonth()+1)+"_"+d.getHours()+"-"+d.getMinutes()+".xls";
	 newBook.Worksheets(1).SaveAs("H:\\" + fileName);
	 alert( "H:"+ " נשמר בהצלחה בתיקיה הפרטית שלך תחת כונן " + fileName+" הקובץ"   );

	}




