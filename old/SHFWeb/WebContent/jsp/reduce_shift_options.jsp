<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="shiftInforce"
	class="bzq.shf.forms.ShiftInforceRequestForm" scope="request"></jsp:useBean>

<jsp:useBean id="shiftReduce"
	class="bzq.shf.forms.ShiftReduceRequestForm" scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.forms.ShiftInforceRequestForm,bzq.shf.bean.AgentDayBean,java.util.Vector,bzq.shf.forms.ShiftReduceRequestForm"
%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>shift_reduce_options.jsp</TITLE>
<SCRIPT>
function approveDecline(reduceId) {
	var accept=window.confirm("האם אתה בטוח כי ברצונך לבטל משמרת זו ?");
	if(accept)
		document.getElementById("acceptReduce"+reduceId).submit();
	else return;
}
</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<%
bzq.shf.profile.UserProfile up=(bzq.shf.profile.UserProfile)session.getAttribute("userProfile");
String empIdNumber=up.getId();

%>
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
			<LEGEND>חיפוש בקשות צמצום משמרות לנציג</LEGEND>
			<div style="overflow:auto;height:95%;">
			
			<TABLE width=100% cellpadding="0" cellspacing="0">
			<%
			
			Vector add_requests=(Vector)request.getAttribute("optionVec");
			if(add_requests!=null && add_requests.size()>0){
				ShiftInforceRequestForm inf_request=null;
				for(int i=0;i<add_requests.size();i++){
					ShiftReduceRequestForm reduceReq=(ShiftReduceRequestForm)add_requests.get(i);
					int dayslen=0;
					int sumApproved=0;
					if(reduceReq.getReduceList()!=null) {
					sumApproved = reduceReq.getSumApproved();
//					AgentDayBean[] dayReqList = reduceReq.getAgentDayList();
//					AgentDayBean dayReq = dayReqList[0];

					bzq.shf.forms.ShiftReduceListForm[] reqList = reduceReq.getReduceList();

 
					if (reqList.length>0) {
					for (int ll=0; ll<reqList.length;ll++) {
				%>
					<TR>
				<%
						bzq.shf.forms.ShiftReduceListForm req = reqList[ll];
						if (reduceReq.getReduceId()==req.getReduceId()) {
							%>
								<TD valign="top" dir="rtl" style="padding:10px 6px 6px 6px;">
								<form action="/shf/reduce/reduceShift.do" id="acceptReduce<%=reduceReq.getReduceId()%>" >  <!-- AddShiftRequestForm -->
									<input type=hidden value="<%=reduceReq.getReduceId()%>" name="reduceId"/>
									<input type=hidden value="<%=req.getAgentDayId()%>" name="agentDayId"/>
									<input type=hidden value="<%=req.getEmpIdNumber()%>" name="wmEmpIdNumber">
									<input type=hidden value="<%=req.getEmployeeId()%>" name="employeeId">
									<INPUT type=hidden value="<%=reduceReq.getAutomaticApprove()%>" name="automaticApprove">
									<input type=hidden value="<shf:shfdate date="<%=reduceReq.getShiftStart()%>"/>" name="date">
									<input type=hidden value="<shf:shftime date="<%=reduceReq.getShiftStart()%>"/>" name="startTime">
									<input type=hidden value="<shf:shftime date="<%=reduceReq.getShiftEnd()%>"/>" name="endTime">
									<input name="sourceWindow" type="hidden" value="reduce_option">
								
								<TABLE width=90% cellpadding="1" cellspacing="1" style="border:1px silver dotted;">
									<TR>
									<TD colspan=4 style="color:#884444;font-size:14px;font-weight:bold;border-bottom:1px silver dotted;background-color:#f5f5f5;"><shf:tables tableName="unitCode" codeName="<%=reduceReq.getMokedId()%>"></shf:tables></TD>
									<TD colspan=14 style="color:#884444;font-size:14px;font-weight:bold;border-bottom:1px silver dotted;background-color:#f5f5f5;"><shf:tables tableName="activityCode" codeName="<%=reduceReq.getActivity()%>"></shf:tables></TD>
									</TR>
									<TR>
									<TD class=header>תאריך:</TD><TD width=10px></TD><TD><shf:shfdate date="<%=reduceReq.getShiftStart()%>"/></TD><TD width=10px></TD>
									<TD class=header>שעת התחלה:</TD><TD width=10px></TD><TD><shf:shftime date="<%=reduceReq.getShiftStart()%>"/></TD><TD width=10px></TD>
									<TD class=header>שעת סיום:</TD><TD width=10px></TD><TD><shf:shftime date="<%=reduceReq.getShiftEnd()%>"/></TD>
									</TR>
									<TR>
									<TD class=header>מקומות פנויים:</TD><TD width=10px></TD><TD><%=reduceReq.getNumberOfAgets()-sumApproved%></TD><TD width=10px></TD>
									<TD class=header>מתוך:</TD><TD width=10px></TD><TD><%=reduceReq.getNumberOfAgets()%></TD>
									<TD colspan="2" class=header>סוג אישור:</TD><TD width=10px></TD><TD><%="1".equals(reduceReq.getAutomaticApprove())?"אוטומטי":"ידני"%></TD>
									<% 			if (req.getReduceId() == 0) { //indicate that the user doesnt have request
													if ( (reduceReq.getNumberOfAgets()- sumApproved) <= 0) {
														%> <TD class=header>סטאטוס: </TD><td> לא נותרו מקומות פנויים</td><%
													    } else {%>
														<TD  align="left"><BUTTON onclick="approveDecline(<%=reduceReq.getReduceId()%>)" class=button >צמצם משמרת</BUTTON>
											     	<%} 
											    } else {
													if (req.getApproveTime() == null ) {
														%> <TD class=header>סטאטוס: </TD><td> ממתין לאישור</td><%	
													} else if (! req.getNewEmpIdNumber().equals("0")){
														%> <TD class=header>סטאטוס: </TD><td> אושר</td><%										
													}
												}%>	
									</TR>
									
								</TABLE>
								
								</form>
						
						</TD>
							<%} else if (req.getReduceId()==0) { %>
								<TD valign="top" dir="rtl" style="padding:10px 6px 6px 6px;">
								<form action="/shf/reduce/reduceShift.do" id="acceptReduce<%=reduceReq.getReduceId()%>" >  <!-- AddShiftRequestForm -->
									<input type=hidden value="<%=reduceReq.getReduceId()%>" name="reduceId"/>
									<input type=hidden value="<%=req.getAgentDayId()%>" name="agentDayId"/>
									<input type=hidden value="<%=req.getEmpIdNumber()%>" name="wmEmpIdNumber">
									<input type=hidden value="<%=req.getEmployeeId()%>" name="employeeId">
									<INPUT type=hidden value="<%=reduceReq.getAutomaticApprove()%>" name="automaticApprove">
									<input type=hidden value="<shf:shfdate date="<%=reduceReq.getShiftStart()%>"/>" name="date">
									<input type=hidden value="<shf:shftime date="<%=reduceReq.getShiftStart()%>"/>" name="startTime">
									<input type=hidden value="<shf:shftime date="<%=reduceReq.getShiftEnd()%>"/>" name="endTime">
									<input name="sourceWindow" type="hidden" value="reduce_option">
												
								
								<TABLE width=90% cellpadding="1" cellspacing="1" style="border:1px silver dotted;">
									<TR>
									<TD colspan=4 style="color:#884444;font-size:14px;font-weight:bold;border-bottom:1px silver dotted;background-color:#f5f5f5;"><shf:tables tableName="unitCode" codeName="<%=reduceReq.getMokedId()%>"></shf:tables></TD>
									<TD colspan=14 style="color:#884444;font-size:14px;font-weight:bold;border-bottom:1px silver dotted;background-color:#f5f5f5;"><shf:tables tableName="activityCode" codeName="<%=reduceReq.getActivity()%>"></shf:tables></TD>
									</TR>
									<TR>
									<TD class=header>תאריך:</TD><TD width=10px></TD><TD><shf:shfdate date="<%=reduceReq.getShiftStart()%>"/></TD><TD width=10px></TD>
									<TD class=header>שעת התחלה:</TD><TD width=10px></TD><TD><shf:shftime date="<%=reduceReq.getShiftStart()%>"/></TD><TD width=10px></TD>
									<TD class=header>שעת סיום:</TD><TD width=10px></TD><TD><shf:shftime date="<%=reduceReq.getShiftEnd()%>"/></TD>
									</TR>
									<TR>
									<TD class=header>מקומות פנויים:</TD><TD width=10px></TD><TD><%=reduceReq.getNumberOfAgets()-sumApproved%></TD><TD width=10px></TD>
									<TD class=header>מתוך:</TD><TD width=10px></TD><TD><%=reduceReq.getNumberOfAgets()%></TD>
									<TD colspan="2" class=header>סוג אישור:</TD><TD width=10px></TD><TD><%="1".equals(reduceReq.getAutomaticApprove())?"אוטומטי":"ידני"%></TD>
									<% 			if (req.getReduceId() == 0) { //indicate that the user doesnt have request
													if ( (reduceReq.getNumberOfAgets()- sumApproved) <= 0) { 
														%> <TD class=header>סטאטוס: </TD><td> לא נותרו מקומות פנויים</td><%
													    } else {%>
														<TD  align="left"><BUTTON onclick="approveDecline(<%=reduceReq.getReduceId()%>)" class=button >צמצם משמרת</BUTTON>
											     	<%} 
											    } else {
													if (req.getApproveTime() == null ) {
														%> <TD class=header>סטאטוס: </TD><td> ממתין לאישור</td><%	
													} else if (! req.getNewEmpIdNumber().equals("0")){
														%> <TD class=header>סטאטוס: </TD><td> אושר</td><%										
													}
												}%>	
									</TR>
									
								</TABLE>
								
								</form>
						
						</TD>							
							<%}%>
					</TR>												
						<%}%>
					<%}%>	

			<%}}}else{%>
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
