<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>

<jsp:useBean id="originalDay"
	class="bzq.shf.bean.AgentDayBean" 
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>

<html>
<head>

<link rel="stylesheet" href="../theme/Master.css" type="text/css">

<title>show original shift</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">

</head>

<BODY style="height:100%;width:100%">
<div  style="width:100%;visibility:visible;height:100%;">

	
	

<table style="height: 90%; width: 100%; background-color: transparent;">
	<TR>
		<TD width="100%" height="100%" valign="top">

		<table width="100%" height="100%" >
			<tr>
				<td valign="top" height="100%" width="100%">
				<fieldset
					style="border:1px solid #333333;margin-left:15%;margin-top:130px;position: absolute; width: 400px; direction: rtl; background-color: #fffff1;">
				<legend><img src="/shf/images/close_window.gif"
					style="cursor: hand" alt="סגור"
					onclick="clear_popup('popupDiv');"> פרטי משמרת מקורית </legend>



				<div style="padding: 10px;">
				<table cellpadding="1" cellspacing="1" >
					<tr>
						<td class=header colspan=3>שם נציג:</td>
						<td class=data><bzq:string name="originalDay" property="fullName"/> </td>
					</tr>
					<tr>
						<td class=header colspan=3>תאריך:</td>
						<td class=data><bzq:date name="originalDay" property="shiftStart"/> </td>
					</tr>
					<tr>
						<td class=header colspan=3>שעת התחלה:</td>
						<td class=data><bzq:datetime pattern="HH:mm" name="originalDay" property="shiftStart"/> </td>
					</tr>
					<tr>
						<td class=header colspan=3>שעת סיום:</td>
						<td class=data><bzq:datetime pattern="HH:mm" name="originalDay" property="shiftEnd"/> </td>
					</tr>
					<tr>
						<td class=header colspan=3>מוקד:</td>
						<td class=data> <shf:tables tableName="unitCode" codeName="<%=originalDay.getMokedCode()%>"/> </td>
					</tr>
					<tr>
						<td>
							<button onclick="clear_popup('popupDiv');">סגור חלון</button>
						</td>
						
					</tr>
				</table>
				</div>

				</fieldset>
				</TD>
			</TR>
		</TABLE>

		</TD>
	</TR>
</TABLE>

</div>
</body>
</html>