<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="completions" class="java.util.Vector" scope="request"></jsp:useBean>
<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>

<html>
<head>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

</head>

<body dir="rtl">
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0" dir="rtl">
		<TR>
			<TD colspan="2" valign="top"><jsp:include page="../submenu/admin_submenu.jsp" /></TD>
		</TR>
		<TR>
			<TD valign="top" height="100%" width="100%" style="padding:12px;">
				<table width="100%" cellpadding="1" cellspacing="0" style="text-align:center;border:solid 1px silver">
					<thead>
						<tr>
							<th>קוד השלמה</th>
							<th>תיאור</th>
							<th>נשלח ל SAP</th>
							<th>תאריך עדכון</th>
						</tr>
					</thead>
					<tbody>
						<logic:iterate id="completion" name="completions">
							<tr>
								<td class="data"><bzq:string name="completion" property="code"/></td>
								<td class="data"><bzq:string name="completion" property="description"/></td>
								<td class="data">
									<logic:equal value="1" name="completion" property="sapPay">כן</logic:equal>
									<logic:equal value="0" name="completion" property="sapPay">לא</logic:equal>	
								</td>
								<td class="data"><shf:shfdate name="completion" property="updateDate" /></td>
							</tr>
						</logic:iterate>
					</tbody>
				</table>
			</TD>
		</TR>
	</TABLE>
</body>

</html>