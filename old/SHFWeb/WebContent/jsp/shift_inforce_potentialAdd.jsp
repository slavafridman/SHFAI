<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.shf.utils.SHFConstants"%>
<jsp:useBean id="potentialInforceForm"
	class="bzq.shf.forms.PotentialInforceForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean 
	id="employeeData"
	class="bzq.shf.forms.EmployeeInforceListForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="employeeInforce"
	class="bzq.shf.bean.PotentialEmployeeBean" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="shiftInforce"
	class="bzq.shf.forms.ShiftInforceRequestForm" 
	scope="request">
</jsp:useBean>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>

<%@page import="java.util.Vector"%>

<%@page import="bzq.shf.bean.PotentialEmployeeBean"%>
<%@page import="bzq.shf.bean.EmployeeBean"%><HTML>
<HEAD>
<script type="text/javascript" src="../dojo/dojo/dojo.js"
	djConfig="isDebug: false, parseOnLoad: true"></script>
<style type="text/css">
@import "../dojo/dojo/resources/dojo.css";

@import "../dojo/dijit/themes/nihilo/nihilo.css";

@import "../dojo/dijit/themes/dijit.css";
</style>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" %>
<%@page import="org.apache.commons.validator.GenericValidator"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" ></link>
<TITLE>shift_inforce_potential.jsp</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script src="/shf/js/shfgrid.js"></script>
<script src="/shf/js/breakjs.js"></script>
<script type="text/javascript">
dojo.require("dojo.parser");
</script>


<SCRIPT>
function submitAddInforce(){
	var num=document.addInforceForm.originalNumOfAgents.value;
	if(num>0)
		submitUpdateInforce();
	else{
		alert("כמות נציגים חייב להיות גדול מאפס");
		return;
	}
}

