// attendance.js
//Yuval - GLOBAL VARIABLE FOR THE COLUMN AT PAGE attendance_table.jsp
var jRemark = 1;//0;
var jRegister = 3;//2;
var jMissing = 4;//3;
var jAttendance = 13;//12;
var jTadrich = 14;//13;
//Yuval - GLOBAL VARIABLE FOR THE COLUMN AT PAGE attendance_table.jsp


function attendCol(checked,missing,agentDay,security,employeeId,iAtt,jAtt){
//yuval - get the actuel index from myData to update
	var jj=0;

	if(security){ 
		return "<input type=checkbox "+((checked)?"checked=1":"")+" name='att"+agentDay+"' onclick=stageArrive(this,"+agentDay+","+employeeId+",0,"+jj+","+jAtt+","+ security + "," +missing +"); "+((missing)?" disabled":"")+" >";
	}
	else{
		return "<input type=checkbox "+((checked)?"checked=1":"")+" disabled name='att"+agentDay+"'>";
	}
	
}

function tadrechCol(checked,missing,agentDay,security,employeeId,iTadrich,jTadrich,jAtt){
	
	//yuval - get the actuel index from myData to update
	var jj=0;

	if(security){
		return "<input type=checkbox "+((checked)?"checked=1":"")+" name='tad"+agentDay+"' onclick=tadreechArrive(this,"+agentDay+","+employeeId+","+jj+","+jTadrich+","+ security + "," +missing +"," + jAtt +"); "+((missing)?" disabled":"")+" >";
	}
	else{
		return "<input type=checkbox "+((checked)?"checked=1":"")+" disabled name='tad"+agentDay+"'>";
	}
	
}

// newFunction 

function tadreechArrive(e,agentDay,employeeId,iTadrichX,jTadrichX, security,missing, jAtt) {
	var ch;
	var xmlHttp;
	var agree;
	var stage=document.getElementById("att"+agentDay);
	
	//yuval - get the actuel index from myData to update
	var iTadrich=getCurrentIndex(agentDay);

	if(!stage.checked){
		if(e.checked){

//		alert("iiTadrich = " + iiTadrich + "  jTadrich = " + jTadrich + "   jAtt = " + jAtt );
			 if(security){
				  	myData[iTadrich][jTadrich] = "<input type=checkbox "+((e.checked)?"checked=1":"")+" name='tad"+agentDay+"' onclick=tadreechArrive(this,"+agentDay+","+employeeId+","+iTadrich+","+jTadrich+"); "+((missing)?" disabled":"")+" >"; 
				 }
				 else{
				 	myData[iTadrich][jTadrich] = "<input type=checkbox "+((e.checked)?"checked=1":"")+" disabled name='tad"+agentDay+"'>";
				 }
			stageArrive(e, agentDay, employeeId, 1,iTadrich,jAtt, security,missing);
			document.getElementById("att"+agentDay).checked=true;
			return;
		}
	}

	if(! e.checked){
		agree=confirm(" ? האם אתה בטוח כי ברצונך לבטל הגעה לתדריך");
		if(!agree){ 
			e.checked=true;

			return;		
		}

	}
	
	 if(security){
		  	myData[iTadrich][jTadrich] = "<input type=checkbox "+((e.checked)?"checked=1":"")+" name='tad"+agentDay+"' onclick=tadreechArrive(this,"+agentDay+","+employeeId+","+iTadrich+","+jTadrich+"); "+((missing)?" disabled":"")+" >"; 
		 }
		 else{
		 	myData[iTadrich][jTadrich] = "<input type=checkbox "+((e.checked)?"checked=1":"")+" disabled name='tad"+agentDay+"'>";
		 }
	
	if(e.checked) 
	{ch=1;	
	 }
	else ch=0;
	
	try{  
		xmlHttp=new XMLHttpRequest();
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			
		}
		
	}
	
	xmlHttp.open("GET","/shf/attendance/setTadreech.do?employeeId="+employeeId+"&agentDayId="+agentDay+"&tadreech="+ch);
	xmlHttp.send(null);	
	

}

