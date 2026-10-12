// myGrid.js
// author: morad zeidan

var myData=new Array();
var selectedCounter = 0;

function orderBy(divid,objct, index){
//author: Yuval Ovadia
	selectedRow = null;
	var i,j;
	if ((objct.className  == 'thDescending') || (objct.className  == "")) {
		objct.className = 'thAscending';	
		for (i=0;i<myData.length;i++) {
			for (j=i; j>0;j--) {

				var data1 = myData[j][index];
				var data2 = myData[j-1][index];
				if(data1.indexOf("colTotal") !== -1 || data2.indexOf("colTotal") !== -1){
					continue;
				}
				var val1 = data1.replace(/<(.|\n)*?>/g, '');
				
				if(isNumeric(val1)){
					var val2 = data2.replace(/<(.|\n)*?>/g, '');
					
					data1 = val1 - 0;
					data2 = val2 - 0;
				}
				if ( data1 < data2 ) {
					temp = myData[j-1];
					myData[j-1] = myData[j];
					myData[j] =  temp;
				}				
			}
		}
	} else {
		objct.className = 'thDescending';	
		for (i=0;i<myData.length;i++) {
			for (j=i; j>0;j--) {

				var data1 = myData[j][index];
				var data2 = myData[j-1][index];
				if(data1.indexOf("colTotal") !== -1 || data2.indexOf("colTotal") !== -1){
					continue;
				}
				var val1 = data1.replace(/<(.|\n)*?>/g, '');
				
				if(isNumeric(val1)){
					var val2 = data2.replace(/<(.|\n)*?>/g, '');
					
					data1 = val1 - 0;
					data2 = val2 - 0;
				}
				if ( data1 >= data2 ) {
					temp = myData[j-1];
					myData[j-1] = myData[j];
					myData[j] =  temp;
				}				
			}
		}		
	}
	document.getElementById(divid).innerHTML=drawGrid(divid);
	document.getElementById('h'+index).className=objct.className;	
}

function isNumeric(value){
	return !isNaN(value - parseFloat(value));
}

function trDblClick(val,ind){
	var hiddenRows=document.getElementsByName("master"+val);
	if(document.getElementById("divid"+ind).innerHTML=="<B>-</B>"){
		document.getElementById("divid"+ind).innerHTML="<B>+</B>";
	} else {
		document.getElementById("divid"+ind).innerHTML="<B>-</B>";
	}
	for(var i=0;i<hiddenRows.length;i++){
		if(hiddenRows[i].style.display=='')
			hiddenRows[i].style.display='none';
		else hiddenRows[i].style.display='';
	}
}

