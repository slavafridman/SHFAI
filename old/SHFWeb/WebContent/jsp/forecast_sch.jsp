<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@page import="bzq.shf.bean.AgentDayBean"%>
<jsp:useBean id="forecastForm" class="bzq.shf.forms.ForecastForm"
	scope="request">
</jsp:useBean>
<jsp:useBean id="forecastData" class="java.util.Vector" scope="request">
</jsp:useBean>

<jsp:useBean id="schedualBean" class="bzq.shf.bean.ForecastSchedualBean"
	scope="page">
</jsp:useBean>



<%@page import="com.ibm.converters.Decimal"%>
<%@page import="java.text.Format"%>
<%@page import="bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.taglib.ClickSelectTag"%><HTML>
<HEAD>

<style type="text/css">
@import "../dojo/dojo/resources/dojo.css";

@import "../dojo/dijit/themes/tundra/tundra.css";

@import "../dojo/dijit/themes/dijit.css";
</style>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255"
	pageEncoding="WINDOWS-1255"
	import="bzq.shf.forms.ActivityForm,java.util.Vector,bzq.shf.bean.ForecastSchedualBean"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<META HTTP-EQUIV="PRAGMA" CONTENT="NO-CACHE">
<meta http-equiv="X-UA-Compatible" content="IE=EmulateIE7" >
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
<script language="JavaScript" src="/shf/js/exceljs.js"></script>
<script language="JavaScript" src="/shf/js/forecast.js"></script>


<TITLE>forecast.jsp</TITLE>

<script src="../dojo/dojo/dojo.js"
	djConfig="isDebug: false, parseOnLoad: true"></script>
<shf:reloadErrors></shf:reloadErrors>


<script type="text/javascript">
	dojo.require("dojo.parser");
	dojo.require("dijit.Dialog");
	dojo.require("dojo.cache");
	dojo.require("dijit.form.Button");
	dojo.require("dijit.layout.ContentPane");
	
