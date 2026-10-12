<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="chageRequestForm" 
	class="bzq.shf.forms.ShiftChangeRequestForm"
	scope="session"></jsp:useBean>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.bean.ChangeRequestCandidate,java.util.Vector"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">
<script src="/shf/js/shfgrid.js"></script>
<TITLE>change_request_applications.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>

<SCRIPT>
/*@cc_on @*/
/*@if (@_win32 && @_jscript_version>=5)

function window.confirm(str)
{
    execScript('n = msgbox("'+str+'","4132")', "vbscript");
    return(n == 6);
}
@end @*/

function rejectCandidate(agentDay,requestId){
	var accept=confirm("האם אתה בטוח שברצונך לדחות בקשה זו");
	if(!accept) return false;
	document.location="/shf/shift/rejectChangeCandidate.do?requestId="+requestId+"&agentDayId="+agentDay;
	//
}

function confirmCandidate(agentDay,requestId,shiftStart,shiftEnd){
	var accept=confirm("האם אתה בטוח שברצונך לאשר בקשה זו");
	if(!accept) return false;
	dds=shiftStart.split("-");
	dde=shiftEnd.split("-");
	shiftStart=dds[0]+" "+dds[1];
	shiftEnd=dde[0]+" "+dde[1];
	document.forms['changeRequestConfirm'].agentDayId.value=agentDay;
	document.forms['changeRequestConfirm'].requestId.value=requestId;
	document.forms['changeRequestConfirm'].newShiftStart.value=shiftStart;
	document.forms['changeRequestConfirm'].newShiftEnd.value=shiftEnd;
	document.forms['changeRequestConfirm'].submit();
	
}
</SCRIPT>

</HEAD>

