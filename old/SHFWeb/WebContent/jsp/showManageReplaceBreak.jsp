<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">


<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>

<HTML>
<HEAD>
<%@ page language="java" contentType="text/html; 
		charset=WINDOWS-1255" 
		pageEncoding="WINDOWS-1255"%>

<%@page import="bzq.shf.utils.SHFTableUtils"%>

<%@ page import="java.util.Date,bzq.shf.utils.SHFConstants,bzq.shf.utils.SHFUtils,
		java.util.Vector,bzq.shf.transfer.OfferReplaceByCritrion"%>

<jsp:useBean id="breakCandidateBean1"
			 class="bzq.shf.bean.BreakCandidateBean" 
			 scope="request">
</jsp:useBean>

<META http-equiv="Content-Type"
	content="text/html; charset=windows-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<SCRIPT type="text/javascript" language="javascript">

function showElement(row){
	document.getElementById(row).style.display='';
}
function hideElement(row){
	document.getElementById(row).style.display='none';
}

</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY>
<TABLE height="100%" width="100%" cellpadding="0" cellspacing="0" dir="rtl">
	<TR>
		<TD valign="top" style="height:20px;"><jsp:include page="submenu/shift_submenu.jsp"></jsp:include> </TD>
	</TR>
	<TR>
	<TD dir=ltr style="height:100%;width:100%;padding:10px 7px 7px 7px;">
	<div  style="height:100%;width:100%;overflow:auto;">
	<fieldset style="direction: rtl">
	<legend>מאגר הפסקות</legend>
	<TABLE style=" direction:ltr;" width="100%" cellpadding="0" cellspacing="2" align="right" >	
	
