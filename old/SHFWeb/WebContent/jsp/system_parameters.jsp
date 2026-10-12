<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ page import="bzq.shf.utils.SHFConstants"%>

<jsp:useBean id="adminForm" class="bzq.shf.forms.SystemAdminForm" scope="request"></jsp:useBean>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>
<script type="text/javascript" src="../dojo/dojo/dojo.js" djConfig="isDebug: false, parseOnLoad: true"></script>
	
<style type="text/css">
@import "../dojo/dojo/resources/dojo.css";
@import "../dojo/dijit/themes/nihilo/nihilo.css";
@import "../dojo/dijit/themes/dijit.css";
</style>

<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>system_parameters.jsp</TITLE>

<SCRIPT>
function saveParameters(){
	
	var cur = document.getElementById("mbmtbc");
	if (cur) {
		var min = parseInt(document.getElementById("hmbmtbc").value,10);
		cur = parseInt(cur.value,10);
		if(cur<min) {
			alert("'פרמטר 'מינימום זמן לפני שינוי הפסקה אוטומטית\n לא יכול להיות פחות מ "+<%=SHFConstants.SHF_SP_MIN_TIME_BEFORE_BREAK_UPDATE%>);
			return false;
		}
	}
	
	var poolTimeBeforeShiftStart = document.getElementsByName("poolTimeBeforeShiftStart")[0].value;
	var poolTimeAfterShiftEnd = document.getElementsByName("poolTimeAfterShiftEnd")[0].value;
	var poolTimeNoArrival = document.getElementsByName("poolTimeNoArrival")[0].value;
	
	if(poolTimeBeforeShiftStart < 10 || poolTimeAfterShiftEnd < 10 || poolTimeNoArrival < 10){
		alert("ערך מינימלי בשדות ניהול שלוחות הינו 10");
		return false;
	}
	
	document.parametersForm.action="/shf/admin/saveParameters.do";
	document.parametersForm.submit();

}
</SCRIPT>

<script type="text/javascript">
dojo.require("dojo.parser");
dojo.require("dijit.layout.AccordionPane");
dojo.require("dijit.layout.AccordionContainer");

function showParameters(){
	document.parametersForm.submit();
}
</script>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%
String moked=adminForm.getMoked();
String agaf=adminForm.getAgaf();
%>
<BODY class=nihilo>