function stageArrive(e,agentDay,employeeId,tadreech,iAtt,jAtt, security,missing) {
	
	
	var ch;
	var xmlHttp;
	var tadChecked=document.getElementById("tad"+agentDay).checked;
	var agree;
	
	//yuval - get the actuel index from myData to update	
	var iAttendance=getCurrentIndex(agentDay);
	if(! e.checked){
		document.getElementById("tad"+agentDay).checked=false;
		agree=confirm(" ? האם אתה בטוח כי ברצונך להסיר נוכחות");
		if(!agree){ 
			e.checked=true;
			document.getElementById("tad"+agentDay).checked=tadChecked;
			return;		
		}
	//update the tadrich data in myData
		 if(security){
			  	myData[iAttendance][jTadrich] = "<input type=checkbox "+((e.checked)?"checked=1":"")+" name='tad"+agentDay+"' onclick=tadreechArrive(this,"+agentDay+","+employeeId+","+iAttendance+","+(jAtt+1)+"); "+((missing)?" disabled":"")+" >"; 
			 }
			 else{
			 	myData[iAttendance][jTadrich] = "<input type=checkbox "+((e.checked)?"checked=1":"")+" disabled name='tad"+agentDay+"'>";
			 }
	}
//update the attendance data in myData

	if(security){
		myData[iAttendance][jAttendance] = "<input type=checkbox "+((e.checked)?"checked=1":"")+" name='att"+agentDay+"' onclick=stageArrive(this,"+agentDay+","+employeeId+",0,"+iAttendance+","+jAtt+","+ security + "," +missing +"); "+((missing)?" disabled":"")+" >";
	}
	else{ 
		myData[iAttendance][jAttendance] = "<input type=checkbox "+((e.checked)?"checked=1":"")+" disabled name='att"+agentDay+"'>";
	}
	
	if(e.checked) ch=1;
	else ch=0;
	
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			
			if(ch==1){
				document.getElementById("setMissing"+agentDay).innerHTML=setMissingInactive(false);
			}
			if(xmlHttp.responseText.length>0){
				
				if(xmlHttp.responseText.match("<TITLE>latePopUp</TITLE>")!=null){
					document.getElementById("popupDiv").innerHTML=xmlHttp.responseText;
					document.getElementById("popupDiv").style.display='';
					
				}else if(xmlHttp.responseText.match("<TITLE>report_popup</TITLE>")!=null){
					document.getElementById("reportPopupDiv").innerHTML=xmlHttp.responseText;
					document.getElementById("reportPopupDiv").style.display='';
				}
			}
		}
	}
	
	xmlHttp.open("GET","/shf/attendance/setAttendance.do?employeeId="+employeeId+"&agentDayId="+agentDay+"&attendanceValue="+ch+"&tadreech="+tadreech);
	xmlHttp.send(null);	
}


function addlate(){
	var xmlHttp;
	var rem=document.addLateForm.lateRemark.value;
	var reason=getSelectedRadioValue(document.getElementsByName("lateReasonId"));
	var eventType=document.addLateForm.eventType.value;
	var agentDay=document.addLateForm.agentDayId.value;
	var source=document.addLateForm.lateSource.value;
	var lateMinutes=document.addLateForm.lateMinutes.value;
	//alert(rem + " "+ reason+ " "+ eventType+ " "+ agentDay+ " "+ lateMinutes)
	
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return ;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("popupDiv").innerHTML='';
			document.getElementById("popupDiv").style.display='none';
		}
	}
	
	xmlHttp.open("GET","/shf/attendance/addEvent.do?eventType="+eventType+"&agentDayId="+agentDay+"&lateRemark="+rem+"&lateSource="+source+"&lateReasonId="+reason+"&lateMinutes="+lateMinutes);
	xmlHttp.send(null);	
	
}



function viewMissing(agentDay,eventType){
	var xmlHttp;
	
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("missingPopupDiv").style.display='';
			document.getElementById("missingPopupDiv").innerHTML=xmlHttp.responseText;
        }
	}
	
	xmlHttp.open("GET","/shf/attendance/viewMissing.do?agentDayId="+agentDay);
	xmlHttp.send(null);	
}


