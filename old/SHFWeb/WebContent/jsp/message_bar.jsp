<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<HTML>
<HEAD>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>

<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");
%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>message_bar.jsp</TITLE>
</HEAD>

<BODY class=messages>
<TABLE border="0" cellspacing="0"
	cellpadding="0" style="border-collapse: separate" class="messageBar">
	<TBODY>
		<TR>
			<TD width="100%"
				align="center" id="messageBarArea" style="font-weight:bold;"><shf:errors/>
			</TD>
			
		</TR>
	</TBODY>
</TABLE>
</BODY>
</HTML>