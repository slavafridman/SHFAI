<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="employeeData"
class="bzq.shf.forms.EmployeeActivitiesForm" 
scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>

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
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" ></link>

<TITLE>employee_activities.jsp</TITLE>

<SCRIPT>
parent.parent.document.getElementById('loadingImgDiv').style.display = 'none';
function cancelShift(empid){
	
	if(selectedRow==null || selectedRow=='') 
		alert("נא לסמן את המשמרת שברצונך למחוק");	
	else
		var accept=confirm("האם אתה בטוח כי ברצונך לבטל את המשמרת");
		if(!accept) return;
			checkShiftForCancel(empid);			
}

function cofirmCancelShift(){
	if(document.forms['cancelShiftForm'].cancelReasonCode.value=="00"){
		alert("נא לבחור סיבת ביטול");
		return ;
	}
	document.forms['cancelShiftForm'].appendChild(document.getElementById("locParam"));
	document.forms['cancelShiftForm'].submit();
	parent.parent.document.getElementById('loadingImgDiv').style.display = "";
}

/*@cc_on @*/
/*@if (@_win32 && @_jscript_version>=5)

function window.confirm(str)
{
    execScript('n = msgbox("'+str+'","4132")', "vbscript");
    return(n == 6);
}
@end @*/

function keyUp(){
	if(window.event.keyCode==13){
		document.employeeShiftsForm.submit();
	}
}
</SCRIPT>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shiftjs.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<shf:reloadErrors></shf:reloadErrors>

</HEAD>
<%
Vector activities=(Vector)request.getAttribute("shifts");

%>
<BODY onkeyup="keyUp();">
<div id="popupShiftChange" class="popup2" style="display: none; top: -100px;"></div>
<div id="cancelPopupDiv" style="display:none;" class="divPopup"></div>
<form action="/shf/employee/getShifts.do"
name="employeeShiftsForm" 
method=post >

<input type="hidden" name="employeeId" value="<bzq:integer name="employeeData" property="employeeId"/>">
<input type="hidden" id="locParam" name="locParam" value="empShifts">

<TABLE style="direction:rtl" width=100% height=100% cellpadding="0" cellspacing="0">
	<TR style="border-bottom:1px #d3d3d3 solid;">
		<TD class="header" style="padding-right:12px;padding-bottom:5px;text-align:right;border-left:0px;border-bottom:0px;">מתאריך: 
			<shf:calendar calname="from" name="employeeData" property="from" ></shf:calendar>&nbsp;
			עד תאריך: <shf:calendar calname="to" name="employeeData" property="to" ></shf:calendar>&nbsp; 
			&nbsp;&nbsp;
			<button onclick="document.employeeShiftsForm.submit();" style="width:50;">חפש</button>
		</TD>
	</TR>
	<%if(activities!=null && activities.size()>0){%>
	<TR>
		<TD>
			<TABLE cellspacing=0 cellpadding=0 width=100% style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
				<TR class="tableTotal">
					<shf:security activity="shift_cancel">
					<TD style='text-align:left;padding-left:2px;' class=tableTotal>
						<img src="/shf/images/delete-16.png" style="cursor:hand;" onclick="cancelShift(<%=employeeData.getEmployeeId()%>);">
					</TD>
					</shf:security>
				</TR>
			</TABLE>
		</TD>
	</TR>
	<%}%>
	<TR>
		<TD valign=top height="100%" dir="ltr">
		<div  style="height=100%;overflow:auto;border:1px silver solid;" id=dataGridDiv>
		<jsp:include page="emp_shifts_result.jsp"></jsp:include>
		</div>
		</TD>
	</TR>
</TABLE>

</form>

</BODY>
</HTML>
