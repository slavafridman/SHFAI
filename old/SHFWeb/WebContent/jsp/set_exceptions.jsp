<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

String moked=request.getParameter("moked");

%> 
<jsp:useBean id="forecastForm"
	class="bzq.shf.forms.ForecastForm" 
	scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.utils.SHFTableUtils"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
	
<%
if(moked.equals("-1")){
%>
	<shf:exceptionselect tablename="exceptionCode" name="exception" 
			logic=" disabled " style="width:160px;font-size:10px;"/>
<%						
}
else{
%>
	<shf:exceptionselect tablename="exceptionCode" name="exception" 
			selectedName="forecastForm" selectedProperty="exception"  
			site="<%=SHFTableUtils.getSiteCodeOfUnit(moked)%>" 
			style="width:160px;font-size:10px;" all="yes"/>
<%
}
%>