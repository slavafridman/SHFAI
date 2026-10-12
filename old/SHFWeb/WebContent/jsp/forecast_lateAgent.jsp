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
pageEncoding="WINDOWS-1255"%>

<%@page import="bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@ page import="java.util.Date,bzq.shf.utils.SHFConstants,bzq.shf.utils.SHFUtils,java.util.Vector,bzq.shf.bean.AgentDayBean"%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<META HTTP-EQUIV="PRAGMA" CONTENT="NO-CACHE">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<jsp:useBean id="agentDayBeans" class="java.util.Vector" scope="request"></jsp:useBean>
<jsp:useBean id="forecastForm" class="bzq.shf.forms.ForecastForm"
	scope="request"></jsp:useBean>

<style type="text/css">

</style>
<link rel="stylesheet" href="../theme/Master.css" type="text/css">
<title>forecast_lateAgent</title>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/breakjs.js"></script>
</HEAD>
<body dir="rtl">
<DIV id="div1" style="width: 700px; height: 150px; overflow-y: auto; overflow-x: auto;direction: rtl">
<form name="forecastForm" method="post">
<html:hidden property="moked" name="forecastForm" value=""></html:hidden> 
	

<table  border="1" cellpadding="0" cellspacing="0" align="center"
	dir="rtl">
	<tbody >
		<tr bgcolor="white" dir="rtl">
			<td bgcolor="#dbeaf5" dir="rtl">שם פרטי</td>
			<td bgcolor="#dbeaf5" dir="rtl">שם משפחה</td>
			<td bgcolor="#dbeaf5" dir="rtl">מוקד</td>
			<td bgcolor="#dbeaf5" dir="rtl">צוות</td>
			<td bgcolor="#dbeaf5" dir="rtl">תור</td>
			<td bgcolor="#dbeaf5" dir="rtl">תפקיד</td>
			<td bgcolor="#dbeaf5" dir="rtl">תחילת משמרת</td>
			<td bgcolor="#dbeaf5" dir="rtl">סיום משמרת</td>
			<td bgcolor="#dbeaf5" dir="rtl">סלולרי</td>
			<td bgcolor="#dbeaf5" dir="rtl">בית</td>
			<td bgcolor="#dbeaf5" dir="rtl">הערת משמרת</td>

		</tr>

	
	<%int i = 0; %>
		<logic:iterate id="agentDayBean" name="agentDayBeans">
				<%
				AgentDayBean agentDayBeanLate = ((AgentDayBean) (((Vector)request.getAttribute("agentDayBeans")).get(i)));
				//String mokedCode =bzq.shf.utils.SHFTableUtils.getMokedCodeOf(agentDayBeanLate.getm);
				
				// Svetlana
				//String activity=agentDayBeanLate.getShiftActivity();
				//activity=bzq.shf.utils.SHFUtils.replace(activity,";","");
				String activity=SHFTableUtils.getActivityNamesExport(agentDayBeanLate.getWmActivityId());

				String moked = agentDayBeanLate.getOrgUnitCode();
								 %>
					<tr>
					<TD nowrap="nowrap" class="data"><bzq:string name="agentDayBean" property="firstName"/></TD>
					<TD nowrap="nowrap" class="data"><bzq:string name="agentDayBean" property="lastName"/></TD>
					<TD nowrap="nowrap" class="data"><shf:tables tableName="unitCode" codeName="<%=moked%>"></shf:tables></TD>
					<TD nowrap="nowrap" class="data"><bzq:string name="agentDayBean" property="orgUnitName"/></TD>
					
					<!-- TD nowrap="nowrap" class="data"><shf:tables tableName="activityCode" codeName="<!--%=activity%>"></shf:tables></TD-->
					<TD nowrap="nowrap" class="data"><%=activity%></TD>
					
					<TD nowrap="nowrap" class="data"><bzq:string name="agentDayBean" property="jobName"/></TD>
					<TD nowrap="nowrap" class="data"><shf:shftime name="agentDayBean" property="shiftStart" pattern="dd/MM/yyyy HH:mm" /></TD>
					<TD nowrap="nowrap" class="data"><shf:shftime name="agentDayBean" property="shiftEnd" pattern="dd/MM/yyyy HH:mm" /></TD>
					<TD nowrap="nowrap" class="data"><bzq:string name="agentDayBean" property="cellularPhone"/></TD>
					<TD nowrap="nowrap" class="data"><bzq:string name="agentDayBean" property="homePhone"/></TD>
					<TD nowrap="nowrap" class="data"><bzq:string name="agentDayBean" property="remark"/></TD>
					</tr>	
		</logic:iterate>
	</tbody>
	
	
	
</table>
</form>
</DIV>
    </body>
    </html>