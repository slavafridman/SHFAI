<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");


%>
<jsp:useBean id="employeeListForm"
	class="bzq.shf.forms.EmployeeListForm" scope="request">
</jsp:useBean>
<jsp:useBean id="employee"
	class="bzq.shf.bean.EmployeeBean" scope="page">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector,bzq.shf.bean.EmployeeBean"
%>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
	
<%
Vector employees=(Vector)request.getAttribute("employees");
String team=employeeListForm.getTeam()[0];
if(team.equals("00")){
%>
	
<%						
}
else{
%>

<%
if(employees!=null && employees.size()>0){
%>
	<form name="employeeSwitchForm" style="display: inline;">
	<TABLE width="100%">
	<TR>
	<TD class=header>שם עובד:</TD>
	<TD width="10px"></TD>
	<TD>
	<select name="employeeId" style="width:160px;font-size:10px;" onchange="viewShiftsForSwitch();">
	<OPTGROUP style="border-bottom:2px black solid">
	<OPTION value="">בחר עובד</OPTION>
	</OPTGROUP>
	<OPTGROUP>
	<%
	for(int i=0;i<employees.size();i++){
		employee=(EmployeeBean)employees.get(i);
		//if status is not active then continue. (show only active emp's)
		if(employee.getStatusId()!=3) continue;
		
	%>
	<OPTION value="<%=employee.getEmployeeId()%>"><%=employee.getFname()+" "+employee.getLname()%></OPTION>
	<%
	}
	%>
	</OPTGROUP>
	</select>
	</TD>
	</TR>
	</TABLE>
	</form>
<%
}}
%>