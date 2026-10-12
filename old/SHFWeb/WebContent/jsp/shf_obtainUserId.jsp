<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.0 Transitional//EN">
<%@ page language="java" contentType="text/html; charset=windows-1255" %>
<html>
<head>
<%
	response.setHeader("pragma", "no-cache"); 
	response.setHeader("Cache-control", "no-cache, no-store, must-revalidate"); 
	response.setHeader("Expires", "01 Apr 1995 01:10:10 GMT");
	response.setDateHeader("Expires", 0);
%>
<meta
	http-equiv="Expires"
	CONTENT="0">
<meta
	http-equiv="Cache-Control"
	CONTENT="no-cache">
<meta
	http-equiv="Pragma"
	CONTENT="no-cache">

<meta
	http-equiv="Content-Type"
	content="text/html; charset=windows-1255">
<title>Redirection</title>
<meta
	http-equiv="Content-Style-Type"
	content="text/css">
</head>
<body>
<%
	String env=((bzq.utils.AppInfo)application.getAttribute(bzq.utils.AppConstants.APP_INFO_KEY)).getEnvironment();
	env=env.substring(0,1);
%>
<form action="http://<%=env%>auths.bezeq.com/obtainuserid/default.asp" method="post">
<%
	java.util.Enumeration keys = request.getParameterNames();
	String values[] = null;
	String name = null;
	String value = null;

	while (keys.hasMoreElements()){
		name = (String)keys.nextElement();
		values = request.getParameterValues(name);
		for(int i=0; i<values.length; i++){
			value = values[i];
%> <input
	type="hidden"
	name="<%= name %>"
	value="<%= value %>"> <%
		}
	}
%></form>
<script language="JavaScript">
	document.forms[0].submit();
</script>

</body>
</html>
