<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="reduceReqForm" 
	class="bzq.shf.forms.ShiftReduceRequestForm" scope="request"></jsp:useBean>	
<%@taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.bean.AgentDayBean,java.util.Vector,bzq.shf.forms.ShiftReduceRequestForm,bzq.shf.forms.ShiftReduceListForm"
%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>shift_inforce.jsp</TITLE>

<SCRIPT>
function openCloseReduce(rowid){
	if(document.getElementById(rowid).style.display=='')
		document.getElementById(rowid).style.display='none';
	else
		document.getElementById(rowid).style.display='';

}
function confirmDelete(id, approved){
	if (approved > 0) {
		window.alert("לא ניתן למחוק בקשה שאושרה לה מחיקה");
		return;
	}
	var accept=window.confirm("האם אתה בטוח שברצונך למחוק בקשת צמצום זו ?");
	if(accept) {
		navigate("/shf/reduce/addUpdateReduceShiftReq.do?reduceId=" + id + "&mode=delete");
	}	
	else return;
}

function searchAgents(rowid){
	if(document.getElementById("searchAgentsRes"+rowid).style.display=='')
		document.getElementById("searchAgentsRes"+rowid).style.display='none';
		
	else {
		document.getElementById("searchAgentsRes"+rowid).style.display='';
		document.getElementById("searchAgntForm"+rowid).submit();
	}
}

function approveReduce(dayId, empId, reduceId, numLeft) {
	if (numLeft > 0) {
			navigate("/shf/reduce/approveDeclineReduce.do?agentDayId=" + dayId + "&employeeId="+ empId +"&mode=1");
		} else
		{
			alert('לא נותרו מקומות פנויים');
		}
}
function declineReduce(dayId, empId, reduceId) {
	navigate("/shf/reduce/approveDeclineReduce.do?agentDayId=" + dayId + "&employeeId="+ empId +"&mode=0");
}

function declineAll(id) {
	var accept=window.confirm("האם ברצונך לדחות את כל הבקשות שלא אושרו ?");
	if(accept)
		navigate("/shf/reduce/declineAll.do?reduceId="+id);
	else return;
}

function exportExcel(){
	window.open("/shf/reduce/reduceShiftReq.do?mode=export",null);
}
</SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY>