function showInforceOptionals(){
	
	if(!isValidTime(document.forms['potentialInforceForm'].startTimeInforce.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.forms['potentialInforceForm'].endTimeInforce.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(document.potentialInforceForm.moked.value=='-1' || document.potentialInforceForm.moked.value==''){
		alert("לא הוזנו כל שדות החובה");
		return;
	}
	//alert("1");
//	if (validateAddInforceForm(document.all.potentialInforceForm)) {   
		document.forms['potentialInforceForm'].action="/shf/shift/InforcePotentialData.do";
		//document.forms['addInforceForm'].target="inforceOptionsFrame";
		document.forms['potentialInforceForm'].target="";
        document.forms['potentialInforceForm'].submit();     
//	}
//	alert("2");
}

function submitUpdateInforce(){
	if(!isValidTime(document.addInforceForm.shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.addInforceForm.shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(document.addInforceForm.activity.value=='00' || document.addInforceForm.activity.value==''){
		alert("צריך לבחור תור");
		return;
	}
	
	submitAddInforceForm();
}

function submitAddInforceForm(){
	if(!isValidTime(document.addInforceForm.shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.addInforceForm.shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if (validateAddInforceForm(document.all.addInforceForm)) {   
		document.forms['addInforceForm'].action="/shf/shift/inforceShift.do";
		document.forms['addInforceForm'].target="";
        document.addInforceForm.submit();     
	}
}
function change(checkItem)	{
   
	if(checkItem.value=='0') {
		checkItem.value='1';
		checkItem.checked == true;
		selectAll();
		}	
	else {	
		checkItem.value='0'
		checkItem.checked == false;
		clearAll();
		}
		
}
function setInforcrForAgante() {
	arr = document.getElementsByName("selectedPotential");
	var test = false;
	for (var i = 0; i < arr.length; i++) {
		if (arr[i].checked == true) 
			test=true; 
	}
	if (test) {
		document.forms['potentialInforceForm'].action="/shf/shift/InforcePotentialAdd.do";
		document.forms['potentialInforceForm'].target="";
	    document.forms['potentialInforceForm'].submit();
    } else {
    	alert("לא נבחרו נציגים לשיבוץ למשמרת תגבור");
    }   
}

function addInforceReq() {
	if (!checkTimeRange()) {
		return;
	}
	if(document.potentialInforceForm.moked.value=='-1' || document.potentialInforceForm.moked.value==''){
		alert("לא הוזנו כל שדות החובה");
		return;
	} else 
	{
		document.addShiftForm.moked.value = document.potentialInforceForm.moked.value;		
	}

	document.addShiftForm.activity.value = document.potentialInforceForm.activity.value;
	document.addShiftForm.remark.value = document.potentialInforceForm.remark.value;
	document.addShiftForm.breaksNumber.value = document.potentialInforceForm.breaksNumber.value;
	document.addShiftForm.date.value = document.potentialInforceForm.date.value;
	document.addShiftForm.shiftStart.value = document.potentialInforceForm.startTimeInforce.value;
	document.addShiftForm.shiftEnd.value = document.potentialInforceForm.endTimeInforce.value;
	document.addShiftForm.employeeId.value = document.potentialInforceForm.endTimeInforce.value;
//	document.addShiftForm.idNumber.value = document.potentialInforceForm.idNumber.value;
//	document.addShiftForm.breakPotential.value = document.potentialInforceForm.breakPotential.value;	
	
	arrBreak1 = document.getElementsByName("breakPotentialAll");
	arrBreak = document.getElementsByName("breakPotential");
	for (var u = 0; u < arrBreak.length; u++) {
		arrBreak1[u].value = arrBreak[u].value;
	}
	
	var shfLocForm = document.getElementsByName("shiftLocationAll");
	var shfLocCurr = document.getElementsByName("shiftLocation");
	for (var u = 0; u < shfLocCurr.length; u++) {
		shfLocForm[u].value = shfLocCurr[u].value;		
	}
	
	var potential = document.getElementsByName("selectedPotential");
	var num = potential.length;
	breakes = false;
	for (var i=0; i<num;i++ ) {
		    var startBreak1 = document.getElementById("fromBreak1"+i).value;
		   	//alert(startBreak1);
		    if (startBreak1 <= "00:00"){
			    breakes= true;
			}
	}
	//alert(breakes+document.getElementById("breaksNumber").value);
	if (breakes && document.getElementById("breaksNumber").value > 0){
	  if(!(confirm("לא הוזנו הפסקות לחלק מהנציגים , נציגים אלה לא ישובצו למשמרת תגבור "))){
		return false;
		}
	}
	arr=document.getElementsByName("breakStart");
	arr[0].value = document.getElementById("firstBreakTime0").value;
	arr[1].value = document.getElementById("secondBreakTime0").value;
	arr[2].value = document.getElementById("thirdBreakTime0").value;
	
	
	arr1=document.getElementsByName("breakEnd");
	
//end break
	var startBreak1 = document.getElementById("firstBreakTime0").value;
	var startBreak2 = document.getElementById("secondBreakTime0").value;
	var startBreak3 = document.getElementById("thirdBreakTime0").value;
	
	var lenBreak1 = document.getElementById("firstBreakLength").value;
	var lenBreak2 = document.getElementById("secondBreakLength").value;
	var lenBreak3 = document.getElementById("thirdBreakLength").value;
	
	var timeTemp = new Date();
	
//end break 1
	timeTemp.setTime(Date.parse("01/01/2010 " + startBreak1));	
	timeTemp.setMinutes(timeTemp.getMinutes() + parseInt(lenBreak1,10));
	var minute;
	if (timeTemp.getMinutes() < 10) {
			minute = "0" + timeTemp.getMinutes();
		 }
		else {
			minute = timeTemp.getMinutes(); 
		 }
	var endBreak1 = timeTemp.getHours() + ":" + minute;
	arr1[0].value = endBreak1;
//end break 2
	
	timeTemp.setTime(Date.parse("01/01/2010 " + startBreak2));	
	timeTemp.setMinutes(timeTemp.getMinutes() + parseInt(lenBreak2,10));

	if (timeTemp.getMinutes() < 10) {
			minute = "0" + timeTemp.getMinutes();
		 }
		else {
			minute = timeTemp.getMinutes(); 
		 }
	var endBreak2 = timeTemp.getHours() + ":" + minute;
	arr1[1].value = endBreak2;
//end break 3	
	timeTemp.setTime(Date.parse("01/01/2010 " + startBreak3));
	timeTemp.setMinutes(timeTemp.getMinutes() + parseInt(lenBreak3, 10));

	if (timeTemp.getMinutes() < 10) {
			minute = "0" + timeTemp.getMinutes();
		 }
		else {
			minute = timeTemp.getMinutes(); 
		 }
	var endBreak3 = timeTemp.getHours() + ":" + minute;
	arr1[2].value = endBreak3;

	
	//var x[]=document.potentialInforceForm.team.value;
	//alert(x[0]);
	
	
	
//	<INPUT type="hidden" name="categoryJob" value="<%//=(potentialInforceForm.isCategoryJob())?1:0%>//">
//<INPUT type="hidden" name="workFromHome" value="<%//=(potentialInforceForm.isWorkFromHome())?1:0%>//"> 
//<INPUT type="hidden" name="trained" value="<%//=(potentialInforceForm.isTrained())?1:0%>//">
//<INPUT type="hidden" name="shiftStart" value="<%//=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getStartPotential(),"dd/MM/yyyy HH:mm")%>//">
//<INPUT type="hidden" name="shiftEnd"
	
	var actionUrl="/shf/shift/addExtraAll.do";
	dojo.xhrPost({url:actionUrl,load:returnUpdateResults,error:errorReturn,handleAs:"text",form:'addShiftFormId',contentType: "application/x-www-form-urlencoded; charset=utf-8"});
	document.getElementById("loadingImgDiv").style.display = "";
	
	//document.forms['addShiftForm'].action="/shf/shift/addExtraAll.do";
	//document.forms['addShiftForm'].target="_self";
    //document.forms['addShiftForm'].submit();
}

function returnUpdateResults(data,ioArgs){    
	 var result=data;
	 //alert(result);
	 if(result!='ok'){
     	  window.top.frMsgBar.document.location.href="/shf/msgBar.do";
      }else{
// 	  	  history.back(1);
		document.location="/shf/shift/InforcePotentialData.do";
	  }

}

function errorReturn(){
	//alert(error);
}

function exportExcel(){
	document.forms['potentialInforceForm'].action="/shf/shift/exportPotentialInforce.do";
	document.forms['potentialInforceForm'].target="_blank";
	document.forms['potentialInforceForm'].submit();
}

function selectAll(){
	arr=document.getElementsByName("selectedPotential");
	for (i = 0; i < arr.length; i++)
		arr[i].checked = true ;
	
}

function clearAll(){
	arr=document.getElementsByName("selectedPotential");
	for (var i = 0; i < arr.length; i++)
		arr[i].checked = false ;
}

function setBreaks(){
	if (!checkTimeRange()) {
		return;
	}
	var num=document.forms['potentialInforceForm'].breaksNumber.value;
	if (num==0) {
		alert("לא ניתן להגדיר הפסקות משום שלא הוזנו כל שדות החובה או משום שנבחר הערך ללא בשדה מספר הפסקות");
	} else {
		document.getElementById("breakDiv").style.visibility = "visible"; 
		document.getElementById("addBreakId").disabled='';
		document.getElementById("breaksNumber").disabled='disabled';
		document.getElementById("breakButt").disabled='disabled';
		document.getElementById("fromDateId").innerHTML="<shf:timechooser inputname='startTimeInforce' disabled='true' inputvalue='"+document.potentialInforceForm.startTimeInforce.value+"'/>";
		document.getElementById("toDateId").innerHTML="<shf:timechooser inputname='endTimeInforce' disabled='true' inputvalue='"+document.potentialInforceForm.endTimeInforce.value+"'/>";
		
		var bp = document.getElementsByName("selectedPotential");
		num = bp.length;
		for (var i=0; i<num;i++ ) {
			document.getElementById("btEdit"+i).disabled='';
			document.getElementById("check"+i).disabled='';
		}
	}
}
function setShiftsLocation(){
	var bp = document.getElementsByName("selectedPotential");
	num = bp.length;
	for (var i=0; i<num;i++ ) {
		document.getElementById("btEdit"+i).disabled='';
		document.getElementById("check"+i).disabled='';
	}
	document.getElementById("locationBtn").disabled=true;
	document.getElementById("locationDiv").style.visibility = "visible"; 
	document.getElementById('selectRemoveAll').disabled=false;
	document.getElementById('changeLctnBtn').disabled=false;
}
function changeShiftsLocation(){
	var sp = document.getElementsByName("selectedPotential");
	var locSel = document.getElementsByName("newShiftLocation")[0];
	var newVal = locSel.options[locSel.selectedIndex].value;
	var checked = false;
	
	for (var i=0; i<sp.length; i++ ) {
		var el = document.getElementById("check"+i);
		var elShfLoc = document.getElementById("shiftLocation"+i);
		var parent = elShfLoc.parentNode;
		if (el.checked){
			checked = true;
			elShfLoc.value = newVal;
			
			for(var m = 0; m < parent.childNodes.length; m++ ){
				if(parent.childNodes[m].tagName.toLowerCase() === 'span'){
					parent.childNodes[m].innerHTML = newVal === "<%=SHFConstants.SHIFT_LOCATION_HOME%>" ? "בית" : "מוקד";
					
				}
			}
			
			el.checked = false;
		}
	}	
	
}
function checkTimeRange() {
	var endPotentialOrg = document.potentialInforceForm.endTimeInforceToCheck.value;
	var endPotentialCurr = document.potentialInforceForm.endTimeInforce.value;
	var startPotentialOrg = document.potentialInforceForm.startTimeInforceToCheckId.value;
	var startPotentialCurr = document.potentialInforceForm.startTimeInforce.value;
	
	//var shiftTime = new Date();
	var date1=document.potentialInforceForm.date.value;
	var time1 =endPotentialOrg
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10); 
    var dt1  = parseInt(date1.substring(0,2),10); 
	var mon1 = parseInt(date1.substring(3,5)-1,10 );
    var yr1  = parseInt(date1.substring(6,10),10);
    if (hh==00){hh=24 }
   
    var endOrg = new Date(yr1, mon1, dt1, hh, mm);
	var time1 =endPotentialCurr
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10); 
    var dt1  = parseInt(date1.substring(0,2),10); 
	var mon1 = parseInt(date1.substring(3,5)-1,10 );
    var yr1  = parseInt(date1.substring(6,10),10);
    if (hh==00){hh=24 }
	var endCurr = new Date(yr1, mon1, dt1, hh, mm);
	
	
	
	
	//var endOrg = Date.parse("01/01/2010 " + endPotentialOrg);
	//var endCurr = Date.parse("01/01/2010 " + endPotentialCurr);
	if (endCurr > endOrg) {
		//alert(document.getElementById("startTimeInforceToCheckId").value);
		document.getElementById("startTimeInforce").value=document.getElementById("startTimeInforceToCheckId").value;
		document.getElementById("endTimeInforce").value=document.getElementById("endTimeInforceToCheckId").value;
		alert("שעות המשמרת מחוץ לטווח האפשרי");
		return false;
	} 
	
	var startOrg = Date.parse("01/01/2010 " + startPotentialOrg);
	var startCurr = Date.parse("01/01/2010 " + startPotentialCurr);
	var currentTime = new Date();
	var shiftTime = new Date();
	var date1=document.potentialInforceForm.date.value;
	var time1 = document.potentialInforceForm.startTimeInforce.value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10); 
    var dt1  = parseInt(date1.substring(0,2),10); 
	var mon1 = parseInt(date1.substring(3,5)-1,10 );
    var yr1  = parseInt(date1.substring(6,10),10);
   
    var date2 = new Date(yr1, mon1, dt1, hh, mm);
   
  	if (currentTime > date2) {
		alert("לא ניתן להגדיר משמרת בזמן עבר");
		return false;
	}
	var timeEnd=document.potentialInforceForm.endTimeInforce.value;
	var hh = parseInt(timeEnd.substring(0,2),10);
	var mm = parseInt(timeEnd.substring(3,5),10); 
	var dateEnd = new Date(yr1, mon1, dt1, hh, mm);
	//var duration=bzq.shf.utils.SHFUtils.getMinutesBetween(dateEnd,date2);
	difference = dateEnd.getTime()-date2.getTime();
	//alert("diff"+difference);
	var minutesDiff=Math.floor(difference/1000/60);
	//alert("mindiff"+minutesDiff);
	var max=document.getElementById("maxLength").value;
	//alert("diff"+difference);
	//alert(max);
	//alert(duration);	
	if(minutesDiff > max){
		//alert(document.getElementById("startTimeInforceToCheckId").value);
		document.getElementById("startTimeInforce").value=document.getElementById("startTimeInforceToCheckId").value;
		document.getElementById("endTimeInforce").value=document.getElementById("endTimeInforceToCheckId").value;
		alert("אורך המשמרת גדול מהאורך המקסימלי");
		return false;
	}
	//return false;
	//alert(document.potentialInforceForm.startTimeInforce.value);
	if (parseInt(startCurr,10) < parseInt(startOrg,10)) {
		//alert(document.getElementById("startTimeInforceToCheckId").value);
		document.getElementById("startTimeInforce").value=document.getElementById("startTimeInforceToCheckId").value;
		document.getElementById("endTimeInforce").value=document.getElementById("endTimeInforceToCheckId").value;
		alert("שעות המשמרת מחוץ לטווח האפשרי");
		return false;
	}
	
	return true;
}
function editBreak(ii) {

	clearAll();
	document.getElementById("check"+ii).checked=true;
	var num=document.forms['potentialInforceForm'].breaksNumber.value;
	
	document.getElementById("firstBreakTime0").value = document.getElementById("fromBreak1"+ii).value;
	document.getElementById("secondBreakTime0").value = document.getElementById("fromBreak2"+ii).value;
	document.getElementById("thirdBreakTime0").value = document.getElementById("fromBreak3"+ii).value;
	
	var len;
	
	var startBreak = document.getElementById("fromBreak1"+ii).value;
	var endBreak = document.getElementById("toBreak1"+ii).value;
	var lenEnd = Date.parse("01/01/2010 " + endBreak);
	var lenStart = Date.parse("01/01/2010 " + startBreak);
	len = parseInt(lenEnd,10) - parseInt(lenStart,10);
	document.getElementById("firstBreakLength").value = len/60000;
	
	
	var startBreak = document.getElementById("fromBreak2"+ii).value;
	var endBreak = document.getElementById("toBreak2"+ii).value;
	var lenEnd = Date.parse("01/01/2010 " + endBreak);
	var lenStart = Date.parse("01/01/2010 " + startBreak);
	len = parseInt(lenEnd,10) - parseInt(lenStart,10);
	document.getElementById("secondBreakLength").value = len/60000;

	
	var startBreak = document.getElementById("fromBreak3"+ii).value;
	var endBreak = document.getElementById("toBreak3"+ii).value;
	var lenEnd = Date.parse("01/01/2010 " + endBreak);
	var lenStart = Date.parse("01/01/2010 " + startBreak);
	len = parseInt(lenEnd,10) - parseInt(lenStart,10);
	document.getElementById("thirdBreakLength").value = len/60000;

//	var lenBreak2 = document.getElementById("secondBreakLength").value;
//	var lenBreak3 = document.getElementById("thirdBreakLength").value;
	
}

function goBackPoten() {
	var accept=confirm("פעולה זו תבטל כל שינוי שבוצע במסך שיבוץ נציגים");
	if (accept) {
			 history.back(1);
		} else {
			return;
		}
 	
}
function addBreak(){
	
	if (!validateBreake()) {
		return;
	}
	var bp = document.getElementsByName("selectedPotential");
//	alert(bp.length);
//	alert(document.getElementById("breaksNumber").value);
	num = bp.length;
	
	var startBreak1 = document.getElementById("firstBreakTime0").value;
	var startBreak2 = document.getElementById("secondBreakTime0").value;
	var startBreak3 = document.getElementById("thirdBreakTime0").value;
	
	var lenBreak1 = document.getElementById("firstBreakLength").value;
	var lenBreak2 = document.getElementById("secondBreakLength").value;
	var lenBreak3 = document.getElementById("thirdBreakLength").value;
	
	var timeTemp = new Date();
	
//end break 1
	timeTemp.setTime(Date.parse("01/01/2010 " + startBreak1));	
	timeTemp.setMinutes(timeTemp.getMinutes() + parseInt(lenBreak1,10));
	var minute;
	if (timeTemp.getMinutes() < 10) {
			minute = "0" + timeTemp.getMinutes();
		 }
		else {
			minute = timeTemp.getMinutes(); 
		 }
	var endBreak1 = timeTemp.getHours() + ":" + minute;
//end break 2
	
	timeTemp.setTime(Date.parse("01/01/2010 " + startBreak2));	
	timeTemp.setMinutes(timeTemp.getMinutes() + parseInt(lenBreak2,10));

	if (timeTemp.getMinutes() < 10) {
			minute = "0" + timeTemp.getMinutes();
		 }
		else {
			minute = timeTemp.getMinutes(); 
		 }
	var endBreak2 = timeTemp.getHours() + ":" + minute;
//end break 3	
	timeTemp.setTime(Date.parse("01/01/2010 " + startBreak3));
	timeTemp.setMinutes(timeTemp.getMinutes() + parseInt(lenBreak3, 10));

	if (timeTemp.getMinutes() < 10) {
			minute = "0" + timeTemp.getMinutes();
		 }
		else {
			minute = timeTemp.getMinutes(); 
		 }
	var endBreak3 = timeTemp.getHours() + ":" + minute;
	var checked = false;
	for (var i=0; i<num;i++ ) {
		if (document.getElementById("check"+i).checked){
		    checked = true;
			if(document.getElementById("breaksNumber").value > 0  ) {
				document.getElementById("fromBreak1"+i).value = startBreak1;
				document.getElementById("toBreak1"+i).value = endBreak1;
			}
			if(document.getElementById("breaksNumber").value > 1  ) {
				document.getElementById("fromBreak2"+i).value = startBreak2;
				document.getElementById("toBreak2"+i).value = endBreak2;
			}
			if(document.getElementById("breaksNumber").value > 2  ) {
				document.getElementById("fromBreak3"+i).value = startBreak3;
				document.getElementById("toBreak3"+i).value = endBreak3;
			}
			document.getElementById("check"+i).checked=false;
		}
	}
	
	if (!checked){
		alert("לא נבחרו נציגים לשיבוץ הפסקות");
	}
}

function validateBreake(){
	//validate the break are valid and exist as expected
	
	var date1=document.potentialInforceForm.date.value;
	var time1 =  document.getElementById("endTimeInforce").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10); 
    var dt1  = parseInt(date1.substring(0,2),10); 
	var mon1 = parseInt(date1.substring(3,5)-1,10 );
    var yr1  = parseInt(date1.substring(6,10),10);
    if (hh==00){hh=24 }
    var date2 = new Date(yr1, mon1, dt1, hh, mm);
    
    
	var lenBreak1 = document.getElementById("firstBreakLength").value;
	var lenBreak2 = document.getElementById("secondBreakLength").value;
	var lenBreak3 = document.getElementById("thirdBreakLength").value;





	var startPotentialCurr = document.potentialInforceForm.startTimeInforce.value;
	var endPotentialCurr = document.potentialInforceForm.endTimeInforce.value;
	var startBreak1 = document.getElementById("firstBreakTime0").value;
	var startBreak2 = document.getElementById("secondBreakTime0").value;
	var startBreak3 = document.getElementById("thirdBreakTime0").value;
	
	time1 = document.getElementById("firstBreakTime0").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10);
	//if (hh==00){dt1++ }
	var startBreakTime1 = new Date(yr1, mon1, dt1, hh, mm);
	
	time1 = document.getElementById("secondBreakTime0").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10);
	//if (hh==00){dt1++ }
	var startBreakTime2 = new Date(yr1, mon1, dt1, hh, mm);
	
	
	time1 = document.getElementById("thirdBreakTime0").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10);
	//if (hh==00){dt1++ }
	var startBreakTime3 = new Date(yr1, mon1, dt1, hh, mm);
	//alert(startBreakTime1);
	
	var timeTemp = new Date();
	timeTemp=startBreakTime1.getTime() + (parseInt(lenBreak1,10))*60*1000;
	//alert("end="+timeTemp);
	var endBreak1 =  new Date(timeTemp);
	//alert("endBreak"+endBreak1);
	
	//timeTemp=setTime(startBreakTime2);	
	timeTemp=startBreakTime2.getTime() + (parseInt(lenBreak2,10))*60*1000;
	var endBreak2 =  new Date(timeTemp);
	
	//timeTemp.setTime(startBreakTime3);	
	timeTemp=startBreakTime3.getTime() + (parseInt(lenBreak3,10))*60*1000;
	var endBreak3 =  new Date(timeTemp);
	var time1 = document.getElementById("startTimeInforce").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10); 
	var date1 = new Date(yr1, mon1, dt1, hh, mm);
	//alert(date1);
	//alert(startBreakTime1);
	//var startCurr = Date.parse("01/01/2010 " + startPotentialCurr);
	if (startBreakTime1 < date1) {
		alert("הפסקה לא חוקית, שעת תחילת הפסקה קטן משעת תחילת משמרת");
		return false;
	} 



	var time1 = document.getElementById("endTimeInforce").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10); 
	var date2 = new Date(yr1, mon1, dt1, hh, mm);
	if(document.getElementById("breaksNumber").value == 1  ) {
		if (lenBreak1 == 0) {
			alert("לא ניתן לשבץ הפסקות משום שלא הוזנו כל ההפסקות");
			return false;
		}
		if (endBreak1 > date2) {
			alert("ההפסקה האחרונה נמשכת מעבר למשמרת");
			return false;
		}
	}
	if(document.getElementById("breaksNumber").value == 2  ) {
		if (lenBreak1*lenBreak2 == 0) {
			alert("לא ניתן לשבץ הפסקות משום שלא הוזנו כל ההפסקות");
			return false;
		}
		//alert("start="+startBreakTime2);
		//alert("end="+ endBreak1);
		if (startBreakTime2 < endBreak1) {
			alert("לא ניתן לשבץ משמרות משום שהפסקות חופפות או לא בסדר הנכון");
			return false;
		}
		if (endBreak2 > date2 || endBreak1 > date2 ) {
			alert("ההפסקה האחרונה נמשכת מעבר למשמרת");
			return false;
		}
		
	}
	
	if(document.getElementById("breaksNumber").value == 3  ) {
		if (lenBreak1*lenBreak2*lenBreak3 == 0) {
			alert("לא ניתן לשבץ הפסקות משום שלא הוזנו כל ההפסקות");
			return false;
		}
		
		if (startBreakTime2 < endBreak1)  {
			alert("לא ניתן לשבץ משמרות משום שהפסקות חופפות או לא בסדר הנכון");
			return false;
		}
		
		
		
		if (startBreakTime3 < endBreak2)  {
			alert("לא ניתן לשבץ משמרות משום שהפסקות חופפות או לא בסדר הנכון");
			return false;
		}	
		if (endBreak1 > date2 || endBreak2 > date2 || endBreak3 > date2 ) {
			alert("ההפסקה האחרונה נמשכת מעבר למשמרת");
			return false;
		}	
	}
	//alert( "endbreak"+endBreak1);
	//alert("date2"+date2);
	//var endCurr = Date.parse("01/01/2010 " + endPotentialCurr);
	//alert(date2);
	//alert(endPotentialCurr);
	//alert(endBreak1);
	if ( endBreak1 > date2  ) {
		alert("הפסקה לא חוקית, שעת סיום הפסקה גדול משעת סיום משמרת");
		return false;
	} 
	
	
	return true;
}
function imposeMaxLength(Object, MaxLen)
{
  return (Object.value.length <= MaxLen);
}
function ableChooseAll(){
  //alert(document.getElementById('breaksNumber').value);
  if(document.getElementById('breaksNumber').value > 0){
  	document.getElementById('selectRemoveAll').disabled=false;
  	document.getElementById("firstBreakTime").value=document.getElementById("startTimeInforce").value;
  	document.getElementById("secondBreakTime").value=document.getElementById("startTimeInforce").value;
  	document.getElementById("thirdBreakTime").value=document.getElementById("startTimeInforce").value;
  }else{
  	document.getElementById('selectRemoveAll').disabled=true;
  }
  
}
</SCRIPT>

