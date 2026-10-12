<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

String moked=request.getParameter("moked");
String property=request.getParameter("property");

int all=0,multy=0;
try{
all=Integer.parseInt(request.getParameter("allActivities"));
}catch(NumberFormatException e){}
String allActivities=all>0?"yes":"no";

try{
multy=Integer.parseInt(request.getParameter("multiple"));
}catch(NumberFormatException e){}
String multiple=multy>0?"yes":"no";

%> 
<jsp:useBean id="shiftInforce"
	class="bzq.shf.forms.ShiftInforceRequestForm" 
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
if(moked.equals("-1")){
	if ("activityAim".equals(property)){ %>
		<shf:localActivitySelectTag tablename="activityCode" name="activity" selectedName="shiftInforce" selectedProperty="activity" logic=" disabled" style="width:170px;font-size:10px;"/>
	<% } else { %>
		<shf:activityselect tablename="activityCode" name="activity" selectedName="shiftInforce" selectedProperty="activity" logic=" disabled" style="width:170px;font-size:10px;"></shf:activityselect>
	<%} %>
<%						
}
else{
	if ("activityAim".equals(property)){ %>
		<shf:localActivitySelectTag tablename="activityCode" name="activity" multiple="<%=multiple%>" all="<%=allActivities%>" selectedName="shiftInforce" selectedProperty="activity" moked="<%=moked%>"  style="width:170px;font-size:10px;" />
	<%} else { %>

	<shf:activityselect tablename="activityCode" name="activity" multiple="<%=multiple%>" all="<%=allActivities%>" selectedName="shiftInforce" selectedProperty="activity" moked="<%=moked%>"  style="width:170px;font-size:10px;" ></shf:activityselect>
	<%} %>
<%
}
%>