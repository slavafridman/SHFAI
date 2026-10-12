<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="shiftInforce"
	class="bzq.shf.forms.ShiftInforceRequestForm" scope="request"></jsp:useBean>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.forms.ShiftInforceRequestForm,bzq.shf.bean.AgentDayBean,java.util.Vector"
%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>shift_inforce_options.jsp</TITLE>
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
		<TD dir="rtl" width="100%" height="100%" valign="top" style="padding:7px 7px 7px 7px;">
			<FIELDSET style="overflow:auto;height:100%;">
			<LEGEND>חיפוש בקשות תגבור משמרות</LEGEND>
			<div style="overflow:auto;height:95%;">
			
			<TABLE width="100%" cellpadding="0" cellspacing="0">
			<%
			Vector add_requests=(Vector)request.getAttribute("inforces");
			if(add_requests!=null && add_requests.size()>0){
				ShiftInforceRequestForm inf_request=null;
				for(int i=0;i<add_requests.size();i++){
					ShiftInforceRequestForm inforceReq=(ShiftInforceRequestForm)add_requests.get(i);
					int dayslen=0;
					if(inforceReq.getDays()!=null)
						dayslen=inforceReq.getDays().length;
			%>
			<TR>
				<TD valign="top" dir="rtl" style="padding:10px 6px 6px 6px;">
				<form action="/shf/shift/addShift.do" >  <!-- AddShiftRequestForm -->
				<input type="hidden" value="<shf:shfdate date="<%=inforceReq.getDate()%>"/>" name="date">
				<input type="hidden" value="<shf:shftime date="<%=inforceReq.getShiftStart()%>"/>" name="from">
				<input type="hidden" value="<shf:shftime date="<%=inforceReq.getShiftEnd()%>"/>" name="to">
				<input type="hidden" value="<%=inforceReq.getActivity()%>" name="activity">
				<input type="hidden" value="<%=inforceReq.getMoked()%>" name="moked">
				<input type="hidden" value="<%=inforceReq.getId()%>" name="inforceRequestId">
				<input type="hidden" value="inforce_option" name="sourceWindow">
				<input type="hidden" value="<%=empIdNumber%>" name="empIdNumber">
			
				
				<TABLE width="90%" cellpadding="1" cellspacing="1" style="border:1px silver dotted;">
					<TR>
					<TD colspan="4" style="color:#884444;font-size:14px;font-weight:bold;border-bottom:1px silver dotted;background-color:#f5f5f5;"><shf:tables tableName="unitCode" codeName="<%=inforceReq.getMoked()%>"></shf:tables></TD>
					<TD colspan="14" style="color:#884444;font-size:14px;font-weight:bold;border-bottom:1px silver dotted;background-color:#f5f5f5;"><shf:tables tableName="activityCode" codeName="<%=inforceReq.getActivity()%>"></shf:tables></TD>
					</TR>
					<TR>
					<TD class="header">תאריך:</TD><TD width="10px"></TD><TD><shf:shfdate date="<%=inforceReq.getDate()%>"/></TD><TD width="10px"></TD>
					<TD class="header">שעת התחלה:</TD><TD width="10px"></TD><TD><shf:shftime date="<%=inforceReq.getShiftStart()%>"/></TD><TD width="10px"></TD>
					<TD class="header">שעת סיום:</TD><TD width="10px"></TD><TD><shf:shftime date="<%=inforceReq.getShiftEnd()%>"/></TD>
					</TR>
					<TR>
					<TD class="header">מקומות פנויים:</TD><TD width="10px"></TD><TD><%=inforceReq.getOriginalNumOfAgents()-dayslen%></TD><TD width="10px"></TD>
					<TD class="header">מתוך:</TD><TD width="10px"></TD><TD><%=inforceReq.getOriginalNumOfAgents()%></TD>
					<TD colspan="4" align="left"><input type="submit" class="button" value="הוסף משמרת"></TD>
					</TR>
					
				</TABLE>
				
				</form>
				
				</TD>
			</TR>
			<%}}else{%>
			<TR>
			<TD ><div class="gridNoData">לא נמצאו נתונים</div></TD>
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
