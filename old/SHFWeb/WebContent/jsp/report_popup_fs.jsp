<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="attendanceForm"
	class="bzq.shf.forms.AttendanceDataForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="reports"
	class="java.util.Vector" 
	scope="request">
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
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>report_popup_fs.jsp</TITLE>
</HEAD>
<BODY>
<fieldset style="
				margin-left:12%;margin-top:100px;position:absolute;
				width:400px;height:200px; 
				direction:rtl; 
				background-color:#f1ffe1;
				border: 1px solid gray;">
				
				<legend><img src="/shf/images/close_window.gif" style="cursor:hand" alt="סגור" onclick="clear_popup('reportPopupDiv');"> אישור היעדרות </legend>
				
				<TABLE width="100%" height="100%">
					<TBODY>
						<TR>
							<TD valign="top" height="100%" width="100%" class=header style="padding-top:10px;">
								הנציג <%=attendanceForm.getFirstName()+" "+attendanceForm.getLastName()%> חייב להגיש אישור היעדרות לתאריכים:
								<div style="overflow:auto;height:150px;padding-top:10px;">
								<TABLE width=100%>
									
									<%
									int size=reports.size();
									bzq.shf.bean.AgentDayBean day=null;
									for(int i=0;i<size;i++){
										day=(bzq.shf.bean.AgentDayBean)reports.get(i);
										long dayId=day.getAgentDayId();
									%>
									<TR>
										<TD class=data><shf:shfdate date="<%=day.getShiftStart()%>"/> </TD>
										<TD class=data><shf:tables tableName="eventReasonCode" codeName="<%=String.valueOf(day.getMissingReasonId())%>"/> </TD>
										<TD id="approveLinkTD<%=dayId%>" style="color:navy;font-size:13px;cursor:hand;"><u><a onclick="javascript:approveReport(<%=dayId%>)">הובא אישור</a></u></TD>
									</TR>
									<%}%>
									
								</TABLE>
								</div>
								<br>
								<BUTTON onclick="clear_popup('reportPopupDiv');">סגור</BUTTON>
							</TD>
						</TR>
						
					</TBODY>
					
				</TABLE>
				
				</fieldset>
</BODY>
</HTML>