function trmouseclick(objid,val,oEvent,isCtrl){
	if(typeof(onBeforeclickActive) != "undefined"){
		if(typeof(onBeforeclickFunction) == "function" && onBeforeclickActive){
			onBeforeclickFunction();
		}
	}
	var countSelected = (typeof(multiSelectLimit) !== "undefined");
	var i;
	var j;
	//TODO: enable this when ready (multi select enabled Igal 2015)
	if( (isCtrl === 'true') && (typeof selectedRow !== 'undefined') && (oEvent.ctrlKey == 1)) {
		if ( selectedRow.indexOf(val) != -1 ) {
			if (selectedRow.indexOf(val) != 0 ) {
				val = ( selectedRow.split(";").length > 1 ? ";" : "" )+val;
			} else {
				val = val+( selectedRow.split(";").length > 1 ? ";" : "" );
			}
			selectedRow = selectedRow.replace(val,"");
			if (countSelected) selectedCounter--;
		} else {
			if (countSelected == true) {
				var selectedCounterTmp = selectedCounter;
				if (++selectedCounterTmp <= multiSelectLimit) {
					selectedCounter++;
					selectedRow=selectedRow+";"+val;
				} else {
					alert("ניתן לסמן עד "+multiSelectLimit+" נציגים");
					objid.getElementsByTagName('input')[0].checked = false;
					return;
				}
			} else {
				selectedRow=selectedRow+";"+val;
			}
		}
	} else { 
		selectedRow=val;
		selectedCounter = 1;
	}
	var alltable=document.getElementById('dataTable');
	var rows=alltable.getElementsByTagName('tr');
	
	if ( ! oEvent.ctrlKey == 1 ) {
		if (isCtrl) {
			for(i=0;i<rows.length;i++){
				var  checkBoxs = rows[i].getElementsByTagName('input');
				for (var k=0;k<checkBoxs.length;k++) {
						checkBoxs[k].checked = false;
				}
				var cells=rows[i].getElementsByTagName('td');
				for(j=0;j<cells.length;j++){
					if(cells[j].className=='tr_selected'){
						if(i%2==0) cells[j].className='grid_td';
						else cells[j].className='grid_td2';
					}	
				}
			}
			var  checkBox = objid.getElementsByTagName('input');
			for (i=0;i<checkBox.length;i++) {
				checkBox[i].checked = true;
			}
		} else {
			for(i=0;i<rows.length;i++){
				var cells=rows[i].getElementsByTagName('td');
				for(j=0;j<cells.length;j++){
					if(cells[j].className=='tr_selected'){
						if(i%2==0) cells[j].className='grid_td';
						else cells[j].className='grid_td2';
					}	
				}
			}
		}
		var array=objid.getElementsByTagName('td');
		for(i=1;i<array.length;i++){
			array[i].className="tr_selected";
		}
	} else if ( isCtrl ) {
		var isTrBlack = false;
		var tr_selected = false;
		
		for(i=0;i<rows.length;i++){
			if (rows[i] === objid ) {
				isTrBlack = (i%2==0) ? false : true;
			}
		}
		
		var array=objid.getElementsByTagName('td');
		for(i=1;i<array.length;i++){
			if ( array[i].className == "tr_selected" ) {
				tr_selected = true;
				if( ! isTrBlack ) array[i].className = 'grid_td';
				else array[i].className = 'grid_td2';
			} else {
				array[i].className="tr_selected";
			}
		}
		
		var  checkBox = objid.getElementsByTagName('input');
		for (i=0;i<checkBox.length;i++) {
			if (tr_selected) {
				checkBox[i].checked = false;
			} else {
				checkBox[i].checked = true;
			}
		}

	}

	///// if onclick function available
	if (! oEvent.ctrlKey == 1) {
		if(typeof(onclickActive)!="undefined"){
			if(typeof(onclickFunction) == "function" && onclickActive){
				onclickFunction();
			}
		}
	}	
}

function drawGrid3(divid){
	document.all(divid).innerHTML="";
	var i;
	var j;
	document.write("<TABLE width=100% cellspacing=0 cellpadding=0 id='dataTable'><THEAD>");
	//document.write("<TR><Th class=index>&nbsp;</Th>");
	for(i=0;i<myHeader.length;i++){
		document.write("<TH id='h"+i+"' dir='rtl'>"+myHeader[i]+"</TH>");
	}
	document.write("</TR></THEAD>");
	document.write("<TBODY>");
	for(i=0;i<myData.length;i++){
		document.write("<tr ");
		if(typeof(myData[i][myHeader.length+1 ])!="undefined" && myData[i][myHeader.length+1 ]!=''){
		document.write(" id='master"+myData[i][myHeader.length+1 ]+"' style='display:none;'");
		}else{
		document.write("id='masterRow"+i+"' class=grid_tr ");
		
		}
		
		if(typeof(myData[i][myHeader.length+2 ])!="undefined"){
			document.write("ondblclick=trDblClick('"+myData[i][myHeader.length+2 ]+"',"+i+");");
		}
		
		document.write(">");
		var arr=myData[i];
		//document.write("<td class=index>&nbsp;</td>");
		for(j=0;j<myHeader.length;j++){
			var stclass='grid_td3';
			if(typeof(myData[i][myHeader.length+2 ])!="undefined") stclass='grid_td2';
			dataValue=myData[i][j];
			if(dataValue=="" || dataValue==null) dataValue="&nbsp;";
			document.write("<td class="+stclass+" style='color:"+txtColor[j]+"'>"+dataValue+"</td>");
		}
		document.write("</tr>");
	}
	document.write("</table>");
}