<%	
	Vector candidateVec = (Vector)request.getAttribute("breakCaBean");
	if (candidateVec!=null && candidateVec.size()>0)	{
%>	
	<TR align="right" bgcolor="#f2f2f2" style="position:relative;top: expression(offsetParent.scrollTop);height:20px; ">			
		<Th height="20px" colspan="3" align="center" class="header">פעולות</Th>
		<TH class="header">פרטים</TH>
		<TH class="header">סטטוס</TH>	
		<TH class="header">סיום</TH>
		<TH align="right" class="header">התחלה</TH>
		<TH align="right" class="header">תור</TH>
		<TH align="right" class="header">שם נציג</TH>
		<TH align="right" class="header">תאריך</TH>
	</TR>	
<% 
	
	bzq.shf.bean.BreakCandidateBean[] list=null;
	list = (bzq.shf.bean.BreakCandidateBean[])candidateVec.toArray(new bzq.shf.bean.BreakCandidateBean[candidateVec.size()]);	
	
	for (int index=0;index<list.length;index++){
		
		bzq.shf.bean.BreakCandidateBean breakCaBean = new bzq.shf.bean.BreakCandidateBean();
		
		breakCaBean = (bzq.shf.bean.BreakCandidateBean)list[index];
		
		//bzq.shf.bean.BreakCandidateBean breakCandidateBean = ((bzq.shf.bean.BreakCandidateBean) (((Vector)request.getAttribute("breakCaBean")).get(index)));
		Date startTime = breakCaBean.getStartTime();
		Date endTime = breakCaBean.getEndTime();
		Date modifiedDate = breakCaBean.getModifiedDate();
		long agentDay = breakCaBean.getAgentDayId();
		String empId = breakCaBean.getEmployeeId();
		String empIdNumber = breakCaBean.getEmpIdNumber();
		String orgUnitId = breakCaBean.getOrgUnitId();
		String fullName = breakCaBean.getFirstName() + " " + breakCaBean.getLastName();
		long duration = breakCaBean.getDuration();
	
	// 	offerStartTime = offerReplaceByCritrion.getOfferStartTime();
	//	Date offerEndTime = offerReplaceByCritrion.getOfferEndTime();
		String status = breakCaBean.getStatus();
		String statusDisplay = null;
	
	
	
	
		if ("OPEN".equals(status))
			statusDisplay = "פתוח להצעות";	
		else
			statusDisplay = "מחכה לתשובה";
	
	%>    
		<TR align="right" >
			
		<%if(!"OPEN".equals(status))	{
			bzq.shf.bean.BreakCandidateBean offerCandidateBean = breakCaBean.getOfferCaDetails();
			String offerEname = offerCandidateBean.getFirstName() + " " + offerCandidateBean.getLastName();
			String offerEmpId = offerCandidateBean.getEmployeeId();
			long canDayId = offerCandidateBean.getAgentDayId();
			Date canStartDate = offerCandidateBean.getStartTime();
			%>
			<TD colspan="3" class="data">
				<img src="/shf/images/add_missing.gif" style="cursor:hand;" alt="בטל הצעתך" onclick="javascript:navigate('/shf/break/cancelBreakOffer.do?startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>&agentDayId=<%=agentDay%>&offerDayId=<%=canDayId%>&offerStartDate=<%=SHFUtils.formatDateToString(canStartDate,"dd/MM/yyyy HH:mm")%>')"/>
			</TD>			
			<TD class="data">
				<DIV id="detail<%=index+1%>" style="position: absolute ;left:20px;z-index: 999;display:none;">
				 <FIELDSET class="info">
					 <TABLE width="400px" dir="rtl">
					  <tr>
						 <TD dir="rtl">הצעתך ל  <%=offerEname%> להחליפו בהפסקתו  </td>
					 </tr>
				 	 <tr>
				   		<TD> המתחילה ב <%=SHFUtils.formatDateToString(offerCandidateBean.getStartTime(),"dd/MM/yyyy HH:mm")%>  ומסתיימת ב <%=SHFUtils.formatDateToString(offerCandidateBean.getEndTime(),"dd/MM/yyyy HH:mm")%>    </td></tr><TR><td valign="bottom"><A href="javascript:hideElement('detail<%=index+1%>');"/>סגור</a></td>
				  	</tr>
				 	</TABLE>
				 </FIELDSET>
				</DIV>
				<A href="javascript:showElement('detail<%=index+1%>');" style="color:navy;">הצג</a>
			</TD>
		<%}else{%>
			<TD class="data"><img src="/shf/images/add_missing.gif" style="cursor:hand;" alt="בטל בקשה לחילוף" onclick="javascript:navigate('/shf/break/cancelBreakCandidate.do?startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>&agentDayId=<%=agentDay%>')"  /></TD>
			<TD class="data"><img src="/shf/images/notepad.png" style="cursor:hand;" height="25px" alt="כנס להצעות" onclick="javascript:navigate('/shf/break/lookForBreakOffer.do?startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>&agentDayId=<%=agentDay%>&endTime=<%=SHFUtils.formatDateToString(endTime,"dd/MM/yyyy HH:mm")%>&employeeId=<%=empId%>&empIdNumber=<%=empIdNumber %>&orgUnitId=<%=orgUnitId %>')" /></TD>
			<TD class="data"><img src="/shf/images/search2.png" style="cursor:hand;" alt="חפש חילוף" onclick="javascript:navigate('/shf/break/goForChangeBreak.do?startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>&agentDayId=<%=agentDay%>&endTime=<%=SHFUtils.formatDateToString(endTime,"dd/MM/yyyy HH:mm")%>&employeeId=<%=empId%>&isNewCandidate=0&duration=<%=duration%>')"/></TD>
			<TD class="data"></TD>
		<%}%>
			<TD class="data" style="color:#aa5555;"><%=statusDisplay%></TD>
			<TD class="data"><%=SHFUtils.formatDateToString(endTime,"HH:mm")%></TD>		
			<TD class="data" style="color:#66aa66;"><%=SHFUtils.formatDateToString(startTime,"HH:mm")%></TD>
	    	<TD class="data"><%=SHFTableUtils.getActivityName(breakCaBean.getActivity())%></TD>
	    	<TD class="data"><%=fullName%></TD>
	    	<TD class="data"><%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy")%></TD>
			
					
		</TR>
	<% 
		}//end of for statment
	%>	       	
	<%}else{%>

		<TR>
		<TD colspan=20>
			<div class="gridNoData">אין הצעות החלפה זמינות</div>
		</TD>
		</TR>

	<%}%>    
</TABLE>
</fieldset>
</div>
</TD>
</TR>
</TABLE>

</BODY>
</HTML>
