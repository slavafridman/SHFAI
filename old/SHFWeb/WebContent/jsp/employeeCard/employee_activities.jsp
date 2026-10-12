<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="employeeData"
	class="bzq.shf.forms.EmployeeDataForm" scope="request">
</jsp:useBean>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" 	  prefix="shf"%>
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
<TITLE>employee_activities.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>

</HEAD>
<%
int empid=employeeData.getEmployeeId();
%>
<BODY dir=rtl onload="employeeShiftsForm.submit();">
	<TABLE width=100% height=100%>
		<TBODY>
			<TR>
				<TD width=100% style="text-align:right;font-size:12px; background-color: #eeeeee;">
					<a onclick="document.employeeShiftsForm.submit();" style="color:navy;cursor:hand;padding-left:5px;padding-right:5px;">משמרות</a>  | 
					<a onclick="document.employeeExceptionsForm.submit();" style="color:navy;cursor:hand;padding-left:5px;padding-right:5px;">פעילויות אחרות</a>   
					
				</TD>
			</TR>
			<TR>
				<TD  style="padding-top:5px;padding-bottom:5px;height:100%" width=100% >
					<IFRAME height="100%" width="100%" frameborder="0" name="activityFrame" id="educationFrame"></IFRAME>	
				</TD>
			</TR>
		</TBODY>
	</TABLE>
	
	<form style="display:none;"
	action="/shf/employee/getShiftsParam.do" 
	name="employeeShiftsForm" 
	method=post target="activityFrame">
	<input type="hidden" value="<%=empid%>" name="employeeId">
	</form>
	
	<form style="display:none;"
	action="/shf/employee/getExceptions.do" 
	name="employeeExceptionsForm" 
	method=post target="activityFrame">
	<input type="hidden" value="<%=empid%>" name="employeeId">
	</form>
	
</BODY>
</HTML>
