<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.profile.UserProfile"%>


<HTML>
<HEAD>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>admin_main.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>


<%
UserProfile userprofile=(UserProfile)session.getAttribute("userProfile");
String username=userprofile.getFirstName()+" "+userprofile.getLastName();
%>
<BODY dir=rtl>
<TABLE width=100% height=100% cellpadding="0" cellspacing="0">
	<TR>
	<TD valign="top" style="height:20px;"><jsp:include page="submenu/admin_submenu.jsp"></jsp:include> </TD>
	</TR>
	
		
	<TR>
	<TD valign=top style="padding:10px 10px 10px 10px;">
		<FIELDSET>
		<TABLE>
		<TR>
			<TD><img src="/shf/images/hint.png"></TD>
			<TD class=header>ωμεν</TD>
			<TD class=header><%=username%></TD>
		</TR>
		</TABLE>
		</FIELDSET>
	</TD>
	</TR>
</TABLE>
</BODY>
</HTML>