<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	
	<TR>
		<TD dir="rtl" valign="top" width="100%">
		<jsp:include page="submenu/shift_submenu.jsp" />
		</TD>
	</TR>
	
	<TR>
		<TD dir=rtl width=100% height="100%" valign="top" style="padding:7px 7px 7px 7px;">
			<FIELDSET style="overflow:auto;height:100%;">
			<LEGEND>
			<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;margin-top:2px;position:absolute;' width=18px>
			&nbsp;&nbsp;&nbsp;&nbsp;
			חיפוש בקשות צמצום משמרות לאחמש
			</LEGEND>
			<div style="overflow:auto;height:95%;">
			
			<TABLE width=100% cellpadding="0" cellspacing="0">
			<%
			
			Vector add_requests = (Vector)request.getAttribute("reduceVec");
			if(add_requests!=null && add_requests.size()>0){
			int daysSize=0;
			int approvedReduce=0;
			int notApprovedReduce=0;
			ShiftReduceListForm[] days=null;
			ShiftReduceRequestForm inf_request=null;
			for(int i=0;i<add_requests.size();i++){
				inf_request=(ShiftReduceRequestForm)add_requests.get(i);
				days=inf_request.getReduceList();
				
				approvedReduce=0;
				notApprovedReduce=0;
				if(days!=null && days.length>0){ 
					for(int j=0; j<days.length; j++) {
						ShiftReduceListForm dd=days[j];
						if ((dd.getApproveTime()!=null)) { approvedReduce++; } else { notApprovedReduce++; }
					}
				}
				
				if ( (notApprovedReduce != 0) && ( (inf_request.getNumberOfAgets()-approvedReduce) == 0) ) {
					%> <SCRIPT> declineAll('<%=inf_request.getReduceId()%>'); </SCRIPT> <%
					
				}
				daysSize=0;
				if(days!=null && days.length>0) daysSize=days.length;%>
				<TR>
					<TD valign="top" dir="rtl" style="padding:10px 6px 6px 6px;">
					<TABLE width=100% cellpadding="1" cellspacing="0" style="border:1px navy dotted;">
						<TR>
							<TD colspan=3 style="border-bottom:1px silver dotted;background-color:navy;color:white;font-weight:bold;"><shf:tables tableName="unitCode" codeName="<%=inf_request.getMokedId()%>"></shf:tables></TD>
							<TD colspan=8 style="border-bottom:1px silver dotted;background-color:navy;color:white;font-weight:bold;"><shf:tables tableName="activityCode" codeName="<%=inf_request.getActivity()%>"></shf:tables></TD>
							<TD colspan=4 style="border-bottom:1px silver dotted;background-color:navy;color:white;font-weight:bold;"><%="1".equals(inf_request.getAutomaticApprove())?"אוטומטי":"ידני"%></TD>
						</TR>
						<TR>
							<TD rowspan=2 style="border-left:1px silver dotted;"><img src="/shf/images/open_down.png" style="cursor:hand;" onclick="openCloseReduce('req<%=inf_request.getReduceId()%>');"></TD>
							<TD class=header>תאריך:</TD><TD width=10px></TD><TD><shf:shfdate date='<%=inf_request.getShiftStart()%>'/></TD><TD width=10px></TD>
							<TD class=header>שעת התחלה:</TD><TD width=10px></TD><TD><shf:shftime date="<%=inf_request.getShiftStart()%>"/></TD><TD width=10px></TD>
							<TD class=header>שעת סיום:</TD><TD width=10px></TD><TD><shf:shftime date="<%=inf_request.getShiftEnd()%>"/></TD>
						</TR>
						<TR>
							<TD class=header>מקומות פנויים:</TD><TD width=10px></TD><TD><%=inf_request.getNumberOfAgets()-approvedReduce%></TD><TD width=10px></TD>
							<TD class=header>מתוך:</TD><TD width=10px></TD><TD><%=inf_request.getNumberOfAgets()%></TD>
							<TD></TD>
							<TD class=header>סוג אישור:</TD><TD width=10px></TD><TD><%="1".equals(inf_request.getAutomaticApprove())?"אוטומטי":"ידני"%></TD>
							<TD></TD>
						</TR>
						
						<TR id="req<%=inf_request.getReduceId()%>" style="display:none">
						<TD colspan=15 valign="top" style="border-top:1px silver solid;">
							<table width=100% bgcolor="#f3f3f3" dir=rtl>
								<%
								if(days!=null && days.length>0){
								%>
								<TR><TD colspan=2 style="color:navy;font-size:12px;">נציגים שהוסיפו משמרת לפי בקשה זו</TD></TR>
								<%
								for(int j=0;j<days.length;j++){
									ShiftReduceListForm day=days[j];
								%>
								<TR>
									<TD style="color:purple;font-size:13px;"><%=(j+1) +") "+day.getFirstName()+" "+day.getLastName()%></TD>
									<TD align="right" style="color:purple;font-size:13px;"><shf:tables tableName="unitCode" codeName="<%=day.getOrgUnitCode()%>"/></TD>
									<!--Add security here -->
									<%if (day.getApproveTime()== null) {%>
										<TD> <button type="button" class=button style="cursor:hand;"  onclick="javascript:approveReduce('<%=day.getAgentDayId()%>', '<%=day.getEmployeeId()%>', '<%=day.getReduceId()%>', '<%=inf_request.getNumberOfAgets()-approvedReduce%>')">אשר בקשה</button> </TD>
										<TD> <button type="button" class=button style="cursor:hand;"  onclick="javascript:declineReduce('<%=day.getAgentDayId()%>', '<%=day.getEmployeeId()%>', '<%=day.getReduceId()%>')">דחה בקשה</button> </TD>
									<% } else { %>
										<TD align="right" style="color:purple;font-size:13px;"> אושר </TD>	
									<% }%>
									<!--Add security here -->
								</TR>
													
								<%} 
								}else{%>
								<TR>
									<TD style="color:coral;" colspan=8>אין נציגים שהוסיפו משמרות לבקשה זו</TD>
								</TR>
								<%}%>
								<TR id="searchAgentsRes<%=inf_request.getReduceId()%>" style="display:none;">
									<TD colspan=3>
										<IFRAME name="srchIf<%=inf_request.getReduceId()%>"  style="width:100%;height:200px">
											
										</IFRAME>
									</TD>
								</TR>
								<TR>
									<TD style="padding:2px 2px 2px 2px;font-size:12px;">
										<shf:security activity="reduce_update">
										<a style="color:navy;cursor:hand;" onclick='navigate("/shf/reduce/addUpdateReduceShiftReq.do?reduceId=<%=inf_request.getReduceId()%>&mode=viewForUpdate");'>עדכון</a>
										</shf:security>
										|
										<shf:security activity="reduce_update">
										<a style="color:navy;cursor:hand;" onclick='navigate("/shf/reduce/addUpdateReduceShiftReq.do?reduceId=<%=inf_request.getReduceId()%>&mode=duplicate");'>שכפל</a>
										</shf:security>
										
										<shf:security activity="reduce_update">
										<%if(inf_request.getNumberOfAgets()-(days==null?0:days.length)>0){%>
										|
										<a style="color:navy;cursor:hand;" onclick="searchAgents('<%=inf_request.getReduceId()%>');">חפש נציגים</a> 
										<%}%>
										</shf:security>
										<%if(approvedReduce==0){%>
										<shf:security activity="reduce_update">
										|
										<a style="color:navy;cursor:hand;" onclick="confirmDelete('<%=inf_request.getReduceId()%>', <%=approvedReduce%>);">מחק</a>
										</shf:security>
										<%}%>
										<shf:security activity="reduce_update">
										|
										<a style="color:navy;cursor:hand;" onclick="declineAll('<%=inf_request.getReduceId()%>');">דחה לא מאושרים</a>
										</shf:security>

									</TD>
								</TR>
							</table>
							<form id="searchAgntForm<%=inf_request.getReduceId()%>" action="/shf/reduce/searchForReduce.do" target="srchIf<%=inf_request.getReduceId()%>"> <!-- EmployeeInforceListForm  -->
								<input type=hidden value="<%=inf_request.getReduceId()%>" name="reduceId">
								<input type=hidden value="<shf:shfdate date="<%=inf_request.getShiftStart()%>"/>" name="date">
								<input type=hidden value="<shf:shftime date="<%=inf_request.getShiftStart()%>"/>" name="shiftStart">
								<input type=hidden value="<shf:shftime date="<%=inf_request.getShiftEnd()%>"/>" name="shiftEnd">
								<input type=hidden value="<%=inf_request.getActivity()%>" name="activity">
								<input type=hidden value="<%=inf_request.getMokedId()%>" name="mokedId">
								<input type="hidden" value="<%=inf_request.getAutomaticApprove()%>" name="automaticApprove">
								 <% if (inf_request.getSelectedExceptions() != null) { %>
									<input type=hidden value="<%=inf_request.getSelectedExceptions()%>" name="selectedExceptions">
								 <%}%>
							</form>
						</TD>
						</TR>
					</TABLE>
					<br>
					</TD>
				</TR>
			<%}}else{%>
			<TR>
			<TD ><div class=gridNoData>לא נמצאו נתונים</div></TD>
			</TR>
			<%}%>
		</TABLE>
		</div>
		</FIELDSET>
		
		</TD>
	</TR>
</TABLE>
</BODY>
</HTML>
