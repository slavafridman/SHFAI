//dojo.require("window");

// shfutils.js

function setTeamAndActivities(moked,allActivities) {
	setTeams();
	setActivities(moked,allActivities);
}

function reSetMoked(){
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
				return ;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if(xmlHttp.readyState==4){
			document.getElementById("mokedsAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/reset_moked.jsp",true);
	xmlHttp.send(null);	
}
function setMokeds(singleMokedUnitID, callBackFuncName, multiSelect){
	var agaf;
	var xmlHttp;
	agaf = document.getElementsByName("agaf")[0].value;
	if (singleMokedUnitID) {
		allowedMoked = document.getElementsByName("ctiAllowedMoked")[0].value;
	}
	if(!multiSelect){
		multiSelect = false;
	}
	try{  
		xmlHttp = new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp = new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp = new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return ;      
			}    
		}  
	}
	xmlHttp.onreadystatechange = function(){
		if(xmlHttp.readyState == 4){
			document.getElementById("mokedsAjaxResult").innerHTML = xmlHttp.responseText;
			if (callBackFuncName) {
				var fn = window[callBackFuncName];
				if (typeof fn === 'function') {
					fn();
				}
			}
		}
	};
	xmlHttp.open("GET","/shf/jsp/"+(multiSelect ? "set_multi_mokeds.jsp" : "set_mokeds.jsp")+"?agaf="+agaf+(typeof allowedMoked !== 'undefined' ? "&allowedMoked="+allowedMoked:""),true);
	xmlHttp.send(null);	
}


function setInnerJobs(){
	var agaf;
	var xmlHttp;
	agaf=document.getElementsByName("agaf")[0].value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("innerJobsAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/set_inner_job.jsp?agaf="+agaf,true);
	xmlHttp.send(null);	
}

function setMokedsForMultiTeams(){
	var agaf;
	var xmlHttp;
	agaf=document.getElementsByName("agaf")[0].value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("mokedsAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/set_mokeds_multi_teams.jsp?agaf="+agaf,true);
	xmlHttp.send(null);	
}

function setTeams(mokedinput){
	var moked;
	var xmlHttp;
	moked=mokedinput.value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("teamsAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/set_teams.jsp?moked="+moked,true);
	xmlHttp.send(null);	
}

function setTeams(){
	var moked;
	var xmlHttp;
	moked=document.getElementsByName("moked")[0].value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("teamsAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/set_teams.jsp?moked="+moked,true);
	xmlHttp.send(null);	
}

function setActivities(mokedInput,allActivities,formName,property){
	var moked;
	var xmlHttp;
	
	
	moked=mokedInput.value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("activityAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/set_activities.jsp?formName="+formName+"&property="+property+"&moked="+moked+"&allActivities="+allActivities,true);
	xmlHttp.send(null);	
}

function setMultiExceptions(mokedInput,formName,property){
	var moked;
	var xmlHttp;
	moked=mokedInput.value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("exceptionAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/set_multi_exception.jsp?formName="+formName+"&property="+property+"&moked="+moked,true);
	xmlHttp.send(null);	
}

function setMultiTimeoff(mokedInput,formName,property){
	var moked;
	var xmlHttp;
	moked=mokedInput.value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("timeoffAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/set_multi_timeoff.jsp?formName="+formName+"&property="+property+"&moked="+moked,true);
	xmlHttp.send(null);	
}

