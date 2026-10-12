<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

String agaf=request.getParameter("agaf");

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
	
<shf:innerJobCheckList length="170" name="attendanceForm" 
tablename="innerJobCode" agaf="<%=agaf%>" property="innerJob" />