<bzqjs:validator>
 <bzqjs:form name="addInforceForm" />
</bzqjs:validator>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%
String hour1=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getStartPotential(),"HH:mm");
String hour2=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getStartPotential(),"HH:mm");
String hour3=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getStartPotential(),"HH:mm");

String moked=null;
String dis = "disabled";
if (potentialInforceForm!=null && potentialInforceForm.getBreaksNumber() > 0){
   dis = ""; 
}
if(potentialInforceForm!=null)
	moked=potentialInforceForm.getMoked();
%>
<BODY>
<%Vector potentialVec = potentialInforceForm.getPotentialInforceData(); %>
<%bzq.shf.bean.EmployeeBean[] emps=employeeData.getEmployee(); %>

<div id="loadingImgDiv" style="overflow:hidden; text-align:center; position: absolute; width: 100%; height: 100%; z-index: 200; background: white; filter: alpha(opacity=80); top: 1px; left: 1px; display: none;">
	<div style="vertical-align: middle; width: 200px; height: 200px; z-index: 500; border: 1px solid grey; margin-top:17%;">
		<span class="helper"></span>
		<img  alt="...המתן" src="/shf/images/wait.gif" style="width: 35%; vertical-align: middle;">
	</div>
	<div style="vertical-align: middle; width:256px;">נא להמתין בעת סנכרון עם מע' סופטפון</div>
	<span class="helper"></span>
