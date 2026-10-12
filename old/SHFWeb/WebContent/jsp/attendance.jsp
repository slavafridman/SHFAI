<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean
	id="attendanceForm"
	class="bzq.shf.forms.EmployeeArriveForm"
	scope="request">
</jsp:useBean>
<jsp:useBean
	id="shifts_list"
	class="java.util.Vector"
	scope="request">
</jsp:useBean>

<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="bzq.shf.utils.TablesConstants"%>
<%@page import="bzq.shf.utils.SHFUtils"%>

<HTML>
<HEAD>
<script type="text/javascript" src="../dojo/dojo/dojo.js"
	djConfig="isDebug: false, parseOnLoad: true"></script>

<style type="text/css">
@import "../dojo/dojo/resources/dojo.css";
@import "../dojo/dijit/themes/nihilo/nihilo.css";
@import "../dojo/dijit/themes/dijit.css";
</style>

<%@ taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<%
response.setHeader("Cache-control", "no-store");
%>


<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector"
%>
<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<meta http-equiv="Cache-Control" content="must-revalidate">
<meta http-equiv="Cache-Control" content="no-store">
<meta http-equiv="Pragma" content="no-cache">


<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<TITLE>employee_list.jsp</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/attendance.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/reports.js"></SCRIPT>

<shf:reloadErrors></shf:reloadErrors>

<bzqjs:validator>
<bzqjs:form name="addLateForm" />
</bzqjs:validator>

<SCRIPT>

function validateLate(){
	if(!validateAddLateForm(document.all.addLateForm)){
		return;
	}
	else if(getSelectedRadioValue(document.getElementsByName("lateReasonId"))==''){
		alert("נא לבחור סיבת איחור");
		return;
	}
	addlate();
}
function cancelMissing(){
//this function is called from missing_popup.jsp (called with Ajax)
	if(!(window.confirm("האם אתה בטוח שברצונך להסיר את החיסור"))){
		return;
	}
	removeMissing();
}
function updateMissing(){
	if(getSelectedRadioValue(document.getElementsByName("missReasonId"))==''){
	alert("נא לבחור סיבת חיסור");
	return;
	}
	if(!(window.confirm("האם ברצונך לשמור את השינויים"))){
		return;
	}
	saveMissing(document.addMissingForm.employeeId.value);
}
function validateMissing(){
		if(getSelectedRadioValue(document.getElementsByName("missReasonId"))==''){
		alert("נא לבחור סיבת חיסור");
		return;
		}
		document.getElementById("submitButton").disabled="true";
		var tt= document.addMissingForm.missDateStart.value;
		var remarkTemp =  "מתאריך "+ document.addMissingForm.missDateStart.value +" עד "+ document.addMissingForm.missDateEnd.value + " : "+document.addMissingForm.missingRemark.value;
		document.addMissingForm.missingRemark.value = remarkTemp;

		saveMissing(document.addMissingForm.employeeId.value);
	
}
function validateForm(){
	var from=document.forms['attendanceForm'].timeFrom.value;
	var to=document.forms['attendanceForm'].timeTo.value;
	if(!isValidTime(from)){
		alert("HH:MM שעת התחלה לא חוקית ! הזן שעה בפורמט");	
		return;
	}
	if(!isValidTime(to)){
		alert("HH:MM שעת סיום לא חוקית ! הזן שעה בפורמט");	
		return;
	}
	document.forms['attendanceForm'].action="/shf/attendance/searchResult.do";
	document.forms['attendanceForm'].target="";
	document.forms['attendanceForm'].submit();
}

function keyPressed(){

	var k=window.event.keyCode;
	
	if(Number(k)==13){
		if (document.getElementById("dialogTableId").style.visibility == "hidden") {
//			alert("Dailog Close");
			validateForm();
		} 
	}
}

function viewAddRemark(){
	if(selectedRow==null || selectedRow==''){
		window.alert("נא לבחור משמרת קודם");
		return;
	}
	
	viewRemarkDialog(selectedRow);
}

