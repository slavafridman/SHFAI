<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="change_requests" 
	class="java.util.Vector"
	scope="request"></jsp:useBean>
	
<jsp:useBean id="chageRequestForm" 
	class="bzq.shf.forms.ShiftChangeRequestForm"
	scope="page"></jsp:useBean>
	
	
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.forms.ShiftChangeRequestForm"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>shift_time_change_requests.jsp</TITLE>

<SCRIPT>
function viewChangeRequest(reqid,mode){
	document.updateChangeRequestForm.requestId.value=reqid;
	document.updateChangeRequestForm.mode.value=mode;
	document.updateChangeRequestForm.submit();
}

function searchAgents(reqid){
	document.location="/shf/shift/viewChangeRequestOptions.do?requestId="+reqid;
}

function viewAddedShifts(reqid){
	document.location="/shf/shift/viewChangeRequestApplications.do?requestId="+reqid;
}

function exportExcel(){
	window.open('/shf/shift/viewShiftTimeChangeRequests.do?mode=export',null);
}
</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY dir="rtl">

	<TABLE width=100% height=100% cellpadding="0" cellspacing="0">
		<TR>
			<TD dir=rtl valign="top" style="height: 20px"><jsp:include
				page="submenu/shift_submenu.jsp"></jsp:include></TD>
		</TR>
	
	
		<TR>
			<TD valign=top style="padding-bottom:5px;padding-top:10px;padding-right:6px;padding-left: 6px">
				<TABLE width="100%" height="100%">
					<TR>
						<TD>
							<h3 style="color:navy;"><img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;margin-top:2px;position:absolute;' width=18px>
							&nbsp;&nbsp;&nbsp;&nbsp;
							בקשות שינוי משמרות המוני</h3>
						</TD>
					</TR>
					<TR>
						<TD height="100%" width="100%">
						<DIV style="height:100%;overflow:auto;" > 
						<%
						if(change_requests!=null && change_requests.size()>0){
						for(int i=0;i<change_requests.size();i++){
							chageRequestForm=(ShiftChangeRequestForm)change_requests.get(i);
						%>
						
						<TABLE width=100% cellpadding="1" cellspacing="0" style="border:1px silver solid;margin-bottom:20px;">
							<TR bgcolor="#dbeaf5">
								<TD colspan=13 width=100%>
									<TABLE width=100%>
										<TR>
											<TD class=header>מוקד: <shf:tables tableName="unitCode" codeName="<%=chageRequestForm.getMoked()%>"></shf:tables></TD>
											<TD class=header>תור: <shf:tables tableName="activityCode" codeName="<%=chageRequestForm.getActivity()%>"></shf:tables></TD>
											
											<TD align=left  style="color:#cccccc;">
											  <a style="color:navy;font-size:12px;" href="javascript:viewAddedShifts('<%=chageRequestForm.getRequestId()%>');">הצג בקשות</a>
											<shf:security activity="shift_update">| <a style="color:navy;font-size:12px;" href="javascript:searchAgents('<%=chageRequestForm.getRequestId()%>')">חפש נציגים</a></shf:security>
											<shf:security activity="shift_update">| <a style="color:navy;font-size:12px;" href="javascript:viewChangeRequest('<%=chageRequestForm.getRequestId()%>','update');">עדכן</a></shf:security>
											<shf:security activity="shift_update">| <a style="color:navy;font-size:12px;" href="javascript:viewChangeRequest('<%=chageRequestForm.getRequestId()%>','insert');">שכפל</a></shf:security>
											<shf:security activity="shift_update">| <a style="color:navy;font-size:12px;" href="javascript:viewChangeRequest('<%=chageRequestForm.getRequestId()%>','delete');">מחק</a></shf:security>
											</TD>
										
										</TR>
									</TABLE>
								</TD>
							</TR>
							
							<TR>
								<TD nowrap="nowrap" class=header>תאריך:</TD>
								<TD nowrap="nowrap" width=10px></TD>
								<TD nowrap="nowrap" class=data><shf:shfdate date="<%=chageRequestForm.getDate()%>" /></TD>
								<TD nowrap="nowrap" width=20px></TD>
								
								<TD nowrap="nowrap" class=header>סוג אישור:</TD>
								<TD nowrap="nowrap" width=10px></TD>
								<TD nowrap="nowrap" class=data><%=chageRequestForm.getAutoApprove()==1?"אוטומטי":"ידני"%></TD>
								<TD nowrap="nowrap" width=20px></TD>
								
								<TD colspan=5 nowrap="nowrap" width=100%></TD>
							</TR>
							<TR>
								<TD nowrap="nowrap" class=header>מקומות פנויים:</TD>
								<TD nowrap="nowrap" width=10px></TD>
								<TD nowrap="nowrap" class=data><%=chageRequestForm.getAgentsNum()-chageRequestForm.getAprovedNum()%></TD>
								<TD nowrap="nowrap" width=20px></TD>
								<TD nowrap="nowrap" class=header>מתוך:</TD>
								<TD nowrap="nowrap" width=10px></TD>
								<TD nowrap="nowrap" class=data><%=chageRequestForm.getAgentsNum()%></TD>
								<TD nowrap="nowrap" width=20px></TD>
								<TD colspan=5 nowrap="nowrap" width=100%></TD>
							</TR>
							
							<TR>
							<%int sp=13;%>
								<%if(chageRequestForm.getShiftStartOption()==1){ sp-=4;%>
								<TD nowrap="nowrap" class=header>התחלת משמרת:</TD>
								<TD nowrap="nowrap" width=10px></TD>
								<TD nowrap="nowrap" class=data><%=chageRequestForm.getStartFrom()%> - <%=chageRequestForm.getStartTo()%></TD>			
								<TD nowrap="nowrap" width=20px></TD>
								<%}if(chageRequestForm.getShiftEndOption()==1){ sp-=4; %>
								<TD nowrap="nowrap" class=header>סיום משמרת:</TD>
								<TD nowrap="nowrap" width=10px></TD>
								<TD nowrap="nowrap" class=data><%=chageRequestForm.getEndFrom()%> - <%=chageRequestForm.getEndTo()%></TD>
								<TD nowrap="nowrap" width=20px></TD>
								<%}if(chageRequestForm.getShiftLengthOption()==1){ sp-=4; %>
								<TD nowrap="nowrap" class=header>משך משמרת:</TD>
								<TD nowrap="nowrap" width=10px></TD>
								<TD nowrap="nowrap" class=data><%=chageRequestForm.getShiftLength() %> דקות</TD>
								<TD nowrap="nowrap" width=20px></TD>
								<%}%>
								<TD colspan="<%=sp%>" nowrap="nowrap" width=100%></TD>
							</TR>
							
							<TR><TD colspan=13 bgcolor="#fafafa" style="color:coral;font-weight:bold;font-size:12px;" width="100%">השינוי:</TD></TR>
							
							<TR>
								<%sp=13;
								if(chageRequestForm.getChangeStartSelected()==1){ sp-=4;%>
								<TD nowrap="nowrap" class=header>שינוי התחלה:</TD>
								<TD nowrap="nowrap" width=10px></TD>
								<TD nowrap="nowrap" nowrap="nowrap" class=data><%=chageRequestForm.getStartChangeDesc()+"&nbsp;&nbsp;"+org.apache.struts.util.PropertyUtils.getProperty(chageRequestForm,chageRequestForm.getChangeStartOption())%></TD>
								<TD nowrap="nowrap" width=20px></TD>
								<%}if(chageRequestForm.getChangeEndSelected()==1){ sp-=4;%>
							
								<TD nowrap="nowrap" class=header>שינוי סיום:</TD>
								<TD nowrap="nowrap" width=10px></TD>
								<TD nowrap="nowrap" nowrap="nowrap" class=data><%=chageRequestForm.getEndChangeDesc()+"&nbsp;&nbsp;"+org.apache.struts.util.PropertyUtils.getProperty(chageRequestForm,chageRequestForm.getChangeEndOption())%></TD>
								<TD nowrap="nowrap" width=20px></TD>
								<%}%>
								<TD colspan="<%=sp%>" nowrap="nowrap" width=100%></TD>
							</TR>
							
							
						</TABLE>
						<%
						}
						}else{%>
							<div class="gridNoData">אין נתונים</div>
						<%}%>
						</div>
						
						</TD>
					</TR>
				</TABLE>
			</TD>
		</TR>
	</TABLE>
	<form action="/shf/shift/updateShiftTimeChangeParam.do" name="updateChangeRequestForm">
		<input type="hidden" name="requestId">
		<input type="hidden" name="mode">
	</form>
</BODY>
</HTML>
