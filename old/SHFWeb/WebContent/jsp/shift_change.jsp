<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@page import="java.util.Date"%>
<%@page import="bzq.shf.utils.SHFConstants, bzq.shf.utils.SHFUtils"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@	taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<jsp:useBean id="shiftForm" class="bzq.shf.forms.ShiftDataForm" scope="request"></jsp:useBean>
<jsp:useBean id="shiftBreaks" class="java.util.Vector" scope="request"></jsp:useBean>
<jsp:useBean id="conflicting_exceps" class="java.util.Vector" scope="request"></jsp:useBean>
<jsp:useBean id="reason_id" class="java.lang.String" scope="request"></jsp:useBean>

<%
boolean isManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(bzq.shf.utils.SHFTableUtils.getMokedCodeOf(shiftForm.getOrgUnitCode())).getValue());
//boolean isPilotAgent = SHFConstants.managedBreaksEmpList.contains(shiftForm.getEmpIdNumber());
boolean break1managedBreaksDisabled = false;
boolean break2managedBreaksDisabled = false;
boolean break3managedBreaksDisabled = false;
int managedBreaksMin = 0;
if (isManagedBreaks) {
	Date now = new Date();
	managedBreaksMin = Integer.parseInt(bzq.shf.utils.SHFParameters.getManagedBreakMinTimeBeforeChange(bzq.shf.utils.SHFTableUtils.getAgafCodeOf(shiftForm.getOrgUnitCode())).getValue());
	if ( shiftBreaks.size()>0 && managedBreaksMin > 0) {
		break1managedBreaksDisabled = ((BreakBean)shiftBreaks.get(0)).getStartTime().getTime() - now.getTime() <= managedBreaksMin*60*1000;
	}
	if ( shiftBreaks.size()>1 && managedBreaksMin > 0) {
		break2managedBreaksDisabled = ((BreakBean)shiftBreaks.get(1)).getStartTime().getTime() - now.getTime() <= managedBreaksMin*60*1000;
	}
	if ( shiftBreaks.size()>2 && managedBreaksMin > 0) {
		break3managedBreaksDisabled = ((BreakBean)shiftBreaks.get(2)).getStartTime().getTime() - now.getTime() <= managedBreaksMin*60*1000;
	}
}
%>