function setMultiActivities(mokedInput,formName,property,from){
	var moked;
	var xmlHttp;
	moked=mokedInput.value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("activityAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	

	
	xmlHttp.open("GET","/shf/jsp/set_multi_activity.jsp?formName="+formName+"&property="+property+"&moked="+moked+"&from="+from,true);
	xmlHttp.send(null);		
}

function setMultiTeams(mokedInput,formName,property,len){
	var moked;
	var xmlHttp;
	moked=mokedInput.value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("teamsAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/set_multi_team.jsp?formName="+formName+"&property="+property+"&moked="+moked+"&optionsLength="+len,true);
	xmlHttp.send(null);	
}

/*function setActivities(){
	var moked;
	var xmlHttp;
	moked=document.getElementsByName("moked")[0].value;
	
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
		if(xmlHttp.readyState==4){
			document.getElementById("activityAjaxResult").innerHTML=xmlHttp.responseText;
		}
	}
	xmlHttp.open("GET","/shf/jsp/set_activities.jsp?moked="+moked,true);
	xmlHttp.send(null);	
}*/


function setExceptions(){
	var moked;
	var xmlHttp;
	moked=document.getElementsByName("moked")[0].value;
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
		if(xmlHttp.readyState==4){
			document.getElementById("exceptionAjaxResult").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/jsp/set_exceptions.jsp?moked="+moked,true);
	xmlHttp.send(null);	
}



function hideDisplay(id){
	if(document.getElementById(id).style.display==''){
		document.getElementById(id).style.display='none';
	} else{
		document.getElementById(id).style.display='';
	}
}

function submitForm(f){
	document.getElementById(f).submit();
}

function clear_popup(popId){
	document.getElementById(popId).innerHTML='';
	document.getElementById(popId).style.display='none';
}

function getSelectedRadio(buttonGroup) {
   if (buttonGroup[0]) { // if the button group is an array (one button is not an array)
      for (var i=0; i<buttonGroup.length; i++) {
         if (buttonGroup[i].checked) {
            return i;
         }
      }
   } else {
      if (buttonGroup.checked) { return 0; } 
   }
   return -1;
} 

function getSelectedRadioValue(buttonGroup) {
   var i = getSelectedRadio(buttonGroup);
   if (i == -1) {
      return "";
   } else {
      if (buttonGroup[i]) {
         return buttonGroup[i].value;
      } else { 
         return buttonGroup.value;
      }
   }
} 

function isValidTime(value) {
   var hasMeridian = false;
   var re = /^\d{1,2}[:]\d{2}([:]\d{2})?( [aApP][mM]?)?$/;
   if (!re.test(value)) { return false; }
   if (value.toLowerCase().indexOf("p") != -1) { hasMeridian = true; }
   if (value.toLowerCase().indexOf("a") != -1) { hasMeridian = true; }
   var values = value.split(":");
   if ( (parseFloat(values[0]) < 0) || (parseFloat(values[0]) > 23) ) { return false; }
   if (hasMeridian) {
      if ( (parseFloat(values[0]) < 1) || (parseFloat(values[0]) > 12) ) { return false; }
   }
   if ( (parseFloat(values[1]) < 0) || (parseFloat(values[1]) > 59) ) { return false; }
   if (values.length > 2) {
      if ( (parseFloat(values[2]) < 0) || (parseFloat(values[2]) > 59) ) { return false; }
   }
   return true;
}

function curTime(itemid)
{
	var now=new Date();
	var hrs=now.getHours();
	var min=now.getMinutes();
	var sec=now.getSeconds();
	//var don="AM"
	//if (hrs>=12){ don="PM" }
	//if (hrs>12) { hrs-=12 }
	if (hrs==0) { hrs=12 ;}
	if (hrs<10) { hrs="0"+hrs; }
	if (min<10) { min="0"+min; }
	if (sec<10) { sec="0"+sec; }
	document.getElementById(itemid).innerHTML=hrs+":"+min+":"+sec;//+" "+don;
	setTimeout("curTime('"+itemid+"')",1000);
}


function hideMenu(){
	top.frames['widthFrames'].cols="*,0";
}

function displayMenu(){
	top.frames['widthFrames'].cols="*,150";
}

function hideDisplayMenu(){
	if(top.frames['widthFrames'].cols=="*,0"){
		displayMenu();
	}else{
		hideMenu();
	}
}



function viewRemarkDialog(agentDay){
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
			document.getElementById("remarkPopupDiv").style.display='';
			document.getElementById("remarkPopupDiv").innerHTML=xmlHttp.responseText;
			document.getElementById("remarkText").value=document.getElementById("remark"+agentDay).innerHTML;
        }
	};
	
	xmlHttp.open("GET","/shf/shift/viewRemarkDialog.do?agentDayId="+agentDay);
	xmlHttp.send(null);	
}

function addShiftRemark(){
	var agentDay = document.forms[0].agentDayId.value;
	var remark = document.forms[0].remark.value;
	var remlen=remark.length;
	if(remlen>100){
		alert("אורך ההערה מוגבל ל 100 תווים בלבד");
		return false;
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
			document.getElementById("remarkPopupDiv").innerHTML='';
			document.getElementById("remarkPopupDiv").style.display='none';
			document.getElementById("remark"+agentDay).innerHTML=remark;
			if(remark==null || remark=='')
				document.getElementById("remarkImg"+agentDay).innerHTML="&nbsp;";
			else
				document.getElementById("remarkImg"+agentDay).innerHTML="<img src=/shf/images/edit.gif>";
        }
	};
	
	xmlHttp.open("GET","/shf/shift/addRemark.do?agentDayId="+agentDay+"&remark="+remark);
	xmlHttp.send(null);
}