function setMissing(security,agentDay,eventType){
// Yuval - jMissing = the place of Miss column 	

	var iMissing;
	iMissing = getCurrentIndex();
	if(security) {
		if (selectedRow > 0) {
			//Yuval - update myData with the actual object only for selected row
			myData[iMissing][jMissing] = "<span name='add' id=setMissing" + agentDay + " ><a href=javascript:viewMissing("+agentDay+","+eventType+")><img src='/shf/images/add_missing.gif' alt='הוסף חיסור' border=0></a></span>";
		}
		return "<span name='add' id=setMissing" + agentDay + " ><a href=javascript:viewMissing("+agentDay+","+eventType+")><img src='/shf/images/add_missing.gif' alt='הוסף חיסור' border=0></a></span>";
	}
	else {
		if (selectedRow > 0) {
			myData[iMissing][jMissing] = "<span name='add'>&nbsp;</span>";
		}
		return "<span name='add'>&nbsp;</span>";
	}
}

function setMissingInactive(security){
	//Yuval - the place of this column as it is in attendance_table.jsp
	var iMissing = getCurrentIndex();
	if(security) {
		if (selectedRow > 0) {
			//Yuval - update myData with the actual object
			myData[iMissing][jMissing] = "<span name='add'><img src='/shf/images/add_missing.gif' border=0 class='transparent'></span>";
		}
		return "<span name='add'><img src='/shf/images/add_missing.gif' border=0 class='transparent'></span>";
	}
	else {
		if (selectedRow > 0) {
			myData[iMissing][jMissing] = "<span name='add'>&nbsp;</span>";
		}
		return "<span name='add'>&nbsp;</span>";
	}
}

function setViewMissing(security,agentDay,eventType){
	
	//Change
	var iMissing = getCurrentIndex();
	if(security) {
		if (selectedRow > 0) {
			myData[iMissing][jMissing] = "<span name='view' id=setMissing" + agentDay + " ><a href=javascript:viewMissing("+agentDay+","+eventType+")><img src='/shf/images/rem.gif'  border=0></a></span>";
		}
		return "<span name='view' id=setMissing" + agentDay + " ><a href=javascript:viewMissing("+agentDay+","+eventType+")><img src='/shf/images/rem.gif'  border=0></a></span>";
	}
	else
		{
		if (selectedRow > 0) {
			myData[iMissing][jMissing] = "<span name='view'><img src='/shf/images/rem.gif' border=0></span>";
		}
		return "<span name='view'><img src='/shf/images/rem.gif' border=0></span>";
		}
}

function missingCol(security,agentDay,stageTime,missingReason,stationTime,eventType){
	if(missingReason>0)
		//in case that there is missing for the shift
		return setViewMissing(security,agentDay,eventType);
	else if(stageTime!='' || stationTime!='')
		return setMissingInactive(security);
	else if(missingReason<=0)
		return setMissing(security,agentDay,eventType);
	return null;
}

function removeMissing(){
	var xmlHttp;
	var agentDay=document.addMissingForm.agentDayId.value;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return ;
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			clear_popup("missingPopupDiv");
			document.getElementById("setMissing"+agentDay).innerHTML=setMissing(true,agentDay,0);
			document.getElementById("setStation"+agentDay).innerHTML=enterToStation(true,agentDay,0);
        }
	}
	
	xmlHttp.open("GET","/shf/attendance/removeMissing.do?agentDayId="+agentDay);
	xmlHttp.send(null);
}

