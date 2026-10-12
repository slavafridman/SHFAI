<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

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
	<shf:unitselect tablename="unitCode" name="moked"
	style="width:170px;font-size:10px;" type="G01" emptySelection="yes"
	type="G01"  logic="onchange=setMultiActivities(this,'forecastForm','activityList');setMultiExceptions(this,'exceptionForm','exceptionList');setChoice('moked');"/>
	