<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@page import="java.util.Calendar"%>
<%@page import="org.apache.tools.ant.util.DateUtils"%>
<%@page import="java.util.Date"%>
<%@page import="java.util.Enumeration"%>
<%@page import="bzq.shf.forms.ForecastForm"%>
<%@page import="bzq.shf.utils.SHFUtils"%>
<%@page import="bzq.shf.bean.AgentDayBean"%>
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

<jsp:useBean id="mokedSwitchesLeft" class="java.util.Vector" scope="request"></jsp:useBean>
<jsp:useBean id="mokedSwitchesArrived" class="java.util.Vector" scope="request"></jsp:useBean>

<style type="text/css">
  
 </style>
<link rel="stylesheet" href="../theme/Master.css" type="text/css">
<title>forecast_activitySwitch</title>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/breakjs.js"></script>


</HEAD>

<body  dir="rtl">
<DIV id="div1" style="width: 800px; height: 350px; overflow-y: auto; overflow-x: auto;direction: rtl; top: 700" align="center">
<table border="1" cellpadding="0" cellspacing="0" align="center" dir="rtl">

<tbody>
	<tr bgcolor="#dbeaf5">
		<th colspan="7" style="text-align: center;" >נציגים חסרים לשעה במוקד</th>
		
	</tr>
	<tr>
		<th colspan="3" style="text-align: center;">פרטי משמרת מקורית</th><th colspan="4" style="text-align: center;">פרטי משמרת מוחלפת</th>
		
	</tr>
	<tr>
			<th style="text-align: center;">שם פרטי</th> <th style="text-align: center;">שם משפחה</th> <th style="text-align: center;">משמרת מקורית</th>
			<th style="text-align: center;">שם פרטי</th> <th style="text-align: center;">שם משפחה</th> <th style="text-align: center;">מוקד</th> <th style="text-align: center;">משמרת מוחלפת</th>
    </tr>
	

		<logic:iterate id="agentDayBean" name="mokedSwitchesLeft">
					<tr>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="firstName"/></TD>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="lastName"/></TD>
					<TD nowrap="nowrap" class="data">מ <shf:shftime name="agentDayBean" property="wmShiftStartTime" pattern="dd/MM HH:mm" /> - עד
													  <shf:shftime name="agentDayBean" property="wmShiftEndTime" pattern="dd/MM HH:mm" /> </TD>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="switchedWithFirstName" /></TD>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="switchedWithLastName" /></TD>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="siteName" /></TD>
					<TD nowrap="nowrap" class="data">מ <shf:shftime name="agentDayBean" property="newShiftStart" pattern="dd/MM HH:mm" /> - עד
													  <shf:shftime name="agentDayBean" property="newShiftEnd" pattern="dd/MM HH:mm" /></TD>
					
					</tr>	
		</logic:iterate>
		<tr>
			<th colspan="2" style="text-align: center;">סה"כ חסרים</th><th colspan="5" style="text-align: center; color: red;"> <%=mokedSwitchesLeft.size()%></th>
		</tr>
		<tr bgcolor="#dbeaf5">
		<th colspan="7" style="text-align: center;">נציגים שהתווספו לשעה במוקד</th>
		
	</tr>
	<tr>
		<th colspan="3" style="text-align: center;">פרטי משמרת מקורית</th><th colspan="4" style="text-align: center;">פרטי משמרת מוחלפת </th>
		
	</tr>
	<tr>
			<th style="text-align: center;">שם פרטי</th> <th style="text-align: center;">שם משפחה</th> <th style="text-align: center;">משמרת מקורית</th>
			<th style="text-align: center;">שם פרטי</th> <th style="text-align: center;">שם משפחה</th> <th style="text-align: center;">מוקד</th> <th style="text-align: center;">משמרת מוחלפת</th>
    </tr>
	

		<logic:iterate id="agentDayBean" name="mokedSwitchesArrived"> 
					<tr>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="firstName"/></TD>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="lastName"/></TD>
					<TD nowrap="nowrap" class="data">מ <shf:shftime name="agentDayBean" property="wmShiftStartTime" pattern="dd/MM HH:mm" /> - עד
													  <shf:shftime name="agentDayBean" property="wmShiftEndTime" pattern="dd/MM HH:mm" /> </TD>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="switchedWithFirstName" /></TD>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="switchedWithLastName" /></TD>
					<TD nowrap="nowrap" class="data"> <bzq:string name="agentDayBean" property="siteName" /></TD>
					<TD nowrap="nowrap" class="data">מ <shf:shftime name="agentDayBean" property="newShiftStart" pattern="dd/MM HH:mm" /> - עד
													  <shf:shftime name="agentDayBean" property="newShiftEnd" pattern="dd/MM HH:mm" /></TD>
					</tr>	
		</logic:iterate>
		<tr>
			<th colspan="2" style="text-align: center;">סה"כ נוספים</th><th colspan="5" style="text-align: center; color: red;"> <%=mokedSwitchesArrived.size()%></th>
		</tr>
		
	</tbody>

</table>
</DIV>
	</body>
    </html>