function saveMissing(employeeId){
	var xmlHttp;
	var rem=document.addMissingForm.missingRemark.value;
	var reason=getSelectedRadioValue(document.getElementsByName("missReasonId"));
	var eventType=document.addMissingForm.eventType.value;
	var agentDay=document.addMissingForm.agentDayId.value;
	var missDateStart = document.addMissingForm.missDateStart.value;
	var missDateEnd = document.addMissingForm.missDateEnd.value;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return ;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			clear_popup("missingPopupDiv");
			document.getElementById("setMissing"+agentDay).innerHTML=setViewMissing(true,agentDay,eventType);
			//YuvalOv
        	document.getElementsByName("att"+agentDay)[0].disabled=true;
        	document.getElementsByName("tad"+agentDay)[0].disabled=true;
        	document.getElementById("setStation"+agentDay).innerHTML=enterToStation(true,agentDay,1);
        }
	}
	
	xmlHttp.open("GET","/shf/attendance/addEvent.do?employeeId="+employeeId+"&eventType="+eventType+"&agentDayId="+agentDay+"&missingRemark="+rem+"&missingReasonId="+reason+"&missDateStart="+missDateStart+"&missDateEnd="+missDateEnd);
	xmlHttp.send(null);
}


function clear_popup(popId){
	document.getElementById(popId).innerHTML='';
	document.getElementById(popId).style.display='none';
}

function addMissing(agentDay){
	document.attendanceForm.action="/shf/attendance/addMissing.do";
	document.attendanceForm.agentDayId.value=agentDay;
	document.attendanceForm.submit();
}

function stationRegister(agentDay){
//Yuval - jRegister the place of this column as it is in attendance_table.jsp
//Yuval - update myData with the actual object
	var iRegister=getCurrentIndex(agentDay);
	
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("setMissing"+agentDay).innerHTML=setMissingInactive(true);
			if(xmlHttp.responseText.length>20){
				document.getElementById("popupDiv").style.display='';
				document.getElementById("popupDiv").innerHTML=xmlHttp.responseText;
				document.getElementById("setStation"+agentDay).innerHTML='&nbsp;';
				myData[iRegister][jRegister] = '&nbsp;';
			}
			else{
				document.getElementById("setStation"+agentDay).innerHTML=xmlHttp.responseText;
				myData[iRegister][jRegister] = xmlHttp.responseText;
			}
        }
	}
	
	xmlHttp.open("GET","/shf/attendance/employeeArrive.do?agentDayId="+agentDay);
	xmlHttp.send(null);
}

function cancelStation(){
	agree=confirm(" ? האם אתה בטוח כי ברצונך לבטל כניסה לעמדה");
	if(!agree){ 
		return;		
	}
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			top.frMsgBar.location="/shf/msgBar.do";
			if( xmlHttp.responseText.match("success") != null ){
				document.getElementById("setStation"+selectedRow).innerHTML=enterToStation(true,selectedRow,0);
				document.getElementById("setMissing"+selectedRow).innerHTML=setMissingInactive(true);
			}
        }
	}
	
	xmlHttp.open("GET","/shf/attendance/cancelStation.do?agentDayId="+selectedRow);
	xmlHttp.send(null);
}


function stationCol(security,agentDay,stationTime,lateMinutes,missingReason,lateReason,exitTime){
	if(lateMinutes>0 && stationTime != ''){
//	 	enable to watch late data
		return showLate(security,agentDay,stationTime,lateReason);
	}
	else if(stationTime != ''){
//	 	dispaly the actual stationTime
		return "<a style='color:green;'>"+stationTime+"</a>";
	}
	else if(stationTime=='' && missingReason<=0){
		return enterToStation(security,agentDay,0);
	}
	else if(missingReason>0){
		return enterToStation(security,agentDay,1);
	}
	else{
		return "<a style='color:green;'>"+stationTime+"</a>";
	}
	
}

function enterToStation(security,agentDay,param){
	
//	Yuval - jRegister is the place of this column as it is in attendance_table.jsp
	
//	Yuval - update myData with the actual object
	var iRegister=getCurrentIndex(agentDay);
	
	if(param==1 || !security) {
		if (selectedRow>0) {
		myData[iRegister][jRegister] = "<div id='setStation"+agentDay+"' style='color:d3d3d3'><u>רישום</u></div>";
		}
			return "<div id='setStation"+agentDay+"' style='color:d3d3d3'><u>רישום</u></div>";
		
	}
	else if(param==0)
		{
		if (selectedRow>0) {
			myData[iRegister][jRegister] = "<div id='setStation"+agentDay+"'><a style='color:navy' href=javascript:stationRegister("+agentDay+") >רישום</a></div>";
		}
		return "<div id='setStation"+agentDay+"'><a style='color:navy' href=javascript:stationRegister("+agentDay+") >רישום</a></div>";
		}
	
}

