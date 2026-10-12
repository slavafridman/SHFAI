<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="attendanceForm"
	class="bzq.shf.forms.AttendanceDataForm" 
	scope="request">
</jsp:useBean>

<jsp:useBean id="reason" 
	class="bzq.shf.forms.EventReasonForm"
	scope="page">
</jsp:useBean>

<jsp:useBean id="reports"
	class="java.util.Vector" 
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>

<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>latePopUp</TITLE>
<shf:reloadErrors></shf:reloadErrors>

</HEAD>

<%
int eventType=bzq.shf.utils.SHFConstants.LATE_REASON;
java.util.Vector eventReasons=bzq.shf.utils.SHFTableUtils.getEventReasonsOfType(eventType);
long agentDay=attendanceForm.getAgentDayId();
String remark="";
if(attendanceForm.getLateRemark()!=null) remark=attendanceForm.getLateRemark();
String lateReason=String.valueOf(attendanceForm.getLateReasonId());
int lateMinutes=attendanceForm.getLateMinutes();
String source=(String)request.getAttribute("source");
%>
<BODY>

<FORM action="/shf/addEvent.do" name="addLateForm" >
	<%if(reports!=null && reports.size()>0){%>
		<div id="reportPopupDiv" class="divPopup2">
			<table width="100%" height="100%" style="height: 100%; background-color: transparent">
				<TR>
					<TD width="100%" height="100%" valign="top">
						<jsp:include page="/jsp/report_popup_fs.jsp"></jsp:include>
					</TD>
				</TR>	
			</table>		</div>
	<%}%>
	<table width="100%" height="100%"
	style="height: 100%; background-color: transparent">
	<TR>
		
		<TD width="100%" height="100%" valign="top">
			
		<table width="100%" height="100%"
			style="margin-top: 110; margin-left: 70">
			<tr>
				<td valign="top">
				
				<fieldset
					style="padding-bottom: 10px; padding-left: 5px; padding-right: 5px; width: 75%; direction: rtl; background-color: #ffffea;border: 1px solid gray;">
				<legend> <img src="/shf/images/close_window.gif"
					style="cursor: hand" alt="סגור" onclick="clear_popup('popupDiv');">
				הוספת איחור </legend>

				<TABLE>
					<TBODY>
						<TR>
							<TD height="20px" colspan=5></TD>
						</TR>

						<TR id=reasonsRow>
							<TD>
							<TABLE>
								<TBODY>
									<%
				for(int i=0;i<eventReasons.size();i++){
					reason=(bzq.shf.forms.EventReasonForm)eventReasons.get(i);
				%>
									<TR>
										<TD><input name="lateReasonId" type=radio
											value="<%=reason.getCode()%>"
											<%=(reason.getCode().equals(lateReason)?" checked":"")%>></TD>
										<TD><%=reason.getDescription()%></TD>
									</TR>
				<%
				}
				%>
								</TBODY>
							</TABLE>
							</TD>
							<TD width=30px></TD>

							<TD>
							<table>
								<tbody>
									<TR>
										<TD colspan=3 class="header">דקות איחור:&nbsp; <input
											type="text" name="lateMinutes" style="width: 30px"
											value="<%=lateMinutes%>"></TD>
									</TR>
									<TR>
										<TD class="header"><u>הערה:</u></td>
									</TR>
									<TR>
										<TD colspan=3><textarea rows="7" cols="30" name="lateRemark"><bzq:string
											name="attendanceForm" property="lateRemark"></bzq:string></textarea>
										</TD>
									</TR>
								</tbody>
							</table>
							</TD>
						</TR>
						<%if(attendanceForm.getLateReasonId()==0){%>
						<TR>
							<TD align=left colspan=5>
							<button onclick="validateLate();">שמור</button>
							&nbsp;
							<button onclick="clear_popup('popupDiv');">ביטול</button>		
							
							</TD>
						</TR>
						<%}%>
						<TR>
							<TD height="20px" colspan=5></TD>
						</TR>
					</TBODY>
					<%if(attendanceForm.getLateReasonId()>0){%>
					<TFOOT>
						<TR>
							<TD colspan=3>איחור זה נרשם ע"י : <%=attendanceForm.getStationArrivalUser()%>
							ב <shf:shfdate date="<%=attendanceForm.getStationArrivalTime()%>" />
							<shf:shftime date="<%=attendanceForm.getStationArrivalTime()%>" /></TD>
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
<input type="hidden" name="lateSource" value=<%=source%>>
<input type="hidden" name="eventType" value=<%=eventType%>> 
<input type="hidden" name="agentDayId" value=<%=agentDay%>>
</form>
</BODY>
</HTML>
