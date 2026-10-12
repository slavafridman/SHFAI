<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@page import="bzq.shf.utils.SHFTableUtils"%>
<jsp:useBean id="attendanceForm"
	class="bzq.shf.forms.EmployeeArriveForm" 
	scope="request"></jsp:useBean>
	
<jsp:useBean id="agentDayBreaks"
	class="java.util.Vector" 
	scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>

<%@ page import="bzq.shf.utils.SHFConstants"%>

<HTML>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.bean.BreakBean,bzq.utils.BaseConvert"

%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
 
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>employee_arrive.jsp</TITLE>
<SCRIPT language="JavaScript" src="/shf/js/agentAttendance.js"></SCRIPT>
<script type="text/javascript">
function submitEntry(i) {
	document.forms['entryShiftForm'].agentMood.value = i;
	document.forms['entryShiftForm'].action="/shf/attendance/employeeArriveStation.do";
	document.forms['entryShiftForm'].target=""; 
    document.forms['entryShiftForm'].submit();
} 



function submitExit(i, maxInactive, lastAccess) {
	document.forms['exitShiftForm'].agentMood.value = i;
	exitShift(maxInactive,lastAccess);
} 

</script>
<shf:reloadErrors></shf:reloadErrors>


</HEAD>
<%
String divCode = null;
if (attendanceForm.getOrgUnitCode() != null) {
	divCode = SHFTableUtils.getBusinessDivCodeOf(attendanceForm.getOrgUnitCode());
}
boolean isBusiness = true;
if (divCode != null) {
	if (divCode.equals("00100975")) {
		isBusiness = true;
	} else {
		isBusiness = false;
	}
}
int maxInactive=session.getMaxInactiveInterval();
long lastAccess=session.getLastAccessedTime();
boolean isManagedBreaks = Boolean.parseBoolean(bzq.shf.utils.SHFParameters.getManagedBreakEnabled(SHFTableUtils.getMokedCodeOf(attendanceForm.getOrgUnitCode())).getValue());
//boolean isPilotAgent = SHFConstants.managedBreaksEmpList.contains(attendanceForm.getEmpIdNumber());
//System.out.println("isManagedBreaks : "+isManagedBreaks);
//System.out.println("isPilotAgent : "+isPilotAgent);
%>
<BODY dir="rtl">
<TABLE width="100%" cellpadding="0" cellspacing="0">
	<TR>
	<TD valign="top" style="height: 20px;"><jsp:include page="submenu/emptySubmenu.jsp"></jsp:include> </TD>
	</TR>

	<TR>
		<TD valign="top" height="100%" width="100%" style="padding: 5px 5px 5px 5px;">
			<FIELDSET class="form"><legend> שלום <bzq:string name="attendanceForm" property="firstName" /> <bzq:string name="attendanceForm" property="lastName" /></legend>

			
			<TABLE cellpadding="10px" width="100%" cellspacing="5">
					<TR>
						<TD></TD>
						<TD rowspan="12" align="left" valign="top"><IMG
							src="http://pic.bezeq.com/bezeqpic/<%=attendanceForm.getEmpIdNumber()%>.JPG"
							style="background-color: #e3e3e3; border: 1px solid gray"
							width="140px"></TD>
					</TR>
					<logic:greaterThan value="0" name="attendanceForm" property="agentDayId" scope="request">

					<TR>
					<TD width="100%">
					<TABLE width="100%">
						<TBODY>
							<TR>
								<TD colspan="4" style="padding-bottom: 10px">
								<p style="font-weight: bold"><u>פרטי יום העבודה הנוכחי :</u></p>
								</TD>
							</TR>

							<TR>
								<TD nowrap="nowrap" class="header">תאריך:</TD>
								<TD nowrap="nowrap" width="20px"></TD>
								<TD nowrap="nowrap" class="data"><bzq:date name="attendanceForm" property="date"
									pattern="dd/MM/yyyy" /></TD>
								<TD width="100%"></TD>
							</TR>
							<TR>
								<TD nowrap="nowrap" class="header">שעת התחלה:</TD>
								<TD nowrap="nowrap" width="20px"></TD>
								<TD nowrap="nowrap" class="data"><bzq:time name="attendanceForm"
									property="shiftStart" pattern="HH:mm" /></TD>
									<TD width="100%"></TD>
							</TR>
							<TR>
								<TD nowrap="nowrap" class="header">שעת סיום:</TD>
								<TD nowrap="nowrap" width="20px"></TD>
								<TD nowrap="nowrap" class="data"><bzq:time name="attendanceForm"
									property="shiftEnd" pattern="HH:mm" /></TD>
									<TD width="100%"></TD>
							</TR>

							<TR>
								<TD nowrap="nowrap" class="header">תור:</TD>
								<TD nowrap="nowrap" width="20px"></TD>
								<TD nowrap="nowrap" class="data"><%=bzq.shf.utils.SHFTableUtils.getActivityName(attendanceForm.getShiftActivity())%></TD>
								<TD width="100%"></TD>
							</TR>

							<TR>
								<TD height="10px"></TD>
							</TR>
							
							
							<!-- ============ הפסקות ============= -->
								<%if(attendanceForm.getStationArrivalTime()!=null && attendanceForm.getStationExitTime()==null){ %>
								
								<TR>
									<TD height="10px" width="100%" colspan="4">
										<%if(agentDayBreaks!=null){%>
											<TABLE dir="rtl" width="100%" cellpadding="2" cellspacing="1">
												<TR>
												<TD colspan="3" style="padding-bottom: 10px">
												<p style="font-weight: bold"><u>הפסקות<%=isManagedBreaks  /* && isPilotAgent */  ? " (אוטומטיות) " : "" %>:</u></p>
												</TD>
												</TR>

												<%
												for(int i=0;i<agentDayBreaks.size();i++){
												BreakBean breakInfo=(BreakBean)agentDayBreaks.get(i);
												%>
												<TR>
													<TD>הפסקה מס' <%=i+1%>:</TD>
													<TD><shf:shftime date="<%=breakInfo.getStartTime()%>"/> - <shf:shftime date="<%=breakInfo.getEndTime()%>"/></TD><TD></TD>
													<%if(breakInfo.getExitTime()==null){%>
													<TD valign="middle">
														<form name="exitToBreakForm<%=i%>" action="/shf/break/exitToBreak.do" >
															<input type="hidden" name="agentDayId" value="<%=breakInfo.getAgentDayId()%>">
															<input type="hidden" name="startTime" value='<%=bzq.utils.BaseConvert.dateToString(breakInfo.getStartTime(),"dd/MM/yyyy HH:mm")%>'>
														</form>
														<% if( ! isManagedBreaks  /* || ! isPilotAgent */ ){ %>
															<button onclick="exitToBreak(<%=i%>,<%=maxInactive%>,<%=lastAccess%>);" style="width: 90px;">יציאה להפסקה</button>
														<%} %>
													<%}else{%>
													<TD>
														יצאת ב: <shf:shftime date="<%=breakInfo.getExitTime()%>"/>
														
													</TD>
													<%}%>
													<TD>
													<%if(breakInfo.getExitTime()!=null && breakInfo.getEntryTime()==null){ %>
													
														<form name="backFromBreakForm<%=i%>" action="/shf/break/backFromBreak.do" style="display: none;">
															<input type="hidden" name="agentDayId" value="<%=breakInfo.getAgentDayId()%>">
															<input type="hidden" name="startTime" value='<%=BaseConvert.dateToString(breakInfo.getStartTime(),"dd/MM/yyyy HH:mm")%>'>
															<input type="hidden" name="endTime" value='<%=BaseConvert.dateToString(breakInfo.getEndTime(),"dd/MM/yyyy HH:mm")%>'>
															<input type="hidden" name="exitTime" value='<%=BaseConvert.dateToString(breakInfo.getExitTime(),"dd/MM/yyyy HH:mm")%>'>
															<input type="hidden" name="employeeId" value="<%=attendanceForm.getEmployeeId()%>">
															<input type="hidden" name="orgUnitId" value="<%=attendanceForm.getOrgUnitCode() %>">  
														</form>
														<% if( ! isManagedBreaks /* || ! isPilotAgent */ ){ %>
															<button id="btBackFromBreak<%=i%>" onclick="backFromBreak(<%=i%>,<%=maxInactive%>,<%=lastAccess%>);" style="width: 90px;">חזרתי</button>
														<%} %>
													<%}else if(breakInfo.getEntryTime()!=null){ %>
														חזרת ב: <shf:shftime date="<%=breakInfo.getEntryTime()%>"/>
													<%}%>
													</TD>
												</TR>
												<%}%>
											</TABLE>
										<%}%>
									</TD>
								</TR>
								<%} %>
						</TBODY>
					</TABLE>
					</TD>
				</TR>
				<%if(attendanceForm.getMissingReasonId()>0){%>
				<TR>
				<TD style="color: #6666cc; font-weight: bold;">סומן לך חיסור, נא לברר מול האחראי משמרת לביטול החיסור</TD>
				</TR>
				<%
				}
				if(attendanceForm.getStationArrivalTime()==null){%>
					
				<TR>
				  
				<% if (isBusiness) { //if busniss unit %>
					<TD style="font-weight: bold; color: #cc4444">לחץ על הכפתור הנ"ל
					כדי לסמן התחלת משמרת
					<%} %>
				<% if (!isBusiness) { //if not busniss unit%>
					<TD style="font-weight: bold; color: #cc4444">מה שלומך היום?
					<%} %>
					<FORM action="/shf/attendance/employeeArriveStation.do" name="entryShiftForm">
						<input type="hidden" name="agentDayId" value='<bzq:integer name="attendanceForm" property="agentDayId" />'>
						<input type="hidden" name="agentMood" >
						<% if (divCode.equalsIgnoreCase("00100975") || (divCode == null)) { //if busniss unit %>
						<input type="submit" class="button" value="כניסה למשמרת" style="width: 90px;">
						<%} %>
					</FORM>
					</TD>
				</TR>
				<% if (!isBusiness) { //if not busniss unit%>
				<TR>
					<td>
						<table>
							<tr>
								<td>
								<img src="../images/smile-4.png" onclick="submitEntry(4)" style="cursor:hand" > 
								</td>
								<TD nowrap="nowrap" width="20px"></TD>
								<td>
								<img src="../images/smile-3.png" onclick="submitEntry(3)" style="cursor:hand" >
								</td> 
								<TD nowrap="nowrap" width="20px"></TD>
								<td>
								<img src="../images/smile-2.png" onclick="submitEntry(2)" style="cursor:hand" >
								</td>
								<TD nowrap="nowrap" width="20px"></TD>
								<td> 
								<img src="../images/smile-1.png" onclick="submitEntry(1)" style="cursor:hand" > 
								</td>
							</tr>
						</table>
					</td>
				</TR>
					<%} %>
				<%}else if(attendanceForm.getStationExitTime()==null){%>
				
					
				<TR>
					<TD>
					נרשמת למשמרת בשעה <bzq:time name="attendanceForm" property="stationArrivalTime" pattern="HH:mm" />
					<br>
					נרשמת ע"י המשתמש <bzq:string name="attendanceForm" property="stationArrivalUser" />
					</TD>
				</TR>
					
				<TR>
					<% if (!isBusiness) { //if not busniss unit%>
					<TD style="font-weight: bold; color: #cc4444">איך עברה המשמרת?
					<%} %>
					<TD>
					<% //Date currentDate = new Date();
					//if ( attendanceForm.getShiftEnd().getTime() > currentDate.getTime() ) {%>    
					<!--button onclick="exitShift('<%//=attendanceForm.getShiftEnd().getTime()%>');" style="width:140px;" >יציאה מהמשמרת</button>
					<%//}%>
					<form action="/shf/attendance/viewEarlyExit.do" name="earlyExitShiftForm">
						<input type="hidden" name="agentDayId" value="<bzq:integer name="attendanceForm" property="agentDayId" />">
					</form-->					
					<form action="/shf/attendance/employeeStationExit.do" name="exitShiftForm">
						<input type="hidden" name="agentDayId" value='<bzq:integer name="attendanceForm" property="agentDayId" />'>
						<input type="hidden" name="agentMood" >
						<% if (isBusiness) { //if busniss unit %>
						<button onclick="exitShift(<%=maxInactive%>,<%=lastAccess%>);" style="width:140px;" >יציאה מהמשמרת</button>
						<%} %>
					</form>
					</TD>
				</TR>
				<% if (!isBusiness) { //if not busniss unit%>
				
				<TR>
				<td>
					<table>
						<tr>
							<td>
							<img src="../images/smile-4.png" onclick="submitExit(4, <%=maxInactive%>,<%=lastAccess%>)" style="cursor:hand" > 
							</td>
							<TD nowrap="nowrap" width="20px"></TD>
							<td>
							<img src="../images/smile-3.png" onclick="submitExit(3, <%=maxInactive%>,<%=lastAccess%>)" style="cursor:hand" >
							</td>
							<TD nowrap="nowrap" width="20px"></TD>
							<td> 
							<img src="../images/smile-2.png" onclick="submitExit(2, <%=maxInactive%>,<%=lastAccess%>)" style="cursor:hand">
							</td>
							<TD nowrap="nowrap" width="20px"></TD>
							<td> 
							<img src="../images/smile-1.png" onclick="submitExit(1, <%=maxInactive%>,<%=lastAccess%>)" style="cursor:hand"> 
							</td>						
						</tr>
					</table>
				</td>
				</TR>
					<%} %>
				<%}else{%>
				<TR>
					<TD>ביצעת יציאה מהמשמרת בשעה <shf:shftime date="<%=attendanceForm.getStationExitTime()%>"/> </TD>
				</TR>
				<%}%>

				</logic:greaterThan>
				
				<logic:lessEqual value="0" name="attendanceForm" property="agentDayId" scope="request">
				<TR>
					<TD>
					<p style="text-align: center; font-size: 22pt; color: #bababa; font-family: Arial">
					לא נמצאה משמרת שמתחילה בשעה הקרובה</p>
					</TD>
				</TR>
				</logic:lessEqual>
				
				</TABLE>
				</FIELDSET>	
			</TD>
		</TR>
</TABLE>



</BODY>
</HTML>