</div>
	
<form action="/shf/shift/InforcePotentialData.do" name="potentialInforceForm" method="post">
<TABLE width="100%" height="80%" cellpadding="0" cellspacing="0" >
	<TR>
		<TD dir="rtl" valign="top" width="100%"><jsp:include
			page="submenu/shift_submenu.jsp" /></TD>
	</TR>

	<TR>
		<TD width="100%" valign="top" style="padding: 6px 0px 6px 6px;">
		<FIELDSET class="form">
		<INPUT type="hidden" name="maxLength"  id="maxLength" value='<%=potentialInforceForm.getMaxLength()%>'/>
		<LEGEND>שיבוץ נציגים למשמרת תגבור</LEGEND>
			<TABLE cellspacing="5" width="100%">
			<TR>
				<td>
					<table>
						<tr>
							<TD class="header">תאריך:</TD>
							<TD id="dDateId">
								<shf:calendar calname='date' name='potentialInforceForm' property='date' disabled="true" />
							</TD>
							<TD width="15px"></TD>
								
							<TD class="header">משעה:
								<INPUT type="hidden" name="startTimeInforceToCheck"  id="startTimeInforceToCheckId" value='<%=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getStartTimeInforceToCheck(),"HH:mm")%>'/>
							</TD>
							<TD id="fromDateId">
								<shf:timechooser  inputvalue='<%=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getStartTimeInforce(),"HH:mm")%>' inputname="startTimeInforce"   />								
							</TD>
							<TD width="15px"></TD>
							<TD class="header" nowrap="nowrap">עד שעה:
								<INPUT type="hidden" name="endTimeInforceToCheck"  id="endTimeInforceToCheckId" value='<%=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getEndTimeInforceToCheck(),"HH:mm")%>'/>
								<INPUT type="hidden" name="moked"  id="moked" value='<%=potentialInforceForm.getMoked()%>'/>
							
							</TD>
							<TD id="toDateId">
								<shf:timechooser inputvalue='<%=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getEndTimeInforce(),"HH:mm")%>' inputname="endTimeInforce"  />
							</TD>
							<TD width="15px"></TD>
							
							<TD class="header"  valign="top">תור:</TD>
							<TD id="activityAjaxResult"  valign="top" colspan="2">
								<%if(moked==null||moked.equals("-1")){%>
								<shf:activityselect tablename="activityCode" name="activity" 
								selectedName="potentialInforceForm" selectedProperty="activity"  
								logic=" disabled " style="width:170px;font-size:10px;"  />
								 <%}else{%>
								<shf:activityselect tablename="activityCode" name="activity" 
								selectedName="potentialInforceForm" selectedProperty="activity"  
								moked="<%=moked%>" style="width:170px;font-size:10px;" logic="onchange=disable();");/>
								 <%}%>
							</TD>
							<TD width="150px"></TD>
							<td  class="header" valign="top">מספר הפסקות:</td>
							
							<TD valign="top">
								<select style="height:18px;font-size:10px;" name="breaksNumber" id="breaksNumber" onchange="changeBreaksNumber(potentialInforceForm);ableChooseAll()">
								<option value="0" <%if(shiftInforce.getBreaksNumber()==0){%> selected="selected" <%}%> >ללא</option>
								<option value="1" <%if(shiftInforce.getBreaksNumber()==1){%> selected="selected" <%}%> >1</option>
								<option value="2" <%if(shiftInforce.getBreaksNumber()==2){%> selected="selected" <%}%> >2</option>
								<option value="3" <%if(shiftInforce.getBreaksNumber()==3){%> selected="selected" <%}%> >3</option>
								</select>
							</TD>
							
						</tr>
					</table>
				</td>	
			</TR>
			<TR>
				<td>
					<table>
						<tr>
							<TD width="15px"></TD>
							<td  class="header" valign="top">הערה:</td>
							<td colspan=2><html:textarea property="remark" name="shiftInforce" cols="100" rows="1"  onkeypress="return imposeMaxLength(this, 100);" ></html:textarea> </td>
							<TD width="40px"></TD>
							<TD align="left"><button onclick="setBreaks();" id="breakButt" >הגדר הפסקות </button></TD>
							<TD width="40px"></TD>
							<TD align="left"><button onclick="setShiftsLocation();" id="locationBtn" >הגדר מיקום </button></TD>
						</tr>
					</table>
				</td>
			</TR>
			</TABLE>

		</FIELDSET>
		</TD>
	</TR>
	<%if (potentialVec != null && potentialVec.size() > 0)  {%>
	<tr>
		<td>
			<table cellspacing="0" cellpadding="0" width="100%" border="0"
				style="border-top: 1px silver solid; border-left: 1px silver solid; border-right: 1px silver solid;" >
				<tr style="tableTotal">
				<TD style="text-align: right;" class="tableTotal" width="150px">
				<img src='/shf/images/search.png' height="16px"> נמצאו <%=potentialVec.size()%>
				רשומות</TD>
				
					<TD style="text-align: right;" class="tableTotal" width="50px"> בחר הכל</TD>
				<td style="text-align: right;" class="tableTotal" >
				<input type="checkbox" value="0" id="selectRemoveAll" onclick="javascript:change(this);" <%=dis%>>
				</TD>
			</TR>
		</TABLE>
		</td>
	</tr>	
	<%} %>
	<TR>
		<TD height="100%" width="100%" valign="top" style="padding: 6px 6px 6px 6px;">
			<table height="100%" width="100%" cellpadding="0" cellspacing="0">
				<TR>
					<!-- TD valign="top" height="100%" width="100%" >
						<iframe id="inforceOptionsFrame" frameborder="0" width="100%" height="100%" scrolling="auto" name="inforceOptionsFrame"></iframe>
					</TD-->
					<td valign="top" height="100%" style="padding: 0px 7px 7px 7px;" dir="ltr">
						<div style="overflow:auto;border:1px silver solid;height:100%;"
							id="dataGridDiv"><jsp:include page="shift_inforce_potential_tableAdd.jsp"></jsp:include>
						</div>
					</td>
				</TR>
			</table>
			
		</TD>
	</TR>