function drawGrid3Sch(divid,wfm, withoutSign, withSum, withException, withNetoBreak, withBreakInd, withNetoInd, withCalcReqInd,withChangeShift){
	document.all(divid).innerHTML="";
	var i;
	var j;
	document.write("<TABLE width=100% border=2 cellspacing=0 cellpadding=0 id='dataTable'><THEAD>");
	//document.write("<TR><Th class=index>&nbsp;</Th>"); //for numbering
	if (wfm) {
		if (withoutSign) {
			document.write("<TR>");
			for(i=0;i<myTopHeader.length;i++){
			    if(i==0 && withChangeShift==3){
				document.write("<TH id='h"+i+"' border=0 class='header' dir='rtl' colspan='3'>"+myTopHeader[i]+"</TH>");
			    
			    } else if ( i==withSum || i==withException || i==withNetoBreak || i==withBreakInd || i==withNetoInd || i==withCalcReqInd ) 
				{
				document.write("<TH id='h"+i+"' border=0 class='header' dir='rtl' colspan='2' >"+myTopHeader[i]+"</TH>");
				} else {
				document.write("<TH id='h"+i+"' border=0 class='header' dir='rtl' >"+myTopHeader[i]+"</TH>");	
				}
			}
			document.write("</TR></THEAD>");
		}
	document.write("<THEAD><TR>");
	for(i=0;i<myHeader.length;i++){
			document.write("<TH id='h"+i+"' border=0 class='header' dir='rtl'>"+myHeader[i]+"</TH>");
	}
	document.write("</TR></THEAD>");
	
	} else {
		myHeader = myHeaderNoWfm;
		document.write("<THEAD><TR>");
		for(i=0;i<myHeader.length;i++){
				document.write("<TH id='h"+i+"' border=0 class='header' dir='rtl'>"+myHeader[i]+"</TH>");
		}
		document.write("</TR></THEAD>");
		
	}
	document.write("<TBODY>");
	for(i=0;i<myData.length;i++){
				document.write("<tr ");
				if(typeof(myData[i][myHeader.length+1 ])!="undefined" && myData[i][myHeader.length+1 ]!=''){
				document.write(" id='master"+myData[i][myHeader.length+1 ]+"' style='display:none;'");
				}else{
				document.write("id='masterRow"+i+"' class=grid_tr ");
				
				}
				
				if(typeof(myData[i][myHeader.length+2 ])!="undefined"){
					document.write("ondblclick=trDblClick('"+myData[i][myHeader.length+2 ]+"',"+i+");");
				}
				
				document.write(">");
				//var arr=myData[i];
				//document.write("<td class=index>&nbsp;</td>");
				for(j=0;j<myHeader.length;j++){
					//alert(myData[i][j]);
					var stclass='grid_td3';
					if(typeof(myData[i][myHeader.length+2 ])!="undefined") stclass='grid_td2';
					dataValue=myData[i][j];
					if(dataValue=="" || dataValue==null) dataValue="&nbsp;";
					if (dataValue.match('BUB') != null) {
						dataValue = dataValue.replace('BUB', '');
						//alert(dataValue);
						document.write("<td class="+stclass+"  style='color:"+txtColor[j]+"'> <u style='cursor: pointer;'>"+dataValue+" </u></td>");
					} else {
						document.write("<td class="+stclass+" style='color:"+txtColor[j]+"'> "+dataValue+" </td>");
					}
				}
				document.write("</tr>");
		}
	document.write("</table>");
}


function drawGridTemp(divid){
	
	document.all(divid).innerHTML="";
	var i;
	var j;
	document.write("<TABLE width=20px cellspacing=0 cellpadding=0 id='dataTable'><THEAD>");
	document.write("<TR><Th class=index>&nbsp;</Th>");
	for(i=0;i<myHeader.length;i++){
		document.write("<TH id='h"+i+"' style='direction:rtl;' onclick=orderBy('"+divid+"',this,"+i+");>"+myHeader[i]+"</TH>");
	}
	document.write("</TR></THEAD>");
	document.write("<TBODY>");
	for(i=0;i<myData.length;i++){
		document.write("<tr class=grid_tr onclick=trmouseclick(this,'"+myData[i][myHeader.length ]+"',event);>");
		var arr=myData[i];
		for(j=0;j<myHeader.length;j++){
			var stclass='grid_td';
			if(i%2==0) stclass='grid_td2';
			dataValue=myData[i][j];
			if(dataValue=="" || dataValue==null) dataValue="&nbsp;";
			document.write("<td class="+stclass+" style='color:"+txtColor[j]+"'>"+dataValue+"</td>");
		}
		document.write("</tr>");
	}
	document.write("</table>");
}

