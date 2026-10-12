<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>

<jsp:useBean id="shiftForm"
	class="bzq.shf.forms.ShiftDataForm" 
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>

<html>
<head>

<link rel="stylesheet" href="../theme/Master.css" type="text/css">

<title>add_remark_dialog</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">

</head>

<BODY style="height:100%;width:100%">
<div  style="width:100%;visibility:visible;height:100%;">
<form name=addRemarkForm>
	
	<html:hidden property="agentDayId" name="shiftForm"></html:hidden>

<table style="height: 90%; width: 100%; background-color: transparent;">
	<TR>
		<TD width="100%" height="100%" valign="top">

		<table width="100%" height="100%">
			<tr>
				<td valign="top" height="100%" width="100%">
				<fieldset
					style="margin-left:15%;margin-top:130px;position: absolute; width: 400px; direction: rtl; background-color: #ffffea;border: 1px solid gray;">
				<legend><img src="/shf/images/close_window.gif"
					style="cursor: hand" alt="סגור"
					onclick="clear_popup('remarkPopupDiv');"> הוספת הערה </legend>



				<div style="padding: 10px;">
				<table cellpadding="1" cellspacing="1">
					<tr>
						<td class=header colspan=3>הערת משמרת</td>
					</tr>
					<tr>
						<td colspan=3 style="padding-bottom:5px;"><textarea id="remarkText" cols="35" rows="5" name="remark" ></textarea><br>
						<span style="color:#bbbbbb;font-size:11px;font-style:italic;">מקסימום 100 תווים</span>
						</td>
					</tr>
					<tr>
						<td>
						<button onclick="clear_popup('remarkPopupDiv');">ביטול</button>
						</td>
						<td>
						<button onclick="document.getElementById('remarkText').innerText='';">מחיקה</button>
						</td>
						<td>
						<button onclick="addShiftRemark();">שמור</button>
						</td>
						<td width=50px></td>
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
</form>
</div>
</body>
</html>