<html:html>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.bean.BreakBean,bzq.utils.BaseConvert"
%>
<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<%	  
if ( conflicting_exceps != null && conflicting_exceps.size() == 0 )  {
  %>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
<script language="JavaScript" src="/shf/js/attendance.js"></script>
<script language="JavaScript" src="/shf/js/breakjs.js"></script>

<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<SCRIPT>
var oldStart;
var oldEnd;
var oldSplitStart;
var oldSplitEnd;
function onPageLoad(){
	oldStart = document.shiftsUpdate.newStartTime.value;
	oldEnd = document.shiftsUpdate.newEndTime.value;
	oldSplitStart = document.shiftsUpdate.newSplitStartTime.value;
	oldSplitEnd = document.shiftsUpdate.newSplitEndTime.value;
	
}
function subChange(startEnd) {
	if ( (document.shiftsUpdate.newStartTime.value == oldStart && document.shiftsUpdate.newEndTime.value == oldEnd)
		&& (document.shiftsUpdate.newSplitStartTime.value == oldSplitStart && document.shiftsUpdate.newSplitEndTime.value == oldSplitEnd)
		){
		alert('לא הוכנסו שינויים');
		return false;
	}
	
	if(!isValidTime(document.shiftsUpdate.newStartTime.value)){
		alert("HH:MM שעת התחלה לא חוקית ! הזן שעה בפורמט");	
		return false;
	}
	
	if(!isValidTime(document.shiftsUpdate.newEndTime.value)){
		alert("HH:MM שעת סיום לא חוקית ! הזן שעה בפורמט");	
		return false;
	}

	if(document.shiftsUpdate.newStartTime.value != oldStart && 
	document.shiftsUpdate.newStartStatusForUpdate.value==00){
		alert("נא לבחור סיבת שינוי תחילת משמרת");
		return false;
	}
	else if(document.shiftsUpdate.newEndTime.value != oldEnd && 
	document.shiftsUpdate.newEndStatusForUpdate.value==00){
		alert("נא לבחור סיבת שינוי סוף משמרת");
		return false;
	}
		
	var accept=confirm("האם אתה בטוח כי ברצונך לשנות את זמן המשמרת");
	if(!accept) return false;
	document.forms['shiftsUpdate'].submit();
	document.getElementById("loadingImgDiv").style.display = "";
}

function goBack(){
	document.shiftsUpdate.action='/shf/shift/searchResult.do';
	if(document.shiftsUpdate.job.value=="null")
		document.shiftsUpdate.job.value="00";
	if(document.shiftsUpdate.moked.value=="null")
		document.shiftsUpdate.moked.value="-1";
	//if(document.shiftsUpdate.team.value=="null")
		//document.shiftsUpdate.team.value="-1";
	if(document.shiftsUpdate.activity.value=="null")
		document.shiftsUpdate.activity.value="00";
	//if(document.shiftsUpdate.timeFrom.value==null)
		//document.shiftsUpdate.action='/shf/shift/searchParam.do';
	document.forms['shiftsUpdate'].submit();
}
function breakUpdate(){
	document.forms['breakForm'].submit();
	document.getElementById("loadingImgDiv").style.display = "";
}
function updateShiftLocation(){
	var form = document.forms['shiftsUpdateLocation'];
	var originLoc = document.getElementById("originShiftLocation").value.toLowerCase() === 'y' ? "<%=SHFConstants.SHIFT_LOCATION_HOME%>" : "<%=SHFConstants.SHIFT_LOCATION_SITE%>";
	var selectedLoc = form.shiftLocation.options[form.shiftLocation.selectedIndex].value;
	if (originLoc === selectedLoc) {
		alert("לא בוצע שינוי");
		return;
	}
	document.getElementById("loadingImgDiv").style.display = "";
	form.submit();
}

</SCRIPT>

<TITLE></TITLE>
<shf:reloadErrors></shf:reloadErrors>

</HEAD>

<%
java.util.Calendar cal= java.util.Calendar.getInstance();


String empname=shiftForm.getFirstName()+" "+shiftForm.getLastName();
String ename=bzq.shf.utils.SHFUtils.replace(empname,"\'","&#39;");
String team = shiftForm.getOrgUnitCode();
String moked = bzq.shf.utils.SHFTableUtils.getMokedCodeOf(team);
int job = shiftForm.getJobCode();

String startChangeReson = Integer.toString(shiftForm.getStartChangeReason());
String endChangeReson = Integer.toString(shiftForm.getEndChangeReason());

int breakLen1=0,breakLen2=0,breakLen3=0;
String breakTime1=BaseConvert.dateToString(shiftForm.getShiftStart(),"HH:mm");
String breakTime2=BaseConvert.dateToString(shiftForm.getShiftStart(),"HH:mm");
String breakTime3=BaseConvert.dateToString(shiftForm.getShiftStart(),"HH:mm");

boolean break1Exited=false;
boolean break2Exited=false;
boolean break3Exited=false;

boolean break1Returned=false;
boolean break2Returned=false;
boolean break3Returned=false;

String shiftLocation = shiftForm.isWorkingFromHome() ? SHFConstants.SHIFT_LOCATION_HOME : SHFConstants.SHIFT_LOCATION_SITE;

if(shiftBreaks!=null){
	if(shiftBreaks.size()>0){
		breakLen1=((BreakBean)shiftBreaks.get(0)).getDuration();
		breakTime1=BaseConvert.dateToString(((BreakBean)shiftBreaks.get(0)).getStartTime(),"HH:mm");
		break1Exited=((BreakBean)shiftBreaks.get(0)).getExitTime()!=null;
		break1Returned = ((BreakBean)shiftBreaks.get(0)).getEntryTime()!=null;
	}
	if(shiftBreaks.size()>1){
		breakLen2=((BreakBean)shiftBreaks.get(1)).getDuration();
		breakTime2=BaseConvert.dateToString(((BreakBean)shiftBreaks.get(1)).getStartTime(),"HH:mm");
		break2Exited=((BreakBean)shiftBreaks.get(1)).getExitTime()!=null;
		break2Returned = ((BreakBean)shiftBreaks.get(1)).getEntryTime()!=null;
	}
	if(shiftBreaks.size()>2){
		breakLen3=((BreakBean)shiftBreaks.get(2)).getDuration();
		breakTime3=BaseConvert.dateToString(((BreakBean)shiftBreaks.get(2)).getStartTime(),"HH:mm");
		break3Exited=((BreakBean)shiftBreaks.get(2)).getExitTime()!=null;
		break3Returned = ((BreakBean)shiftBreaks.get(2)).getEntryTime()!=null;
	}
}

%>

<BODY onload="onPageLoad()">

	<div id="loadingImgDiv" style="overflow:hidden; text-align:center; position: absolute; width: 100%; height: 100%; z-index: 200; background: white; filter: alpha(opacity=80); top: 1px; left: 1px; display: none;">
		<div style="vertical-align: middle; width: 200px; height: 200px; z-index: 500; border: 1px solid grey; margin-top:17%;">
			<span class="helper"></span>
			<img  alt="...המתן" src="/shf/images/wait.gif" style="width: 35%; vertical-align: middle;">
		</div>
		<div style="vertical-align: middle; width:256px;">נא להמתין בעת סנכרון עם מע' סופטפון</div>
		<span class="helper"></span>
	</div>
	
<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0" dir="rtl">

	<TR>
		<TD colspan="3" valign="top" style="height: 20px"><jsp:include
			page="submenu/shift_change_submenu.jsp"></jsp:include></TD>
	</TR>
	<TR>
		<TD width="100%" valign="top">
		<FORM name="shiftsUpdate" method="post" action="/shf/shift/updateShiftExceptions.do">
			<TABLE width="100%" cellpadding="0" cellspacing="0">
				<TR>
					<TD colspan="3" valign="top" height="100%" style="padding: 6px 6px 6px 6px" width="100%">
					<FIELDSET dir="rtl" class="info"><legend> עדכון משמרת עבור </legend>
					<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
						<TR>
							<TD class="header" width="60" align="right">שם נציג:</TD>
							<TD class="data"><shf:employee empid="<%=shiftForm.getEmployeeId()%>"
								empname="<%=ename%>" /></TD>
							<TD class="header" align="right">צוות:</TD>
							<TD class="data"><shf:tables tableName="unitCode"
								codeName="<%=String.valueOf(team)%>" /></TD>
			
						</TR>
						<TR>
							<TD class="header" align="right">תפקיד:</TD>
							<TD class="data"><%=bzq.shf.utils.SHFTableUtils.getJobName(job)%></TD>
							<TD class="header" align="right">תור:</TD>
							<TD class="data"><%=bzq.shf.utils.SHFTableUtils.getActivityName(shiftForm.getShiftActivity())%></TD>
						</TR>
						<TR>
							<TD class="header" width="60" align="right">זמן נוכחי:</TD>
							<TD class="data" align="right"><shf:shfdate date="<%=shiftForm.getShiftStart()%>" /></TD>
							<TD class="header" align="right">שעות:</TD>
							<TD class="data"><shf:shftime date="<%=shiftForm.getShiftEnd()%>" />-<shf:shftime date="<%=shiftForm.getShiftStart()%>" /></TD>
						</TR>
					</TABLE>
					</FIELDSET>
					</TD>
				</TR>
				<TR>
					<TD valign="top" style="padding: 6px 6px 6px 6px">
						<INPUT type="hidden" name="agentDayId" value="<%=shiftForm.getAgentDayId()%>">
			
					<FIELDSET dir="rtl" class="form"><legend> עדכון זמן תחילת משמרת</legend>
					<TABLE dir="rtl" width="100%">
						<TBODY>
							<TR>
								<TD class="header">תאריך:</TD>
								<TD><shf:calendar calname="newStartDate" name="shiftForm" property="newStartDate"/></TD>
								<TD class="header">שעה:</TD>
								<TD><shf:timechooser inputname="newStartTime" inputvalue="<%=shiftForm.getNewStartTime()%>" /></TD>
							</TR>
							<TR>
								<TD width="50" colspan="2"></TD>
								<TD class="header">סיבה:</TD>
								<%-- <TD><shf:eventselect style="width:120px;"
									name="newStartStatusForUpdate"
									type="<%=bzq.shf.utils.SHFConstants.CHANGE_SHIFT_REASON%>"
									tablename="eventReasonCode" selectedvalue="<%=startChangeReson%>" /> Original code before empty selection request by Viki (Igal 7.2013)--%>
									<TD><shf:eventselect style="width:120px;"
									name="newStartStatusForUpdate"
									type="<%=bzq.shf.utils.SHFConstants.CHANGE_SHIFT_REASON%>"
									tablename="eventReasonCode" emptySelection="yes" />
								</TD>
							</TR>
							
							<%if (shiftForm.isShiftSplit()) {%>
							<tr>
								<td colspan="4" class="header" height="10px"></td>
							</tr>
							<tr>
								<td width="50" colspan="2"></td>
								<td class="header">שעת תחילת פיצול:</td>
								<td><shf:timechooser inputname="newSplitStartTime" inputvalue='<%=SHFUtils.formatDateToString(shiftForm.getSplitShiftStart(),"HH:mm")%>' /></td>
							</tr>
							<%} %>

						</TBODY>
					</TABLE>
					</FIELDSET>
						<INPUT type="hidden" name="attendanceDate" value="<bzq:date name="shiftForm" property="date"/>"> 
						<INPUT type="hidden" name="timeFrom" value="<%=shiftForm.getTimeFrom()%>"> 
						<INPUT type="hidden" name="timeTo" value="<%=shiftForm.getTimeTo()%>"> 
						<INPUT type="hidden" name="currentUserIdForSelect" value="<%=shiftForm.getEmpIdNumber()%>">
						<INPUT type="hidden" name="moked" value="<%=shiftForm.getMoked()%>"> 
						<INPUT type="hidden" name="job" value="<%=String.valueOf(shiftForm.getJob())%>">
						<INPUT type="hidden" name="activity" value="<%=shiftForm.getActivity()!=null?shiftForm.getActivity()[0]:"00"%>">
						
						</TD>
						
					<TD valign="top" style="padding: 6px 6px 6px 6px">
					
			
					<FIELDSET dir="rtl" class="form"><legend> עדכון זמן סיום משמרת</legend>
					<TABLE dir="rtl" width="100%">
						<TBODY>
							<TR>
								<TD class="header">תאריך:</TD>
								<TD><shf:calendar calname="newEndDate" name="shiftForm" property="newEndDate" /></TD>
								<TD class="header">שעה:</TD>
								<TD><shf:timechooser inputname="newEndTime" inputvalue="<%=shiftForm.getNewEndTime()%>" /></TD>
							</TR>
							<TR>
								<TD width="50" colspan="2"></TD>
								<TD class="header">סיבה:</TD>
								<%-- <TD><shf:eventselect style="width:120px;"
									name="newEndStatusForUpdate"
									type="<%=bzq.shf.utils.SHFConstants.CHANGE_SHIFT_REASON%>"
									tablename="eventReasonCode" selectedvalue="<%=endChangeReson%>" /> Original code before empty selection request by Viki (Igal 7.2013) --%>
									<TD><shf:eventselect style="width:120px;"
									name="newEndStatusForUpdate"
									type="<%=bzq.shf.utils.SHFConstants.CHANGE_SHIFT_REASON%>"
									tablename="eventReasonCode" emptySelection="yes" />
								</TD>
							</TR>
							
							<%if (shiftForm.isShiftSplit()) {%>
							<tr>
								<td colspan="4" class="header" height="10px"></td>
							</tr>
							<tr>
								<td width="50" colspan="2"></td>
								<td class="header">שעת סיום פיצול:</td>
								<td><shf:timechooser inputname="newSplitEndTime" inputvalue='<%=SHFUtils.formatDateToString(shiftForm.getSplitShiftEnd(),"HH:mm")%>' /></td>
							</tr>
							<%} %>
						</TBODY>
					</TABLE>
					</FIELDSET>
					</TD>
						
				</TR>
				<TR>
					<TD colspan="2">
					<TABLE align="center">
						<TR>
							<%if(!"readOnly".equals(shiftForm.getMode())){%>
							<TD colspan="1" valign="top" style="padding: 6px 6px 6px 6px" dir="ltr">
							<button type="button" name="cbSubmit" onclick="subChange();">עדכן</button>
							</TD>
							<%}%>
							<TD colspan="1" valign="top" style="padding: 6px 6px 6px 6px">
							<button type="button" name="cbSubmitBack" onclick="goBack();">חזרה</button>
							</TD>
			
						</TR>
						<tr>
							<td class=data colspan=2>
							<html:checkbox property="cancelBreakSwitch" name="shiftForm" value="true"></html:checkbox>
							מחק הפסקות ממאגר החלפה במידה והן קיימות.</td>
						</tr>
					</TABLE>
					</TD>
			
				</TR>
			</TABLE>
			</form>
		</TD>
	</TR>
		<TR> 
		<TD>
		</TD>
	</TR>
	<tr>
		<td style="padding:0px 6px 6px 6px;">
			<FIELDSET dir="rtl" class="form">
				<legend>עדכון מיקום משמרת</legend>
				<form name="shiftsUpdateLocation" method="post" action="/shf/shift/updateShiftLocation.do">
					<input type="hidden" name = "agentDayId" value = "<%=shiftForm.getAgentDayId()%>">
					<input type="hidden" name ="workFromHome" id = "originShiftLocation" value="<%=shiftForm.isWorkingFromHome() ? "y" : "n"%>">
						<input type="hidden" name="attendanceDate" value="<bzq:date name="shiftForm" property="date"/>"> 
						<input type="hidden" name="timeFrom" value="<%=shiftForm.getTimeFrom()%>"> 
						<input type="hidden" name="timeTo" value="<%=shiftForm.getTimeTo()%>"> 
<%-- 						<input type="hidden" name="currentUserIdForSelect" value="<%=shiftForm.getEmpIdNumber()%>"> --%>
						<input type="hidden" name="moked" value="<%=shiftForm.getMoked()%>"> 
						<input type="hidden" name="job" value="<%=String.valueOf(shiftForm.getJob())%>">
						<input type="hidden" name="activity" value="<%=shiftForm.getActivity()!=null?shiftForm.getActivity()[0]:"00"%>">
					<table>
						<tr>
							<td>
								<shf:shiftLocationSelectTag name="shiftLocation" selectedvalue="<%=shiftLocation%>" />
							</td>
							<TD width="50"></TD>
							<td>
								<button type="button" name="cbSubmit" onclick="updateShiftLocation();">עדכן</button>
							</td>
						</tr>
					</table>
				</form>

			</FIELDSET>
		</td>
	</tr>
	<TR> 
		<TD>
			<!-- נועד בכדי שאובייקט התאריך לא יתנגש עם אובייקט בחירת מספר הפסקות - יובל-->
		</TD>
	</TR>
	<!--**************************************-->
	<!--  ------------ הפסקות --------------- -->
	<!--**************************************-->
	
	<shf:security activity="break_update">
	<TR>
		<TD valign="top" height="100%">
			<form name="breakForm" action="/shf/break/updateShiftBreak.do" >
			<INPUT type="hidden" name="agentDayId" value="<%=shiftForm.getAgentDayId()%>">
			<INPUT type="hidden" name="date" value="<%=bzq.utils.BaseConvert.dateToString(shiftForm.getDate(),"dd/MM/yyyy")%>">
			<INPUT type="hidden" name="dateEnd" value="<%=bzq.utils.BaseConvert.dateToString(shiftForm.getShiftEnd(),"dd/MM/yyyy")%>">
			<INPUT type="hidden" name="attendanceDate" value="<bzq:date name="shiftForm" property="date"/>"> 
			<INPUT type="hidden" name="timeFrom" value="<%=shiftForm.getTimeFrom()%>"> 
			<INPUT type="hidden" name="timeTo" value="<%=shiftForm.getTimeTo()%>">
			<INPUT type="hidden" name="wmEmpIdNumber" value="<%=shiftForm.getEmpIdNumber()%>"> 
			<INPUT type="hidden" name="orgUnitCode" value="<%=shiftForm.getOrgUnitCode()%>">
			<INPUT type="hidden" name="employeeIdNumberFull" value="<%=shiftForm.getEmployeeIdNumberFull()%>"> 

			<!-- added by Yuval 01.06.09 -->			
			<INPUT type="hidden" name="originalShiftStart" value="<shf:shftime date="<%=shiftForm.getShiftStart()%>" />">  
			<INPUT type="hidden" name="originalShiftEnd" value="<shf:shftime date="<%=shiftForm.getShiftEnd()%>" />"> 
			<!-- added by Yuval 01.06.09 -->
			<INPUT type="hidden" name="activity" value="<%=shiftForm.getActivity()!=null?shiftForm.getActivity()[0]:"00"%>"> 
			
			<INPUT type="hidden" name="moked" value="<%=shiftForm.getMoked()%>"> 
			<INPUT type="hidden" name="team" value="<%=shiftForm.getTeam()%>"> 
			<INPUT type="hidden" name="job" value="<%=String.valueOf(shiftForm.getJob())%>">
						
			<%if(shiftBreaks.size()>0){ %>
			<INPUT type="hidden" name="firstBreakTimeOld" value="<%=breakTime1%>">
			<INPUT type="hidden" name="firstBreakLengthOld" value="<%=breakLen1%>">
			<INPUT type="hidden" name="firstBreakStartDateTime" value="<%=bzq.utils.BaseConvert.dateToString(((BreakBean)shiftBreaks.get(0)).getStartTime(), "dd/MM/yyyy HH:mm")%>">
			<%} %>
			<%if(shiftBreaks.size()>1){ %>
			<INPUT type="hidden" name="secondBreakTimeOld" value="<%=breakTime2%>">
			<INPUT type="hidden" name="secondBreakLengthOld" value="<%=breakLen2%>">
			<INPUT type="hidden" name="secondBreakStartDateTime" value="<%=bzq.utils.BaseConvert.dateToString(((BreakBean)shiftBreaks.get(1)).getStartTime(), "dd/MM/yyyy HH:mm")%>">
			<%} %>
			<%if(shiftBreaks.size()>2){ %>
			<INPUT type="hidden" name="thirdBreakTimeOld" value="<%=breakTime3%>">
			<INPUT type="hidden" name="thirdBreakLengthOld" value="<%=breakLen3%>">
			<INPUT type="hidden" name="thirdBreakStartDateTime" value="<%=bzq.utils.BaseConvert.dateToString(((BreakBean)shiftBreaks.get(2)).getStartTime(), "dd/MM/yyyy HH:mm")%>">
			<%} %>
			
			<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
				<TR>
					<TD colspan="2" valign="top" style="padding:0px 6px 6px 6px;" height="100%">
						<FIELDSET dir="rtl" class="form"><legend> עדכון הפסקות</legend>
							<TABLE dir="rtl" >
							<%if (isManagedBreaks /* && isPilotAgent */ ) { %>
								<TR height="32px">
									<TD><SPAN style="color: black;">** ניהול הפסקות אוטומטי ** (מינימום לפני תחילת הפסקה <%=managedBreaksMin %> דק')</SPAN></TD>
								</TR>
								
							<%} %>
			
								<TR>
									<TD valign="top">
										<TABLE dir="rtl">
											<TR>
												<TD class="header">מספר ההפסקות:</TD>
												<TD width="10px"></TD>
												<TD align="right">
													<select style="height:18px;font-size:10px;" name="breaksNumber" onchange="changeBreaksNumber(breakForm);">
														<%if(!(break1Returned || break2Returned || break3Returned)){ %>
														<option value="0" <%if(shiftBreaks.size()==0){%> selected="selected" <%}%> >ללא</option>
														<%}if(!break2Returned){ %>
														<option value="1" <%if(shiftBreaks.size()==1){%> selected="selected" <%}%> >1</option>
														<%}if(!break3Returned){ %>
														<option value="2" <%if(shiftBreaks.size()==2){%> selected="selected" <%}%> >2</option>
														<%}%>
														<option value="3" <%if(shiftBreaks.size()==3){%> selected="selected" <%}%> >3</option>
														
													</select>
												</TD>
											</TR>
										</TABLE>
									</TD>
								</TR>
								<TR>
									<TD width="100%" style="padding-top:20px;">   
										<TABLE dir="rtl">
											<TR id="break1" <%if(shiftBreaks.size()<1){%>style="display=none;" <%}%>><TD class="header">הפסקה ראשונה:</TD><TD><shf:timechooser disabled="<%=break1Returned || break1managedBreaksDisabled%>" inputname="firstBreakTime" inputvalue="<%=breakTime1%>"/></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input  type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;<%=(break1Returned || break1managedBreaksDisabled)?"color:gray;":""%>" <%=(break1Returned || break1managedBreaksDisabled)?"readonly=\"readonly\"":"" %> name="firstBreakLength" value="<%=breakLen1%>"></TD><TD><input type="hidden" name="firstBreakEnded" value="<%=break1Returned?"1":"0"%>"/></TD> </TR>
											<TR id="break2" <%if(shiftBreaks.size()<2){%>style="display=none;" <%}%>><TD class="header">הפסקה שנייה:</TD><TD><shf:timechooser  disabled="<%=break2Returned || break2managedBreaksDisabled%>" inputname="secondBreakTime" inputvalue="<%=breakTime2%>"/></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;<%=(break2Returned || break2managedBreaksDisabled)?"color:gray;":""%>" <%=(break2Returned || break2managedBreaksDisabled)?"readonly=\"readonly\"":"" %> name="secondBreakLength" value="<%=breakLen2%>"></TD><TD><input type="hidden" name="secondBreakEnded" value="<%=break2Returned?"1":"0"%>"/></TD></TR>
											<TR id="break3" <%if(shiftBreaks.size()<3){%>style="display=none;" <%}%>><TD class="header">הפסקה שלישית:</TD><TD><shf:timechooser disabled="<%=break3Returned || break3managedBreaksDisabled%>" inputname="thirdBreakTime" inputvalue="<%=breakTime3%>"/></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;<%=(break3Returned || break3managedBreaksDisabled)?"color:gray;":""%>" <%=(break3Returned || break3managedBreaksDisabled)?"readonly=\"readonly\"":"" %> name="thirdBreakLength" value="<%=breakLen3%>"></TD><TD><input type="hidden" name="thirdBreakEnded" value="<%=break3Returned?"1":"0"%>"/></TD></TR>
										</TABLE>
									</TD>
								</TR>
								<TR>
									<TD width="100%" style="padding-top:20px;">
										<INPUT type="submit" value="עדכן" class="button" onclick="breakUpdate(); this.disabled=true;">
									</TD>
								</TR>	
							</TABLE>
						</FIELDSET>
					</TD>
				</TR>
			</TABLE>
			</FORM>
		</TD>
	</TR>
	</shf:security>
	
	
	<TR><TD height="100%" valign="top"></TD></TR>
</TABLE>
<%	} else { %>
</HEAD>

<script type="text/javascript">
function onPageLoad() {
	var num = <%=conflicting_exceps.size() %>;
	if ( confirm("נמצאו פעילויות המתנגשות עם עידכון המשמרת\n ? האם ברצונך לבטל אותן ולשמור את השינויים") ) {
		document.forms['shiftsUpdateExceptions'].submit();
	} else {
		document.location="/shf/shift/shiftMenu.do";
	}
}
</script>
<body onload="onPageLoad()">

<FORM name="shiftsUpdateExceptions" method="post" action="/shf/shift/updateShiftExceptions.do">
		<INPUT type="hidden" name="shiftDayId" value="<%=shiftForm.getAgentDayId()%>">  
		<INPUT type="hidden" name="reason_id" value="<%=reason_id%>">
		<INPUT type="hidden" name="del_exceps_confirmed" value="true">
</FORM>
<% }%>


</BODY>
</html:html>