</TABLE>
<table  width="100%" height="20%" cellpadding="0" cellspacing="0" border="0">
		<tr>
			<td class="header" style="border-style: solid; border-width: 1px 1px 0px 1px;border-color: lightgray;">הפסקות:</td>
			<td class="header" style="border-style: solid; border-width: 1px 1px 0px 1px;border-color: lightgray;">מיקום:</td>
		</tr>
		<tr>
			<td style="border-style: solid; border-width: 0px 1px 0px 1px;border-color: lightgray;">&nbsp;
				<div id="breakDiv" style="visibility : hidden;">
					<TABLE dir="rtl">
						<TR id="break1" <%if(shiftInforce.getBreaksNumber()<1){%>style="display=none;" <%}%>><TD class="header">הפסקה ראשונה:</TD><TD><shf:timechooser inputname="firstBreakTime" inputvalue="<%=hour1%>" /></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="firstBreakLength" id="firstBreakLength" value="<bzq:integer name="potentialInforceForm" property="firstBreakLength"/>"></TD></TR>
						<TR id="break2" <%if(shiftInforce.getBreaksNumber()<2){%>style="display=none;" <%}%>><TD class="header">הפסקה שנייה:</TD><TD><shf:timechooser inputname="secondBreakTime" inputvalue="<%=hour2%>"/></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="secondBreakLength" id="secondBreakLength" value="<bzq:integer name="potentialInforceForm" property="secondBreakLength"/>"></TD></TR>
						<TR id="break3" <%if(shiftInforce.getBreaksNumber()<3){%>style="display=none;" <%}%>><TD class="header">הפסקה שלישית:</TD><TD><shf:timechooser inputname="thirdBreakTime" inputvalue="<%=hour3%>"/></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="thirdBreakLength" id="thirdBreakLength" value="<bzq:integer name="potentialInforceForm" property="thirdBreakLength"/>"></TD></TR>
					</TABLE>
				</div>	
			</td>
			<td  style="border-style: solid; border-width: 0px 1px 0px 1px;border-color: lightgray;">&nbsp;
				<div id="locationDiv" style="visibility : hidden;text-align: center;">
					<shf:shiftLocationSelectTag name="newShiftLocation"/>
				</div>
			</td>
		</tr>
		<tr>
			<td align="left" width="34%" style="border-style: solid; border-width: 0px 1px 1px 1px;border-color: lightgray;"><button style="width: 100px;" id="addBreakId" disabled="disabled" onclick="addBreak();">שבץ הפסקות </button></td>
			<td align="left" width="26%" style="border-style: solid; border-width: 0px 1px 1px 1px;border-color: lightgray;"><button style="width: 100px;" id="changeLctnBtn" disabled="disabled" onclick="changeShiftsLocation();">שבץ מיקום </button></td>
			<td align="left" width="20%"><button style="width: 150px;" onclick="goBackPoten()">חזרה לפוטנציאל נציגים</button></td>
			<td align="left" width="20%"><button style="width: 50px;" onclick="addInforceReq();">סיום </button></td>
		</tr>



