<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>login.jsp</TITLE>
</HEAD>
<BODY>
<h1 style="padding-left:10px;">Shifter Login Page</h1>
<form action="/shf/login.do" style="padding-left:10px;">
<TABLE>
	<TBODY>
		<TR>
			<TD>Id Number:</TD>
			<TD><INPUT type="text" name="user" size="20"></TD>
		</TR>
		<TR>
			<TD colspan=2><br><INPUT class=button type="submit" value="כניסה"></TD>
			
		</TR>
	</TBODY>
</TABLE>
</form>
</BODY>
</HTML>
