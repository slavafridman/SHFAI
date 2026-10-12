<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"><%@page
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>


<%@page import="bzq.shf.bean.EmployeeBean"%>
<%@page import="java.util.Vector"%>
<%@page import="bzq.shf.bean.ShfBaseBean"%>
<%@page import="bzq.shf.bean.AgentDayBean"%>

<%@taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<html>

<jsp:useBean id="completionForm" class="bzq.shf.forms.CTICompletionForm" scope="request"></jsp:useBean>
<jsp:useBean id="allChecked" class="java.util.Vector" scope="request"></jsp:useBean>

<head>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<link rel="stylesheet" href="../theme/Master.css" type="text/css">
<link rel="stylesheet" href="../theme/shfgrid.css" type="text/css">
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>

<title>cti_set_completion</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">

<script type="text/javascript">
function saveCompletion(){
	document.forms['saveCompletionForm'].submit();
}
</script>
<shf:reloadErrors></shf:reloadErrors>
</head>


<body dir="rtl">
	<html:form action="/completion/saveCompletion" name="saveCompletionForm" type="bzq.shf.forms.CTICompletionForm">
	<html:hidden property="completionFromDate" value="<%=completionForm.getCompletionFromDate()%>"></html:hidden>
	<html:hidden property="completionToDate" value="<%=completionForm.getCompletionToDate()%>"></html:hidden>
	<html:hidden property="completionCode" value="<%=completionForm.getCompletionCode()%>"></html:hidden>
	
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height: 20px;"><jsp:include page="submenu/cti_submenu.jsp"></jsp:include> </TD>
		</TR>			
		<TR>
			<TD width="100%" height="100%" valign="top" style="padding-top: 3px; padding-bottom: 5px; padding-right: 6px; padding-left: 6px;">
				
			<table cellpadding="0" cellspacing="0" height="100%" width="100%">
					
					<TR>
						<TD height="100%" width="100%">
							<table cellpadding="2" cellspacing="2" width="100%" height="100%">
								<TR>
									<TD class="bigHeader">פרטי השלמה:</TD>
								</TR>
								<TR>
									<TD>
										<table>
											<tr>
											<TD class="header">התחלה:</TD>
											<TD class="data"><bzq:string name="completionForm" property="completionFromDate" /> - <bzq:string name="completionForm" property="completionStart"/></TD>
											</tr>
											<tr>
											<TD class="header">סיום:</TD>
											<TD class="data"><bzq:string name="completionForm" property="completionToDate" /> - <bzq:string name="completionForm" property="completionEnd"/></TD>
											</tr>
											<tr>
											<TD class="header">סוג השלמה:</TD>
											<TD class="data"><shf:tables tableName="completionCode" codeName="<%=completionForm.getCompletionCode()%>" /></TD>
											</tr>
											
										</table>
									</TD>
								</TR>
								<TR>
									<TD class="bigHeader">העובדים שנבחרו:</TD>
								</TR>
								<TR>
									<TD height="100%" width="100%">
									
									

							<div dir="rtl" class="tableContainerDiv" width="100%">
							<table style="text-align: center; direction: ltr;" width="100%"
								cellpadding="0" cellspacing="0" style="color:#666666;">
								<thead>
									<TR>
										<TH>שעת סיום</TH>

										<TH>שעת התחלה</TH>

										<%if(completionForm.isShiftData()){ %>

										<TH>יציאה</TH>
										<TH>כניסה</TH>
										<TH>חיסור</TH>
										<TH>סיום</TH>
										<TH>התחלה</TH>
										<%}%>

										<TH>צוות</TH>
										<TH>שם</TH>
										<TH>#</TH>
									</TR>
								</thead>
								<tbody>
									<%
											ShfBaseBean employee=null;
											for(int i=0;i<allChecked.size();i++){
												if(completionForm.isShiftData())
													employee=(AgentDayBean)allChecked.get(i);
												else
													employee=(EmployeeBean)allChecked.get(i);
											%>
											
									<%if(completionForm.isShiftData()){ %>
									
									<html:hidden property="selectedEmployees" value="<%=String.valueOf(((AgentDayBean)employee).getEmployeeId())%>"></html:hidden>
									
									<TR bgcolor="<%=i%2==0?"#f5f5f5":"#ffffff"%>">
										<TD><shf:timechooser inputname="completionsEnd" inputid="<%=i%>" name="completionForm" property="completionEnd"/></TD>
										<!--TD><shf:calendar calname="completionToDate" name="completionForm" property="completionToDate" marginBottom="40" marginRight="20"/></TD-->
										<TD><shf:timechooser inputname="completionsStart" inputid="<%=i%>" name="completionForm" property="completionStart"/></TD>
										<!--TD><shf:calendar calname="completionFromDate" name="completionForm" property="completionFromDate" marginBottom="60" marginRight="20"/></TD-->
										<TD class="data" style="color:coral;"><shf:shftime date="<%=((AgentDayBean)employee).getStationExitTime()%>" /></TD>
										<TD class="data" style="color:#449944;"><shf:shftime date="<%=((AgentDayBean)employee).getStationArrivalTime()%>" /></TD>
										<TD class="data"><%=((AgentDayBean)employee).getMissingReasonId()>0?"<img src=/shf/images/rem.gif border=0>":""%></TD>
										<TD class="data"><shf:shftime date="<%=((AgentDayBean)employee).getShiftEnd()%>" /></TD>
										<TD class="data"><shf:shftime date="<%=((AgentDayBean)employee).getShiftStart()%>" /></TD>
										<TD class="data"><shf:tables tableName="unitCode" codeName="<%=((AgentDayBean)employee).getOrgUnitCode()%>" /></TD>
										<TD class="data"><%=((AgentDayBean)employee).getFirstName()+" "+((AgentDayBean)employee).getLastName()%></TD>
										<TD class="index" style="border-left: 1px silver solid;"><%=i+1 %></TD>
									</TR>
									<%}else{%>

									<html:hidden property="selectedEmployees" value="<%=String.valueOf(((EmployeeBean)employee).getEmployeeId())%>"></html:hidden>

									<TR bgcolor="<%=i%2==0?"#f5f5f5":"#ffffff"%>">
										<TD><shf:timechooser inputname="completionsEnd" inputid="<%=i%>" name="completionForm" property="completionEnd" /></TD>
										<!--TD><shf:calendar calname="completionToDate" name="completionForm" property="completionToDate" marginBottom="40" marginRight="20"/></TD-->
										<TD><shf:timechooser inputname="completionsStart" inputid="<%=i%>" name="completionForm" property="completionStart" /></TD>
										<!--TD><shf:calendar calname="completionFromDate" name="completionForm" property="completionFromDate" marginBottom="60" marginRight="20"/></TD-->
										<TD class="data"><shf:tables tableName="unitCode" codeName="<%=((EmployeeBean)employee).getOrgUnitId()%>" /></TD>
										<TD class="data"><%=((EmployeeBean)employee).getFname()+" "+((EmployeeBean)employee).getLname()%></TD>
										<TD class="index" style="border-left: 1px silver solid;"><%=i+1 %></TD>
									</TR>
									<%}}%>
								</tbody>
							</table>
							</div>
							</TD>
								</TR>
							</table>
							
						</TD>
					</TR>
					<TR>
						<TD colspan="4" style="padding:10px;">
							<button onclick="javascript:history.go(-1);">חזרה</button>&nbsp;
							<button onclick="javascript:document.forms['saveCompletionForm'].reset();">איפוס</button>&nbsp;
							<button onclick="saveCompletion();">שמירה</button> 
						</TD>
					</TR>
				</table>
			</TD>
		</TR>
	</TABLE>
	</html:form>
</body>
</html>