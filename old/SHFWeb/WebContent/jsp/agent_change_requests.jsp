<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="changeRequestOptions" 
	class="java.util.Vector"
	scope="request"></jsp:useBean>
<jsp:useBean id="changeRequestForm" 
	class="bzq.shf.forms.ShiftChangeRequestForm"
	scope="page"></jsp:useBean>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.forms.ShiftChangeRequestForm,bzq.utils.BaseConvert"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>agent_change_requests.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%
request.setAttribute("changeRequestOptions",changeRequestOptions);
%>
<BODY dir="rtl">
	<TABLE width=100% height=100% cellpadding="0" cellspacing="0">
		<TR>
			<TD dir=rtl valign="top" style="height: 20px"><jsp:include
				page="submenu/shift_submenu.jsp"></jsp:include></TD>
		</TR>
	
	
		<TR>
			<TD valign=top style="height:100%;padding-bottom:5px;padding-top:10px;padding-right:6px;padding-left:6px">
				<div style="overflow:auto;height:100%;width:100%;">
				<TABLE width=100% cellpadding="1" cellspacing="0" style="border:1px silver solid;margin-bottom:15px;">
				<%
				if(changeRequestOptions!=null && changeRequestOptions.size()>0){
					for(int i=0;i<changeRequestOptions.size();i++){
						changeRequestForm=(ShiftChangeRequestForm)changeRequestOptions.get(i);
						
				%>
					<TR bgcolor="#dbeaf5">
						<TD colspan=6 valign="top">
							<TABLE width=100%>
								<TR>
									<TD class=header>מוקד: <shf:tables tableName="unitCode" codeName="<%=changeRequestForm.getMoked()%>"></shf:tables></TD>
									<TD class=header>תור: <shf:tables tableName="activityCode" codeName="<%=changeRequestForm.getActivity()%>"></shf:tables></TD>
									<TD class=header>תאריך: <shf:shfdate date="<%=changeRequestForm.getDate()%>"/></TD>
									
								</TR>
							</TABLE>
						</TD>
					</TR>
					
					<%if(changeRequestForm.getShiftStartOption()==1){%>
					<TR>
						<TD nowrap="nowrap" class=header style="padding-right:5px;">התחלת משמרת:</TD>
						<TD nowrap="nowrap" width=10px></TD>
						<TD nowrap="nowrap" class=data><%=changeRequestForm.getStartFrom()%> - <%=changeRequestForm.getStartTo()%></TD>
						<TD nowrap="nowrap" width=100%></TD>
					</TR>
					<%}if(changeRequestForm.getShiftEndOption()==1){%>
					<TR>
						<TD nowrap="nowrap" class=header style="padding-right:5px;">סיום משמרת:</TD>
						<TD nowrap="nowrap" width=10px></TD>
						<TD nowrap="nowrap" class=data><%=changeRequestForm.getEndFrom()%> - <%=changeRequestForm.getEndTo()%></TD>
						<TD nowrap="nowrap" width=100%></TD>
					</TR>
					<%}if(changeRequestForm.getShiftLengthOption()==1){%>
					<TR>
						<TD nowrap="nowrap" class=header style="padding-right:5px;">משך משמרת:</TD>
						<TD nowrap="nowrap" width=10px></TD>
						<TD nowrap="nowrap" class=data><%=changeRequestForm.getShiftLength() %> דקות</TD>
						<TD nowrap="nowrap" width=100%></TD>
					</TR>
					<%}%>
					
					<TR><TD colspan=6  style="padding-right:5px;color:coral;font-weight:bold;font-size:13px;" width="100%">השינוי:</TD></TR>
					
					<%if(changeRequestForm.getChangeStartSelected()==1){%>
					<TR>
						<TD nowrap="nowrap" class=header style="padding-right:5px;">שינוי התחלה:</TD>
						<TD width=10px></TD>
						<TD nowrap="nowrap" class=data><%=changeRequestForm.getStartChangeDesc()+"&nbsp;&nbsp;"+org.apache.struts.util.PropertyUtils.getProperty(changeRequestForm,changeRequestForm.getChangeStartOption())%></TD>
					</TR>
					<%}if(changeRequestForm.getChangeEndSelected()==1){%>
					<TR>
						<TD nowrap="nowrap" class=header style="padding-right:5px;">שינוי סיום:</TD>
						<TD width=10px></TD>
						<TD nowrap="nowrap" class=data><%=changeRequestForm.getEndChangeDesc()+"&nbsp;&nbsp;"+org.apache.struts.util.PropertyUtils.getProperty(changeRequestForm,changeRequestForm.getChangeEndOption())%></TD>
					</TR>
					<%}%>
					<TR>
						<TD colspan=6 align=left style="font-weight:bold;font-size:13pt;color:green;padding-left:10px;">
						<%if(changeRequestForm.getCandidate().getCreationTime()!=null){%>
							
							<%if(changeRequestForm.getCandidate().getApproveTime()!=null){%>
								<span style="color:green;">בוצע</span>
							<%}else{%>
								<span style="color:coral;">מחכה לאישור</span>
							<%}%>
						
						<%}else{%>
							<form  action="/shf/shift/registerToChangeRequest.do" method="post">
							<input type="hidden" name="requestId" value="<%=changeRequestForm.getRequestId()%>" >
							<input type="hidden" name="agentDayId" value="<%=changeRequestForm.getCandidate().getAgentDayId()%>" >
							<input type="hidden" name="wmShiftStartTime" value="<%=BaseConvert.dateToString(changeRequestForm.getCandidate().getShiftStart(),"dd/MM/yyyy HH:mm")%>" >
							<input type="hidden" name="wmShiftEndTime" value="<%=BaseConvert.dateToString(changeRequestForm.getCandidate().getShiftEnd(),"dd/MM/yyyy HH:mm")%>" >
							<input class="button" value="שנה" type="submit">
							</form>
						<%}%>
						
						
						</TD>
					</TR>
					
				<%}}else{%>
					<TR><TD align="center"><div class="gridNoData">אין נתונים</div></TD></TR>
				<%}%>
				</TABLE>
				</div>
			</TD>
			
		</TR>
	</TABLE>
</BODY>
</HTML>
