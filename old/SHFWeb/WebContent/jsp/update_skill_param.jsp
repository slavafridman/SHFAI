<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="skillForm" 
class="bzq.shf.transfer.SkillForm"
scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
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
<TITLE>update_skill_param.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY>
<TABLE height="100%" width="100%" cellpadding="0" cellspacing="0"
	dir=rtl>
	<TR>
		<TD valign="top"><jsp:include page="submenu/admin_submenu.jsp" /></TD>
	</TR>

	<TR>
		<TD valign="top"  style="height: 100%; padding: 7px 7px 7px 7px">
			<FIELDSET class=info style="padding:7px 7px 7px 7px;">
			<LEGEND>עדכון סקיל</LEGEND>
			<form action="/shf/admin/updateSkillSave.do" name="skillUpdateForm" >
			<input type=hidden name=skillId value="<bzq:integer name="skillForm" property="skillId"/>">
			<input type=hidden name=skillName value="<bzq:string name="skillForm" property="skillName"/>">
			<TABLE>
				<TR>
				<TD class=header>שם סקיל:</TD><TD width=10px></TD><TD><bzq:string name="skillForm" property="skillName"/></TD>
				</TR>
				<TR>
				<TD class=header>תיאור סקיל:</TD><TD width=10px></TD><TD><input type=text value="<bzq:string name="skillForm" property="skillDesc"/>" name="skillDesc"></TD>
				</TR>
				<TR>
				<TD class=header>סקיל שפה:</TD><TD width=10px></TD><TD><input type="checkbox" name="isLanguage" value=1 <%=skillForm.getIsLanguage()==1?" checked":""%> >  </TD>
				</TR>
				<TR>
				<TD colspan=5><br>
				<button onclick="javascript:navigate('/shf/admin.do?action=updateSkills')">חזרה</button>
				&nbsp;<button onclick="document.skillUpdateForm.submit();">שמור</button>
				</TD>
				</TR>
			</TABLE>
			</form>
			</FIELDSET>
		</TD>
	</TR>
</TABLE>
</BODY>
</HTML>
