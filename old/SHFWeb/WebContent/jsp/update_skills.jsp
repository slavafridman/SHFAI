<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>

<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<%@ page 
import="bzq.shf.transfer.SkillForm"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">
<TITLE>update_skills.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY>
<TABLE height="100%" width="100%" cellpadding="0" cellspacing="0" dir=rtl>
	<TR>
	<TD valign="top"><jsp:include page="submenu/admin_submenu.jsp" /></TD>
	</TR>
	
	<TR>
	<TD valign="top" width=100% style="height:100%;padding:7px 7px 7px 7px;">
		<FIELDSET style="width:90%;height:90%;padding:7px 7px 7px 7px;">
		<LEGEND>טבלת תרגום סקילים</LEGEND>
		<TABLE width="100%" height="100%"><TR><TD style="overflow:auto;height:100%;width:100%">
		<div style="overflow:auto;height:100%;width:100%">
		<TABLE cellpadding="0" cellspacing="0" dir="ltr" height="100%" width=100%>
		<THEAD>
		<TR>
		<TH>עדכון</TH>
		<TH>סקיל שפה</TH>
		<TH>תיאור</TH>
		<TH>שם סקיל</TH>
		<TH>קוד</TH>
		
		</TR>
		</THEAD>
		<TBODY>
		<logic:iterate id="skill" name="skills">
			  	
    	<tr class="grid_tr">
    		<TD align="center" class="grid_td">
    		<a href="javascript:navigate('/shf/admin/updateSkillParam.do?skillId=<%=((SkillForm)skill).getSkillId()%>');" style="color:navy;cursor:hand;">עדכון</a>
    		</TD>
    		
    		<TD align="center" class="grid_td2"><%=((SkillForm)skill).getIsLanguage()==1?"כן":"לא"%> </TD>
    		<TD align="center" class="grid_td"><bean:write name="skill" property="skillDesc"/></TD>
    		<TD align="center" class="grid_td2"><bean:write name="skill" property="skillName"/></TD>
    		<TD align="center" class="index"><bean:write name="skill" property="skillId"/></TD>
		</tr>
		
		</logic:iterate>
		</TBODY>
		</TABLE>
		</div>
		</TD></TR></TABLE>
		</FIELDSET>
	</TD>
	</TR>
</TABLE>
</BODY>
</HTML>
