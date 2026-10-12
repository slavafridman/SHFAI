<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ page import="bzq.shf.utils.SHFUtils"%>
<jsp:useBean 
	id="breakForm" 
	class="bzq.shf.forms.BreakSearchForm"
	scope="request">
</jsp:useBean>

<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@	taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<html:html>

<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector,bzq.shf.bean.BreakBean"
%>


<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK rel="stylesheet" href="../theme/Master.css" type="text/css">
<LINK rel="stylesheet" href="../theme/shfgrid.css" type="text/css">

<TITLE></TITLE>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<%
Vector vec=breakForm.getBreakVecExceptional();
%>
<BODY>

<%if(vec!=null && vec.size()>0){%>
<TABLE cellpadding="0" cellspacing="0" width="100%"  >
<THEAD>
<TR>
<Th class="header">תור</Th>
<Th class="header">שעת חזרה</Th>
<Th class="header">שעת יציאה</Th>
<Th class="header">שעת סיום</Th>
<Th class="header">שעת התחלה</Th>
<Th class="header">שם</Th>
<Th class="header">תאריך</Th>
<Th class="header">יום</Th>
</TR>
</THEAD>
<%
for(int i=0;i<vec.size();i++){
	BreakBean breakBean=(BreakBean)vec.get(i);
	String ename=breakBean.getFirstName()+" "+breakBean.getLastName();
	ename=bzq.shf.utils.SHFUtils.replace(ename,"\'","&#39;");
%>
	<TR>
	<TD class=data valign="middle" align=center><%=bzq.shf.utils.SHFTableUtils.getActivityName(breakBean.getActivity())%></TD>
	<TD class=data valign="middle" align=center><shf:shftime date="<%=breakBean.getEntryTime()%>"/></TD>
	<TD class=data valign="middle" align=center><shf:shftime date="<%=breakBean.getExitTime()%>"/></TD>
	<TD class=data valign="middle" align=center><shf:shftime date="<%=breakBean.getEndTime()%>"/></TD>
	<TD class=data valign="middle" align=center><shf:shftime date="<%=breakBean.getStartTime()%>"/></TD>
	<TD class=data valign="middle" align=center><shf:employee empid="<%=Integer.parseInt(breakBean.getEmployeeId())%>" empname="<%=ename%>"/></TD>
	<TD class=data valign="middle" align=center><shf:shfdate date="<%=breakBean.getStartTime()%>"/></TD>
	<TD class=data valign="middle" align=center><shf:dayofweek date="<%=breakBean.getStartTime()%>"/> </TD>
	</TR>
<%
}
%>

</TABLE>
<%}%>
</BODY>
</html:html>
