<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="employeeData"
	class="bzq.shf.forms.EmployeeDataForm" scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<HTML>
<HEAD>

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
<TITLE>employeeEducation.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%
int empid=employeeData.getEmployeeId();
%>
<BODY dir=rtl onload="employeeSkillsForm.submit();">
	<TABLE width=100% height=100%>
		<TBODY>
			<TR>
				<TD width=100% style="text-align:right;font-size:12px; background-color: #f2f2f2;">
					<a onclick="document.employeeSkillsForm.submit();" style="color:navy;cursor:hand;padding-left:5px;padding-right:5px;">מיומנויות</a>  | 
					<a disabled style="color:navy;cursor:hand;padding-left:5px;padding-right:5px;">קורסים</a>  | 
					
					<a disabled style="color:navy;cursor:hand;padding-left:5px;padding-right:5px;">הכשרות פנימיות</a>  | 
					<a disabled style="color:navy;cursor:hand;padding-left:5px;padding-right:5px;">מבחני ידע</a>
				</TD>
			</TR>
			<TR>
				<TD  style="padding-top:5px;padding-bottom:5px;height:100%" width=100% >
					<IFRAME height="100%" width="100%" frameborder="0" name="educationFrame" id="educationFrame"></IFRAME>	
				</TD>
			</TR>
		</TBODY>
	</TABLE>
	
	<form style="display:none;"
	action="/shf/employee/getCourses.do" 
	name="employeeCoursesForm" 
	method=post target="educationFrame">
	<input type="hidden" value="<%=empid%>" name="employeeId">
	</form>
	
	<form style="display:none;"
	action="/shf/employee/getSkills.do" 
	name="employeeSkillsForm" 
	method=post target="educationFrame">
	<input type="hidden" value="<%=empid%>" name="employeeId">
	</form>
	
</BODY>
</HTML>