</script>	
<SCRIPT>
function validateSchForm(){
	if ( document.getElementById("rb_moked").checked) {
		if(document.forms['schFrc'].moked.value==-1){
			alert("נא לבחור מוקד");
			return;
		}
	}	
	//alert("submit");
    //dijit.byId("dialogTableId").destroyDescendants();
    //dijit.byId("dialogTableId").destroyRecursive();
	document.getElementById("dataGridDiv").style.display="none";
	//document.getElementById("dataGridDiv2").style.display="none";
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
	//document.getElementById("dataGridDiv2").style.display="";
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

function wfmClicked(e){
	if(e.checked){
		return true;
	}else{
		return false;
	}
}
function setChoice(choice) {
	//document.getElementById("rb_value").value = choice;
	var checked =document.getElementById("rb_moked").checked;
	
	if (choice=="moked") {
		document.getElementById("rb_moked").checked="checked";
		document.getElementById("withException").disabled="";
		
	} else {
		document.getElementById("rb_activity").checked="checked";
		document.getElementById("withException").disabled="disabled";
		document.getElementById("withException").checked="";
	}
}

function showMarkedAgent(index){
    alert(index);
    document.schFrc.indexForSearch.value=index;
    //document.schFrc.indexForSearch.value=index;
	document.forms['schFrc'].target="";
	//document.forms['schFrc'].action="/shf/forecast/markedAgent.do";
	//document.forms['schFrc'].submit();

}
//function showMissing() {
//	alert("from here");
//}
</SCRIPT>


<SCRIPT>



function openDialog(urlString,nameOfTable,index)
{			
		//alert("url"+urlString);
		//dijit.byId("dialogTableId").reset();
		//dijit.byId("dialogTableId").innerHtml="";
		//dijit.byId("dialogTableId").titleNode.innerHTML= nameOfTable;
		//dijit.byId("dialogTableId").setHref(urlString);
		//dijit.byId("dialogTableId").show();
		//dijit.byId("dialogTableId").refresh();
		//dijit.byId("dialogTableId").reset();
		var dialog = dijit.byId("dialogTableId");
		//dialog. refresh();
		dialog.reset();
		//dialog.refresh();
		dialog.titleNode.dir = "rtl";
		dialog.titleNode.innerHTML = nameOfTable;
		dialog.setHref(urlString);
		dialog.show();



			//alert(urlString);
			
			//dijit.byId("dialogTableId").href=urlString;
            //setDialogHeader(nameOfTable); 
            //dijit.byId("dialogTableId").show(); 
    
}  

function setDialogHeader(strHeader){
			//alert(strHeader);
            dijit.byId("dialogTableId").titleNode.dir="rtl";
            dijit.byId("dialogTableId").titleNode.innerHTML = strHeader;
}
function closeDialog()
{
			alert("close");
			dijit.byId("dialogTableId").reset();
			dijit.byId("dialogTableId").innerHtml="";
            //dijit.byId("dialogTableId").hide();
            //dojo.require("dijit.layout.ContentPane");
            //dijit.byId("dialogTableId").destroyDescendants();
            dijit.byId("dialogTableId").hide();
            
           
            
}
//function destroy(){
//alert("dastroy");
//dijit.byId("dialogTableId").destroy();

//}

</script>

</HEAD>

<%
String moked=forecastForm.getMoked();
%>
<BODY class="tundra" onkeyup="keyPressed();" onload="hideWaitImg();">
<div id="popupMissing" class="popup2" style="display: none;"></div>
<div id="popupLate" class="popup3" style="display: none;"></div>
<div id="popupArrival" class="popup2" style="display: none;"></div>
<div id="popupfutureExit" class="popup2" style="display: none;"></div>
<div id="popupmarked" class="popup3" style="display: none;"></div>
<div id="popupexcepSHF" class="popup3" style="display: none;"></div>
<TABLE cellpadding="0" cellspacing="0" width="100%" height="100%">
	<TR>
		<TD width="100%" valign="top" colspan="2">
		<FIELDSET style="border: 1px silver solid;" class="form"><LEGEND>בקרת
		כ"א</LEGEND>
		<form action="/shf/forecast/schResult.do" name="schFrc"
			style="display: inline;" method="post"><input
			name="indexForSearch" type="hidden"
			value="<bzq:integer name="forecastForm" property="indexForSearch"></bzq:integer>">
		<TABLE cellspacing="0" cellpadding="2">
			<TR>
				<td>
				<TABLE cellspacing="0" cellpadding="2">
					<TR>
						<TD width="30px"></TD>
						<TD class="header" nowrap="nowrap">תאריך:</TD>
						<TD><shf:calendar calname="date" name="forecastForm"
							property="date" /></TD>
						<TD width="10px"></TD>
						<TD class="header" width="20" nowrap align="right"><shf:checkbox
							logic="onclick=alldayClicked(this);" inputname="allday"
							name="forecastForm" property="allday" /></TD>
						<TD class="header" width="40px">כל היום</TD>
						<TD width="45px"></TD>
						<TD class="header" nowrap="nowrap">משעה:</TD>
						<TD width="10px"></TD>

						<TD class="data" id="timeFromTd">
						<%if(forecastForm.isAllday()){%> <shf:timechooser
							inputname="timeFrom" disabled="true" name="forecastForm"
							property="timeFrom" /> <%}else{%> <shf:timechooser
							inputname="timeFrom" name="forecastForm" property="timeFrom" />
						<%}%>
						</TD>
						<TD width="20px"></TD>
						<TD class="header" nowrap="nowrap">עד שעה:</TD>
						<TD width="10px"></TD>
						<TD class="data" id="timeToTd">
						<%if(forecastForm.isAllday()){%> <shf:timechooser inputname="timeTo"
							disabled="true" name="forecastForm" property="timeTo" /> <%}else{%>
						<shf:timechooser inputname="timeTo" name="forecastForm"
							property="timeTo" /> <%}%>
							
						</TD>
					</TR>
				</TABLE>
				</TD>
				<td width="10" colspan="10"><br>
				<br>
				</td>
			</TR>
			<TR>
				<td>
				<TABLE cellspacing="0" cellpadding="2">
					<TR>
						<TD width="30px"></TD>
						<TD>
						<% 
									 if (forecastForm.getRbChoice()==null) { %> <input
							id="rb_activity" type="radio" name="rbChoice" checked="checked"
							value="activity"
							onclick="setChoice(this.value);reSetMoked();setMultiExceptions(0,'exceptionForm','exceptionList');setMultiActivities(this,'forecastForm','activityList');">
						<%} else {
										 if (forecastForm.getRbChoice().equals("activity")) { %> <input
							id="rb_activity" type="radio" name="rbChoice" checked="checked"
							value="activity"
							onclick="setChoice(this.value);reSetMoked();setMultiExceptions(0,'exceptionForm','exceptionList');setMultiActivities(this,'forecastForm','activityList');">
						<%} else { %> <input id="rb_activity" type="radio" name="rbChoice"
							value="activity"
							onclick="setChoice(this.value);reSetMoked();setMultiExceptions(0,'exceptionForm','exceptionList');setMultiActivities(this,'forecastForm','activityList');">
						<%} %> <%} %>
						</TD>
						<TD class="header" nowrap="nowrap">תור ארצי:</TD>
						<TD width="10px"></TD>

						<TD id="virtualList"><shf:virtualActivityCheckList
							name="forecastForm" property="virtualActivity" /></TD>
						<TD width="10px"></TD>
						
						<TD class="header">תפקיד בפועל:</TD>
						<TD width="10px"></TD>
					    <TD class="data" valign="middle"><shf:innerJobCheckList
						name="forecastForm" tablename="innerJobCode" property="innerJobList" />
					    </TD>
					    <TD width="30px"></TD>

						<TD>
						<% if (forecastForm.getRbChoice()!=null) { %> <%if (forecastForm.getRbChoice().equals("moked")) { %>
						<input id="rb_moked" type="radio" name="rbChoice" 
							checked="checked" value="moked" onclick="setChoice(this.value);" >
						<%} else { %> <input id="rb_moked" type="radio" name="rbChoice"
							value="moked"  onclick="setChoice(this.value);"  > <%} %> <%} else {%>
						<input id="rb_moked" type="radio" name="rbChoice" value="moked"
							 onclick="setChoice(this.value);"  > <%} %>
						</TD>
						<TD class="header">מוקד:</TD>
						<TD width="10px"></TD>
						<TD class="data" id="mokedsAjaxResult"><shf:unitselect
							tablename="unitCode" name="moked" selectedName="forecastForm"
							selectedProperty="moked" style="width:170px;font-size:10px;"
							type="G01"
							logic="onchange=setMultiActivities(this,'forecastForm','activityList','frcstSch');setMultiExceptions(this,'exceptionForm','exceptionList');setChoice('moked');"
							emptySelection="yes" /></TD>
						<TD width="20px"></TD>
						<TD class="header">תור:</TD>
						<TD width="10px"></TD>
						<TD id="activityAjaxResult"><shf:activityCheckList
							name="forecastForm" moked="<%=moked%>" property="activityList" />
						</TD>
						<TD width="20px"></TD>
						<TD class="header">סוג חריגה:</TD>
						<TD width="10px"></TD>
						<TD id="exceptionAjaxResult"><shf:exceptionCheckList
							name="forecastForm" moked="<%=moked%>" property="exceptionList" />
						</TD>
					</TR>
				</TABLE>
				</td>
			</TR>
			<TR>
				<td>
				<TABLE cellspacing="0" cellpadding="2">
					<TR>
						<TD width="30px"></TD>
						<TD><shf:checkbox inputname="withWfm" name="forecastForm"
							property="withWfm" /></TD>
						<TD class="header" width="80px">עם נתוני WFM</TD>

						<TD><shf:checkbox inputname="withCalc" name="forecastForm"
							property="withCalc" /></TD>
						<TD class="header" nowrap width="80px">נדרש Calc</TD>

						<TD><shf:checkbox inputname="withReq" name="forecastForm"
							property="withReq" /></TD>
						<TD class="header" width="80px">נדרש Req</TD>

						<TD><shf:checkbox inputname="withNeto" name="forecastForm"
							property="withNeto" /></TD>
						<TD class="header" width="80px">מענה נטו</TD>

						<TD><shf:checkbox inputname="withBreak" name="forecastForm"
							property="withBreak" /></TD>
						<TD class="header" width="80px">הפסקות</TD>
						
						<TD><shf:checkbox inputname="withNetoBreak"
							name="forecastForm" property="withNetoBreak" /></TD>
						<TD class="header" width="80px">מענה והפסקות</TD>
						
						<TD><shf:checkbox 
						checked='<%=(forecastForm.isWithChange()||forecastData.size()==0?1:0)%>'
						inputname="withChange" name="forecastForm"/></TD>
						<TD class="header" width="80px">שינויים במשמרת</TD>
						
						<%if (forecastForm.getRbChoice()==null || forecastForm.getRbChoice().equals("activity") ) { %>
						<TD><shf:checkbox inputname="withException"
							name="forecastForm" property="withException"
							logic="disabled='disabled' id='withException'" /></TD>
						<%} else { // customer demand 23.12.2010%>
						<TD><shf:checkbox inputname="withException"
							name="forecastForm" property="withException" /></TD>
						<%} %>
						<TD class="header" width="80px">פעילויות נוספות</TD>
						<TD><shf:checkbox
							checked='<%=(forecastForm.isWithSum()||forecastData.size()==0?1:0)%>'
							inputname="withSum" name="forecastForm" /></TD>
						<TD class="header" width="80px">סהכ במוקד</TD>
						
					</TR>
				</TABLE>
				</td>
			</TR>
			<TR>
				<TD align="left">
				<button onclick="validateSchForm();">רענן</button>
				<input type="hidden" name="from" value="frcstSch">
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
		<TD style="padding-top: 6px;" colspan="2">

		<TABLE cellspacing="0" cellpadding="0" width="100%"
			style="border-top: 1px silver solid; border-left: 1px silver solid; border-right: 1px silver solid;">
			<TR class="tableTotal">

				<TD style='text-align: left; padding-left: 2px;' class="tableTotal">

				<shf:security activity="attend_cancel_exit">
					<img src='/shf/images/excell.png' alt='שמור לאקסל'
						onclick="startForeCastExcel('forecast');" style='cursor: hand;'
						height="19px" width="19px">
				</shf:security></TD>
			</TR>
		</TABLE>
		</TD>
	</TR>
	<%}%>
	<TR>
		<TD width="100%" valign="top" dir="ltr" style="overflow: auto;">
		<div class="gridNoData" id="waitImgDiv"
			style="width: 100%; overflow-x: scroll;"><img height="40px"
			src="/shf/images/wait.gif"></div>
		<%int withCountInd=8, withSumInd=-1, withExceptionInd=-1, withNetoBreakInd=-1, withBreakInd=-1, withNetoInd=-1, withCalcReqInd=-1,withChangeShift=-1; %>
		<div
			style="display: none; width: 100%; height: 100%; overflow: auto; border: 1px silver solid;"
			id="dataGridDiv"><!-- hidden --> <%if(forecastData!=null && forecastData.size()>0){%>
		<SCRIPT>
					var myTopHeader=[
					<%if (forecastForm.isWithChange()){ withChangeShift=3;%>
					"שינויים במשמרת",<%}%>
					"&nbsp;", 
					"&nbsp;",
					"&nbsp;",
					"&nbsp;",
					"&nbsp;",
					"&nbsp;",
					"&nbsp;",
					<%if (forecastForm.isWithSum()){ withSumInd=withCountInd++;%>
					"סהכ במוקד",
					<%}
					if (forecastForm.isWithException()){ withExceptionInd=withCountInd++;%>
					"פעילויות נוספות",
					<%}
					if (forecastForm.isWithNetoBreak()){ withNetoBreakInd=withCountInd++;%>
					"מענה והפסקות",
					<%}
					if (forecastForm.isWithBreak()){ withBreakInd=withCountInd++;%>
					"הפסקות",
					<%}
					if (forecastForm.isWithNeto()){ withNetoInd=withCountInd++;%>
					"מענה נטו",
					<%}
					if (forecastForm.isWithCalc() && forecastForm.isWithReq()){ withCalcReqInd=++withCountInd;%>
					"פער בין",
					<%}
					if (forecastForm.isWithCalc() || forecastForm.isWithReq()){%>
					"נדרש",
					<%}%>
					"&nbsp;",
					"&nbsp;"
					];
					var txtColor=['#000'];

					</SCRIPT> <SCRIPT>
					var myHeader=[
					<%if (forecastForm.isWithChange()){%>
					"קיצור","הארכה","הזזה",		
					<%}%>
					"יוצאים",
					"מגיעים",
					"נוכחים",
					"תגבור",
					"צמצום",
					"איחורים",
					"חיסורים",
					<%if (forecastForm.isWithSum()){%>
					"שיפטר","wfm",					
					<%}
					if (forecastForm.isWithException()){%>
					"שיפטר","wfm",					
					<%}
					if (forecastForm.isWithNetoBreak()){%>
					"שיפטר","wfm",					
					<%}
					if (forecastForm.isWithBreak()){%>
					"שיפטר","wfm",					
					<%}
					if (forecastForm.isWithNeto()){%>
					"שיפטר","wfm",					
					<%}
					if (forecastForm.isWithCalc() && forecastForm.isWithReq()){%>
					"Req ו Calc",
					<%}
					if (forecastForm.isWithReq()){%>
					"Req",
					<%}
					if (forecastForm.isWithCalc()){%>
					"Calc",
					<%}%>
					"החלפות בין"+" <br> "+"מוקדים", <%--Igal 5.2013 --%>
					"שעה",
					"&nbsp;"
					];
					var txtColor=['#000'];
					</SCRIPT> <SCRIPT>
					var myHeaderNoWfm=[
					<%if (forecastForm.isWithChange()){%>
					"קיצור","הארכה","הזזה",			
					<%}%>
					"יוצאים",
					"מגיעים",
					"נוכחים",
					"תגבור",
					"צמצום",
					"איחורים",
					"חיסורים",
					<%if (forecastForm.isWithSum()){%>
					"סהכ במוקד"+" <br> "+"שיפטר",
					<%}
					if (forecastForm.isWithException()){%>
					"פעילויות נוספות"+" <br> "+"שיפטר",
					<%}
					if (forecastForm.isWithNetoBreak()){%>
					"מענה והפסקות"+" <br> "+"שיפטר",
					<%}
					if (forecastForm.isWithBreak()){%>
					"הפסקות"+" <br> "+"שיפטר",
					<%}
					if (forecastForm.isWithNeto()){%>
					"מענה נטו"+" <br> "+"שיפטר",
					<%}
					if (forecastForm.isWithCalc() && forecastForm.isWithReq()){%>
					"פער בין"+" <br> "+"calc ל rec",
					<%}
					if (forecastForm.isWithReq()){%>
					"נדרש"+" <br> "+" Req",
					<%}
					if (forecastForm.isWithCalc()){%>
					"נדרש"+" <br> "+" Calc",
					<%}%>
					"החלפות בין"+" <br> "+"מוקדים", <%--Igal 5.2013 --%>
					"שעה",
					"&nbsp;"
					];
					var txtColor=['#000'];

					</SCRIPT>
					
					 <SCRIPT>
					var excepSHFData=[
					<%
					//build object for marked - use it inside drowGrid3Sch()
					Vector excepShfVec = new Vector();
					int j= 1;
					for(int i=0;i<forecastData.size();i++){
						ForecastSchedualBean schBean=(ForecastSchedualBean)forecastData.get(i);
							excepShfVec = schBean.getExceptionsSHFDetails();

							if (excepShfVec != null && excepShfVec.size() > 0)
							   {
						   		%> [ <%
						   		int v=0;
						   		for (v=0;v<excepShfVec.size()-1;v++){
						   		%>
						   		'<%=(String)excepShfVec.get(v)%>',
						   		<%
						   		}
						   %>'<%=(String)excepShfVec.get(v)%>']<%
							   } else {
							   %> [ ' '  ] <%
							   }
						if(i<forecastData.size()-1){%>,<%}
					}
					%>
					];
					</SCRIPT> <SCRIPT>
					
					var myData=[
					<%
						for(int i=0;i<forecastData.size();i++){
							int index=i;
							j++;
							schedualBean=(ForecastSchedualBean)forecastData.get(i);
						//if (schedualBean.getTekhnonMaty()>=0) { //TODO check with Yael how to activate this!!!
							int difference=schedualBean.getDifference();
							
							// Svetlana
							//fix the format for SHF
							double shfSum =  schedualBean.getAfterChanges();
							String shfSumStr = BaseConvert.decimalToString(shfSum,"##.##");
							//fix the format for SHF ExtraHours
							double shfInExtraHours =  schedualBean.getInExtraHours();
							String shfInExtraHoursStr = BaseConvert.decimalToString(shfInExtraHours,"##.##");
							//fix the format for SHF Marked
							double shfMarked =  schedualBean.getMarked();
							String shfMarkedStr = BaseConvert.decimalToString(shfMarked,"##.##");
							//fix the format for SHF Arrivals
							double shfArrivals =  schedualBean.getArrivals();
							String shfArrivalsStr = BaseConvert.decimalToString(shfArrivals,"##.##");
							//fix the format for SHF FutureExit
							double shfFutureExit =  schedualBean.getFutureExit();
							String shfFutureExitStr = BaseConvert.decimalToString(shfFutureExit,"##.##");
							
							//fix the format for WFM - break - excep
							double wfmNoExcepNoBreak =  schedualBean.getShebotsMoked() - schedualBean.getExceptionsWFM() - schedualBean.getBreakExcepWFM();
							String wfmNoExcepNoBreakStr = BaseConvert.decimalToString(wfmNoExcepNoBreak,"##.##");
							//fix the format for SHF - break - excep 
							double shfNoExcepNoBreak =  shfSum - schedualBean.getExceptionsSHF() - schedualBean.getBreakExcepSHF();
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
							double shfNoBreak =  shfSum - schedualBean.getExceptionsSHF();
							String shfNoBreakStr = BaseConvert.decimalToString(shfNoBreak,"##.##");
							
							//fix the format for WFM Exceptions
							double wfmExcep =  schedualBean.getExceptionsWFM();
							String wfmExcepStr = BaseConvert.decimalToString(wfmExcep,"##.##");
							//fix the format for SHF Exceptions
							double shfExcep =  schedualBean.getExceptionsSHF();
							String shfExcepStr = BaseConvert.decimalToString(shfExcep,"##.##");
							
							//fix the format for SHF Missing
							double shfMiss =  schedualBean.getMissing();
							String shfMissStr = BaseConvert.decimalToString(shfMiss,"##.##");
							
							//fix the format for SHF Late
							double shfLate =  schedualBean.getLate();
							String shfLateStr = BaseConvert.decimalToString(shfLate,"##.##");
							
							//fix the format for SHF Cancelled
							double shfCancelled =  schedualBean.getCancelled();
							String shfCancelledStr = BaseConvert.decimalToString(shfCancelled,"##.##");
							double shfShortening 	=  schedualBean.getShortening();
							String shfShorteningStr = BaseConvert.decimalToString(shfShortening,"##.##");
							double shfShifting 	=  schedualBean.getShifting();
							String shfShiftingStr = BaseConvert.decimalToString(shfShifting,"##.##");
							double shfExtension 	=  schedualBean.getExtension();
							String shfExtensionStr = BaseConvert.decimalToString(shfExtension,"##.##");
							String color="green";
							if(difference<0) color="red";
							//the BUB - is for making under line for number that the user can see more details
							//i use it inside the drowGrid3Sch()
						%>
							[
							<%if (forecastForm.isWithChange()){ %>
							<%if (i%5==0 || Double.parseDouble(shfShorteningStr) == 0) {
							%>
								'<span > <%=shfShorteningStr%></span>',
							<% 
								} else {
							%>
								'<span title="פרטי מקצרים"onclick=openDialog("/shf/forecast/reducingAgent.do?param=reducing_agents&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfShorteningStr%></span>',
							<%}%>
							
							<%if (i%5==0 || Double.parseDouble(shfExtensionStr) == 0) {
							%>
								'<span > <%=shfExtensionStr%></span>',
							<% 
								} else {
							%>
								'<span title="פרטי מאריכים"onclick=openDialog("/shf/forecast/extensionAgent.do?param=extension_agents&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfExtensionStr%></span>',
							<%}%>
							<%if (i%5==0 || Double.parseDouble(shfShiftingStr) == 0) {
							%>
								'<span > <%=shfShiftingStr%></span>',
							<% 
								} else {
							%>
								'<span title="פרטי מזיזים"onclick=openDialog("/shf/forecast/shiftingAgent.do?param=shifting_agents&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfShiftingStr%></span>',
							<%}%>
							
							<%}%>
							<%
							if (i%5==0 || Double.parseDouble(shfFutureExitStr) == 0) {
							%>
								'<span > <%=shfFutureExitStr%></span>',
							<% 
								} else {
							%>
								'<span title="פרטי יוצאים" onclick=onclick=openDialog("/shf/forecast/futureAgent.do?param=future_agent&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfFutureExitStr%></span>',
							<%}%>
							<%
							if (i%5==0 || Double.parseDouble(shfArrivalsStr) == 0) {
							%>
								'<span > <%=shfArrivalsStr%></span>',
							<% 
								} else {
							%>
								'<span title="פרטי מגיעים"onclick=onclick=openDialog("/shf/forecast/arrivalAgent.do?param=arrival_agent&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfArrivalsStr%></span>',
							<%}%>
							<%
							if (i%5==0 || Double.parseDouble(shfMarkedStr) == 0 || schedualBean.getMarkedDetails()==null || schedualBean.getMarkedDetails().size()<1) {
							%>
								'<span > <%=shfMarkedStr%></span>',
							<% 
								} else {
							%>
							    '<span title="פרטי נוכחים" onclick=openDialog("/shf/forecast/markedAgent.do?param=marked_agent&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfMarkedStr%></span>',
							<%}%>
							<%
							if (i%5==0 || Double.parseDouble(shfInExtraHoursStr) == 0 || schedualBean.getExtraDetails()==null || schedualBean.getExtraDetails().size()<1 ) {
							%>
								'<span > <%=shfInExtraHoursStr%></span>',
							<% 
								} else {
							%>
							    '<span title="פרטי מתגברים" onclick=openDialog("/shf/forecast/extraAgent.do?param=extra_agent&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfInExtraHoursStr%></span>',
							<%}%>
							<%
							if (i%5==0 || Double.parseDouble(shfCancelledStr) == 0|| schedualBean.getCancelDetails()==null || schedualBean.getCancelDetails().size()<1 ) {
							%>
								'<span > <%=shfCancelledStr%></span>',
							<% 
								} else {
							%>
							    '<span title="פרטי מצמצמים" onclick=openDialog("/shf/forecast/cancelAgent.do?param=cancel_agent&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfCancelledStr%></span>',
							<%}%>
							<%
							if (i%5==0 || Double.parseDouble(shfLateStr) == 0) {
							%>
								'<span > <%=shfLateStr%></span>',
							<% 
								} else {
							%>
								'<span title="פרטי מאחרים"  onclick=openDialog("/shf/forecast/lateAgent.do?param=late_agents&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfLateStr%></span>',
							<%}%>
							<%
							if (i%5==0 || Double.parseDouble(shfMissStr) == 0) {
							%>
								'<span > <%=shfMissStr%></span>',
							<% 
								} else {
							%>
								'<span title="פרטי מחסרים"onclick=openDialog("/shf/forecast/missingAgent.do?param=missing_agents&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=shfMissStr%></span>',
							<%}%>
							
							<%if (forecastForm.isWithSum()){%>
								'<%=shfSumStr%>',
								<%
								if (forecastForm.isWithWfm()) {
								%>
									'<%=schedualBean.getShebotsMoked()%>', 
								<%}
							}%>
							
							<%if (forecastForm.isWithException()){%>
								<%
								if (i%5==0 || Double.parseDouble(shfExcepStr) == 0) {
								%>
									'<span > <%=shfExcepStr%></span>',
								<% 
									} else {
								%>
									'<span onclick=showExceptionSHF("<%=i%>");> BUB<%=shfExcepStr%></span>',
								<%}%>
							<%
							if (forecastForm.isWithWfm()) {
							%>
								'<%=wfmExcepStr%>',  
							<%}
							}%>
							<%if (forecastForm.isWithNetoBreak()){%>
								'<%=shfNoBreakStr%>',
								<%
								if (forecastForm.isWithWfm() ) {
								%>
									'<%=wfmNoBreakStr%>',  
								<%}
							}%>
							<%if (forecastForm.isWithBreak()){%>
								'<%=shfBreakStr%>',
								<%
								if (forecastForm.isWithWfm()) {
								%>
									'<%=wfmBreakStr%>',  
								<%}
							}%>
							<%if (forecastForm.isWithNeto()){%>
								'<%=shfNoExcepNoBreakStr%>',
								<%
								if (forecastForm.isWithWfm()) {
								%>
									'<%=wfmNoExcepNoBreakStr%>',   
								<%}
							}%>
							<%if (forecastForm.isWithCalc() && forecastForm.isWithReq()){%>
								'<%=schedualBean.getTekhnonMaty() - schedualBean.getRequiredStaffing()%>',
							<%}%>
							<%if (forecastForm.isWithReq()){%>
								'<%=schedualBean.getRequiredStaffing()%>',
							<%}%>
							<%if (forecastForm.isWithCalc()){%>
								'<%=schedualBean.getTekhnonMaty()%>',
							<%}%>
							 <%--Igal 5.2013 moked switches--%>
							<%
								if (i%5==0) { 
									String sizeLeft = "0";
									String sizeArrived = "0";
									
									try{
										if ( ! (schedualBean.getVecMokedSwitchesLeft().size() == 0) ){
										sizeLeft = String.valueOf(-schedualBean.getVecMokedSwitchesLeft().size());
										}
									}catch (Exception e){
									}
									try{
										if ( ! (schedualBean.getVecMokedSwitchesArrived().size() == 0) ){
										sizeArrived ="+" + String.valueOf(schedualBean.getVecMokedSwitchesArrived().size());
										}
									}catch (Exception e){
									}
									
									if ( ! ("0".equals(sizeLeft) && "0".equals(sizeArrived) ) ){
									%>	
									'<span title="פרטי מתחלפים" onclick=openDialog("/shf/forecast/activitySwitch.do?param=activitySwitch&indexForSearch=<%=i%>",this.title,<%=i%>);> BUB<%=sizeLeft%>&nbsp;<%=sizeArrived%></span>',
									<%} else {%>
										'0',
									<%} %>
									
								
								<% 
									} else {
								%>
									'',
								<%}%>
							<%--Igal 5.2013 --%>
							'<shf:shftime date="<%=schedualBean.getTime()%>" pattern="HH:mm"/>',
							'<%=i%5==0?"<div id=divid"+i+"><B>+</B></div>":""%>'
							<%=i%5==0?",'','','"+(i/5)+"'":",'','"+(i/5)+"'"%>
							]
						<%
						if(i<forecastData.size()-1){%>,<%} }%>];
							drawGrid3Sch('dataGridDiv', <%=forecastForm.isWithWfm()%>, <%=forecastForm.isRbWithoutSign()%>, <%=withSumInd%>,<%=withExceptionInd%>,<%=withNetoBreakInd%>, <%=withBreakInd%>, <%=withNetoInd%>, <%=withCalcReqInd%>,<%=withChangeShift%>);
						</SCRIPT> <%
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
		<img height="40px" src="/shf/images/wait.gif"></div>
		<div
			style="display: none; height =100%; overflow: auto; border: 1px silver solid;"
			id="dataGridDiv2"></div>
		</TD>



	</TR>
</TABLE>
<div dojotype="dijit.Dialog" id="dialogTableId" title="" layoutalign="right" align="center" 
	preload="false" errorMessage="לא ניתן להציג טבלה" 
	isLayoutContainer="false" preventCache="true" 
	style="margin: 0px; outline: 0px; overflow: hidden; padding: 0px; border: 2px solid; border-bottom-style: groove; border-right-style: groove;">
</div>

</BODY>
</HTML>
