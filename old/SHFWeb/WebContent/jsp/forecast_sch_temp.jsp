<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="forecastForm" class="bzq.shf.forms.ForecastForm"
	scope="request">
</jsp:useBean>
<jsp:useBean id="forecastData" class="java.util.Vector"
	scope="request">
</jsp:useBean>

<jsp:useBean id="schedualBean" class="bzq.shf.bean.ForecastSchedualBean"
	scope="page">
</jsp:useBean>



<%@page import="com.ibm.converters.Decimal"%>
<%@page import="java.text.Format"%>
<%@page import="bzq.utils.BaseConvert"%><HTML>
<HEAD>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.forms.ActivityForm,java.util.Vector,bzq.shf.bean.ForecastSchedualBean"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
<script language="JavaScript" src="/shf/js/exceljs.js"></script>

<TITLE>forecast.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>

<SCRIPT>
function validateSchForm(){
	if ( document.getElementById("rb_moked").checked) {
		if(document.forms['schFrc'].moked.value==-1){
			alert("נא לבחור מוקד");
			return;
		}
	}	

	document.getElementById("dataGridDiv").style.display="none";
	document.getElementById("dataGridDiv2").style.display="none";
	document.getElementById("waitImgDiv").style.display="";
	document.forms['schFrc'].submit();
	
	
}

function keyPressed(){
	
	if(window.event.keyCode==13){
		validateSchForm();
	}
}


function hideWaitImg(){
	document.getElementById("dataGridDiv").style.display="";
	document.getElementById("dataGridDiv2").style.display="";
	document.getElementById("waitImgDiv").style.display="none";
}

function alldayClicked(e){
	if(e.checked){
		document.getElementById("timeFromTd").innerHTML="<shf:timechooser inputname='timeFrom' disabled='true' inputvalue='00:00'/>";
		document.getElementById("timeToTd").innerHTML="<shf:timechooser inputvalue='24:00' disabled='true' inputname='timeTo'/>";
	}else{
		document.getElementById("timeFromTd").innerHTML="<shf:timechooser inputname='timeFrom' inputvalue='07:00'/>";
		document.getElementById("timeToTd").innerHTML="<shf:timechooser inputvalue='16:00' inputname='timeTo'/>";
		//document.getElementById("timeToTd").innerHTML="<shf:timechooser inputname='timeTo' name='forecastForm' property='timeTo'/>";
	}
}
function setChoice(choice) {
	//document.getElementById("rb_value").value = choice;
	if (choice=="moked") {
		document.getElementById("rb_moked").checked="checked";
	} else {
		document.getElementById("rb_activity").checked="checked";
	}
}
</SCRIPT>
</HEAD>

