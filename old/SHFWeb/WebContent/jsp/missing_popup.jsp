<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="attendanceForm"
	class="bzq.shf.forms.AttendanceDataForm" 
	scope="request">
</jsp:useBean>

<jsp:useBean id="reason" 
	class="bzq.shf.forms.EventReasonForm"
	scope="page">
</jsp:useBean>

<HTML>
<HEAD>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>


<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<TITLE>missingReasonPopUp.jsp</TITLE>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%
int eventType=bzq.shf.utils.SHFConstants.MISSING_REASON;
java.util.Vector eventReasons=bzq.shf.utils.SHFTableUtils.getEventReasonsOfType(eventType);
eventReasons.add(0,eventReasons.get(eventReasons.size()-1));	// set 'mahala' first (initially last)
eventReasons.remove(eventReasons.size()-1);	// remove it from last
long agentDay=attendanceForm.getAgentDayId();
String remark="";
if(attendanceForm.getMissingRemark()!=null) remark=attendanceForm.getMissingRemark();
String missingReason=String.valueOf(attendanceForm.getMissingReasonId());

%>

<BODY style="height:100%;width:100%">
<div  style="width:100%;visibility:visible;height:100%;">
<form action="/shf/attendance/addEvent.do" method="post" name=addMissingForm>
	<input type="hidden" value="<%=agentDay%>" name="agentDayId"> 
	<input type="hidden" value="<%=eventType%>" name="eventType">
	<input type="hidden" name="employeeId" value="<jsp:getProperty name="attendanceForm" property="employeeId"/>" >
							
<table style="height:90%;width:100%;background-color:transparent;">
	<TR>
		<TD width="100%" height="100%" valign="top">

		<table width="100%" height="100%">
			<tr>
				<td valign="top" height="100%" width="100%">
							
				<fieldset style="
				margin-left:12%;margin-top:100px;position:absolute;
				width:600px; 
				direction:rtl; 
				background-color:#ffffea;
				border: 1px solid gray;">
				
				<legend><img src="/shf/images/close_window.gif" style="cursor:hand" alt="סגור" onclick="clear_popup('missingPopupDiv');">
				 <%if(attendanceForm.getMissingReasonId()<=0){%>
				 הוספת חיסור 
				 <%}else{%>
				 עדכון \ ביטול חיסור
				 <%}%>
				 </legend>
				
				<TABLE width="100%" height="100%">
					<TBODY>
						<TR>
						<TD>
						<TABLE width="100%" height="100%">
							<TBODY>	
								<TR>
									<TD class=header>מתאריך:</TD>
									<TD class=data valign="middle">
										<shf:calendar disabled="true" calname="missDateStart" name="attendanceForm" property="shiftStart"  />
									</TD>
									<TD class=header nowrap="nowrap">עד תאריך:</TD>
									<TD class=data valign="middle">
										<%if(attendanceForm.getMissingReasonId()<=0){%>
										<shf:calendar  calname="missDateEnd" name="attendanceForm" property="shiftStart"  />
										<%}else{%>
										<shf:calendar disabled="true" calname="missDateEnd" name="attendanceForm" property="shiftStart"  />
										<%}%>
									</TD>	
								</TR>
							</TBODY>
						</TABLE>								
						</TD>	
						</TR>
						<TR>
							<TD valign="top" height="100%" width="100%">
							<span class=header>סיבה:</span>
							<DIV style="overflow:auto;height:280px;">
							<table width="100%">
								<TBODY>
									
						<%
						for(int i=0;i<eventReasons.size();i++){
							reason=(bzq.shf.forms.EventReasonForm)eventReasons.get(i);
						%>
									<TR>
										<TD><input name="missReasonId" type=radio value="<%=reason.getCode()%>" <%=(reason.getCode().equals(missingReason)?" checked":"")%>></TD>
										<TD><%=reason.getDescription()%></TD>
									</TR>
						<%
							}
						%>
								</TBODY>
							</table>
							</div>
							</TD>
							<TD width=20px></TD>
							<TD>
							<table>
								<tbody>
									<tr>
										<td class="header"><u>הערה:</u></td>
									</tr>
									<tr>
										<td valign="top"><textarea style="valign: top" rows="7"
											cols="30" name="missingRemark"><%=remark%></textarea></td>
									</tr>
								</tbody>
							</table>
							</TD>
						</TR>
						
						<%if(attendanceForm.getMissingReasonId()<=0){%>
						<TR>
							<TD align=left colspan=5>
							<button id="submitButton" onclick="validateMissing();">שמור</button>
							&nbsp;
							<button onclick="clear_popup('missingPopupDiv');">ביטול</button>
							</TD>
						</TR>
						<%}else{%>
						<TR>
							<TD align=left colspan=5>
							<shf:security activity="updateCancelMissing">
							<button onclick="cancelMissing();">הסרה</button>
							&nbsp;
							<button onclick="updateMissing();">שמירה</button>
							&nbsp;
							</shf:security>
							<button onclick="clear_popup('missingPopupDiv');">ביטול</button>
							</TD>
						</TR>
						<%} %>
					</TBODY>
					<%if(attendanceForm.getMissingReasonId()>0){%>
					<TFOOT>
						<TR>
							<TD colspan=3>חיסור זה נרשם ע"י : <%=attendanceForm.getStageArrivalUser()%>
							ב <shf:shfdate date="<%=attendanceForm.getMissingTime()%>" />
							<shf:shftime date="<%=attendanceForm.getMissingTime()%>" /></TD>
						</TR>
					</TFOOT>
					<%}%>
				</TABLE>
				
				</fieldset>
				</TD>
			</TR>
		</TABLE>

		</TD>
	</TR>
</TABLE>
</form>
</div>
</BODY>
</HTML>