<BODY dir="rtl">
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height: 20px"><jsp:include
				page="submenu/shift_submenu.jsp"></jsp:include></TD>
		</TR>
	
		<TR>
			<TD width="100%" valign="top" style="height: 100%; padding-bottom: 5px; padding-top: 10px; padding-right: 6px; padding-left: 6px">
				<TABLE width="100%" height="100%">
				<TR>
				<TD><h2 style="color: green;">בקשות שינוי שהתקבלו</h2>
				</TD>
				</TR>
				<TR>
				<TD valign="top" height="100%" width="100%">
				<TABLE width="100%" cellpadding="1" cellspacing="0" style="border: 1px silver solid; height: 100%;">
					<TR bgcolor="#CAEaFF">
						<TD colspan="4" valign="top">
							<TABLE width="100%">
								<TR>
									<TD class="header">מוקד: <shf:tables tableName="unitCode" codeName="<%=chageRequestForm.getMoked()%>"></shf:tables></TD>
									<TD class="header">תור: <shf:tables tableName="activityCode" codeName="<%=chageRequestForm.getActivity()%>"></shf:tables></TD>
									<TD class="header">תאריך: <shf:shfdate date="<%=chageRequestForm.getDate()%>"/></TD>
									<TD class="header">סוג אישור: <%=chageRequestForm.getAutoApprove()==1?"אוטומטי":"ידני"%></TD>
									
									<TD align="left">
									<a onclick="javascript:navigate('/shf/shift/viewShiftTimeChangeRequests.do');" style="font-size: 12px; font-family: Arial; color: navy; cursor: hand;">חזרה למאגר הבקשות</a>
									</TD>
								</TR>
							</TABLE>
						</TD>
					</TR>
					
					
					<TR>
						<TD colspan="6" valign="top">
							<table>
							<TR>
							<TD nowrap="nowrap" class="header">מקומות פנויים:</TD>
							<TD nowrap="nowrap" width="10px"></TD>
							<TD nowrap="nowrap" class="data">
							<%=chageRequestForm.getAgentsNum()-chageRequestForm.getAprovedNum()%>
							מתוך
							<%=chageRequestForm.getAgentsNum()%>
							</TD>
							</TR>
							</table>
						</TD>
					</TR>
					<TR>
					<TD colspan="6" valign="top">
						<table>
						<%if(chageRequestForm.getShiftStartOption()==1){%>
						<TR>
							<TD nowrap="nowrap" class="header">התחלת משמרת:</TD>
							<TD nowrap="nowrap" width="10px"></TD>
							<TD nowrap="nowrap" class="data"><%=chageRequestForm.getStartFrom()%> - <%=chageRequestForm.getStartTo()%></TD>
							<TD nowrap="nowrap" width="100%"></TD>
						</TR>
						<%}if(chageRequestForm.getShiftEndOption()==1){%>
						<TR>
							<TD class="header">סיום משמרת:</TD>
							<TD width="10px"></TD>
							<TD nowrap="nowrap" class="data"><%=chageRequestForm.getEndFrom()%> - <%=chageRequestForm.getEndTo()%></TD>
						</TR>
						<%}if(chageRequestForm.getShiftLengthOption()==1){%>
						<TR>
							<TD class="header">משך משמרת:</TD>
							<TD width="10px"></TD>
							<TD class="data"><%=chageRequestForm.getShiftLength() %> דקות</TD>
						</TR>
						<%}%>
						
						<TR><TD colspan="6" style="color: coral; font-weight: bold; font-size: 12px;" width="100%">השינוי:</TD></TR>
						
						<%if(chageRequestForm.getChangeStartSelected()==1){%>
						<TR>
							<TD class="header">שינוי התחלה:</TD>
							<TD width="10px"></TD>
							<TD nowrap="nowrap" class="data"><%=chageRequestForm.getStartChangeDesc()+"&nbsp;&nbsp;"+org.apache.struts.util.PropertyUtils.getProperty(chageRequestForm,chageRequestForm.getChangeStartOption())%></TD>
						</TR>
						<%}if(chageRequestForm.getChangeEndSelected()==1){%>
						<TR>
							<TD class="header">שינוי סיום:</TD>
							<TD width="10px"></TD>
							<TD nowrap="nowrap" class="data"><%=chageRequestForm.getEndChangeDesc()+"&nbsp;&nbsp;"+org.apache.struts.util.PropertyUtils.getProperty(chageRequestForm,chageRequestForm.getChangeEndOption())%></TD>
						</TR>
						<%}%>
						</table>
					</TD>
					</TR>
					<TR><TD colspan="6"  style="color: coral; font-weight: bold; font-size: 12px;" width="100%">משמרות ששובצו לבקשה:</TD></TR>
					
					<%if(chageRequestForm.getAgentDaysApplications()!=null && chageRequestForm.getAgentDaysApplications().size()>0){%>
					<TR>
						<TD dir="ltr"  colspan="6" valign="top" style="padding-top: 10px; height: 100%;">
							<div style="height: 100%; overflow: auto; width: 100%;">
							
							<SCRIPT>
							var myHeader=["&nbsp;","תור","משך משמרת","שעת סיום","שעת התחלה","תאריך משמרת","שם הנציג"];
							var txtColor=['#000'];
							</SCRIPT>
							
							
							<div id="dataGridDiv2">
							<SCRIPT>
							var myData=[
							<%
							Vector applications=chageRequestForm.getAgentDaysApplications();
							ChangeRequestCandidate day=null;
							int size=applications.size();
							for(int i=0;i<size;i++){
								day=(ChangeRequestCandidate)applications.get(i);
								
							%>
							
							[
							<%if(day.getApproveTime()==null){%>
							'<a class=confirm onclick=confirmCandidate("<%=day.getAgentDayId()%>","<%=day.getRequestId()%>","<%=bzq.utils.BaseConvert.dateToString(day.getShiftStart(),"dd/MM/yyyy-HH:mm")%>","<%=bzq.utils.BaseConvert.dateToString(day.getShiftEnd(),"dd/MM/yyyy-HH:mm")%>")>אשר</a> / <a class=reject onclick=rejectCandidate(<%=day.getAgentDayId()%>,<%=day.getRequestId()%>)>דחה</a>',
							<%}else{%>
							'מאושר',
							<%}%>
							'<shf:activityName activity="<%=day.getShiftActivity()%>"/>',
							'<%=bzq.shf.utils.SHFUtils.getMinutesBetween(day.getShiftStart(),day.getShiftEnd())%>',
							'<shf:shftime date="<%=day.getShiftEnd()%>"/>',
							'<shf:shftime date="<%=day.getShiftStart()%>"/>',
							'<shf:shfdate date="<%=day.getShiftStart()%>"/>',
							'<%=bzq.utils.BaseConvert.specialCharacters(day.getFirstName() + " " + day.getLastName())%>']
							<%if(i<size-1){%>,<%}}%>];
							drawGrid2('dataGridDiv2');
							</SCRIPT>
							</div>
							
							</div>
							
						</TD>
					</TR>
					<%}else{%>
					<TR>
						<TD colspan="6" style="padding-top:10px;height:100%;"><div class="gridNoData">אין נתונים</div></TD>
					</TR>
					<%}%>
				</TABLE>
				</TD>
				</TR>
				</TABLE>
			</TD>
		</TR>
	</TABLE>
	<form action="/shf/shift/confirmChangeRequest.do" name="changeRequestConfirm">
		<input type="hidden" name="newShiftStart">
		<input type="hidden" name="newShiftEnd">
		<input type="hidden" name="agentDayId">
		<input type="hidden" name="requestId">
	</form>
</BODY>
</HTML>
