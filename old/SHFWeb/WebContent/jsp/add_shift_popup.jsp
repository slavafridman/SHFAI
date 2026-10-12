<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>

<jsp:useBean id="addShiftForm"
	class="bzq.shf.forms.AddShiftForm" 
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>

<html>
<head>


<link rel="stylesheet" href="../theme/Master.css" type="text/css">

<title>add_shift_dialog</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">


</head>

<BODY style="height:100%;width:100%">
<div  style="width:100%;visibility:visible;height:100%;">
<form name=addShiftForm action="/shf/shift/add.do" style="height:0px;">
	
<html:hidden property="employeeId" name="addShiftForm"></html:hidden>
<html:hidden property="moked" name="addShiftForm"></html:hidden>
<html:hidden property="idNumber" name="addShiftForm"></html:hidden>

<table style="height:100%; width: 100%; background-color: transparent;">
	<TR>
		<TD width="100%" height="100%" valign="top">

		<table width="100%" height="100%">
			<tr>
				<td valign="top" height="100%" width="100%">
				<fieldset style="margin-left:200px;margin-top:150px;position:absolute; width: 500px; direction:rtl; background-color:#eeeeee;">
				<legend><img src="/shf/images/close_window.gif"
					style="cursor: hand" alt="סגור"
					onclick="clear_popup('popupDiv');"> הוספת משמרת</legend>


				<div style="padding:10px;">
				<table cellpadding="1" cellspacing="3">
					
					<tr>
						<td class=header>תאריך:</td>
						<td><shf:calendar calname="date" name="addShiftForm" property="date" marginBottom="-130" /> </td>
						<td width=10px></td>
					</tr>
					<tr>
						<td class=header>שעת התחלה:</td>
						<td><shf:timechooser inputname="shiftStart" name="addShiftForm" property="shiftStart"/> </td>
						<td width=10px></td>
						<td class=header>שעת סיום:</td>
						<td><shf:timechooser inputname="shiftEnd" name="addShiftForm" property="shiftEnd"/> </td>
					</tr>
					<tr>
						<td class=header>פיצול:</td>
						<td><input type="checkbox" onclick="updateSplitShift();"><input id="shiftSplitInput" type="hidden" name="shiftSplit" value="false"></td>
					</tr>
					<tr id="shiftSplitTime" style="visibility: hidden;">
						<td class=header>תחילת פיצול:</td>
						<td><shf:timechooser inputname="shiftSplitStart" name="addShiftForm" property="shiftStart" /> </td>
						<td width=10px></td>
						<td class=header>סיום:</td>
						<td><shf:timechooser inputname="shiftSplitEnd" name="addShiftForm" property="shiftEnd" /> </td>
					</tr>
					<tr>
						<td class=header>תור:</td>
						<td colspan=3><shf:activityselect tablename="activityCode" moked="<%=addShiftForm.getMoked()%>" name="activity" style="font-size:12px;width:140px;" /> </td>
					</tr>
					<tr>
						<td class=header>מיקום:</td>
						<td colspan=3><shf:shiftLocationSelectTag name="shiftLocation" selectedvalue="site" /> </td>
					</tr>
					<tr>
						<td class=header valign="top">הערה:</td>
						<td colspan=6><html:textarea property="remark" name="addShiftForm" cols="30" rows="4" ></html:textarea> </td>
					</tr>
					<tr>
						<td colspan=7 width=100%><hr></td>
					</tr>
					<tr>
						<td colspan=7>
							<TABLE dir="rtl" >			
								<TR>
									<TD valign="top">
										<TABLE dir="rtl">
											<TR>
												<TD class="header">מספר ההפסקות:</TD>
												<TD width="10px"></TD>
												<TD align="right">
													<select style="height:18px;font-size:10px;" name="breaksNumber" onchange="changeNumOfBreaks();">
														<option value="0" >ללא</option>
														<option value="1" selected="selected">1</option>
														<option value="2" >2</option>
														<option value="3" >3</option>
													</select>
												</TD>
											</TR>
										</TABLE>
									</TD>
								</TR>
								<TR>
									<TD width="100%" style="padding-top:5px;">
										<TABLE dir="rtl">
											<TR id="break1" <%if(addShiftForm.getBreakStart().length<1){%>style="display=none;" <%}%>><TD class="header">הפסקה ראשונה:</TD><TD><shf:timechooser inputname="breakStart" inputid="0" inputvalue="<%=addShiftForm.getBreakStart()[0]%>"/></TD><TD width="10px"></TD><TD class="header">עד</TD><TD><shf:timechooser inputname="breakEnd" inputid="0" inputvalue="<%=addShiftForm.getBreakEnd()[0]%>"/></TD></TR>
											<TR id="break2" <%if(addShiftForm.getBreakStart().length<2){%>style="display=none;" <%}%>><TD class="header">הפסקה שנייה:</TD><TD><shf:timechooser inputname="breakStart" inputid="1" inputvalue="<%=addShiftForm.getBreakStart()[0]%>"/></TD><TD width="10px"></TD><TD class="header">עד</TD><TD><shf:timechooser inputname="breakEnd" inputid="1" inputvalue="<%=addShiftForm.getBreakEnd()[0]%>"/></TD></TR>
											<TR id="break3" <%if(addShiftForm.getBreakStart().length<3){%>style="display=none;" <%}%>><TD class="header">הפסקה שלישית:</TD><TD><shf:timechooser inputname="breakStart" inputid="2" inputvalue="<%=addShiftForm.getBreakStart()[0]%>"/></TD><TD width="10px"></TD><TD class="header">עד</TD><TD><shf:timechooser inputname="breakEnd" inputid="2" inputvalue="<%=addShiftForm.getBreakEnd()[0]%>"/></TD></TR>
										</TABLE>
									</TD>
								</TR>
								
							</TABLE>
						</td>
					</tr>
					<tr>
					<td height="10px"></td>
					</tr>
					<tr>
						<td colspan=6>
						<button id="cancelAddShift" onclick="clear_popup('popupDiv');">ביטול</button>
						&nbsp;
						<button onclick="this.disabled=true; document.getElementById('cancelAddShift').disabled=true; cofirmAddShift();">שמור</button>
						</td>
						<td width=50px></td>
					</tr>
				</table>
				</div>

				</fieldset>
				</TD>
			</TR>
		</TABLE>

		</TD>
	</TR>
</TABLE>
</form>
</div>
</body>
</html>