<!-- 	<tr> -->
<!-- 		<td colspan="4" valign="top" style="padding: 6px 6px 6px 6px;"> -->
<!-- 			<table height="100%" width="100%" cellpadding="0" cellspacing="0" > -->
<!-- 				<tr> -->
<!-- 					<td class="header" width="33%">הפסקות:</td> -->
<!-- 					<td class="header" width="33%">מיקום:</td> -->
<!-- 					<td width="33%"></td> -->
<!-- 				</tr> -->
<!-- 			</table> -->
<!-- 		</td> -->
<!-- 	</tr> -->
<!-- 	<tr> -->
<!-- 		<TD  style="padding-top:20px;" height="100%" width="100%"> -->
<!-- 		<div id="breakDiv" style="display: none;"> -->
<!-- 			<TABLE dir="rtl"> -->
<%-- 				<TR id="break1" <%if(shiftInforce.getBreaksNumber()<1){%>style="display=none;" <%}%>><TD class="header">הפסקה ראשונה:</TD><TD><shf:timechooser inputname="firstBreakTime" inputvalue="<%=hour1%>" /></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="firstBreakLength" id="firstBreakLength" value="<bzq:integer name="potentialInforceForm" property="firstBreakLength"/>"></TD></TR> --%>
<%-- 				<TR id="break2" <%if(shiftInforce.getBreaksNumber()<2){%>style="display=none;" <%}%>><TD class="header">הפסקה שנייה:</TD><TD><shf:timechooser inputname="secondBreakTime" inputvalue="<%=hour2%>"/></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="secondBreakLength" id="secondBreakLength" value="<bzq:integer name="potentialInforceForm" property="secondBreakLength"/>"></TD></TR> --%>
<%-- 				<TR id="break3" <%if(shiftInforce.getBreaksNumber()<3){%>style="display=none;" <%}%>><TD class="header">הפסקה שלישית:</TD><TD><shf:timechooser inputname="thirdBreakTime" inputvalue="<%=hour3%>"/></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="thirdBreakLength" id="thirdBreakLength" value="<bzq:integer name="potentialInforceForm" property="thirdBreakLength"/>"></TD></TR> --%>
<!-- 			</TABLE> -->
<!-- 		</div>	 -->
<!-- 		</TD> -->
			
