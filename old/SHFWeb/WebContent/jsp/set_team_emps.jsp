<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

String parent=request.getParameter("moked");

%>
<jsp:useBean id="employeeListForm"
	class="bzq.shf.forms.EmployeeListForm" scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
	
<%
if(parent.equals("-1")){
%>
	<shf:unitselect tablename="unitCode" name="team"
	selectedName="employeeListForm" selectedProperty="team"
	style="width:170px;font-size:10px;" type="999" logic=" disabled" />
<%						
}
else{
%>
	<shf:unitselect tablename="unitCode" name="team"
	selectedName="employeeListForm" selectedProperty="team"
	style="width:170px;font-size:10px;" type="J01" all="yes" parentunit="<%=parent%>" 
	logic="onchange='setEmps();'"/>
<%
}
%>