function showLate(security,agentDay,stationTime,lateReason){
	//if(security && lateReason>0)
	if(security)
	return "<div id='setStation"+agentDay+"'><span><a href='javascript:viewLate("+agentDay+");'  style='color:red'>"+stationTime+"</a></span></div>";
	else
	return "<div id='setStation"+agentDay+"'><span style='color:red'>"+stationTime+"</span></div>";
}

function viewLate(agentDay){
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("popupDiv").style.display='';
			document.getElementById("popupDiv").innerHTML=xmlHttp.responseText;
        }
	}
	
	xmlHttp.open("GET","/shf/attendance/viewLate.do?agentDayId="+agentDay);
	xmlHttp.send(null);
}


function dayExit(){
	if(selectedRow==null || selectedRow==''){
		window.alert("נא לבחור משמרת קודם");
		return;
	}
	exitDayFunction(selectedRow);
	
}

function exitDayFunction(dayid){
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			top.frMsgBar.location="/shf/msgBar.do";
        }
	}
	xmlHttp.open("GET","/shf/attendance/employeeExit.do?agentDayId="+dayid);
	xmlHttp.send(null);	
}

function cancel_exit(){
	agree=confirm(" ? האם אתה בטוח כי ברצונך לבטל יציאה מהעמדה");
	if(!agree){ 
		return;		
	}
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			top.frMsgBar.location="/shf/msgBar.do";
			if( xmlHttp.responseText.match("success") != null ){
				document.getElementById("exit"+selectedRow).innerHTML="&nbsp;";
			}
        }
	}
	
	xmlHttp.open("GET","/shf/attendance/cancelExit.do?agentDayId="+selectedRow);
	xmlHttp.send(null);
}

function flagCol(flag,user){
	if(flag==null || flag=='')
		return "&nbsp;";
	else if(flag==1)
		return "<img alt='"+user+" דגל איחור נוסף על ידי' src='/shf/images/flag"+flag+".gif'>";
	else if(flag==2)
		return "<img alt='"+user+" דגל צפי עזיבה נוסף על ידי' src='/shf/images/flag"+flag+".gif'>";
	else
		return "&nbsp;";
}

function addFlag(flagId){
	if(selectedRow==null || selectedRow==''){
		window.alert("נא לבחור משמרת קודם");
		return;
	}
	var xmlHttp;
	
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			top.frMsgBar.location="/shf/msgBar.do";
			if( xmlHttp.responseText.match("success") != null ){
				document.getElementById("flag"+selectedRow).innerHTML="<img src=/shf/images/flag"+flagId+".gif>"
			}
        }
	}
	xmlHttp.open("GET","/shf/attendance/addFlag.do?agentDayId="+selectedRow+"&flag="+flagId);
	xmlHttp.send(null);	
}

function removeFlag(){
	if(selectedRow==null || selectedRow==''){
		window.alert("נא לבחור משמרת קודם");
		return;
	}
	var xmlHttp;
	
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			top.frMsgBar.location="/shf/msgBar.do";
			if( xmlHttp.responseText.match("success") != null ){
				document.getElementById("flag"+selectedRow).innerHTML="&nbsp;"
			}
        }
	}
	xmlHttp.open("GET","/shf/attendance/removeFlag.do?agentDayId="+selectedRow);
	xmlHttp.send(null);	
}

function getCurrentIndex (agentDay) {
	
//Yuval - return the current rowId within myData object
//jRemark = the place of the column that i check with it the location (remark column)

	var currentAgentDay;
// in case that row doesnt selected like clicking on the checkBox!!	
	if (agentDay > 0) {
		currentAgentDay = agentDay;
	} else {
		currentAgentDay = selectedRow;
	}
	for (ii=0;ii<myData.length;ii++) {
		textTemp = myData[ii][jRemark];
           if (textTemp.match("remark"+currentAgentDay)) {
        	   return ii;
           }
	}
}