<%
String moked=forecastForm.getMoked();
%>
<BODY onkeyup="keyPressed();" onload="hideWaitImg();">
	<TABLE cellpadding="0" cellspacing="0" width="400px" height="600px" >
			<TR>
				<TD width="100%" valign="top" colspan="2">
				<FIELDSET style="border: 1px silver solid;" class="form">
				<LEGEND>תחזית שיבוץ</LEGEND>
				<form action="/shf/forecast/schResult.do" name="schFrc" style="display:inline;" method="post">
				<!--  input id="rb_value" name="rbChoice" type="hidden"-->
				<TABLE  cellspacing="0" cellpadding="2" >
					<TR>
						<td>
						<TABLE  cellspacing="0" cellpadding="2">
							<TR>
								<TD width="30px"></TD>
								<TD class="header" nowrap="nowrap">תאריך:</TD>
								<TD>
									<shf:calendar calname="date" name="forecastForm" property="date" />
								</TD>
								<TD width="10px"></TD>
								<TD class="header" width="40px">כל היום</TD>
								<TD class="header" width="20" nowrap align="right"><shf:checkbox logic="onclick=alldayClicked(this);" 
									inputname="allday" name="forecastForm" property="allday"/> </TD>
								<TD width="10px"></TD>
								<TD class="header" nowrap="nowrap">משעה:</TD>
								<TD width="10px"></TD>
						
								<TD class="data" id="timeFromTd">
								<%if(forecastForm.isAllday()){%>
								<shf:timechooser inputname="timeFrom" disabled="true" name="forecastForm" property="timeFrom" />
								<%}else{%>
								<shf:timechooser inputname="timeFrom" name="forecastForm" property="timeFrom" />
								<%}%>
								</TD>
								<TD width="20px"></TD>
								<TD class="header" nowrap="nowrap">עד שעה:</TD>
								<TD width="10px"></TD>
								<TD class="data" id="timeToTd">
								<%if(forecastForm.isAllday()){%>
								<shf:timechooser inputname="timeTo" disabled="true" name="forecastForm" property="timeTo" />
								<%}else{%>
								<shf:timechooser inputname="timeTo" name="forecastForm" property="timeTo" />
								<%}%>
								</TD>
							 </TR>
						 </TABLE>
						 </TD>
						 <td width="10" colspan="10"> </td>
					</TR>	 
					<TR>
						<td>
						<TABLE  cellspacing="0" cellpadding="2">
							<TR>
								<TD width="30px"></TD>
								<TD >
									<% 
									 if (forecastForm.getRbChoice()==null) { %>
									 	<input id="rb_activity" type="radio"  name="rbChoice" checked="checked" value="activity" onclick="setChoice(this.value);reSetMoked();setMultiExceptions(0,'exceptionForm','exceptionList');setMultiActivities(this,'forecastForm','activityList');">
									 <%} else {
										 if (forecastForm.getRbChoice().equals("activity")) { %>
											<input id="rb_activity" type="radio"  name="rbChoice" checked="checked" value="activity" onclick="setChoice(this.value);reSetMoked();setMultiExceptions(0,'exceptionForm','exceptionList');setMultiActivities(this,'forecastForm','activityList');">
										<%} else { %>
											<input id="rb_activity" type="radio"  name="rbChoice"  value="activity" onclick="setChoice(this.value);reSetMoked();setMultiExceptions(0,'exceptionForm','exceptionList');setMultiActivities(this,'forecastForm','activityList');">
										<%} %>
									<%} %>
								</TD>
								<TD class="header" nowrap="nowrap">תור ארצי:</TD>
								<TD width="10px"></TD>
								
								<TD id="virtualList" >
									<shf:virtualActivityCheckList name="forecastForm"  property="virtualActivity" />
								</TD>	
								<TD width="30px"></TD>
								
								<TD >
								<% if (forecastForm.getRbChoice()!=null) { %>
								
									<%if (forecastForm.getRbChoice().equals("moked")) { %>
										<input id="rb_moked" type="radio"  name="rbChoice" checked="checked" value="moked" onclick="setChoice(this.value);" >
										<%} else { %>
										<input id="rb_moked" type="radio"  name="rbChoice" value="moked" onclick="setChoice(this.value);" >
									<%} %>
									
								<%} else {%>
									<input id="rb_moked" type="radio"  name="rbChoice" value="moked" onclick="setChoice(this.value);" >
								<%} %>
								</TD>
								<TD class="header">מוקד:</TD>
								<TD width="10px"></TD>
								<TD class="data" id="mokedsAjaxResult">
									<shf:unitselect tablename="unitCode" name="moked"
									selectedName="forecastForm" selectedProperty="moked"
									style="width:170px;font-size:10px;"
									type="G01" logic="onchange=setMultiActivities(this,'forecastForm','activityList');setMultiExceptions(this,'exceptionForm','exceptionList');setChoice('moked');" emptySelection="yes"/>
								</TD>
								<TD width="20px"></TD>
								<TD class="header">תור:</TD>
								<TD width="10px"></TD>
								<TD id="activityAjaxResult">
								<shf:activityCheckList name="forecastForm" moked="<%=moked%>"  property="activityList"/>
								</TD>
							</TR>
						</TABLE>
						</td>
					</TR>
					<TR>
						<td>
						<TABLE  cellspacing="0" cellpadding="2">
							<TR>
								<TD width="30px"></TD>
								<TD class="header">סוג חריגה:</TD>
								<TD width="10px"></TD>
								<TD id="exceptionAjaxResult">
									<shf:exceptionCheckList name="forecastForm" moked="<%=moked%>" property="exceptionList"/>
								</TD>
							</TR>
						</TABLE>
						</td>
					</TR>
					<TR>
						<TD align="left">
						<button onclick="validateSchForm();">רענן</button>
						 </TD>
					</TR>
				</TABLE>
				</form>
				</FIELDSET>
				</TD>
			</TR>
			<%
			if(forecastData!=null && forecastData.size()>0){
				
			%>
			<TR>
				<TD style="padding-top:6px;" colspan="2" >
				
				<TABLE cellspacing="0" cellpadding="0" width="300px" style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
				<TR class="tableTotal">
				
				<TD style='text-align:left;padding-left:2px;' class="tableTotal">
				
				<shf:security activity="attend_cancel_exit">
				<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="startExcel('forecast');" style='cursor:hand;' height="19px" width="19px">
				</shf:security>
				</TD>
				</TR>
				</TABLE>
				</TD>
			</TR>
			<%}%>
			<TR>
				<TD width="400px" valign="top" dir="ltr" style="overflow-y: scroll overflow-x: none;">
					<div class="gridNoData" id="waitImgDiv" style="width: 300px; overflow-x: scroll">
						<img height="40px" src="/shf/images/wait.gif">
					</div>
					<div  style="display:none;width:600px;height:100%;overflow-y: hidden ; overflow-x: scroll; border:1px silver solid;" id="dataGridDiv">
					
					<%if(forecastData!=null && forecastData.size()>0){%>
					<SCRIPT>
					var myHeader=[
					"פער",
					"מחוברים",
					"איחורים",
					"חיסורים",
					"סומנו לתדריך",
					"לא סומנו",
					"שעות נוספות",
					"זימון + שינויים",
					"מגיעים",
					"שיבוץ מוקד",
					"סהכ במוקד WFM",
					"פעילויות נוספות SHF",
					"פעילויות נוספות WFM",
					"מענה והפסקות SHF",
					"מענה והפסקות WFM",
					"הפסקות SHF",
					"הפסקות WFM",
					"מענה SHF",
					"מענה WFM",
					"req- \n calc",
					"req",
					"calc",
					"שעה"
					];
					var txtColor=['#000'];
					</SCRIPT>
					<SCRIPT>
					var myData=[
					<%
						for(int i=0;i<forecastData.size();i++){
							schedualBean=(ForecastSchedualBean)forecastData.get(i);
						if (schedualBean.getTekhnonMaty()>0) {
							int difference=schedualBean.getDifference();
							//fix the format for WFM - break - excep
							double wfmNoExcepNoBreak =  schedualBean.getShebotsMoked() - schedualBean.getExceptionsWFM() - schedualBean.getBreakExcepWFM();
							String wfmNoExcepNoBreakStr = BaseConvert.decimalToString(wfmNoExcepNoBreak,"##.##");
							//fix the format for SHF - break - excep 
							double shfNoExcepNoBreak =  schedualBean.getAfterChanges() - schedualBean.getExceptionsSHF() - schedualBean.getBreakExcepSHF();
							String shfNoExcepNoBreakStr = BaseConvert.decimalToString(shfNoExcepNoBreak,"##.##");
							//fix the format for WFM break
							double wfmBreak =  schedualBean.getBreakExcepWFM();
							String wfmBreakStr = BaseConvert.decimalToString(wfmBreak,"##.##");
							//fix the format for SHF break
							double shfBreak =  schedualBean.getBreakExcepSHF();
							String shfBreakStr = BaseConvert.decimalToString(shfBreak,"##.##");
							
							//fix the format for WFM - excep
							double wfmNoBreak =  schedualBean.getShebotsMoked() - schedualBean.getExceptionsWFM();
							String wfmNoBreakStr = BaseConvert.decimalToString(wfmNoBreak,"##.##");
							//fix the format for SHF - excep 
							double shfNoBreak =  schedualBean.getAfterChanges() - schedualBean.getExceptionsSHF();
							String shfNoBreakStr = BaseConvert.decimalToString(shfNoBreak,"##.##");
							
							//fix the format for WFM Exceptions
							double wfmExcep =  schedualBean.getExceptionsWFM();
							String wfmExcepStr = BaseConvert.decimalToString(wfmExcep,"##.##");
							//fix the format for SHF Exceptions
							double shfExcep =  schedualBean.getExceptionsSHF();
							String shfExcepStr = BaseConvert.decimalToString(shfExcep,"##.##");
							
							String color="green";
							if(difference<0) color="red";
						%>
							
							[
							'<font color="<%=color%>"><b><%=difference%></b></font>',
							'<%=schedualBean.getSum()%>',
							'<%=schedualBean.getLate()%>',
							'<%=schedualBean.getMissing()%>',
							'<%=schedualBean.getMarked()%>',
							'<%=schedualBean.getNotMarked()%>',
							'<%=schedualBean.getInExtraHours()%>',
							'<%=schedualBean.getAfterChanges()%>',
							'<%=schedualBean.getArrivals()%>',
							'<%=schedualBean.getShebotsMoked()%>',
							'<%=schedualBean.getShebotsMoked()%>',
							'<%=shfExcepStr%>',
							'<%=wfmExcepStr%>',
							'<%=shfNoBreakStr%>',
							'<%=wfmNoBreakStr%>',
							'<%=shfBreakStr%>',
							'<%=wfmBreakStr%>',
							'<%=shfNoExcepNoBreakStr%>',
							'<%=wfmNoExcepNoBreakStr%>',
							'<%=schedualBean.getTekhnonMaty() - schedualBean.getRequiredStaffing()%>',
							'<%=schedualBean.getRequiredStaffing()%>',
							'<%=schedualBean.getTekhnonMaty()%>',
							'<shf:shftime date="<%=schedualBean.getTime()%>" pattern="HH:mm"/>'
							]
						<%
						if(i<forecastData.size()-1){%>,<%} } }%>];
							drawGrid2('dataGridDiv');
						</SCRIPT>
						<%
					}
					else{
					%>
					<div class="gridNoData">אין נתונים</div>
					<%	
					}
					%>
					</div>
					</TD>
					
			<!-- NEW FROM HERE  -->
					
				<TD width="50px" height="100%" valign="top" dir="ltr">
					<div class="gridNoData" id="waitImgDiv2" style="display: none">
							<img height="40px" src="/shf/images/wait.gif">
					</div>
					<div  style="display:none;height=100%;overflow:auto;border:1px silver solid;" id="dataGridDiv2">
					
					<%if(forecastData!=null && forecastData.size()>0){%>
					<SCRIPT>
					var myHeader=[
					"שעה"
					];
					var txtColor=['#000'];
					</SCRIPT>
					<SCRIPT>
					var myData=[
					<%
						for(int j=0;j<forecastData.size();j++){
							schedualBean=(ForecastSchedualBean)forecastData.get(j);
						if (schedualBean.getTekhnonMaty()>0) {
						%>
							[
							'<shf:shftime date="<%=schedualBean.getTime()%>" pattern="HH:mm"/>'
							]
						<%
						if(j<forecastData.size()-1){%>,<%} } }%>];
							drawGridTemp('dataGridDiv2');
						</SCRIPT>
						<%
					} // end if(forecastData!=null && forecastData.size()>0)
					else{
					%>
					<div class="gridNoData">אין נתונים</div>
					<%	
					}
					%>
					</div>
			</TD>
					
					
					
		</TR>
	</TABLE>
					
				
</BODY>
</HTML>
