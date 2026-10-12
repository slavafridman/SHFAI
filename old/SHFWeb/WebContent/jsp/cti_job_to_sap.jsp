<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="available" class="java.util.Vector" scope="request"></jsp:useBean>
<jsp:useBean id="assigned" class="java.util.Vector" scope="request"></jsp:useBean>

<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>


<%@page import="bzq.shf.forms.TableForm"%><html>
<head>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">


<title>cti</title>

<script type="text/javascript" src="/shf/js/drag.js"></script>

<shf:reloadErrors></shf:reloadErrors>
</head>

<body dir="rtl">
<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TR>
		<TD dir="rtl" valign="top" style="height:20px;"><jsp:include
			page="submenu/cti_submenu.jsp"></jsp:include></TD>
	</TR>
	
	<TR>
		<TD width="100%" valign="top"
			style="padding-top:3px;height:100%; padding-bottom: 5px; padding-right: 6px; padding-left: 6px;">
			<fieldset style="padding:5px;height:90%;">
				<legend>רשימת תפקידים</legend>
			<table border="0" width="100%" height="100%">
				<tr>
					
					<td height="100%" width="300px" style="padding-top:15px;">
					<div style="border:1px silver solid;color:navy;font-size:15px;font-weight:bold;background-image:url('/shf/images/yellow_fade_bg.png');background-repeat:no-repeat;padding:3px;">תפקידים שלא מועברים ל SAP</div>
					<div style="overflow: auto; border: 1px silver solid;height:90%;" id="dataGridDiv">
					
					<table id="sourceTable" width="100%" bgcolor="#fafafa">
						<%for(int i=0;i<available.size();i++){ 
							TableForm job=(TableForm)available.get(i);
						%>
							<tr onclick="selectSourceRow(this,<%=job.getCode() %>);">
								<td style="cursor:hand;" width="100%" id="srow<%=job.getCode()%>"><%=job.getDescription() %> </td>
							</tr>
						<%}%>
					</table>
					</div>
					</td>
					
					
					<td valign="middle" align="center">
						<span onclick="sourceToTarget();"><img src="/shf/images/left_002.png"/></span> 
						<br/><br/>
						<span onclick="targetToSource();"><img src="/shf/images/right_002.png"/></span>
					</td>
					
					
					<td height="100%" width="300px" style="padding-top:15px;">
					<div style="border:1px silver solid;color:navy;font-size:15px;font-weight:bold;background-image:url('/shf/images/yellow_fade_bg.png');background-repeat:no-repeat;padding:3px;">תפקידים שמועברים ל SAP</div>
					<div style="overflow:auto;border:1px silver solid;height:90%;" id="dataGridDiv">
					<table id="targetTable"  width="100%" bgcolor="#fafafa">
						<%for(int i=0;i<assigned.size();i++){ 
							TableForm job=(TableForm)assigned.get(i);
						%>
							<tr onclick="selectTargetRow(this,<%=job.getCode() %>);">
								<td style="cursor:hand;" width="100%" id="trow<%=job.getCode()%>"><%=job.getDescription() %> </td>
							</tr>
						<%}%>
					</table>
					</div>
					</td>
					
				</tr>
			</table>
			</fieldset>
		</TD>
	</TR>
</TABLE>
</body>
</html>