<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">


<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255"
	pageEncoding="WINDOWS-1255"%>
<%@ page import="bzq.shf.utils.SHFConstants"%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>add_event.jsp</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<shf:reloadErrors></shf:reloadErrors>

<SCRIPT>
function addEvent(){
	if(document.addEventForm.reason.value==''){
		alert("נא לבחור סוג אירוע");
		return;
	}
	if(!isValidTime(document.addEventForm.hour.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	document.addEventForm.submit();
}
</SCRIPT>

</HEAD>
<BODY dir="rtl">
<div style="height: 100%; overflow: auto;">
<TABLE>
	<TR>
		<TD height="100%">

		<form name="addEventForm" action="/shf/employee/addEvent.do"
			method="post"><input type="hidden" name="employee_id"
			value='<%=request.getParameter("employeeId")%>'> <input
			type="hidden" name="eventType" value="<%=SHFConstants.EVENT_TYPE%>">
			<html:hidden property="mode" value="add"></html:hidden>
		<TABLE height="100%">
			<TR>
				<TD class="header">תאריך:</TD>
				<TD></TD>
				<TD><shf:calendar calname="date" marginRight="-20"/></TD>
				<TD width="20px"></TD>
				<TD class="header">סוג אירוע:</TD>
				<TD></TD>
				<TD><shf:eventselect tablename="eventReasonCode" name="reason"
					type="<%=SHFConstants.EVENT_TYPE%>" /></TD>
			</TR>
			<TR>
				<TD class="header">שעה:</TD>
				<TD></TD>
				<TD><shf:timechooser inputname="hour" /></TD>


			</TR>
			<TR>
				<TD valign="top" class="header">הערה:</TD>
				<TD></TD>
				<TD colspan="6"><textarea cols="40" rows="3" name="remark"></textarea></TD>
			</TR>

			<TR>
				<TD></TD>
				<TD colspan="6">
				<button onclick="javascript: history.go(-1);">חזור</button>
				&nbsp;
				<button onclick="addEvent();">שמור</button>
				</TD>
			</TR>
		</TABLE>
		</form>
		</TD>
	</TR>
</TABLE>
</div>
</BODY>
</HTML>