function viewOriginalShift(agentDay){
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
	};
	
	xmlHttp.open("GET","/shf/shift/viewOriginalShiftDialog.do?agentDayId="+agentDay);
	xmlHttp.send(null);	
}

function viewAddShift(){
	if(selectedRow==null || selectedRow==''){
		window.alert("נא לבחור עובד קודם");
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
				return ;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if(xmlHttp.readyState==4){
			document.getElementById("popupDiv").style.display='';
			document.getElementById("popupDiv").innerHTML=xmlHttp.responseText;
		}
	};
	xmlHttp.open("GET","/shf/shift/viewExtraShiftDialog.do?employeeId="+selectedRow,true);
	xmlHttp.send(null);	
}

function cofirmAddShift(){
	document.forms['addShiftForm'].submit();
	document.getElementById('loadingImgDiv').style.display = "";
	
}

function showChangeReason(olddate,oldstart,oldend,newdate,newstart,newend,user,rs,re,ol,nl){

	document.getElementById("popupShiftChange").style.display='';
	var data="<TABLE width=100% dir=rtl height=140px cellpadding=0 cellspacing=0>";
	data+="<TR><TD valign=top width=100% colspan=2><a href=javascript:clear_popup('popupShiftChange'); style='color:red;font-weight:bold;text-decoration:none;'>x</a></TD></TR>";
	data+="<TR><TD colspan=2 class=header>משמרת לפני עדכון:</TD></TR>";
	data+="<TR><TD>"+olddate+"&nbsp;&nbsp;&nbsp;&nbsp;"+oldend+"-"+oldstart+"</TD></TR>";
	data+="<TR><TD>"+ol+"</TD></TR>";
	data+="<TR><TD colspan=2 class=header>משמרת אחרי עדכון:</TD></TR>";
	data+="<TR><TD>"+newdate+"&nbsp;&nbsp;&nbsp;&nbsp;"+newend+"-"+newstart+"</TD></TR>";
	data+="<TR><TD>"+nl+"</TD></TR>";
	data+="<TR><TD colspan=2 class=header>עודכנה על ידי:</TD></TR>";
	data+="<TR><TD colspan=2>"+user+"</TD></TR>";
	data+="<TR><TD colspan=2 class=header>סיבה:</TD></TR>";
	data+="<TR><TD colspan=2>"+(oldstart !== newstart ? rs : "") + "</TD></TR>";
	data+="<TR><TD colspan=2>"+(oldend !== newend ? re : "") + "</TD></TR>";

	data+="</TABLE>";	
	document.getElementById("popupShiftChange").innerHTML=data;
	
}

function showShiftSplitDetails(shiftStart,splitStart,splitEnd,shiftEnd,shiftDuration){

	var popup = document.getElementById("popupShiftChange");
	var data="<TABLE width=100% dir=rtl height=140px cellpadding=0 cellspacing=0>";
	data+="<TR><TD colspan=2 valign=top width=100% ><a href=javascript:clear_popup('popupShiftChange'); style='color:red;font-weight:bold;text-decoration:none;'>x</a></TD></TR>";	
	data+="<TR><TD colspan=2 class=header>חלק ראשון :</TD></TR>";
	data+="<TR><TD>"+splitStart+" - "+shiftStart+"</TD></TR>";
	data+="<TR><TD colspan=2 class=header>חלק שני :</TD></TR>";
	data+="<TR><TD>"+shiftEnd+" - "+splitEnd+"</TD></TR>";
	data+="<TR><TD colspan=2 class=header>משך משמרת בפועל :</TD></TR>";
	data+="<TR><TD>"+shiftDuration+" שעות</TD></TR>";
	data+="</TABLE>";
	popup.innerHTML=data;
	popup.style.display='';
	
}

function returnSaveResults(data,ioArgs)
{
	
	var actionId = '/shf/attendance/searchResult.do';
	
	if (document.getElementById("modeID").value == 0 ) {
		actionId="/shf/shift/searchResult.do";
	}
	
//	alert(actionId);
//	alert(document.forms[0].name);
	document.forms[0].action=actionId;
	document.forms[0].target="";
	document.forms[0].submit();
}

