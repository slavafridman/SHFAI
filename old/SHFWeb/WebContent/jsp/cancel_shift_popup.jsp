<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>

<jsp:useBean id="shiftDataForm"
	class="bzq.shf.forms.ShiftDataForm" 
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
<form name=cancelShiftForm action="/shf/shift/cancel.do">
	
	<html:hidden property="agentDayId" name="shiftDataForm"></html:hidden>
	<html:hidden property="employeeId" name="shiftDataForm"></html:hidden>

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
					onclick="clear_popup('cancelPopupDiv');"> ביטול משמרת</legend>

				<div style="padding: 10px;">
				<table cellpadding="1" cellspacing="1">
					
					<tr>
						<td class=header>סיבת ביטול</td>
						<td width="10px"></td>
						<td colspan=2><shf:eventselect type="<%=SHFConstants.CANCEL_SHIFT%>" tablename="eventReasonCode"  name="cancelReasonCode" style="width:160px;font-size:12px;" /></td> <%-- emptySelection="yes" --%>
						<td width="100%"></td>
					</tr>
					<tr>
						<td class=header colspan=4>הערת ביטול</td>
					</tr>
					<tr>
						<td colspan=4><textarea id="remarkText" cols="35" rows="5" name="cancelReasonRemark" ></textarea></td>
					</tr>
					
					<tr>
						<td>
							<button id="cancelShiftPopUp" onclick="clear_popup('cancelPopupDiv');">ביטול</button>
						</td>
						<td width="10px"></td>
						<td>
							<button onclick="this.disabled=true; document.getElementById('cancelShiftPopUp').disabled=true; cofirmCancelShift();">שמור</button>
						</td>
						<td width="100%"></td>
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