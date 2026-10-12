<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

String parent=request.getParameter("agaf");
%>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
	
<%
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
	style="width:170px;font-size:10px;" type="G01" all="yes"
	logic="onchange=setMultiTeams(this,'form','team','200');" parentunit="<%=parent%>"/>
<%
}
%>