
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean 
	id="shiftForm" 
	class="bzq.shf.forms.ShiftDataForm"
	scope="request">
</jsp:useBean>

<jsp:useBean id="shifts_list" scope="request" class="java.util.Vector"></jsp:useBean>

<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@	taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>


<%@page import="bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.utils.SHFConstants"%>
<html:html>
<HEAD>

<style type="text/css">

@import "../dojo/dojo/resources/dojo.css";
@import "../dojo/dijit/themes/nihilo/nihilo.css";
@import "../dojo/dijit/themes/dijit_rtl.css";
</style>


<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector"
%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<meta http-equiv="Cache-Control" content="must-revalidate">
<meta http-equiv="Cache-Control" content="no-store">
<meta http-equiv="Pragma" content="no-cache">
<SCRIPT type="text/javascript">

function exportExcel(){
	document.forms['shiftForm'].action="/shf/shift/export.do";
	document.forms['shiftForm'].target="_blank";
	document.forms['shiftForm'].submit();
}
function loadPage(){
	document.getElementById('emplistframe').style.display='none';
}
function sub(type) {
	if(!isValidTime(document.shiftForm.timeFrom.value)){
		alert("HH:MM שעת התחלה לא חוקית ! הזן שעה בפורמט");	
		return false;
	}
	if(!isValidTime(document.shiftForm.timeTo.value)){
		alert("HH:MM שעת סיום לא חוקית ! הזן שעה בפורמט");	
		return false;
	}
	
	if (type == 1)
		{document.shiftForm.action = "/shf/shift/searchResult.do";}
	if (type == 2)	
		{document.shiftForm.action = "/shf/shift/searchParam.do";}
	
	document.forms['shiftForm'].target="";
	document.forms['shiftForm'].action="/shf/shift/searchResult.do";
	document.forms['shiftForm'].submit();
}

function moveShift(){
	if(selectedRow==null || selectedRow==''){
		alert("נא לבחור משמרת לעדכון");
		return false;
	}
	
	var tmp=selectedRow.split("&",1)[0];
	var agentDay=tmp.split("=",2)[1];
	var workFromHome = selectedRow.charAt(selectedRow.indexOf("workFromHome=") + "workFromHome=".length);
	workFromHome = workFromHome.toLowerCase() === "n" ? "<%=SHFConstants.SHIFT_LOCATION_SITE%>" : "<%=SHFConstants.SHIFT_LOCATION_HOME%>";
		
	document.selectForm.shiftId.value = agentDay;
	document.selectForm.shiftLocation.value = workFromHome;
	
	document.forms['selectForm'].submit(); 
}

function forceSwitchShift(){
	if(selectedRow==null || selectedRow==''){
		alert("נא לבחור משמרת להחלפה");
		return false;
	}
	
	var tmp=selectedRow.split("&",1)[0];
	var agentDay=tmp.split("=",2)[1];
	document.location="/shf/switch/sec_shift.do?agentDayId="+agentDay;
	//document.location="/shf/jsp/replace_shift.jsp?agentDayId="+agentDay;
}

function cancelShift(empid){
	if(selectedRow==null || selectedRow=='') 
		alert("נא לסמן את המשמרת שברצונך למחוק");	
	else
		var accept=confirm("האם אתה בטוח כי ברצונך לבטל את המשמרת");
		if(!accept) return;
			checkShiftForCancel(empid);			
}

function switchShift( isPotential ){
	if(selectedRow==null || selectedRow=='') 
		alert("צריך לבחור משמרת להחלפה");	
	else
		checkShiftForSwitch( isPotential );			
}

function deleteRepositories(){
	if(selectedRow==null || selectedRow==''){
		alert("צריך לבחור משמרת");
		return;
	}
	deleteFromRepositories();
}

function keyPressed(){

	if(Number(window.event.keyCode)==13){
		if (document.getElementById("dialogTableId").style.visibility == "hidden") {
			sub(1);
		} 
	}

}

function viewAddRemark(){
	if(selectedRow==null || selectedRow==''){
		alert("נא לבחור משמרת קודם");
		return;
	}	
	
	var tmp=selectedRow.split("&",1)[0];
	var agentDay=tmp.split("=",2)[1];
	
	viewRemarkDialog(agentDay);
}

