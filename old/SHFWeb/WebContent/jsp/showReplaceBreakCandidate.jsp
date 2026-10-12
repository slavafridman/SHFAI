
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<HTML>
<HEAD>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>

<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" %>

<%@ page import="bzq.shf.utils.SHFConstants,bzq.shf.utils.SHFUtils,java.util.Date,
java.util.Vector,bzq.shf.transfer.EventReason,bzq.shf.transfer.ReplaceByCritrion,
bzq.shf.utils.SHFTableUtils, bzq.utils.BaseConvert"%>
<jsp:useBean 
	id="breakBean" 
	class="bzq.shf.bean.BreakBean"
	scope="request">
</jsp:useBean>
	
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">
<TITLE>eventReason</TITLE>
<shf:reloadErrors></shf:reloadErrors>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></script>
<SCRIPT language="JavaScript" src="/shf/js/attendance.js"></script>
<SCRIPT language="JavaScript">

function offerReplaceBreak(myDayId, myStartTime, isNew){
	if(selectedRow==null || selectedRow=='') 	{
		alert("צריך לבחור את המשמרת איתה רוצים להחליף");
	} else	{	
		
		var pos1=selectedRow.indexOf(",");
		var len1=selectedRow.lentgh;
		
//		alert(selectedRow);
		var canDayId = selectedRow.substring(0, pos1);
		var canStartDate = selectedRow.substring(pos1+1, len1);
		
		pos1 = canStartDate.indexOf("-");
		len1 = canStartDate.length;
		var canDate =  canStartDate.substring(0, pos1);
		var canTime = canStartDate.substring(pos1+1, len1);
		canStartDate = canDate + " " + canTime;
//		alert(canStartDate);
//		alert(canDayId);
		navigate('/shf/break/offerReplaceBreak.do?agentDayId='+myDayId+'&startTime='+myStartTime+'&offerDayId='+canDayId+'&offerStartDate='+canStartDate+'&isNewCandidate='+isNew);
	}			
} 

</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY>
<TABLE width=100% cellpadding="0" cellspacing="0" dir="rtl">
	<TR>
		<TD valign="top" style="height: 20px"><jsp:include
			page="submenu/shift_submenu.jsp"></jsp:include></TD>
	</TR>
</TABLE>
<%

//ReplaceByCritrion myShift = (ReplaceByCritrion)request.getAttribute("currentShiftNeedReplace");
//request.setAttribute("currentShiftNeedReplace",myShift);
Date myStartTime = null;
Date myEndTime = null;
String myStartTimeS = null;
String empname = breakBean.getLastName()+ " " + breakBean.getFirstName();
Vector replaceCandidate = new Vector();
replaceCandidate = (Vector)request.getAttribute("breakVec");

if (breakBean!=null)	{
	myStartTime = breakBean.getStartTime();
	myEndTime = breakBean.getEndTime();
	myStartTimeS = BaseConvert.dateToString(breakBean.getStartTime(),"dd/MM/yyyy HH:mm"); ////
	
%>
<BR>
<TABLE width="65%" dir="rtl" align="center">
	<TR>
		<TD>
		<FIELDSET class="form"><LEGEND>ההפסקה שלי</LEGEND>
		<TABLE cellpadding="0" cellspacing="0" align="center" dir="ltr"
			width="100%">
			<TR align="right">
				<TH nowrap class="header">סיום הפסקה</TH>
				<TH nowrap class="header">התחלת הפסקה</TH>
				<TH nowrap class="header">תאריך</TH>
			</TR>
			<TR align="right">
				<TD nowrap class="data"><%=SHFUtils.formatDateToString(myEndTime,"HH:mm")%></TD>
				<TD nowrap class="data"><%=SHFUtils.formatDateToString(myStartTime,"HH:mm")%></TD>
				<TD nowrap class="data"><%=SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy")%></TD>
			</TR>
		</TABLE>
		</FIELDSET>
		</TD>
	</TR>
</TABLE>
<% }%>
<br>



