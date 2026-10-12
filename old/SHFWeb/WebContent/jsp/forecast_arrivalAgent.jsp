<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>

<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<%@page import="bzq.utils.BaseConvert"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<META HTTP-EQUIV="PRAGMA" CONTENT="NO-CACHE">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<jsp:useBean id="agentDayBeans" class="java.util.Vector" scope="request"></jsp:useBean>

<style type="text/css">

</style>
<link rel="stylesheet" href="../theme/Master.css" type="text/css">
<title>forecast_arrivedAgent</title>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/breakjs.js"></script>

</HEAD>

<body  dir="rtl">
<DIV id="div1" style="width: 200px; height: 300px; overflow-y: auto;">
<table border="1" cellpadding="0" cellspacing="0" align="center"
	dir="rtl">
	
	<tbody>
	<tr>
			<th bgcolor="#dbeaf5"  >שם פרטי</th>
			<th bgcolor="#dbeaf5"  >שם משפחה</th>
			
		</tr>
		<logic:iterate id="agentDayBean" name="agentDayBeans">
					<tr>
					<TD nowrap="nowrap" class="data"><bzq:string name="agentDayBean" property="firstName"/></TD>
					<TD nowrap="nowrap" class="data"><bzq:string name="agentDayBean" property="lastName"/></TD>
									</tr>	
		</logic:iterate>
		
	</tbody>
	
	
	
	
</table>
</DIV>
	</body>
    </html>