<!-- 		<TD width="350px"></TD>	 -->
<!-- 	</tr> -->
<!-- 	<tr> -->
<!-- 		<TD  colspan="4" valign="top" style="padding: 6px 6px 6px 6px;"> -->
<!-- 			<table height="100%" width="100%" cellpadding="0" cellspacing="0" > -->
<!-- 				<tr> -->
					<TD width="50px"></TD>
<!-- 					<TD align="left" width="32%"><button style="width: 100px;" id="addBreakId" disabled="disabled" onclick="addBreak();">שבץ הפסקות </button></TD> -->
<!-- 					<TD align="left" width="32%"><button style="width: 100px;" id="addBreakId" disabled="disabled" onclick="addBreak();">שבץ מיקום </button></TD> -->
<!-- 					<TD align="left" width="8%"><button style="width: 150px;" onclick="goBackPoten()">חזרה לפוטנציאל נציגים</button></TD> -->
<!-- 					<TD align="left" width="8%"><button style="width: 50px;" onclick="addInforceReq();">סיום </button></TD> -->
					<TD width="50px"></TD>
<!-- 				</TR> -->
<!-- 			</table> -->
<!-- 		</TD> -->
<!-- 	</tr> -->
</table>
</form>

<FORM name="addShiftForm" id="addShiftFormId" action="/shf/shift/addExtraAll.do" method="post">
<INPUT type="hidden" name="moked">
<INPUT type="hidden" name="remark">
<INPUT type="hidden" name="activity">
<INPUT type="hidden" name="breakStart" id="0">
<INPUT type="hidden" name="breakStart" id="1">
<INPUT type="hidden" name="breakStart" id="2">
<INPUT type="hidden" name="breakEnd" id="0">
<INPUT type="hidden" name="breakEnd" id="1">
<INPUT type="hidden" name="breakEnd" id="2">
<INPUT type="hidden" name="breaksNumber" >
<INPUT type="hidden" name="employeeId" >
<INPUT type="hidden" name="idNumber" > 
<INPUT type="hidden" name="shiftStart" >
<INPUT type="hidden" name="shiftEnd" >
<INPUT type="hidden" name="date" >