function viewAddCancelLogin(startDate, currentDate){

	if(selectedRow==null || selectedRow==''){
		window.alert("נא לבחור משמרת קודם");
		return false;
	}
	
	if (startDate != currentDate) {
		alert("לא ניתן לבטל לוגין למשמרת שאינה מהיום");
		return false;
	}
	
	if(document.getElementById("setMissing"+selectedRow).value == 1) {
		alert("לא ניתן לבטל משמרת בחיסור");
		return false;
	} 
	if(document.getElementById("remarkLoginCell"+selectedRow).value == 1) {
		alert("לא ניתן לבטל משמרת פעמיים");
		return;
	} 
	
	
	
		var tmp=selectedRow.split("&",1)[0];
	var agentDay=tmp.split("=",2)[1];

	openCancelLoginDialog(selectedRow);
//	viewRemarkDialog(selectedRow);
}

function openCancelLoginDialog(agentDayId)
{			
		
		//alert("url"+urlString);
		//dijit.byId("dialogTableId").reset();
		//dijit.byId("dialogTableId").innerHtml="";
		//dijit.byId("dialogTableId").titleNode.innerHTML= nameOfTable;
		//dijit.byId("dialogTableId").setHref(urlString);
		//dijit.byId("dialogTableId").show();
		//dijit.byId("dialogTableId").refresh();
		//dijit.byId("dialogTableId").reset();
		var dialog = dijit.byId("dialogTableId");
		//dialog. refresh();

		dialog.reset();
		//dialog.refresh();
		
		dialog.titleNode.innerHTML = "י ביטול העברת משמרת ל  -SAP";
//		window.alert("before 4");
		
		dialog.setHref("/shf/shift/cancelLoginView.do?agentDayId="+agentDayId);
//		window.alert("after4");
		//&agentDay="+agentDay);
		dialog.show();
		//window.alert(agentDayId);

			//alert(urlString);
			
			//dijit.byId("dialogTableId").href=urlString;
            //setDialogHeader(nameOfTable); 
            //dijit.byId("dialogTableId").show();     
}  


function exportExcel(){
	document.forms['attendanceForm'].action="/shf/attendance/export.do";
	document.forms['attendanceForm'].target="_blank";
	document.forms['attendanceForm'].submit();
}
</SCRIPT>
<script type="text/javascript">
dojo.require("dojo.parser");
dojo.require("dijit.form.CheckBox");
dojo.require("dijit.Dialog");
</script>




</HEAD>

<%
String moked=attendanceForm.getMoked();
%>
<BODY onkeyup="keyPressed();" class="nihilo">

<div id="popupShiftChange" class="popup2" style="display: none; left: 6px; top: 1px;"></div>
<div id="missingPopupDiv" style="display: none;" class="divPopup">
</div>
<div id="popupDiv" style="display: none;" class="divPopup"></div>
<div id="reportPopupDiv" style="display: none;" class="divPopup">
</div><div id="remarkPopupDiv" style="display: none;" class="divPopup"></div>


<div id="CancelRemarkViewDialog" class="popup2" style="display: none;"></div>

<div dojotype="dijit.Dialog" id="dialogTableId" title=""  
	layoutalign="right" align="center" preload="false"
	errorMessage="לא ניתן להציג טבלה" isLayoutContainer="false"
	preventCache="true"
	style=" direction:rtl; margin: 0px; outline: 0px; overflow: hidden; padding: 0px; border: 2px solid; border-bottom-style: groove; border-right-style: groove;">
</div>