function viewAddCancelLogin(startDate, currentDate){

	if(selectedRow==null || selectedRow==''){
		alert("נא לבחור משמרת קודם");
		return false;
	}
	if (startDate != currentDate) {
		alert("לא ניתן לבטל לוגין למשמרת שאינה מהיום");
		return false;
	}
	
	var tmp=selectedRow.split("&",1)[0];
	var agentDay=tmp.split("=",2)[1];
	
	if(document.getElementById("remarkLoginCell"+agentDay).value == 1) {
		alert("לא ניתן לבטל משמרת פעמיים");
		return false;
	}
	
	openCancelLoginDialog(agentDay);
}

function cofirmCancelShift(){
	if(document.forms['cancelShiftForm'].cancelReasonCode.value=="00"){
		alert("נא לבחור סיבת ביטול");
		return ;
	}
	document.forms['cancelShiftForm'].submit();
}


function openCancelLoginDialog(agentDayId){			
		var dialog = dijit.byId("dialogTableId");
		dialog.reset();
		dialog.titleNode.innerHTML = "י ביטול העברת משמרת ל-SAP";
		dialog.setHref("/shf/shift/cancelLoginView.do?agentDayId="+agentDayId);
		dialog.show();
}

function poolAllocRel(){
	if(selectedRow==null || selectedRow==''){
		alert("נא לבחור משמרת קודם");
		return false;
	}
// 	var extExist = false;
// 	var selTr = getSelectedRow(dataTable);;
// 	var dataTable = document.getElementById("dataTable");
	
// 	if(selTr){
		
	var dialog = dijit.byId("dialogTableId");
	dialog.reset();
	dialog.titleNode.innerHTML = "<span style='margin-right:10px; display: inline-block;'>הקצאת/שחרור שלוחה למשמרת</span>";
	dialog.setHref("/shf/shift/poolExtAllocRelease.do?" + selectedRow);
	dialog.show();
// 	}
}

</SCRIPT>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/attendance.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/breakjs.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shiftjs.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/exceljs.js"></SCRIPT>

<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<TITLE></TITLE>

<shf:reloadErrors></shf:reloadErrors>

</HEAD>

<%
String moked=shiftForm.getMoked();
%>

<BODY onkeyup="keyPressed();" class="nihilo">

<div id="popupShiftChange" class="popup2" style="display: none; left: 40px; top: 1px;"></div>
<div id="popupDiv" style="display: none;" class="divPopup"></div>
<div id="remarkPopupDiv" style="display: none;" class="divPopup"></div>

<div id="cancelPopupDiv" style="display: none;" class="divPopup"></div>

<div id="CancelRemarkViewDialog" class="popup2" style="display: none;"></div>

<div dojoType="dijit.Dialog" id="dialogTableId" title=""
	layoutalign="right" align="center" preload="false"
	errorMessage="לא ניתן להציג טבלה" isLayoutContainer="false"
	preventCache="true"
	style="margin: 0px; outline: 0px; overflow: hidden; padding: 0px; border: 2px solid; border-bottom-style: groove; border-right-style: groove;">
</div>

<input type="hidden" name="mode" id="modeID" value="0">

<form name="shiftForm" method="post" action="/shf/shift/searchResult.do">

