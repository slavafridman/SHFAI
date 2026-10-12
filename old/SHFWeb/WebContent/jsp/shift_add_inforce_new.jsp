<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="shiftInforce"
	class="bzq.shf.forms.ShiftInforceRequestForm" 
	scope="request"></jsp:useBean>


<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<%@page import="bzq.utils.BaseConvert"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>shift_add_inforce_new.jsp</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/breakjs.js"></script>
<SCRIPT>
function disable(){
    var originalNumOfAgent;
	var numOfAgent;
	var activity;
	var breaks;
	originalNumOfAgent=document.getElementById('originalNumOfAgents').value;
	numOfAgent=document.getElementById('numOfAgents').value;
	activity=document.getElementById('activity').value;
	breaks=document.getElementById('breaks').value;
	if (document.addInforceForm.activity.value != null){
	    activity= document.addInforceForm.activity.value;
	}
	var dis=true;
	if(originalNumOfAgent != 0 &&  activity != null && activity !=0 ){
		dis=false;			
	}
	var id  = document.addInforceForm.id.value;
	if(id == null || id == 0 ){
 	  document.getElementById('okButton').disabled=dis;
 	}else if (id != null && numOfAgent!=0 ){  
 	 document.getElementById('updateButton').disabled=true;
 	 document.getElementById('activity').disabled=true;
 	 document.getElementById('firstBreakTime').disabled=true;
 	 document.getElementById('secondBreakTime').disabled=true; 
 	 document.getElementById('thirdBreakTime').disabled=true; 
 	 document.getElementById('shiftStart').disabled=true; 
 	 document.getElementById('shiftEnd').disabled=true;
 	 document.getElementById('firstBreakLength').disabled=true; 
 	 document.getElementById('secondBreakLength').disabled=true; 
 	 document.getElementById('thirdBreakLength').disabled=true;
 	 document.getElementById('breaksNumber').disabled=true; 
 	  
 	 }
 	 if (document.addInforceForm.originalNumOfAgents.value > 0){
 	 	document.getElementById('updateButton').disabled=false;
 	 }
 	 
}