<TABLE width="100%" cellpadding="0" cellspacing="0">
	<%if (replaceCandidate!=null && replaceCandidate.size()>0){%>
	<TR>
		<TD valign="top" style="padding-right: 7px; padding-left: 7px"
			dir="ltr">
		<TABLE cellspacing=0 cellpadding=0 width=100%
			style="border-top: 1px silver solid; border-left: 1px silver solid; border-right: 1px silver solid">
			<TR class=tableTotal>
				<TD style='text-align: left' class=tableTotal
					style="padding-left:2px;padding-top:2px;"><img
					src='/shf/images/export.png' alt='הצע החלפה'
					onclick="offerReplaceBreak(<%=breakBean.getAgentDayId()%>, '<%=myStartTimeS%>', <%=breakBean.getIsNewCandidate()%>);" style='cursor: hand' height=17px
					<%=replaceCandidate!=null?"":"Disabled"%>></TD>
			</TR>
		</TABLE>
		</TD>
	</TR>
	<%//}%>
	<TR>
	
		<TD style="padding-right:7px;padding-left:7px;direction:ltr;">

			<%
			bzq.shf.bean.BreakBean[] list=null;
			list = (bzq.shf.bean.BreakBean[])replaceCandidate.toArray(new bzq.shf.bean.BreakBean[replaceCandidate.size()]);
			bzq.shf.bean.BreakBean breakCaBean = new bzq.shf.bean.BreakBean();
			int size=0;
			if(list!=null && list.length>0){
				size=list.length;
				}			
			Date startDate=null;
			Date endDate=null;
			
//			if (replaceCandidate!=null && replaceCandidate.size()>0)	{
			%>
				<SCRIPT>
				var myHeader=["שעת סיום","שעת התחלה","תאריך","שם נציג"];
				var txtColor=['#000','#000','#000','#000','#000'];
				var selectedRow;
				var myData=[<%=list.length%>];
				</SCRIPT>
			<%
			for(int i=0;i<size;i++){
				breakCaBean=(bzq.shf.bean.BreakBean)list[i]; 
				String listEmpname=BaseConvert.specialCharactersHTML(breakCaBean.getFirstName()+" "+breakCaBean.getLastName(),true,true);
				long agentDay = breakCaBean.getAgentDayId();
				endDate = breakCaBean.getEndTime();
				startDate = breakCaBean.getStartTime();
				String startDateS = BaseConvert.dateToString(startDate,"dd/MM/yyyy-HH:mm");
				String agentDayS = Long.toString(agentDay);
				String candidateKey = agentDayS + "," + startDateS;
				
			%>
			<SCRIPT>
			myData[<%=i%>] =			
			[
			'<%=SHFUtils.formatDateToString(endDate,"HH:mm")%>',
			'<%=SHFUtils.formatDateToString(startDate,"HH:mm")%>',
			'<%=SHFUtils.formatDateToString(startDate,"dd/MM/yyyy")%>',
			'<%=listEmpname%>',
			'<%=candidateKey%>'
			]
			</SCRIPT>
			<%}%>			
			<DIV id="dataGridDiv">
				<SCRIPT>
				drawGrid2('dataGridDiv');
				</SCRIPT>
			</DIV>			
			<%
			}
			else{
			%>
			<div class="gridNoData">אין נתונים</div>
			<%	
			}
			%>
		</TD>
	</TR>
	<tr>
  <%
  if (breakBean.getIsNewCandidate()==1)	{
  		
  		String breakStartTime=BaseConvert.dateToString(breakBean.getStartTime(),"dd/MM/yyyy HH:mm");%>
  		<TD align="center"><A href="/shf/break/insertBreakToCandidate.do?&agentDayId=<%=breakBean.getAgentDayId()%>&startTime=<%=breakStartTime%>">אין הפסקה נוחה להחלפה ,שמור הפסקה במאגר החלפות</A></TD>
  <%} else	{%>									
  	<TD align="center" style="padding-top:10px;"><A href="/shf/break/showManageBreak.do" style="color:navy;font-size:16px;">חזור</A></TD>
  <%}%>
</TR>
</TABLE>		

</BODY>
</HTML>