<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TR>
		<TD dir="rtl" valign="top" style="height: 20px;"><jsp:include
			page="submenu/attend_submenu.jsp"></jsp:include></TD>
	</TR>


	<TR>
		<TD valign="top"
			style="padding-top: 3px; padding-bottom: 5px; padding-right: 6px; padding-left: 6px;">
		<form name="attendanceForm" method="get"
			action="/shf/attendance/searchResult.do"
			style="margin: 0px; padding: 0px;">
		<FIELDSET class="form"><legend>נוכחות עובדים</legend>
		<input type="hidden" name="mode" id="modeID" value="1">

		<TABLE cellspacing="3" cellpadding="2" width="100%">
			<TBODY>

				<TR>
					<TD class="header">משעה:</TD>
					<TD class="data"><shf:timechooser inputname="timeFrom"
						inputvalue="<%=attendanceForm.getTimeFrom()%>" /></TD>

					<TD width="10px"></TD>
					<TD class="header">עד:</TD>
					<TD class="data"><shf:timechooser inputname="timeTo"
						inputvalue="<%=attendanceForm.getTimeTo()%>" /></TD>
					<TD width="10px"></TD>
					
					<TD class="header">מוקד:</TD>
					<TD class="data"><shf:unitselect tablename="unitCode"
						name="moked" selectedName="attendanceForm"
						selectedProperty="moked" style="width:170px;font-size:10px;"
						type="<%=bzq.shf.utils.SHFConstants.MOKED_UNIT%>" all="yes"
						logic="onchange=setMultiTeams(this,'attendanceForm','team','200');setMultiActivities(this,'attendanceForm','activity');" />
					</TD>
					<TD width="10px"></TD>
					
					<TD class="header">מיקום:</TD>
					<TD class="data">
						<shf:shiftLocationCheckList name="attendanceForm" property="workLocation" optionsLength="120" length="120"/>
					</TD>

				</TR>

				<TR>
					<TD class="header">תאריך:</TD>
					<TD class="data" valign="middle"><shf:calendar
						calname="attendanceDate" name="attendanceForm"
						property="attendanceDate" /></TD>
					<TD width="10px"></TD>

<!-- Svetlana
					<TD class="header">תור:</TD>
					<TD id="activityAjaxResult"> -->
					<!--  bzq:select name="job" tablename="jobCode"	selectedName="attendanceForm" selectedProperty="job" all="yes" style="width:160px;font-size:10px;"  /--> 