<%
EmployeeBean empRow = new EmployeeBean();
if ((potentialInforceForm.getPotentialInforceData() != null)) {
int s = potentialInforceForm.getPotentialInforceData().size();
for(int i=0;i<s;i++){
	
	employeeInforce = (PotentialEmployeeBean)potentialInforceForm.getPotentialInforceData().get(i);
	empRow = employeeInforce.getEmployeeBean();
	
%>
	<input name="breakPotentialAll" type="hidden" id=bs1<%=i%>>
	<input name="breakPotentialAll" type="hidden" id=be1<%=i%>>
	<input name="breakPotentialAll" type="hidden" id=bs2<%=i%>>
	<input name="breakPotentialAll" type="hidden" id=be2<%=i%>>
	<input name="breakPotentialAll" type="hidden" id=bs3<%=i%>>
	<input name="breakPotentialAll" type="hidden" id=be3<%=i%>>
	<input name="shiftLocationAll" type="hidden" id=shfLoc<%=i%>>
	<input name="employeeIdPotentialAll" type="hidden" id=empId<%=i%> value=<%=empRow.getEmployeeId()%>>
	<input name="idNumberPotentialAll" type="hidden" id=idNum<%=i%> value=<%=empRow.getIdNumber().substring(0,8)%>>
	
<%
	}
	
}
%>
<%
if ((potentialInforceForm.getInnerJob() != null)) {

	for(int ii=0;ii<potentialInforceForm.getInnerJob().length;ii++){
%>
	<input name="innerJob" type="hidden" value="<%=potentialInforceForm.getInnerJob()[ii]%>" id=<%=ii%>>
<%
	}
}
%>
</FORM>
</BODY>
</HTML>
