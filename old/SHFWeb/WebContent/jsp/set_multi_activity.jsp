<%@page import="com.ibm.websphere.validation.base.config.level502.requestmetricsvalidation_502_NLS"%>
<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

String moked=request.getParameter("moked");
String formName=request.getParameter("formName");
String property=request.getParameter("property");
String fromJSP=request.getParameter("from");
int all=0,multy=0;
try{
all=Integer.parseInt(request.getParameter("allActivities"));
}catch(NumberFormatException e){}
String allActivities=all>0?"yes":"no";

%> 


<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">


	<%if ("frcstCalls".equals(fromJSP)) { %>
	<shf:LocalMokedCheckList name="<%=formName%>" moked="<%=moked%>" property="<%=property%>"/>
	<%} else { %>
	<shf:activityCheckList name="<%=formName%>" moked="<%=moked%>" property="<%=property%>"/>
	<%} %>