function catchError(data,ioArgs)
{
 	//alert("Error");
}

function addShiftCancelLogin(){
	
	var textArea = document.getElementById("remarkCancel").value;
	if (textArea.length > 100) {
		alert("הטקסט מכיל " + textArea.length +" תווים, מותר לכתוב עד 100 תוים בלבד");
		return;
	}
	
	var actionId = '/shf/shift/cancelLoginUpdate.do';
	dojo.xhrPost({url:actionId,load:returnSaveResults,error:catchError,form:"shiftLoginCancel", handleAs:'text',contentType:'application/x-www-form-urlencoded; charset=utf-8'});
	dijit.byId("dialogTableId").innerHTML="";
	dijit.byId("dialogTableId").hide();
	
}

function checkIfExtAllocated(queryStr, extExist, callback){
	dojo.xhrGet({
			url:"/shf/shift/checkPoolExtensionAllocated.do?" + queryStr,
			load:function(data){
				if (typeof callback === "function") {
					callback(data, extExist);
				} else {
					console.error("callback is not a function");
				}
		      },
			error:catchError,
			preventCache: true,
			handleAs:'text'
		});
}

//function extAllocRelease(queryStr, extExist, callback){
//	dojo.xhrGet({
//			url:"/shf/shift/poolExtAllocRelease.do?" + queryStr,
//			load:function(data){
//				document.getElementById("popupDiv").innerHTML=data;
//				document.getElementById("popupDiv").style.display='';				
//		      },
//			error:catchError,
//			preventCache: true,
//			handleAs:'text'
//		});
//}


function closeShiftCancelLogin(){

	dijit.byId("dialogTableId").innerHTML="";
	dijit.byId("dialogTableId").hide();
}

function closeShiftAllocReleaseDialog(successStatus, altDesc){
	dijit.byId("dialogTableId").innerHTML="";
	dijit.byId("dialogTableId").hide();
	
	if (successStatus) {
		var tableObj = document.getElementById("dataTable");
		var tableParentObj = tableObj.parentElement;
		var tableParentInnerHtml = tableParentObj.innerHTML;
		var selRowObj = getSelectedRow(tableObj);
		
		if (selRowObj) {
			var imgArr = getElementsByClassName(selRowObj, "extImg");
			var td = findAncestorByTagName(imgArr[0], "td");
			var wrapper= document.createElement('div');
			var  tdInnerHtmlStr =  td.innerHTML + "";
			wrapper.innerHTML = td.outerHTML;
			var newSpan = wrapper.firstChild;

			var selRowStrOrig = selRowObj.outerHTML + "";
			var selRowStr = selRowStrOrig;
				
			if(imgArr.length > 0){
				if(imgArr[0].src.indexOf("exist") > -1){
					imgArr[0].src = imgArr[0].src.replace("exist", "absent");
					
					dojo.attr(newSpan.firstChild, "alt", "");
					dojo.attr(newSpan.firstChild, "src", dojo.attr(newSpan.firstChild, "src").replace("exist", "absent"));
					myData[selRowObj.rowIndex-1][td.cellIndex-1] = myData[selRowObj.rowIndex-1][td.cellIndex-1].replace("exist", "absent");
					myData[selRowObj.rowIndex-1][myData[selRowObj.rowIndex-1].length-1] = myData[selRowObj.rowIndex-1][myData[selRowObj.rowIndex-1].length-1].replace("shiftExtNum=true", "shiftExtNum=false");
					selRowStr = selRowStr.replace("shiftExtNum=true", "shiftExtNum=false");
					
				} else {
					imgArr[0].src = imgArr[0].src.replace("absent", "exist");
					dojo.attr(newSpan.firstChild, "alt", altDesc);
					dojo.attr(newSpan.firstChild, "src", dojo.attr(newSpan.firstChild, "src").replace("absent", "exist"));
					myData[selRowObj.rowIndex-1][td.cellIndex-1] = myData[selRowObj.rowIndex-1][td.cellIndex-1].replace("absent", "exist");
					myData[selRowObj.rowIndex-1][myData[selRowObj.rowIndex-1].length-1] = myData[selRowObj.rowIndex-1][myData[selRowObj.rowIndex-1].length-1].replace("shiftExtNum=false", "shiftExtNum=true");
					selRowStr = selRowStr.replace("shiftExtNum=false", "shiftExtNum=true");
				}
				
				selRowStr = selRowStr.replace(tdInnerHtmlStr, newSpan.outerHTML);
				selRowStr = selRowStr.replace(newSpan.firstChild.src, newSpan.firstChild.src.substring(newSpan.firstChild.src.indexOf("/shf/")));

				if(altDesc){
					imgArr[0].alt = altDesc;
				}else{
					imgArr[0].alt = "";
				}
				
				myData[selRowObj.rowIndex-1][td.cellIndex-1] = wrapper.innerHTML;
			}
			
			var newSelRow;
			
			if (selectedRow.indexOf("shiftExtNum=false") > -1) {
				newSelRow = selectedRow.replace("shiftExtNum=false", "shiftExtNum=true");
			} else {
				newSelRow = selectedRow.replace("shiftExtNum=true", "shiftExtNum=false");
			}

			tableParentInnerHtml = tableParentInnerHtml.replace(/(\r\n|\n|\r)/gm, "").replace(selRowStrOrig.replace(/(\r\n|\n|\r)/gm, ""), selRowStr);
			selectedRow = newSelRow;
			tableParentObj.innerHTML = tableParentInnerHtml;
			
			selRowObj.click();
		}
	}
}
function consoleLog(str, blockSize) {
    if (blockSize === undefined) {
        blockSize = 1024;
    }
    var limit = Math.floor(str.length / blockSize);
    for (var k = 0; k < limit+1; k++) {
      if (k == limit)
          console.log(str.substring(blockSize*k, str.length));
      else
          console.log(str.substring(blockSize*k, blockSize*(k+1)));
    }
}