<TABLE dir=rtl cellpadding="0" cellspacing="0" width=100% height="100%">

	<TR>
	<TD valign="top"><jsp:include page="submenu/admin_submenu.jsp" /></TD>
	</TR>
	
	
	<TR>
	<TD valign="top" height="100%" width=100% style="padding:8px 8px 8px 8px;">
		<form name="parametersForm" action="/shf/admin/viewMokedParameters.do" method="post">
		
		<TABLE height=100% width="100%">
			<TR>
				<TD width=100%>
					<FIELDSET class=form><legend>ניהול פרמטרי מערכת</legend>
					<TABLE>
					<TR>
					<TD class="header">אגף:</TD>
					<TD class="data">
					
					<shf:unitselect tablename="unitCode"
						name="agaf" style="width:170px;font-size:10px;" selectedName="adminForm" selectedProperty="agaf"
						type="<%=SHFConstants.AGAF_UNIT%>" all="yes"
						logic="onchange=showParameters();"/></TD>
						 
					<TD width="20px"></TD>
					
					<%if(agaf!=null){%>
					<TD class=header>מוקד:</TD>
					<TD width="10px"></TD>
					<TD>
					
						<shf:unitselect tablename="unitCode" name="moked" selectedName="adminForm" selectedProperty="moked"
						style="width:170px;font-size:10px;" type="G01" all="yes" parentunit="<%=agaf%>" logic="onchange=showParameters();"/>
					
					</TD>
					<%}%>
					<TD width="20px"></TD>
					<!-- TD><button onclick="showParameters();">הצג פרמטרים</button></TD>
					<TD width="20px"></TD -->
					<%if((moked!=null && !moked.equals("-1")) || (agaf!=null && !agaf.equals("-1"))){%>
					<TD><button onclick="saveParameters();">שמירה</button></TD>
					<%}%>
					</TR>
					</TABLE>
					</FIELDSET>
				</TD>
			</TR>
			<TR>
				<TD valign="top" height=100% width=100%>
					<%if(moked!=null && !moked.equals("-1")){ %>
<br>
				<div dojotype="dijit.layout.AccordionContainer"id="AccordionContainer" style="height:90%;" >
				
				<div dojotype="dijit.layout.AccordionPane" id="shiftsParamPane" title="פרמטרים למשמרות">
					<Table>
						<TBODY>
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinHoursBetweenShifts(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minHoursBetweenShifts" value="<%=adminForm.getMinHoursBetweenShifts()%>" style="width:30px;" maxlength="2"></TD>
							</TR>
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinimalShiftDuration(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minimalShiftDuration" value="<%=adminForm.getMinimalShiftDuration()%>" style="width:40px;" maxlength="4"></TD>
							</TR>
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinimalShiftDurationForCR(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minimalShiftDurationForCR" value="<%=adminForm.getMinimalShiftDurationForCR()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMaximalShiftDuration(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="maximalShiftDurationForCR" value="<%=adminForm.getMaximalShiftDurationForCR()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinHoursBeforeSwitchBreak(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minHoursBeforeSwitchBreak" value="<%=adminForm.getMinHoursBeforeSwitchBreak()%>" style="width:30px;" maxlength="3"></TD>
							</TR>	
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinutesBeforeReduceRequest(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minBeforeReduceRequest" value="<%=adminForm.getMinBeforeReduceRequest()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinutesBeforeChangeRequest(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minBeforeChangeRequest" value="<%=adminForm.getMinBeforeChangeRequest()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinimumTimeFromLastSHift(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minTimeFromLastShift" value="<%=adminForm.getMinTimeFromLastShift()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinimumTimeFromNextSHift(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minTimeFromNextShift" value="<%=adminForm.getMinTimeFromNextShift()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
						</TBODY>	
					</Table>
						
				</div>
				
				<div dojotype="dijit.layout.AccordionPane" id="attendanceParamPane" title="פרמטרים לנוכחות">
					<Table>
						<TBODY>
							<TR>
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinutesBeforeLateParam(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minutesBeforeLate" value="<%=adminForm.getMinutesBeforeLate()%>" style="width:30px;" maxlength="2"></TD>
							</TR>
							<TR>
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getLockEmployeesParam(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><shf:checkbox inputname="lockEmployees" checked="<%=adminForm.isLockEmployees()?1:0%>" /></TD>
							</TR>
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMissingNumParam(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="lockMissingNum" value="<%=adminForm.getLockMissingNum()%>" style="width:30px;" maxlength="2"></TD>
							</TR>
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMaxMinutesToExitAfterEnd(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="maxMinutesToExitAfterEnd" value="<%=adminForm.getMaxMinutesToExitAfterEnd()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
								
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMaxToExitBeforEndShift(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="maxToExitBeforEndShift" value="<%=adminForm.getMaxToExitBeforEndShift()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
						</TBODY>	
					</Table>
				</div>
				
				<div dojotype="dijit.layout.AccordionPane" id="eventsParamPane" title="פרמטרים לאירועים חריגים">
					<Table>
						<TBODY>						
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinimalBreakLate(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minimalBreakLate" value="<%=adminForm.getMinimalBreakLate()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
							
							<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinimalBreakShifting(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="minimalBreakShifting" value="<%=adminForm.getMinimalBreakShifting()%>" style="width:30px;" maxlength="3"></TD>
							</TR>
						</TBODY>	
					</Table>
				</div>
				
				<div dojotype="dijit.layout.AccordionPane" id="breaksParamPane" title="פרמטרים להפסקות">
				<Table>
						<TBODY>
						<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getManagedBreakEnabled(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><shf:checkbox inputname="managedBreakEnabled" checked="<%=adminForm.isManagedBreakEnabled()?1:0%>" /></TD>
						</TR>
						</TBODY>
				</Table>				
				</div>
				
				<div dojotype="dijit.layout.AccordionPane" id="extPoolParamPane" title="ניהול שלוחות">
				<table>
						<TBODY>
						<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getPoolEnabled(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><shf:checkbox inputname="poolEnabled" checked="<%=adminForm.isPoolEnabled()?1:0%>" /></TD>
						</TR>
						<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getPoolExtAllocateTimeBeforeShiftStart(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="poolTimeBeforeShiftStart" value="<%=adminForm.getPoolTimeBeforeShiftStart()%>" style="width:30px;" maxlength="3"></TD>
						</TR>
						<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getPoolExtReturnTimeAfterShiftEnd(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="poolTimeAfterShiftEnd" value="<%=adminForm.getPoolTimeAfterShiftEnd()%>" style="width:30px;" maxlength="3"></TD>
						</TR>
						<TR> 
							<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getPoolExtReturnTimeNoArrival(moked).getDescription()%></TD><TD></TD>
							<TD width="10px"></TD>
							<TD><input type=text dir="ltr" name="poolTimeNoArrival" value="<%=adminForm.getPoolTimeNoArrival()%>" style="width:30px;" maxlength="3"></TD>
						</TR>
						</TBODY>
				</table>				
				</div>
				
				</div>
						
					<%}else if(agaf!=null && !agaf.equals("-1")){%>
					
						<Table>
							<TBODY>
								<TR> 
									<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMinHoursBeforeSwitch(agaf).getDescription()%></TD><TD></TD>
									<TD width="10px"></TD>
									<TD><input type=text dir="ltr" name="minHoursBeforeSwitch" value="<%=adminForm.getMinHoursBeforeSwitch()%>" style="width:30px;" maxlength="2"></TD>
								</TR>
								<TR> 
									<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMaxDifferenceForSwitch(agaf).getDescription()%></TD><TD></TD>
									<TD width="10px"></TD>
									<TD><input type=text dir="ltr" name="maxDifferenceForSwitch" value="<%=adminForm.getMaxDifferenceForSwitch()%>" style="width:30px;" maxlength="3"></TD>
								</TR>
								<TR> 
									<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getMaximumSelectForSwitchOffer(agaf).getDescription()%></TD><TD></TD>
									<TD width="10px"></TD>
									<TD><input type=text dir="ltr" name="maxSelectForSwitchOffer" value="<%=adminForm.getMaxSelectForSwitchOffer()%>" style="width:30px;" maxlength="2"></TD>
								</TR>
								<TR>
									<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getAgafSendSwitchOfferSMS(agaf).getDescription()%></TD><TD></TD>
									<TD width="10px"></TD>
									<%-- <TD><shf:checkbox inputname="agafSendSwitchOfferSMS" checked="<%=( adminForm.getAgafSendSwitchOfferSMS() == null ? 0 : Integer.parseInt(adminForm.getAgafSendSwitchOfferSMS()) )%>" /></TD> --%>
									<TD><shf:checkbox inputname="agafSendSwitchOfferSMS" checked="<%=adminForm.isAgafSendSwitchOfferSMS()?1:0%>" /></TD>
								</TR>
								<TR>
									<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getManagedBreakMinTimeBeforeChange(agaf).getDescription()+" (בדקות, לא פחות מ "+SHFConstants.SHF_SP_MIN_TIME_BEFORE_BREAK_UPDATE+")"%></TD><TD></TD>
									<TD width="10px"></TD>
									<TD><input id="mbmtbc" type=text dir="ltr" name="managedBreakMinTimeBeforeChange" value="<%=adminForm.getManagedBreakMinTimeBeforeChange()%>" style="width:30px;" maxlength="3"></TD>
								</TR>
								<TR>
									<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getIwdMinAfterShiftStart(agaf).getDescription()%></TD><TD></TD>
									<TD width="10px"></TD>
									<TD><input id="mbmtbc" type=text dir="ltr" name="iwdMinAfterShiftStart" value="<%=adminForm.getIwdMinAfterShiftStart()%>" style="width:30px;" maxlength="3"></TD>
								</TR>
								<TR>
									<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getIwdMinBeforeShiftEnd(agaf).getDescription()%></TD><TD></TD>
									<TD width="10px"></TD>
									<TD><input id="mbmtbc" type=text dir="ltr" name="iwdMinBeforeShiftEnd" value="<%=adminForm.getIwdMinBeforeShiftEnd()%>" style="width:30px;" maxlength="3"></TD>
								</TR>
								<TR>
									<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getIwdDefaultTimeToComplete(agaf).getDescription()%></TD><TD></TD>
									<TD width="10px"></TD>
									<TD><input id="mbmtbc" type=text dir="ltr" name="iwdDefaultTimeToComplete" value="<%=adminForm.getIwdDefaultTimeToComplete()%>" style="width:30px;" maxlength="3"></TD>
								</TR>
								<TR>
									<TD><img src="/shf/images/drop.png"></TD><TD width="5px"></TD><TD><%=bzq.shf.utils.SHFParameters.getIwdRescheduleOnAgentBreak(agaf).getDescription()%></TD><TD></TD>
									<TD width="10px"></TD>
									<%-- <TD><shf:checkbox inputname="agafSendSwitchOfferSMS" checked="<%=( adminForm.getAgafSendSwitchOfferSMS() == null ? 0 : Integer.parseInt(adminForm.getAgafSendSwitchOfferSMS()) )%>" /></TD> --%>
									<TD><shf:checkbox inputname="iwdRescheduleOnAgentBreak" checked="<%=adminForm.isIwdRescheduleOnAgentBreak()?1:0%>" /></TD>
								</TR>
							</TBODY>
						</Table>
					
					<%} %>
				</TD>
			</TR>
			
		</TABLE>
	
		</form>
	</TD>
	</TR>
</TABLE>
<%if(agaf!=null && !agaf.equals("-1")){ %>
<input id="hmbmtbc" type="hidden" value="<%=SHFConstants.SHF_SP_MIN_TIME_BEFORE_BREAK_UPDATE%>" />
<%} %>
</BODY>
</HTML>
