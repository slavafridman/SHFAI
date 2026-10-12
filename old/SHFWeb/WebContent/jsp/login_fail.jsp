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
<TITLE>login_fail.jsp</TITLE>
</HEAD>
<%
	String env=((bzq.utils.AppInfo)application.getAttribute(bzq.utils.AppConstants.APP_INFO_KEY)).getEnvironment();
	char e=env.charAt(0);
	String str="";
	switch(e){
	case 'd':
	case 'D':
	str=" בסביבת פיתוח";
	break;
	
	case 't':
	case 'T':
	str=" בסביבת בדיקות";
	break;
	
	case 'p':
	case 'P':
	str=" בסביבת ייצור";
	break;
	
	default:
	
	}
%>
<BODY dir=rtl>
<br><br>
<TABLE cellspacing="0" cellpadding="0" width=530px height="400px" align="center">
<TR>
<TD rowspan=4 bgcolor="#2B348F">&nbsp;&nbsp;&nbsp;&nbsp;</TD><TD rowspan=2 valign="top"><img src="/shf/images/bezeq_home_page_02.jpg"></TD><TD width=100% bgcolor="#2B348F" height="20px" style="color:white;text-align:center;font-size:17px;font-weight:bold;padding-left:60px;font-family:arial;">מערכת שיפטר</TD><TD rowspan=4 bgcolor="#2B348F">&nbsp;&nbsp;&nbsp;&nbsp;</TD>
</TR>
<TR><TD>&nbsp;</TD></TR>
<TR><TD colspan=2  height="100%" align="center" valign="top">
<br>
<TABLE>
<TR>
<TD align="right" rowspan="3" valign="top"><img src="/shf/images/noentry.gif"></TD>

<TD valign="middle" align="center">
<p style="color:red;font-size:22px;font-family:arial;font-weight:bold;">כניסה למערכת נכשלה</p>
<p style="font-size:18px;font-family:arial;">אינך מורשה להיכנס למערכת שיפטר <%=str%></p>
<p style="font-size:18px;font-family:arial;">נא לפנות לרפרנט המערכת במוקד</p>
</TD>
</TR>
</TABLE>
</TD></TR>
<TR><TD colspan=2 bgcolor="#2B348F" width=100%>&nbsp;</TD></TR>
</TABLE>
</BODY>
</HTML>
