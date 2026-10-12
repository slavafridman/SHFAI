<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/shfgrid.css" rel="stylesheet" type="text/css">
<TITLE>bi_cti.jsp</TITLE>

<shf:reloadErrors></shf:reloadErrors>

</HEAD>
<BODY>

<TABLE width=100% height=20px cellpadding="0" cellspacing="0">
	<TR><TD valign="top" style="height:20px;"><jsp:include page="submenu/emptySubmenu.jsp"></jsp:include> </TD></TR>
	
	<TR>
		<TD height="100%" width="100%" align=right style="padding:10px;">
			<p dir=rtl class="header">הצגת נתוני CTI:</p>
			
			<iframe width="100%" height="500px" src="http://vm-sql2k8rs/ReportServer/Pages/ReportViewer.aspx?%2fBI%2fInfomart%2fRS%2fIFM_Session_Natzig&rs:Command=Render"></iframe>
			<!-- iframe width="100%" height="500px" src="http://reports.bezeq.com/ReportServer/Pages/ReportViewer.aspx?%2fBI%2fInfoMart_RS%2fIFM_Session_Natzig&rs:Command=Render"></iframe-->
			
		</TD>
	</TR>
</TABLE>

</BODY>
</HTML>
