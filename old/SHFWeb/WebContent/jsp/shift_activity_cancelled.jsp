<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@	taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<jsp:useBean id="shiftCancelledForm" class="bzq.shf.forms.ActivityCancelForm"
	scope="request">
</jsp:useBean>
<jsp:useBean id="shift_cancelled_list" class="java.util.Vector" scope="request"></jsp:useBean>
<SCRIPT>
	function submitShiftCancelledForm(){
		document.forms['shiftCancelledForm'].action = "/shf/shift/cancelledResult.do";
		document.forms['shiftCancelledForm'].target="";
		document.forms['shiftCancelledForm'].submit();
	
	}
	function exportExcel(){
	document.forms['shiftCancelledForm'].action = "/shf/shift/cancelledExport.do";
	document.forms['shiftCancelledForm'].target="_blank";
	document.forms['shiftCancelledForm'].submit();
}
</SCRIPT>
<%@page import="bzq.shf.utils.ShfException"%>
<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="com.ibm.websphere.management.repository.Document"%>
<%@page import="java.util.HashMap"%><html:html>
<shf:reloadErrors></shf:reloadErrors>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector"
%>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></SCRIPT>

<SCRIPT>
function updownException(){
	hideDisplay('trCurrent');
}

function updownCurrent(){
	hideDisplay('trException');
}

</SCRIPT>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<TITLE></TITLE>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<%
String moked=shiftCancelledForm.getMoked();
%>

<BODY>
<div id="popupShiftChange" class="popup2" style="display: none;"></div>

<form name="shiftCancelledForm" method="post" action="/shf/shift/cancelledResult.do">

<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0" dir="rtl">
	<TR>
			<TD valign="top" style="height:20px;">
				<jsp:include page="submenu/shift_submenu.jsp"></jsp:include> 
			</TD>
	</TR>
	
	<TBODY>
		
		
		<TR>
			<TD valign="top" style="padding-top:3px;padding-bottom:3px;padding-right:6px;padding-left:6px;">
			<FIELDSET class="form"><legend> משמרות ופעילויות מבוטלות   </legend>
			<TABLE cellspacing="2" cellpadding="2">
				<TBODY>
					
					<TR>
						<TD class="header">תאריך:</TD>
						<TD class="data" valign="middle"><shf:calendar calname="date"
							name="shiftCancelledForm" property="date" marginBottom="35" /></TD>
						
						<TD width="10px"></TD>
						<TD class="header">משעה:</TD>
						<TD class="data"><shf:timechooser inputname="timeFrom"
							inputvalue="<%=shiftCancelledForm.getTimeFrom()%>" /></TD>
						<TD width="10px"></TD>
						<TD class="header">עד שעה:</TD>
						<TD class="data"><shf:timechooser inputname="timeTo" 
							inputvalue="<%=shiftCancelledForm.getTimeTo()%>" /></TD>
						
						
					</TR>
					<TR>
					    
						<TD class="header">מוקד:</TD>
						<TD class="data"><shf:unitselect tablename="unitCode"
							name="moked" selectedName="shiftCancelledForm" selectedProperty="moked"
							style="width:160px;font-size:10px;" type="G01" all="yes"
							logic="onchange=setMultiTeams(this,'shiftCancelledForm','team','200');setMultiActivities(this,'shiftCancelledForm','activity');" /></TD>

						<TD width="10px"></TD>	
						<!--TD class="header">תור:</TD>
						<TD id="activityAjaxResult">
							<shf:activityCheckList name="shiftCancelledForm" moked="<!--%=moked%>" property="activity"/>
						</TD-->
						<TD class="header">תפקיד בפועל:</TD>
						<TD class="data" valign="middle" >
						<shf:innerJobCheckList name="shiftCancelledForm" tablename="innerJob" property="innerJob" optionsLength="150"/>
						</TD>
				
						<TD width="10px"></TD>
						<TD class="header">צוות:</TD>
						<TD class="data" id="teamsAjaxResult">
							<shf:orgunitCheckList parentUnit="<%=moked%>" name="shiftCancelledForm" type="J01" property="team" optionsLength="200" length="160"></shf:orgunitCheckList> 
						</TD>	
						
					</TR>
					<TR>
						<TD class="header">סוג פעילות:</TD>
						<TD id="exceptionAjaxResult">
							<shf:exceptionCheckList name="shiftCancelledForm" moked="<%=moked%>" property="exceptionCode"/>
						</TD>
						<TD width="10px"></TD>
						<TD class="header">סיבת ביטול:</TD>
						<TD ><shf:eventReasonCheckList name="shiftCancelledForm" type="8" property="eventReasonCode" optionsLength="150"></shf:eventReasonCheckList></TD>
													
						
					</TR>
					<TR>
						<TD align=right colspan=2 class=header>
						<button onclick="submitShiftCancelledForm();">חפש</button>
						</TD>	
						
						
					</TR>
				</TBODY>
				
			</TABLE>
		

			</FIELDSET>

			</TD>
		</TR>
		<% if (shift_cancelled_list !=null && shift_cancelled_list.size()>0) {%>
		<TR>
			<TD style="padding: 6px 6px 0px 6px;">
			<TABLE width="100%" cellspacing="0" cellpadding="0" style="border-left:1px silver solid;border-right:1px silver solid;border-top:1px silver solid;">
			<TR>
				<TD style="text-align: right;" class="tableTotal"  dir="rtl"><img
					src='/shf/images/search.png' height="16px"> נמצאו <%=shift_cancelled_list.size()%>
				רשומות</TD>
			
				<TD style='text-align:left' width=20px class=tableTotal style="padding-left:2px;padding-top:2px;"  dir="ltr">
			 		<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;' >
				</TD>
				
			</TR>
			</TABLE>
			</TD>
		</TR>
		<%}%>
	
		<TR id="trCurrent">
			<TD valign=top height="100%" style="padding: 0px 6px 7px 6px" dir="ltr">
				<div id="bigDiv"> </div>
				<div style="overflow: auto; border: 1px silver solid;height: 100%" id="dataGridDiv">
					<jsp:include page="shift_activity_cancelled_table.jsp"></jsp:include>
				</div>
			</TD>
		</TR>
	</TBODY>
</TABLE>
</form>

</BODY>
</html:html>