function showCancelRemarkDialog (updName, appName, CancelRemark) {
	
	document.getElementById("popupShiftChange").style.display='';
	var data="<TABLE width=100% dir=rtl height=140px cellpadding=0 cellspacing=0>";
	data+="<TR><TD valign=top width=100% colspan=2><a href=javascript:clear_popup('popupShiftChange'); style='color:red;font-weight:bold;text-decoration:none;'>x</a></TD></TR>";
	data+="<TR><TD colspan=2 class=header> הערה לביטול העברת משמרת:</TD></TR>";
	data+="<TR><TD><textarea cols=20 rows=5 readonly=readonly >"+CancelRemark+"</textarea></TD></TR>";
	data+="<TR><TD colspan=2 class=header>נרשם על ידי:</TD></TR>";
	data+="<TR><TD>"+updName+"</TD></TR>";
	data+="<TR><TD colspan=2 class=header>אושר על ידי:</TD></TR>";
	data+="<TR><TD colspan=2>"+appName+"</TD></TR>";
	data+="<TR><TD colspan=2> <button  onclick=clear_popup('popupShiftChange')>סגור חלון</button></TD></TR>";
	data+="<TABLE>";	
	document.getElementById("popupShiftChange").innerHTML=data;
}

function updateSplitShift(){
	var input = document.getElementById("shiftSplitInput");
	var timeRow = document.getElementById("shiftSplitTime");
	if(input.value === 'false'){
		input.value = 'true';
		timeRow.style.visibility = "visible";
	} else {
		input.value = 'false';
		timeRow.style.visibility = "hidden";
	}
}

function findAncestorByClass (el, cls) {
    while ((el = el.parentNode) && el.className.indexOf(cls) < 0);
    return el;
}
//function findAncestorByTagName (el, tagName) {
//    while ((el = el.parentNode) && el.tagName.toLowerCase() === tagName.toLowerCase());
//    return el;
//}

function findAncestorByTagName (el, tagName) {
	if (el.parentNode) {
		do {
			el = el.parentNode;
		} while (el.tagName.toLowerCase() !== tagName.toLowerCase() && el.parentNode);
	}
    return el;
}

function getElementsByClassName( root, clss ) {

    var result = [], els, i;

    if( arguments.length < 2 || !root || !clss ) {
        return result;
    }

    clss = clss + '';

    if( root.getElementsByClassName ) {
        result = root.getElementsByClassName( clss );
    } else if( root.querySelectorAll ) {
        result = root.querySelectorAll( '.' + clss );
    } else {
        els = root.getElementsByTagName('*');
        clss = " " + clss + " ";
        for( i = 0; i < els.length; ++i ) {
            if( ( " " + els[ i ].className + " " ).indexOf( clss ) !== -1 ) {
                result.push( els[ i ] );
            }
        }
    }
    return result;
}