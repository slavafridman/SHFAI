<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ page import="bzq.shf.utils.SHFUtils"%>
<jsp:useBean 
	id="breakForm" 
	class="bzq.shf.forms.BreakSearchForm"
	scope="request">
</jsp:useBean>
<jsp:useBean 
	id="breakBean" 
	class="bzq.shf.bean.BreakBean"
	scope="page">
</jsp:useBean>

<%@taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<html>
<shf:reloadErrors></shf:reloadErrors>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.bean.BreakBean,java.util.Vector,
bzq.utils.BaseConvert,bzq.shf.utils.SHFUtils,bzq.shf.utils.SHFTableUtils"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255" >
<META name="GENERATOR" content="IBM WebSphere Studio" >
<META http-equiv="Content-Style-Type" content="text/css">
<META http-equiv="CACHE-CONTROL" CONTENT="NO-CACHE">
<META http-equiv="PRAGMA" CONTENT="NO-CACHE">
<LINK rel="stylesheet" href="../theme/Master.css" type="text/css">
<LINK rel="stylesheet" href="../theme/shfgrid.css" type="text/css">

<TITLE></TITLE>
<SCRIPT>


</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<%
BreakBean[] list = null;
Vector breakVec = new java.util.Vector();
breakVec = (Vector)request.getAttribute("resVec");
%>
<BODY>
<FIELDSET dir="rtl">
<LEGEND>הפסקות</LEGEND>
<table cellpadding="0" cellspacing="0" width=100% align="right"  dir=ltr>
<%
if(breakVec!=null && breakVec.size()>0){
	list = (BreakBean[])breakVec.toArray(new BreakBean[breakVec.size()]);
	int size=list.length; %>
		<THEAD>
		<TR>
			<shf:security activity="shift_myshifts">
			<Th class=header>פעולה</Th>
			</shf:security>
			<Th class=header>משך</Th>
			<Th class=header>זמן סיום</Th>
			<Th class=header>זמן התחלה</Th>
			<Th class=header>תאריך</Th>
			<Th class=header >מס.</Th>
		</TR>
		</THEAD>
	
<%	for(int i=0;i<size;i++){
		breakBean=list[i];
		String breakStart=BaseConvert.dateToString(breakBean.getStartTime(),"dd/MM/yyyy");
		String breakStartTime=BaseConvert.dateToString(breakBean.getStartTime(),"dd/MM/yyyy HH:mm");		
		String breakEnd=BaseConvert.dateToString(breakBean.getEndTime(),"HH:mm");
		String breakEndTime=BaseConvert.dateToString(breakBean.getEndTime(),"dd/MM/yyyy HH:mm");
		long duration = breakBean.getDuration();
	%>
		<TR>
			<shf:security activity="shift_myshifts">
			<TD class=data  align=center>  
				<a onclick ="checkBreak(<%=breakBean.getAgentDayId()%>, '<%=breakStartTime%>', '<%=breakEndTime%>', <%=breakBean.getEmployeeId()%>, <%=duration%>);" style="color:navy;cursor:hand;">לחץ להחלפה</a>  
			</TD>
			</shf:security>
			<TD class=data valign="middle" align=center><%=breakBean.getDuration()%> דקות</TD>
			<TD class=data valign="middle" align=center><shf:shftime date="<%=breakBean.getEndTime()%>"/></TD>
			<TD class=data valign="middle" align=center><shf:shftime date="<%=breakBean.getStartTime()%>"/></TD>
			<TD class=data valign="middle" align=center><%=breakStart%></TD>
			<TD class=header valign="middle" align=center><%=i+1%></TD>
			
			
			<!--TD>  
				<a href="javascript:navigate('/shf/break/goForChangeBreak.do?startTime=<%//=breakStartTime%>&agentDayId=<%//=breakBean.getAgentDayId()%>&endTime=<%//=breakEndTime%>&employeeId=<%//=breakBean.getEmployeeId()%>');" style="color:navy;cursor:hand;">עבור להחלפה</a>
			</TD-->
		</TR>
	<%
	}
}
else{
%>
	<TR>
		<TD align="center" class="divNoData">אין הפסקות</TD>
	</TR>
<%
}
%>
</table>
</FIELDSET>
<SCRIPT>
function tmp123(day,tt){
	alert(day);
	alert(tt);
}
</SCRIPT>
</BODY>
</html>