function checkBreak(){
	var breakNumber1=document.addInforceForm.firstBreakTime.value;
	var breakNumber2=document.addInforceForm.secondBreakTime.value;
	var breakNumber3=document.addInforceForm.thirdBreakTime.value;
	var numberOfBreak=document.addInforceForm.breaksNumber.value;
	if((document.addInforceForm.breaksNumber.value == 1 && document.addInforceForm.firstBreakLength.value == 0) ||
	(document.addInforceForm.breaksNumber.value == 2 && document.addInforceForm.secondBreakLength.value == 0) ||
	(document.addInforceForm.breaksNumber.value == 3 && document.addInforceForm.thirdBreakLength.value == 0)){
	alert("יש לרשום את אורך ההפסקה");
		return false;
	}
	var date1=document.addInforceForm.date.value;
	var time1 =  document.getElementById("shiftEnd").value;
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
	var startBreak1 = document.getElementById("firstBreakTime").value;
	var startBreak2 = document.getElementById("secondBreakTime").value;
	var startBreak3 = document.getElementById("thirdBreakTime").value;
	time1 = document.getElementById("firstBreakTime").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10);
	var startBreakTime1 = new Date(yr1, mon1, dt1, hh, mm);
	time1 = document.getElementById("secondBreakTime").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10);
	var startBreakTime2 = new Date(yr1, mon1, dt1, hh, mm);
	time1 = document.getElementById("thirdBreakTime").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10);
	var startBreakTime3 = new Date(yr1, mon1, dt1, hh, mm);
	var timeTemp = new Date();
	timeTemp=startBreakTime1.getTime() + (parseInt(lenBreak1,10))*60*1000;
	var endBreak1 =  new Date(timeTemp);
	timeTemp=startBreakTime2.getTime() + (parseInt(lenBreak2,10))*60*1000;
	var endBreak2 =  new Date(timeTemp);
	timeTemp=startBreakTime3.getTime() + (parseInt(lenBreak3,10))*60*1000;
	var endBreak3 =  new Date(timeTemp);
	var time1 = document.getElementById("shiftStart").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10); 
	var date1 = new Date(yr1, mon1, dt1, hh, mm);
	
	if (startBreakTime1 < date1 && document.getElementById("breaksNumber").value >0) {
		alert("הפסקה לא חוקית, שעת תחילת הפסקה קטן משעת תחילת משמרת");
		return false;
	} 
	var time1 = document.getElementById("shiftEnd").value;
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
	
	if ( endBreak1 > date2  ) {
		alert("הפסקה לא חוקית, שעת סיום הפסקה גדול משעת סיום משמרת");
		return false;
	} 
	return true;
		
}
function submitUpdateInforce(){
	if(!isValidTime(document.addInforceForm.shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return false;
	}
	if(!isValidTime(document.addInforceForm.shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return false;
	}
	var startTime='<bzq:time name="shiftInforce" property="shiftStart" pattern="HH:mm"></bzq:time>';
	var myStartTime=document.addInforceForm.shiftStart.value;
	var endTime='<bzq:time name="shiftInforce" property="shiftEnd" pattern="HH:mm"></bzq:time>';
	var myEndTime=document.addInforceForm.shiftEnd.value;
	if(myStartTime < startTime){
	
		alert("זמן ההתחלה אינו יכול להיות מוקדם יותר ממה שנבחר במסך הקודם" );
		document.addInforceForm.shiftStart.value='<bzq:time name="shiftInforce" property="shiftStart" pattern="HH:mm"></bzq:time>';
		return false;
	}
	if(myEndTime > endTime){
	
		alert("זמן הסיום אינו יכול להיות מאוחר יותר ממה שנבחר במסך הקודם" );
		document.addInforceForm.shiftEnd.value='<bzq:time name="shiftInforce" property="shiftEnd" pattern="HH:mm"></bzq:time>';
		return false;
	}
	var moked=document.addInforceForm.moked.value;
	if(document.addInforceForm.activity.value=='00' || document.addInforceForm.activity.value==''){
		alert("צריך לבחור תור");
		return false;
	}
	submitAddInforceForm();
	
}
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
	
	if(!isValidTime(document.forms['addInforceForm'].shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.forms['addInforceForm'].shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if (validateAddInforceForm(document.all.addInforceForm)) {   
		document.forms['addInforceForm'].action="/shf/employee/searchForInforce.do";
		document.forms['addInforceForm'].target="inforceOptionsFrame";
        document.forms['addInforceForm'].submit();     
	}
}
function submitAddInforceForm(){
	if (!checkBreak()) {
	  	return;
	}
	var id  = document.addInforceForm.id.value;
	var startTime='<bzq:time name="shiftInforce" property="shiftStart" pattern="HH:mm"></bzq:time>';
	var myStartTime=document.addInforceForm.shiftStart.value;
	if(!isValidTime(document.addInforceForm.shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.addInforceForm.shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	
	 var calNumOfAgents;
 	 var originalNumOfAgents='<bzq:integer name="shiftInforce" property="originalNumOfAgents" ></bzq:integer>';
 	 var numOfAgents='<bzq:integer name="shiftInforce" property="numOfAgents" ></bzq:integer>';
 	
	if (document.getElementById('originalNumOfAgents').value == 0 && id!=null && id!=0){
		alert("לא ניתן לאפס את כמות הנציגים, יש אפשרות לבטל את המשמרת");
		document.getElementById('originalNumOfAgents').value='<bzq:integer name="shiftInforce" property="originalNumOfAgents" ></bzq:integer>';
		return;
	}
	if (document.getElementById('originalNumOfAgents').value < numOfAgents && id!=null && id!=0){
		alert("לא ניתן להקטין את כמות הנציגים כוון שקיימים נציגים במשמרת");
		document.getElementById('originalNumOfAgents').value='<bzq:integer name="shiftInforce" property="originalNumOfAgents" ></bzq:integer>';
		return;
	}
	
	var date1=document.addInforceForm.date.value;
	var time1 =  document.getElementById("shiftStart").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10); 
    var dt1  = parseInt(date1.substring(0,2),10); 
	var mon1 = parseInt(date1.substring(3,5)-1,10 );
    var yr1  = parseInt(date1.substring(6,10),10);
    var shiftStart = new Date(yr1, mon1, dt1, hh, mm);
    var time1 =  document.getElementById("shiftEnd").value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10);
	 if (hh==00){hh=24 } 
	var shiftEnd = new Date(yr1, mon1, dt1, hh, mm);
	if(document.addInforceForm.remark.value==null){
    	document.addInforceForm.remark.value="";
    }
	if (validateAddInforceForm(document.all.addInforceForm)) {
		document.forms['addInforceForm'].action="/shf/shift/inforceShift.do";
		document.forms['addInforceForm'].target="";
		document.forms['addInforceForm'].submit();     
	}
}



function change(checkItem)	{
	if(checkItem.value=='0')
		checkItem.value='1'
	else	
		checkItem.value='0'
}

function checkTime(){
	
}
function imposeMaxLength(Object, MaxLen)
{
  return (Object.value.length <= MaxLen);
}

</SCRIPT>
<bzqjs:validator>
 <bzqjs:form name="addInforceForm" />
</bzqjs:validator>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%
//java.util.Date startTime= null;
//java.util.Date endTime= null;
//startTime = shiftInforce.getShiftStart();
//endTime = shiftInforce.getShiftEnd();
String hour1=bzq.utils.BaseConvert.dateToString(shiftInforce.getShiftStart(),"HH:mm");
String hour2=bzq.utils.BaseConvert.dateToString(shiftInforce.getShiftStart(),"HH:mm");
String hour3=bzq.utils.BaseConvert.dateToString(shiftInforce.getShiftStart(),"HH:mm");
String dis="disabled";

//String disUpdate="";
//if(shiftInforce!=null && shiftInforce.getId() > 0){
//	disUpdate="true";
//}
String[] team=shiftInforce.getTeam();
String[] innerJob=shiftInforce.getInnerJob();

//String startHour=null;
//String endHour=null;
//startHour=BaseConvert.dateToString(shiftInforce.getShiftStart(), "HH:mm");
//endHour=BaseConvert.dateToString(shiftInforce.getShiftEnd(), "HH:mm");
if(shiftInforce.getBreaksNumber()>0 && shiftInforce.getFirstBreakTime()!=null ) hour1=shiftInforce.getFirstBreakTime();
if(shiftInforce.getBreaksNumber()>1 && shiftInforce.getSecondBreakTime()!=null ) hour2=shiftInforce.getSecondBreakTime();
if(shiftInforce.getBreaksNumber()>2 && shiftInforce.getThirdBreakTime()!=null ) hour3=shiftInforce.getThirdBreakTime();

String moked=null;
if(shiftInforce!=null)
	moked=shiftInforce.getMoked();
%>
<BODY onload="disable();">

<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TR>
		<TD dir="rtl" valign="top" width="100%"><jsp:include
			page="submenu/shift_submenu.jsp" /></TD>
	</TR>

	<TR>
		<TD width="100%" valign="top" style="padding: 6px 6px 6px 6px;">
		<FIELDSET class="info">
		<%if(shiftInforce!=null && shiftInforce.getId()>0){%>
		<LEGEND>עדכון משמרת למאגר תגבור</LEGEND>
		<%}else{%>
		<LEGEND>הוספת משמרת למאגר תגבור</LEGEND>
		<%}%>
		<form action="/shf/shift/inforceShift.do" name="addInforceForm" method="post">
		<input name="moked" type="hidden" value="<bzq:string name="shiftInforce" property="moked"></bzq:string>">
		<input name="numOfAgents" type="hidden" value="<bzq:integer name="shiftInforce" property="numOfAgents"></bzq:integer>">
		<input name="trained" type="hidden" value="<bzq:integer name="shiftInforce" property="trained"></bzq:integer>">
		<input name="workFromHome" type="hidden" value="<bzq:integer name="shiftInforce" property="workFromHome"></bzq:integer>">
		<input name="categoryJob" type="hidden" value="<bzq:integer name="shiftInforce" property="categoryJob"></bzq:integer>">
		<%if(shiftInforce.getTeam()!= null){
			for (int k=0; k<shiftInforce.getTeam().length; k++) { %>
			<input type=hidden value="<%=shiftInforce.getTeam()[k]%>" name="team" id=<%=k%>>
			<%}}%>
		<%if(shiftInforce.getInnerJob()!= null){
			for (int m=0; m<shiftInforce.getInnerJob().length; m++) { %>
			<input type=hidden value="<%=shiftInforce.getInnerJob()[m]%>" name="innerJob" id=<%=m%>>
		<%}}%>
			<%if(shiftInforce!=null && shiftInforce.getId()>0){%>
			<input name="mode" type="hidden" value="update">
			<input name="id" type="hidden" value="<bzq:integer name="shiftInforce" property="id"></bzq:integer>">
			<input name="addedShiftsNum" type="hidden" value="<bzq:integer name="shiftInforce" property="addedShiftsNum"></bzq:integer>">
			<%}else{%>
			<input name="mode" type="hidden" value="add">
			<%}%>
			<!--input name="originalNumOfAgents" type="hidden"-->
			<TABLE cellspacing="5">
			<TR>
				<TD class="header">תאריך:</TD>
				<TD>
				<shf:calendar calname="date" name="shiftInforce" property="date" marginBottom="53"  disabled="true" />
				
				</TD>
				<TD class="header">מוקד:</TD>
				
				<TD class="data">
					<shf:unitselect tablename="unitCode" name="moked"
					selectedName="shiftInforce" selectedProperty="moked"
					style="width:170px;font-size:10px;"
					type="G01" all="yes" disabled="true"/>
					
				</TD>
				<TD  nowrap="nowrap" class="header">צוות :</TD>
				<td  align="right" >
				
						<select  style="width: 200px" name ="teamSelect" >
							<%if(team!=null && team[0].equals("00") ){
							%><option  style="size:20;" value="0">הכל</option> <%}%> 	
						    <%if(team!=null && team.length!=0 ){
						    	for(int j=0;j<team.length;j++){
						    	%>
						        <option style="size:20;" value="j"><%=bzq.shf.utils.SHFTableUtils.getUnitName(team[j])%> </option>
						      <%}}%>    
						</select>
				</td>
				
				<!-- TD  class="header">צוות:</TD>
				<TD class="data" id="teamsAjaxResult" width="22">
					<shf:orgunitCheckList parentUnit="<%=moked%>" name="shiftInforce" type="J01" property="team" optionsLength="200" length="160" disabled="true"></shf:orgunitCheckList> 
				</TD-->
				<TD  nowrap="nowrap" class="header">תפקיד בפועל:</TD>
				<td  align="right" >
						<select style="width: 200px" name ="jobSelect">
							<%if(innerJob!= null && (innerJob[0].equals("00")|| innerJob[0].equals("0"))){%>
								<option  style="size:20;" value="0">הכל</option><%} %>
							<%if(innerJob!= null && innerJob.length!=0){
						    	for(int j=0;j<innerJob.length;j++){
						    	%>
						        <option style="size:20; value="j"><%=bzq.shf.utils.SHFTableUtils.getInnerJobName(innerJob[j])%></option>
						    <%}}%>    
						</select>
				</td>
				<!--  >TD class="data" valign="middle">
					<shf:innerJobCheckList name="shiftInforce" tablename="innerJobCode" property="innerJob" />
				
				</TD-->
				<TD width="5px"></TD>
			</TR>
			</TABLE> 
			<TABLE cellspacing="5">
			<TR>
				<TD nowrap="nowrap" class="header" >לא מסורתי :
				<input type="checkbox" inputname="trained"  onclick="return false;"
				<% if(shiftInforce.getTrained()==1){%>	checked="checked" <%}%>/>
				</TD>
				<TD width="10px"></TD>
				<TD  nowrap="nowrap" class="header" > עובד מהבית  :
				<input type="checkbox" inputname="workFromHome"  onclick="return false;"
				<% if(shiftInforce.getWorkFromHome()==1){%>	checked="checked" <%}%>/>
				</TD>
				<TD width="10px"></TD>
						
				<TD  nowrap="nowrap" class="header">כולל בכירים/מומחים :
				<input type="checkbox" inputname="categoryJob"  onclick="return false;" 
				<% if(shiftInforce.getCategoryJob()==1){%>	checked="checked" <%}%>/>
				</TD>
				</TR>
			</TABLE>
			
			<TABLE cellspacing="5">
			<br>
			<tr>
			<TD class="header"  valign="top">תור:</TD>
				<TD id="activityAjaxResult"  valign="top" colspan="2">
					
					<%if(moked==null||moked.equals("-1")){%>
					<shf:activityselect tablename="activityCode" name="activity" 
					selectedName="shiftInforce" selectedProperty="activity"  
					logic=" disabled" style="width:170px;font-size:10px;"  />
					 <%}else{%>
					<shf:activityselect tablename="activityCode" name="activity" 
					selectedName="shiftInforce" selectedProperty="activity" 
					moked="<%=moked%>" style="width:170px;font-size:10px;" logic='onchange=disable(); '; />
					<%}%>
					
				</TD>
				
				<td  class="header" valign="top">הערה:</td>
				<td colspan=2><html:textarea  property="remark" name="shiftInforce" cols="30" rows="4"  onkeypress="return imposeMaxLength(this, 100);"  ></html:textarea> </td>
							
			</tr>
			</br>
			</TABLE> 
			<TABLE >	
			<TR>
				<TD class="header">משעה:</TD>
				<TD><shf:timechooser  inputvalue='<%=BaseConvert.dateToString(shiftInforce.getShiftStart(),"HH:mm")%>' inputname="shiftStart"   /></TD>
				<TD class="header">עד שעה:</TD>
				<TD><shf:timechooser inputvalue='<%=BaseConvert.dateToString(shiftInforce.getShiftEnd(),"HH:mm")%>' inputname="shiftEnd"  /></TD>
				<TD class="header">כמות נציגים:</TD>
				<TD><input type="text" maxlength="2" name="originalNumOfAgents"
				style="width:30px;height:18px;font-size:10px;" onblur="disable();" 
				value="<bzq:integer name="shiftInforce" property="originalNumOfAgents"/>">
				</TD>
				
				
			</TR>
			</TABLE> 
			<TABLE cellspacing="5">		
			<br>
			<TR>
				
				<TD nowrap="nowrap" class="header">מספר ההפסקות:</TD>
				<TD width="10px"></TD>
				<TD>
					<select style="height:18px;font-size:10px;" name="breaksNumber" onchange="changeBreaksNumber(addInforceForm);" id="breaks" onblur="disable();" >
					<option value="0" <%if(shiftInforce.getBreaksNumber()==0){%> selected="selected" <%}%> >ללא</option>
					<option value="1" <%if(shiftInforce.getBreaksNumber()==1){%> selected="selected" <%}%> >1</option>
					<option value="2" <%if(shiftInforce.getBreaksNumber()==2){%> selected="selected" <%}%> >2</option>
					<option value="3" <%if(shiftInforce.getBreaksNumber()==3){%> selected="selected" <%}%> >3</option>
					</select>
				</TD>
			</TR>
			<!--   ======  הפסקות ======   -->
			<TR>
				<TD colspan="10" style="padding-top:20px;">
					<TABLE dir="rtl">
					<TR id="break1" <%if(shiftInforce.getBreaksNumber()<1){%>style="display=none;"  <%}%>>
					<TD class="header">הפסקה ראשונה:</TD>
					<TD ><shf:timechooser inputname="firstBreakTime" inputvalue="<%=hour1%>" /> </TD>
					<TD width="10px"></TD>
					<TD class="header">אורך הפסקה:</TD>
					<TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="firstBreakLength"   value="<bzq:integer name="shiftInforce" property="firstBreakLength" />"></TD></TR>
					<TR id="break2" <%if(shiftInforce.getBreaksNumber()<2){%>style="display=none;" <%}%>>
					<TD class="header">הפסקה שנייה:</TD>
					<TD><shf:timechooser inputname="secondBreakTime" inputvalue="<%=hour2%>"/></TD>
					<TD width="10px"></TD><TD class="header">אורך הפסקה:</TD>
					<TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="secondBreakLength"  value="<bzq:integer name="shiftInforce" property="secondBreakLength"/>"></TD></TR>
					<TR id="break3" <%if(shiftInforce.getBreaksNumber()<3){%>style="display=none;" <%}%>>
					<TD class="header">הפסקה שלישית:</TD>
					<TD><shf:timechooser inputname="thirdBreakTime" inputvalue="<%=hour3%>"/></TD>
					<TD width="10px"></TD><TD class="header">אורך הפסקה:</TD>
					<TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="thirdBreakLength"  value="<bzq:integer name="shiftInforce" property="thirdBreakLength"/>"></TD></TR>
					</TABLE>
				</TD>
			</TR>
			</br>
			</TABLE>
			<TABLE cellspacing="5">
			<!--   ======  כפתורים ======   -->
			<TR>
				<!--  TD><button onclick="showInforceOptionals();">חפש נציגים</button></TD-->
				<TD colspan="11" align="center">
				<%if(shiftInforce!=null && shiftInforce.getId()>0){%>
				<button id=updateButton onclick="submitAddInforceForm();">עדכן</button>&nbsp;
				<%}else{%>
				<button id=okButton onclick="submitAddInforce();">אישור</button>&nbsp;
				
				<button onclick="history.go(-1);">חזור</button>
				<%}%>
				</TD>
			</TR>
			</TABLE>
		</form>
		</FIELDSET>
		</TD>
	</TR>
	
	<TR>
		<TD height="100%" width="100%" valign="top" style="padding: 6px 6px 6px 6px;">
			<table height="100%" width="100%" cellpadding="0" cellspacing="0">
				<TR>
					<TD valign="top" height="100%" width="100%" >
						<iframe id="inforceOptionsFrame" frameborder="0" width="100%" height="100%" scrolling="auto" name="inforceOptionsFrame"></iframe>
					</TD>
				</TR>
			</table>
		</TD>
	</TR>
	
</TABLE>
</BODY>
</HTML>
