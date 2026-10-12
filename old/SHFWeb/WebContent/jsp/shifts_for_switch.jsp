<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<jsp:useBean id="shifts" class="java.util.Vector" scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@page import="bzq.utils.BaseConvert"%>
<HTML>
<HEAD>

<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.bean.AgentDayBean"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<TITLE>shifts_for_switch.jsp</TITLE>
</HEAD>
<BODY dir="rtl">
<br>


<%
if(shifts!=null && shifts.size()>0){
%>
<div id="popupShiftChange" class="popup2" style="display: none; right: 740px; top: 1px;"></div>
<TABLE cellpadding="5" cellspacing="1" >
	<TR bgcolor="#f1f1f1">
			<Th>&nbsp;</Th>
			<Th align="center" class="header" style="padding: 5px 10px 5px 10px;">תאריך</Th>
			<Th align="center" class="header" style="padding: 5px 10px 5px 10px;">שעת התחלה</Th>
			<Th align="center" class="header" style="padding: 5px 10px 5px 10px;">שעת סיום</Th>
			<Th align="center" class="header" style="padding: 5px 10px 5px 10px;">פיצול</Th>
			<Th align="center" class="header" style="padding: 5px 10px 5px 10px;">מוקד</Th>
			<Th align="center" class="header" style="padding: 5px 10px 5px 10px;">תפקיד בפועל</Th>
	</TR>
<%
AgentDayBean day=null;
for(int i=0;i<shifts.size();i++){
	day = (AgentDayBean)shifts.get(i);
	String ns = BaseConvert.dateToString(day.getShiftStart(),"HH:mm");
	String ne = BaseConvert.dateToString(day.getShiftEnd(),"HH:mm");
	String ss = BaseConvert.dateToString(day.getSplitShiftStart(),"HH:mm");
	String se = BaseConvert.dateToString(day.getSplitShiftEnd(),"HH:mm");
	double shiftDur = day.getSplitShiftDurationHours();
%>
	<TR bgcolor="#fafafa">
		<TD align="center" class="data" style="padding: 1px 10px 1px 10px;"><input type="radio" name="secondDayId" value="<%=day.getAgentDayId()%>"></TD>
		<TD align="center" class="data" style="padding: 1px 10px 1px 10px;"><shf:shfdate date="<%=day.getShiftStart()%>"/></TD>
		<TD align="center" class="data" style="padding: 1px 10px 1px 10px;"><shf:shftime date="<%=day.getShiftStart()%>"/></TD>
		<TD align="center" class="data" style="padding: 1px 10px 1px 10px;"><shf:shftime date="<%=day.getShiftEnd()%>"/></TD>
		<TD align="center" class="data" style="padding: 1px 10px 1px 10px;"><%= day.isShiftSplit() ? "<span><img src=/shf/images/shiftSplit.png onclick=showShiftSplitDetails('"+ns+"','"+ss+"','"+se+"','"+ne+"','"+shiftDur+"');></span>" : "&nbsp;" %></TD>
		<TD align="center" class="data" style="padding: 1px 10px 1px 10px;"><%=SHFTableUtils.getUnitName(SHFTableUtils.getMokedCodeOf(day.getOrgUnitCode()))%>  </TD>
		<TD align="center" class="data" style="padding: 1px 10px 1px 10px;"><%=SHFTableUtils.getInnerJobName(day.getInnerJobId())%>  </TD>
	</TR>
<%
}
%>
	
	<TR>
		<TD colspan="6">
		<BUTTON onclick="doSwitch();">החלף</BUTTON>
		</TD>
	</TR>
</TABLE>

		<div id="wait" style="text-align: center; font-size: 20px; color: navy;">
		</div>

<%
}else{
%>
<div class="gridNoData">אין נתונים</div>
<%}%>

</BODY>
</HTML>
