<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>

<jsp:useBean id="shiftLoginCancelForm"
			class="bzq.shf.forms.ShiftLoginCancelForm" 
			scope="request">
</jsp:useBean>

<HTML>
<HEAD>
<script type="text/javascript" src="../dojo/dojo/dojo.js"
	djConfig="isDebug: false, parseOnLoad: true"></script>
<style type="text/css">
@import "../dojo/dojo/resources/dojo.css";

@import "../dojo/dijit/themes/nihilo/nihilo.css";

@import "../dojo/dijit/themes/dijit.css";
</style>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<%@page import="bzq.utils.BaseConvert,java.util.Vector"%>
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
<title>add_cancel_login_dialog_1</title>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/breakjs.js"></script>
<script type="text/javascript">
dojo.require("dojo.parser");
dojo.require("dijit.form.Button");

</script>

</HEAD>
<body  dir="rtl" >
<%
String shiftsStartDate = BaseConvert.dateToString(shiftLoginCancelForm.getShiftStart(),"ddMMyyyy"); 
String shiftsStartTime = BaseConvert.dateToString(shiftLoginCancelForm.getShiftStart(),"HH:mm");
String shiftsEndDate = BaseConvert.dateToString(shiftLoginCancelForm.getShiftEnd(),"ddMMyyyy"); 
String shiftsEndTime = BaseConvert.dateToString(shiftLoginCancelForm.getShiftEnd(),"HH:mm");

int ii=0;

%>
<h3>פעולה זו תגרום לאי העברת נתוני CTI למערכת SAP עבור המשמרת הנוכחית</h3>
<DIV id="div1" style="width: 500px; height: 200px; overflow-y: auto;">
<form name="shiftLoginCancelForm" id="shiftLoginCancel">

<input type="hidden"  name="agentDayId" value="<%=shiftLoginCancelForm.getAgentDayId()%>">
<input type="hidden"  name="employeeId" value="<%=shiftLoginCancelForm.getEmployeeId()%>">
<input type="hidden"  name="agantFirstName" value="<%=shiftLoginCancelForm.getAgantFirstName()%>">
<input type="hidden"  name="agantLastName" value="<%=shiftLoginCancelForm.getAgantLastName()%>">
<input type="hidden"  name="shiftStartDate" value="<%=shiftsStartDate%>">
<input type="hidden"  name="shiftStartTime" value="<%=shiftsStartTime%>">
<input type="hidden"  name="shiftEndDate" value="<%=shiftsEndDate%>">
<input type="hidden"  name="shiftEndTime" value="<%=shiftsEndTime%>">

<table border="0" cellpadding="0" cellspacing="0" align="right"	dir="rtl">
	
	<tbody>
	<tr>
		<TD class="header">שם נציג:</TD>
		<TD class="data" align="right" colspan="4">
			<bzq:string name="shiftLoginCancelForm" property="agantFirstName" /> &nbsp; 
			<bzq:string	name="shiftLoginCancelForm" property="agantLastName" />
		</TD>
		</tr>
	<tr>
		<TD class="header">תאריך:</TD>
		<TD>
			<bzq:date name="shiftLoginCancelForm" property="shiftStart" pattern="dd/MM/yyyy"/>
		</TD>	
		<TD width="5px" > </TD>
		<TD class="header">שעה:</TD>
		<td >
			<bzq:time name="shiftLoginCancelForm" property="shiftStart" pattern="HH:mm"/>
		</td>
	</tr>
	<tr>
		<TD class="header">עד תאריך:</TD>
		<TD>
			<bzq:date name="shiftLoginCancelForm" property="shiftEnd" pattern="dd/MM/yyyy"/>
		</TD>	
		<TD width="5px" > </TD>
		<TD class="header">שעה:</TD>
		<td>
			<bzq:time name="shiftLoginCancelForm" property="shiftEnd" pattern="HH:mm"/>
		</td>
	</tr>
	<TR>
		<TD nowrap="nowrap" class="header" >שם מאשר:</TD>
		<TD colspan="4">
			<SELECT name="applierName" id="applierId">
				<% Vector appMan = shiftLoginCancelForm.getApplierVec();
				for(int i=0; i<appMan.size(); i++ ) {%>
				<OPTION value="<%=(String)appMan.get(i)%>"><%=(String)appMan.get(i)%></OPTION>
				<%}%>
			</SELECT>
		</TD>
	</TR>
	<TR>
		<TD nowrap="nowrap" class="header" >שם רושם:</TD>
		<TD colspan="4">
			<SELECT name="updaterName" id="updaterId">
				<% Vector updMan = shiftLoginCancelForm.getUpdaterVec();
				for(int i=0; i<updMan.size(); i++ ) {%>
				<OPTION value="<%=(String)updMan.get(i)%>"><%=(String)updMan.get(i)%></OPTION>
				<%}%>
			</SELECT>
		</TD>
	</TR>
	<TR>
		<TD valign="top" class="header" colspan="6" >הערת ביטול העברה ל - SAP:</TD>
	</TR>
	<tr>
		<TD colspan="6"><textarea cols="33" rows="3" name="cancelLoginRemark" id="remarkCancel"></textarea></TD>
	</tr>
	<tr>
		<td>
			<button dojoType="dijit.form.Button" id="okButton" onclick="addShiftCancelLogin()">אישור</button>
		</td>
		<td colspan="4">
			<button dojoType="dijit.form.Button"  id="cancelButton" onclick="closeShiftCancelLogin()">ביטול</button>
		</td>
	</tr>
	</tbody>

</table>
</form>
</DIV>
	</body>
    </html>