<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0"
	dir="rtl">
	<TR>
		<TD valign="top" dir="rtl" style="height: 20px;"><jsp:include
			page="submenu/shift_submenu.jsp"></jsp:include></TD>
	</TR>
	<TR>
		<TD valign="top"
			style="padding-top: 10px; padding-bottom: 5px; padding-right: 6px; padding-left: 7px;">

		<FIELDSET class="form"><legend> משמרות - תפעול </legend>
		<TABLE cellspacing="2" cellpadding="2" width=100%>

			<TR>
				<TD class="header">תאריך:</TD>
				<TD class="data" valign="middle"><shf:calendar
					calname="attendanceDate" name="shiftForm" property="attendanceDate"
					marginBottom="40" /></TD>

				<TD width="5px"></TD>

				<TD class="header">משעה:</TD>
				<TD class="data"><shf:timechooser inputname="timeFrom"
					inputvalue="<%=shiftForm.getTimeFrom()%>" /></TD>

				<TD width="5px"></TD>
				<TD class="header">עד שעה:</TD>
				<TD class="data"><shf:timechooser inputname="timeTo"
					inputvalue="<%=shiftForm.getTimeTo()%>" /></TD>



			</TR>
			<TR>
				<!--TD class=header>תפקיד:</TD>
						<TD class=data>
						<bzq:select 
							name="job" tablename="jobCode"
							selectedName="shiftForm"
							selectedProperty="job" all="yes"
							style="width:140px;font-size:10px;" />
						</TD>
						<TD width=5px ></TD-->

				<TD class="header">מוקד:</TD>
				<TD class="data"><shf:unitselect tablename="unitCode"
					name="moked" selectedName="shiftForm" selectedProperty="moked"
					style="width:160px;font-size:10px;" type="G01" all="yes"
					logic="onchange=setMultiTeams(this,'shiftForm','team','200');setMultiActivities(this,'shiftForm','activity');" /></TD>



				<TD width="5px"></TD>

				<!-- TD class="header">תור:</TD>

				<TD id="activityAjaxResult"><shf:activityCheckList
					name="shiftForm" moked="<!--%=moked%>" property="activity" /></TD-->
				
				<TD class="header">תפקיד בפועל:</TD>
				<TD class="data" valign="middle"><shf:innerJobCheckList
					name="shiftForm" tablename="innerJobCode" property="innerJob"
					length="150" optionsLength="150" /></TD>
				
				<TD width="5px"></TD>	
				<TD class="header">צוות:</TD>
				<TD class="data" id="teamsAjaxResult"><shf:orgunitCheckList
					parentUnit="<%=moked%>" name="shiftForm" type="J01" property="team"
					length="160" optionsLength="200"></shf:orgunitCheckList></TD>
				
				<TD class="header">מיקום:</TD>
				<TD class="data">
					<shf:shiftLocationCheckList name="shiftForm" property="workLocation" optionsLength="120" length="120"/>
				</TD>

			</TR>
			<TR>
				<TD width="5px"></TD>
				<TD colspan=9></TD>
				<TD align="left" class="header" align="left">
				<button onclick="sub(1);">חפש</button>
				</TD>
			</TR>

		</TABLE>

		</FIELDSET>

		</TD>
	</TR>
	<% if (shifts_list !=null && shifts_list.size()>0) { %>
	<TR>
		<TD valign="top" style="padding-right: 7px; padding-left: 7px;"
			dir="ltr">
		<TABLE cellspacing="0" cellpadding="0" width="100%"
			style="border-top: 1px silver solid; border-left: 1px silver solid; border-right: 1px silver solid;">
			<TR class="tableTotal">

				<shf:security activity="shift_update">
					<TD style='text-align: left; padding-right: 3px' width="20px"
						class="tableTotal" style="padding-left:2px;padding-top:2px;">
					<img src='/shf/images/move_shift.png' alt='ערוך משמרת'
						onclick="moveShift();" style='cursor: hand;'></TD>
				</shf:security>
				<shf:security activity="replace_admin">
					<TD style='text-align: left; padding-right: 3px' width="20px"
							class="tableTotal" style="padding-left:2px;padding-top:2px;">
						<img src='/shf/images/export.png' alt='החלף משמרת מהמאגר'
							onclick='switchShift();' style='cursor: hand;' height="17px">
					</TD>
					<TD style='text-align: left; padding-right: 3px' width="20px"
							class="tableTotal" style="padding-left:2px;padding-top:2px;">
						<img src='/shf/images/export-potensial.png' alt='הצג פוטנציאל החלפה לפי סידור'
							onclick='switchShift(true);' style='cursor: hand;' height="17px">
					</TD>
				</shf:security>

				<shf:security activity="shift_cancel">
					<TD style='text-align: left; padding-right: 3px' width="20px"
						class="tableTotal" style="padding-left:2px;padding-top:2px;">
					<img src='/shf/images/delete-16.png' alt='בטל משמרת'
						onclick='cancelShift(0);' style='cursor: hand;' height="17px">
					</TD>

				</shf:security>
				<shf:security activity="switch_forced">
					<TD style='text-align: left; padding-right: 3px' width="20px"
						class="tableTotal" style="padding-left:2px;padding-top:2px;">
					<img src='/shf/images/fswitch.gif' alt='החלפה מאולצת'
						onclick='forceSwitchShift();' style='cursor: hand;'></TD>
				</shf:security>
				<shf:security activity="deleteFromRepositories">
					<TD style='text-align: left; padding-right: 3px' width="20px"
						class="tableTotal" style="padding-left:2px;padding-top:2px;">
					<img src='/shf/images/deleteRepository.png'
						alt='מחק משמרת ממאגרי החלפות' onclick='deleteRepositories();'
						style='cursor: hand;'></TD>
				</shf:security>
				<shf:security activity="shift_add_remark">
					<TD style='text-align: left; padding-right: 3px' width="20px"
						class="tableTotal" style="padding-left:2px;padding-top:2px;">
					<img src='/shf/images/edit.gif' alt='הוסף הערה'
						onclick="viewAddRemark();" style="cursor: hand;"></TD>
				</shf:security>
				<%java.util.Calendar cal = java.util.Calendar.getInstance(); %>
				<shf:security activity="shift_cancel">
					<TD style='text-align: left; padding-right: 3px' width="20px"
						class="tableTotal" style="padding-left:2px;padding-top:2px;">
					<img src='/shf/images/cancel_login_click.png'
						alt='ביטול העברת משמרת ללוגין' onclick=viewAddCancelLogin('<%=bzq.utils.BaseConvert.dateToString(shiftForm.getAttendanceDate(),"ddMMyyyy")%>','<%=bzq.utils.BaseConvert.dateToString(cal.getTime(),"ddMMyyyy")%>') style="cursor: hand;">
					</TD>
				</shf:security>
				<shf:security activity="shift_update">
					<TD style='text-align: center; padding-right: 3px' width="20px"
						class="tableTotal" style="padding-left:2px;padding-top:2px;">
					<img src='/shf/images/extension_exist.png' alt='הקצאת/שחרור שלוחה למשמרת'
						onclick="poolAllocRel();" style='cursor: hand;height: 14px;'></TD>
				</shf:security>

				<TD style='text-align: left' width=20px class=tableTotal
					style="padding-left:2px;padding-top:2px;"><img
					src='/shf/images/excell.png' alt='שמור לאקסל'
					onclick="exportExcel();" style='cursor: hand;'></TD>
				<TD style="text-align: right;" class="tableTotal"><img
					src='/shf/images/search.png' height="16px"> נמצאו <%=shifts_list.size()%>
				רשומות</TD>

			</TR>
		</TABLE>
		</TD>
	</TR>
	<%}%>
	<TR>
		<TD valign="top" height="100%" style="padding: 0px 7px 7px 7px;"
			dir="ltr">
		<div style="overflow: auto; border: 1px silver solid; height: 100%;"
			id="dataGridDiv"><jsp:include page="shifts_search_table.jsp"></jsp:include>
		</div>
		</TD>
	</TR>

	<TR>
		<TD align="center" valign="top" id="myExceptionsDiv"
			style="display: none; padding-top: 0px; padding-right: 7px; padding-left: 7px; padding-bottom: 7px;"
			dir="ltr"></TD>
	</TR>

</TABLE>
</form>

<script type="text/javascript" src="../dojo/dojo/dojo.js"
	djConfig="isDebug: false, parseOnLoad: true">
</script>
<script type="text/javascript" >
	dojo.require("dojo.parser");
	dojo.require("dijit.Dialog");
	dojo.require("dijit.form.Button");
// 	dojo.require("dijit/form/Button");
// 	dojo.require("dojo/dom-construct");
 </script>



<FORM name="selectForm" action="/shf/shift/selectForUpdateShift.do">
	<INPUT type="hidden" name="attendanceDate"value="<%=shiftForm.getAttendanceDate()%>"> 
	<INPUT type="hidden" name="timeFrom" value="<%=shiftForm.getTimeFrom()%>">
	<INPUT type="hidden" name="timeTo" value="<%=shiftForm.getTimeTo()%>">
	<INPUT type="hidden" name="moked" value="<%=shiftForm.getMoked()%>">
	<INPUT type="hidden" name="job" value="<%=shiftForm.getJob()%>">
	<INPUT type="hidden" name="shiftId">
	<INPUT type="hidden" name="shiftLocation">
</FORM>
</BODY>
</html:html>
