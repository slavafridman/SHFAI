<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>

<jsp:useBean id="employeeExceptionForm"
	class="bzq.shf.forms.EmployeeExceptionForm" 
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>


<%@page import="bzq.shf.utils.SHFConstants"%><html>
<head>


<link rel="stylesheet" href="../theme/Master.css" type="text/css">

<title>cancel_exception_dialog</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">

</head>

<BODY style="height:100%;width:100%">
<div  style="width:100%;visibility:visible;height:100%;">
<form name=cancelExceptionForm action="/shf/exceptions/cancel.do">
	
	<html:hidden property="agentDayId" name="employeeExceptionForm"></html:hidden>
	<html:hidden property="from" name="employeeExceptionForm"></html:hidden>
	<html:hidden property="fullday" name="employeeExceptionForm"></html:hidden>
	<html:hidden property="stateType" name="employeeExceptionForm"></html:hidden>
	<html:hidden property="employeeId" name="employeeExceptionForm"></html:hidden>

<table style="height: 90%; width: 100%; background-color: transparent;">
	<TR>
		<TD width="100%" height="100%" valign="top">

		<table width="100%" height="100%">
			<tr>
				<td valign="top" height="100%" width="100%">
				<fieldset
					style="margin-left:15%;margin-top:130px;position: absolute; width: 400px; direction: rtl; background-color: #ffffea;">
				<legend><img src="/shf/images/close_window.gif"
					style="cursor: hand" alt="סגור"
					onclick="clear_popup('cancelPopupDiv');"> ביטול פעילות</legend>



				<div style="padding: 10px;">
				<table cellpadding="1" cellspacing="1">
					
					<tr>
						<td class=header>סיבת ביטול</td><td colspan=2>
						<shf:eventselect type="<%=SHFConstants.CANCEL_SHIFT%>" tablename="eventReasonCode" name="cancelReasonCode" emptySelection="yes" style="width:160px" /> </textarea></td>
					</tr>
					<tr>
						<td class=header colspan=3>הערת ביטול</td>
					</tr>
					<tr>
						<td colspan=3><textarea id="remarkText" cols="35" rows="5" name="cancelRemark" ></textarea></td>
					</tr>
					
					<tr>
						<td>
						<button onclick="clear_popup('cancelPopupDiv');">ביטול</button>
						</td>
						<td>
						<button onclick="cofirmCancelException();">שמור</button>
						</td>
						<td width=50px></td>
					</tr>
				</table>
				</div>

				</fieldset>
				</TD>
			</TR>
		</TABLE>

		</TD>
	</TR>
</TABLE>
</form>
</div>
</body>
</html>