function drawGrid2(divid){
	
	document.all(divid).innerHTML="";
	var i;
	var j;
	document.write("<TABLE class='respDataTable default singleSelect' width=100% cellspacing=0 cellpadding=0 id='dataTable'><THEAD>");
	document.write("<TR><Th class=index>&nbsp;</Th>");
	for(i=0;i<myHeader.length;i++){
		document.write("<TH id='h"+i+"' style='direction:rtl;' onclick=orderBy('"+divid+"',this,"+i+");>"+myHeader[i]+"</TH>");
	}
	document.write("</TR></THEAD>");
	document.write("<TBODY>");
	for(i=0;i<myData.length;i++){
		document.write("<tr class=grid_tr onclick=trmouseclick(this,'"+myData[i][myHeader.length ]+"',event);>");
		var arr=myData[i];
		document.write("<td class=index>"+ (i+1) +"</td>");
		for(j=0;j<myHeader.length;j++){
			var stclass='grid_td';
			if(i%2==0) stclass='grid_td2';
			dataValue=myData[i][j];
			if(dataValue=="" || dataValue==null) dataValue="&nbsp;";
			document.write("<td class="+stclass+" style='color:"+txtColor[j]+"'>"+dataValue+"</td>");
		}
		document.write("</tr>");
	}
	document.write("</table>");
}

function drawGrid2Multi(divid){
	
	document.all(divid).innerHTML="";
	var i;
	var j;
	document.write("<TABLE class='respDataTable default multiSelect' width=100% cellspacing=0 cellpadding=0 id='dataTable'><THEAD>");
	document.write("<TR><Th class=index>&nbsp;</Th>");
	for(i=0;i<myHeader.length;i++){
		document.write("<TH id='h"+i+"' style='direction:rtl;' >"+myHeader[i]+"</TH>");
	}
	document.write("</TR></THEAD>");
	document.write("<TBODY>");
	for(i=0;i<myData.length;i++){
		document.write("<tr class=grid_tr onclick=trmouseclick(this,'"+myData[i][myHeader.length ]+"',event,'true');>");
		document.write("<td class=index>"+ (i+1) +"</td>");
		for(j=0;j<myHeader.length;j++){
			var stclass='grid_td';
			if(i%2==0) stclass='grid_td2';
			dataValue=myData[i][j];
			if(dataValue=="" || dataValue==null) dataValue="&nbsp;";
			document.write("<td class="+stclass+" style='color:"+txtColor[j]+"'>"+dataValue+"</td>");
		}
		document.write("</tr>");
	}
	document.write("</table>");
}

function drawGrid(divid){

	var i;
	var j;
	var str="";
	str+="<TABLE width=100% cellspacing=0 cellpadding=0 id='dataTable'><THEAD>";
	str+="<TR><Th class=index>&nbsp;</Th>";
	for(i=0;i<myHeader.length;i++){
		str+="<TH id='h"+i+"' style='direction:rtl;' onclick=orderBy('"+divid+"',this,"+i+");>"+myHeader[i]+"</TH>";
	}
	str+="</TR></THEAD>";
	str+="<TBODY>";
	for(i=0;i<myData.length;i++){
		str+="<tr class=grid_tr onclick=trmouseclick(this,'"+myData[i][myHeader.length ]+"',event);>";
		var arr=myData[i];
		str+="<td class=index>"+ (i+1) +"</td>";
		for(j=0;j<myHeader.length;j++){
			var stclass='grid_td';
			if(i%2==0) stclass='grid_td2';
			dataValue=myData[i][j];
			if(dataValue=="" || dataValue==null) dataValue="&nbsp;";
			str+="<td class="+stclass+" style='color:"+txtColor[j]+"'>"+dataValue+"</td>";
		}
		str+="</tr>";
	}
	str+="</table>";
	
	return str;
}

function getSelectedRow(tableObj){
	var result;
	
	if(tableObj) {	
		var allTd = tableObj.getElementsByTagName("td");
		if (allTd){
			for (var x = 0; x < allTd.length; x++) {
				if(allTd[x].className.indexOf("tr_selected") > -1){
					result = allTd[x].parentNode;
					break;
				}
			}
		}
	}
	
	return result;
}