<!-- Svetlana					<shf:activityCheckList	name="attendanceForm" moked="<!--%=moked%>" property="activity" /></TD>-->

					<TD class="header">תפקיד בפועל:</TD>
					<TD class="data" valign="middle"><shf:innerJobCheckList
						name="attendanceForm" tablename="innerJobCode" property="innerJob" />
					</TD>
					
					<TD width="10px"></TD>
					<TD class="header">צוות:</TD>
					<TD class="data" id="teamsAjaxResult"><shf:orgunitCheckList
						parentUnit="<%=moked%>" name="attendanceForm" type="J01"
						property="team" optionsLength="200" length="160"></shf:orgunitCheckList>
					</TD>


				</TR>
				<TR>
					<!-- TD class="header">תפקיד בפועל:</TD>
					<TD class="data" valign="middle"><shf:innerJobCheckList
						name="attendanceForm" tablename="innerJobCode" property="innerJob" />
					</TD-->
					<TD width="10px"></TD>
					<TD colspan=10></TD>
					<TD align="left">
					<button onclick="validateForm();">חפש</button>
					</TD>
				</TR>
			</TBODY>
		</TABLE>

		</FIELDSET>
		</form>
		</TD>
	</TR>

	<%
	if(shifts_list!=null && shifts_list.size()>0){%>
	<TR>
		<TD style="padding-right: 6px; padding-left: 6px;">
		<TABLE cellspacing="0" cellpadding="0" width="100%"
			style="border-top: 1px silver solid; border-left: 1px silver solid; border-right: 1px silver solid;">
			<TR class="tableTotal">

				<shf:security activity="attend_cancel_exit">
					<TD style='text-align: left; padding-left: 2px; width: 22px;'
						class="tableTotal"><img src='/shf/images/cancel_exit.gif'
						alt='ביטול יציאה' onclick="cancel_exit();" style="cursor: hand;">
					</TD>
				</shf:security>


				<shf:security activity="attend_exit_station">
					<TD style='text-align: left; padding-left: 2px; width: 22px;'
						class="tableTotal"><img src='/shf/images/exit_station.png'
						alt='רישום יציאה' onclick="dayExit();" style="cursor: hand;">
					</TD>
				</shf:security>


				<shf:security activity="attend_cancel_station">
					<TD style='text-align: left; padding-left: 2px; width: 22px;'
						class="tableTotal"><img src='/shf/images/cancel_station.png'
						alt='ביטול כניסה לעמדה' onclick="cancelStation();"
						style='cursor: hand;'></TD>
				</shf:security>

				<shf:security activity="shift_add_remark">
					<TD style='text-align: left; padding-left: 2px; width: 22px;'
						class="tableTotal"><img src='/shf/images/edit.gif'
						alt='הוסף הערה' onclick="viewAddRemark();" style="cursor: hand;">
					</TD>
				</shf:security>

				<shf:security activity="shift_add_remark">
					<%java.util.Calendar cal = java.util.Calendar.getInstance(); %>
					<TD style='text-align: left; padding-left: 2px; width: 22px;'
						class="tableTotal"><img
						src='/shf/images/cancel_login_click.png'
						alt='ביטול העברת משמרת ללוגין' onclick="viewAddCancelLogin('<%=bzq.utils.BaseConvert.dateToString(attendanceForm.getAttendanceDate(),"ddMMyyyy")%>','<%=bzq.utils.BaseConvert.dateToString(cal.getTime(),"ddMMyyyy")%>');"
						style="cursor: hand;"></TD>
				</shf:security>

				<TD style='text-align: left' width=20px class=tableTotal
					style="padding-left:2px;padding-top:2px;"><img
					src='/shf/images/excell.png' alt='שמור לאקסל'
					onclick="exportExcel();" style='cursor: hand;'></TD>

				<TD style='text-align: right' class="tableTotal"><img
					src='/shf/images/search.png' height="16px"> נמצאו <%=shifts_list.size()%>
				רשומות</TD>

			</TR>
		</TABLE>
		</TD>
	</TR>
	<%}%>
	<TR>
		<TD valign="top" height="100%"
			style="padding-top: 0px; padding-right: 6px; padding-left: 6px;">
		<div style="height: 100%; overflow: auto; border: 1px silver solid;"
			id="dataGridDiv"><jsp:include page="attendance_table.jsp"></jsp:include>
		</div>
		</TD>
	</TR>

	<TR>
		<TD valign="top"
			style="direction: rtl; padding-top: 5px; padding-bottom: 5px; padding-right: 6px; padding-left: 6px;">
		<TABLE width="100%" cellpadding="0" cellspacing="2"
			style="background-color: #dbeaf5; border: 1px silver solid; padding-right: 5px;">
			<TR>
				<TD width="100%">
				<TABLE align="right" cellspacing="2">
					<TR>
						<TD class="header">סיכום:</TD>
						<TD width="10px"></TD>
						<%if(shifts_list!=null && shifts_list.size()>0){%>
						<TD class="header">נרשמו לתדריך:</TD>
						<TD width="10px"></TD>
						<TD class="data"><bzq:integer name="attendanceForm"
							property="tadreechSum" /></TD>
						<TD width="20px">&nbsp;</TD>
						<TD class="header">נרשמו לנוכחות:</TD>
						<TD width="5px"></TD>
						<TD class="data"><bzq:integer name="attendanceForm"
							property="attendSum" /></TD>
						<TD width="20px">&nbsp;</TD>
						<TD class="header">נרשמו לעמדה:</TD>
						<TD width="5px"></TD>
						<TD class="data"><bzq:integer name="attendanceForm"
							property="stationSum" /></TD>
						<TD width="20px">&nbsp;</TD>
						<TD class="header">חסרים:</TD>
						<TD width="5px"></TD>
						<TD class="data"><bzq:integer name="attendanceForm"
							property="missingSum" /></TD>
						<TD width="20px">&nbsp;</TD>
						<TD class="header">איחורים:</TD>
						<TD width="5px"></TD>
						<TD class="data"><bzq:integer name="attendanceForm"
							property="lateSum" /></TD>
						<TD width="20px">&nbsp;</TD>
							
						<TD class="header">תגבורים:</TD>
						<TD width="5px"></TD>
						<TD class="data"><bzq:integer name="attendanceForm"
							property="inforceSum" /></TD>
						<TD width="20px">&nbsp;</TD>
						<TD class="header">פיצולים:</TD>
						<TD width="5px"></TD>
						<TD class="data"><bzq:integer name="attendanceForm"
							property="slpitSum" /></TD>
						<TD width="20px">&nbsp;</TD>
						
						<TD class="header">שינויים:</TD>
						<TD width="5px"></TD>
						<TD class="data" style="color:<%=attendanceForm.getNetHoursSum() >= 0 ? "green": "red" %>;direction:ltr;"><%=SHFUtils.getLengthFormat(attendanceForm.getNetHoursSum()) %></TD>						
						<%}%>
					</TR>
				</TABLE>
				</TD>
			</TR>
		</TABLE>
		</TD>
	</TR>


</TABLE>



</BODY>


</HTML>
