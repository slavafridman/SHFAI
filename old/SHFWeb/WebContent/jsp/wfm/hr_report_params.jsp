<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="wfmReportForm" class="bzq.wfm.report.WfmReportForm" scope="request"></jsp:useBean>


<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="bzq.shf.utils.TablesConstants"%>

<HTML>
<HEAD>

<%@ taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<%
response.setHeader("Cache-control", "no-store");
%>


<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector"
%>
<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<meta http-equiv="Cache-Control" content="must-revalidate">
<meta http-equiv="Cache-Control" content="no-store">
<meta http-equiv="Pragma" content="no-cache">


<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<TITLE>HR Report</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/attendance.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/reports.js"></SCRIPT>

<shf:reloadErrors></shf:reloadErrors>

<SCRIPT>
function submitReport(){
	document.forms[0].mode.value="build";
	document.forms[0].submit();
}
</SCRIPT>

</HEAD>

<%
String moked=wfmReportForm.getMoked();
String agaf=wfmReportForm.getAgaf();
%>
<BODY>


<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TR>
		<TD dir="rtl" valign="top" style="height: 20px;"><jsp:include page="../submenu/emptySubmenu.jsp"></jsp:include></TD>
	</TR>

	<TR>
		<TD valign="top" style="padding:6px;" height="100%">
		
		<form name="hrReportForm" action="/shf/wfmHRReport.do" style="margin: 0px; padding: 0px;">
		<input type="hidden" name="mode">
		<FIELDSET class="form"><legend>דוח מצבת כח אדם</legend>
		
		<TABLE cellspacing="3" cellpadding="2" >
			<TBODY>

				<TR>
					<!--  
					<TD class="header">אגף:</TD>
					<TD class="data">
					<shf:unitselect tablename="unitCode"
						name="agaf" style="width:170px;font-size:10px;" selectedName="wfmReportForm" selectedProperty="agaf"
						type="<%=bzq.shf.utils.SHFConstants.AGAF_UNIT%>" all="yes"
						logic="onchange=setMokedsForMultiTeams();setInnerJobs();">
						</shf:unitselect>
						
					</TD>
					<TD width="10px"></TD>
					-->
					
					<TD class="header">מוקד:</TD>
					<TD class="data" id="mokedsAjaxResult">
					
					
						<shf:unitselect	tablename="unitCode" name="moked" selectedName="wfmReportForm" selectedProperty="moked" style="width:170px;font-size:10px;" 
						logic="onchange=setMultiTeams(this,'wfmReportForm','team','200');setMultiActivities(this,'wfmReportForm','activityList');"
						type="G01" emptySelection="yes" />
								
						
						
					</TD>
					
					<TD width="10px"></TD>
					<TD class="header">צוות:</TD>
					<TD class="data" id="teamsAjaxResult">
					
					<shf:orgunitCheckList
						parentUnit="<%=moked%>" name="wfmReportForm" type="J01"
						property="team" optionsLength="200" length="170"></shf:orgunitCheckList >
					
						</TD>
						
						<TD width="10px"></TD>
					<TD class="header">סטטוס:</TD>
					<TD>
					
					<html:select property="status" name="wfmReportForm" style="width:110px;font-size:10px;">
						<html:option value="0">הכל</html:option>
						<html:option value="3">פעיל</html:option>
						<html:option value="1">לא פעיל זמנית</html:option>
						<html:option value="2">לא פעיל</html:option>
					</html:select>
					
					</TD>
					
				</TR>

				<TR>
					<TD class="header">תפקיד בפועל:</TD>
					<TD class="data" valign="middle" id="innerJobsAjaxResult">
					<shf:innerJobCheckList length="170" 
						name="wfmReportForm" tablename="innerJobCode" agaf="<%=agaf%>" property="innerJob" />
					</TD>
					
					<TD width="10px"></TD>
					<TD class="header">תפקיד:</TD>
					<TD class="data">
						<bzq:select name="job" tablename="jobCode" all="yes" 
						selectedName="wfmReportForm" selectedProperty="job" style="width:170px;font-size:10px;" />
					</TD>
					
					


				</TR>
				<TR>
					<TD class="header">תור:</TD>
					<TD id="activityAjaxResult">
					<shf:activityCheckList name="forecastForm" moked="<%=moked%>" property="activityList" />
					
					<TD width="10px"></TD>
					<TD class="header">מיומנות:</TD>
					<TD class="data">
						<shf:skillsCheckList name="forecastForm" property="skillList" ></shf:skillsCheckList>
					</TD>
					
					


				</TR>
				<TR>
					
					<TD align="left">
					<button onclick="submitReport();">אישור</button>
					</TD>
				</TR>
			</TBODY>
		</TABLE>

		</FIELDSET>
		</form>
		</TD>
	</TR>

	

</TABLE>



</BODY>


</HTML>
