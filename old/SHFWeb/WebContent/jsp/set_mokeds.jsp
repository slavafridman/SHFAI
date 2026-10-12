<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

String parent = request.getParameter("agaf");
String allowedMoked=request.getParameter("allowedMoked");

%>
<jsp:useBean 
	id="completionForm"
	class="bzq.shf.forms.CTICompletionForm" 
	scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
	
<%
if (allowedMoked == null) {
	if(parent==null || parent.equals("-1")){
	%>
		<shf:unitselect tablename="unitCode" name="moked"
		style="width:170px;font-size:10px;" type="G01" all="yes"
		type="999" logic="disabled"/>
	<%						
	}
	else{
	%>
		<shf:unitselect tablename="unitCode" name="moked"
		selectedName="completionForm" selectedProperty="moked"
		style="width:170px;font-size:10px;" type="G01" all="yes"
		logic="onchange='setTeams();setActivities(this,1);'" parentunit="<%=parent%>"/>
	<%
	}
} else { %>
	<input type="hidden" name="ctiAllowedMoked" value="<%=completionForm.getCtiAllowedMoked() %>">
 <%	if(parent==null || parent.equals("-1")){
	%>
		<shf:unitselectSinlgeMoked name="moked" mokedUnitId="<%=allowedMoked %>" logic="onchange='setTeams();setActivities(this,1);'" style="width:170px;font-size:10px;" disabled="disabled"/>
	<% } else { %>
		<shf:unitselectSinlgeMoked name="moked" mokedUnitId="<%=allowedMoked %>" logic="onchange='setTeams();setActivities(this,1);'" style="width:170px;font-size:10px;" />
	<% } %>
<% } %>