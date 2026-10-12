<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="attendanceForm"
	class="bzq.shf.forms.EmployeeArriveForm" 
	scope="request"></jsp:useBean>
	

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>

<HTML>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector,bzq.shf.bean.BreakBean,bzq.utils.BaseConvert"
%>
<%@ page
import="bzq.shf.utils.SHFConstants"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>employee_arrive.jsp</TITLE>
<SCRIPT language="JavaScript" src="/shf/js/agentAttendance.js"></SCRIPT>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY dir="rtl">
<TABLE width="100%" cellpadding="0" cellspacing="0" >
	<TR>
	<TD valign="top" style="height:20px;"><jsp:include page="submenu/emptySubmenu.jsp"></jsp:include> </TD>
	</TR>

	<TR>
		<TD valign="top" height="100%" width="100%" style="padding:5px 5px 5px 5px;">
			<FIELDSET class="form"><legend> שלום <bzq:string name="attendanceForm" property="firstName" /> <bzq:string name="attendanceForm" property="lastName" /></legend>

			
			<TABLE cellpadding="10px" width="100%" cellspacing="2" >
				<TBODY>
					
					<TR>

						<!--TD> <bzq:select name="" tablename=""></bzq:select></TD-->
						
						<TD rowspan="12" align="right" valign="top"><IMG
							src="http://pic.bezeq.com/bezeqpic/<%=attendanceForm.getEmpIdNumber()%>.JPG"
							style="background-color: #e3e3e3; border: 1px solid gray"
							width="140px"></TD>
					</TR>
					<TR>
					<TD >
					<TABLE width="100%">
						<TBODY>
						
							<TR>
								<TD nowrap="nowrap" >
								<p style="font-weight: bold">את/ה יוצא מהמשמרת מוקדם מהמותר, אנא מלא סיבת יציאה ושם מאשר</p>
								</TD>
							</TR>
							<TR>

								<TD>
								<form action="/shf/attendance/employeeEarlyExit.do" name="exitShiftForm" id="earlyExitId">
								<input type="hidden" name="employee_day_id" value="<bzq:integer name="attendanceForm" property="agentDayId" />">
								<input type="hidden" name="date" value="<bzq:date name="attendanceForm" property="shiftEnd" />">
								<input type="hidden" name="time" value="<bzq:time name="attendanceForm" property="shiftEnd" pattern="HH:mm" />">
								<INPUT type="hidden" name="employee_id" value="<%=attendanceForm.getEmployeeId()%>">
								<INPUT type="hidden" name="agentMood" value="<%=attendanceForm.getAgentMood()%>">
								
								<TABLE >
									<TBODY>
										<TR>
											<TD nowrap="nowrap" class="header" >סיבת יציאה מוקדמת:</TD>
											<TD nowrap="nowrap" width="20px"></TD>
											<TD><shf:eventselect tablename="eventReasonCode" name="reason" type="<%=SHFConstants.EARLY_EXIT%>" /></TD>
										</TR>
										<TR>
											<TD nowrap="nowrap" class="header" >שם מאשר:</TD>
											<TD nowrap="nowrap" width="20px"></TD>
											<TD>
												<SELECT name="manager">
													<% Vector appMan = attendanceForm.getApproveManager();
													for(int i=0; i<appMan.size(); i++ ) {%>
													<OPTION value="<%=(String)appMan.get(i)%>"><%=(String)appMan.get(i)%></OPTION>
													<%}%>
												</SELECT>
											</TD>
										</TR>
										<TR>
											<TD valign="top" class="header" >הערה:</TD>
											<TD></TD>
											<TD colspan="6"><textarea cols="40" rows="3" name="remark"></textarea></TD>
										</TR>
									</TBODY>
								</TABLE>
								</form>
								</TD>
														
							</TR>
							<TR>
								<TD colspan="4" style="padding-bottom: 10px">
								<p style="font-weight: bold"><u>פרטי יום העבודה הנוכחי :</u></p>
								</TD>
							</TR>
							<TR>
								<TD colspan="4">
									<table>
									<TR >
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
									</table>
								</TD>
							</TR>

						</TBODY>
						
					</TABLE>
					</TD>
				</TR>
				<TR>
					<TD colspan="2">
						<button onclick="earlyExitShift();" style="width:100px;" >אישור</button>
						&nbsp;
						<button onclick="javascript:history.go(-1)" style="width:100px;" >ביטול</button>
					</TD>
				</TR>
				</TBODY>
				</TABLE>
				</FIELDSET>	
			</TD>
		</TR>
</TABLE>



</BODY>
</HTML>
