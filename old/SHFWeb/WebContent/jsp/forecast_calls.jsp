
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">


<jsp:useBean id="forecastForm" class="bzq.shf.forms.ForecastForm"
	scope="request">
</jsp:useBean>

<jsp:useBean id="forecastInfo" class="bzq.shf.bean.ForecastCallsBean" 
	scope="page">
</jsp:useBean>

<jsp:useBean id="forecastData" class="java.util.Vector"
	scope="request">
</jsp:useBean>

<jsp:useBean id="localMokeds" class="java.util.Vector"
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector,bzq.shf.bean.ForecastCallsBean,bzq.utils.BaseConvert,bzq.shf.forms.ActivityCallsForm,bzq.shf.forms.ActivityForm"
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
function setChoice(choice) {
	//document.getElementById("rb_value").value = choice;
	var checked =document.getElementById("rb_moked").checked;
	
	if (choice=="moked") {
		document.getElementById("rb_moked").checked="checked";
		
		
	} else {
		document.getElementById("rb_activity").checked="checked";

	}
}
function validateCallForm(){
	if (document.getElementById("rb_moked").checked){
	if(document.forms['callFrc'].moked.value==-1){
			alert("נא לבחור מוקד");
			return;
		}
	}
	document.forms['callFrc'].submit();
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
function keyPressed(){
	if(window.event.keyCode==13){
		validateCallForm();
	}
}
</SCRIPT>
</HEAD>
<%
String moked=forecastForm.getMoked();
%>
<BODY onkeyup="keyPressed();">
	<TABLE cellpadding="0" cellspacing="0" width="100%" height="100%">
			<TR>
				<TD width="100%" valign="top">
				<FIELDSET style="border: 1px silver solid;" class="form">
				<LEGEND>בקרת שיחות</LEGEND>
				<form action="/shf/forecast/callsResult.do" name="callFrc" style="display:inline;" method="post">
				<TABLE  cellspacing="0" cellpadding="2">
					<TR>
						<TD class="header" nowrap="nowrap" valign="top">תאריך:</TD>
						<TD width="10px"></TD>
					<TD >
						<shf:calendar calname="date" name="forecastForm" property="date" />
						</TD>
						<TD width="10px"></TD>
						
						<TD class="header" valign="top">
						<shf:checkbox logic="onclick=alldayClicked(this);" inputname="allday"
						 name="forecastForm" property="allday"/> כל היום </TD>
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
						<TD width="40px"></TD>
											
					</TR>
				</table>
				<TABLE cellspacing="0" cellpadding="2">
					<TR>
						
						<TD>
						<% 
									 if (forecastForm.getRbChoice()==null) { %> <input
							id="rb_activity" type="radio" name="rbChoice" checked="checked"
							value="activity"
							onclick="setChoice(this.value);reSetMoked();setMultiActivities(this,'forecastForm','activityList');">
						<%} else {
										 if (forecastForm.getRbChoice().equals("activity")) { %> <input
							id="rb_activity" type="radio" name="rbChoice" checked="checked"
							value="activity"
							onclick="setChoice(this.value);reSetMoked();setMultiActivities(this,'forecastForm','activityList');">
						<%} else { %> <input id="rb_activity" type="radio" name="rbChoice"
							value="activity"
							onclick="setChoice(this.value);reSetMoked();setMultiActivities(this,'forecastForm','activityList');">
						<%} %> <%} %>
						</TD>
						<TD class="header" nowrap="nowrap">תור ארצי:</TD>
						<TD width="10px"></TD>

						<TD id="virtualList"><shf:virtualActivityCheckList
							name="forecastForm" property="virtualActivity" /></TD>
						<TD width="10px"></TD>
						
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
							logic="onchange=setMultiActivities(this,'forecastForm','activityList','frcstCalls');setChoice('moked');"
							emptySelection="yes" /></TD>
						<TD width="20px"></TD>
						<TD class="header">תור:</TD>
						<TD width="10px"></TD>
						<TD id="activityAjaxResult"><shf:LocalMokedCheckList
							name="forecastForm" moked="<%=moked%>" property="activityList" />
						</TD>
						<TD width="20px"></TD>
						<TD align="left">
						<button onclick="validateCallForm();">רענן</button>
						<input type="hidden" name="from" value="frcstCalls">
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
				<TD style="padding-top:6px;">
				<TABLE cellspacing="0" cellpadding="0" width="100%" style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
				
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
				<TD width="100%" height="100%" valign="top" dir="ltr">
					<div  style="height=100%;overflow:auto;border:1px silver solid;" id="dataGridDiv">
					<%if(forecastData!=null && forecastData.size()>0){%>
					<SCRIPT>
					var gridHeight=395;
					var gridbar=1;
					var myHeader=[
					
					<%if ("moked".equals(forecastForm.getRbChoice())) {	%> 
						<% if (forecastForm.getActivityList().length < 2 && !"00".equals(forecastForm.getActivityList()[0])){ %>
					"פער",
					"זמן שיחה בפועל",
					"יעד זמן שיחה",
						<%}%>
					<%} else { %>  <!-- if virtual activity -->
					<%
					if(localMokeds!=null && localMokeds.size()>0 ){
						for(int a=0;a<localMokeds.size();a++){	
							ActivityForm activity=(ActivityForm)localMokeds.get(a);
					%>
					<% if ( forecastForm.getVirtualActivity().length < 2 && !forecastForm.getVirtualActivity()[0].equals("00")){
					%>
					    "זמן שיחה בפועל "+"<br>"+" "+"<%=activity.getDescription()%>",
				
					<%}%>
					<%}}%>
					<% if ( forecastForm.getVirtualActivity().length < 2 && !forecastForm.getVirtualActivity()[0].equals("00")){
					%>
					"פער",
					"זמן שיחה בפועל ארצי",
					"יעד זמן שיחה ארצי ",
					<%}%>
					<%}%> <!-- END ELSE  -->
					"סטייה מהתחזית",
					<%if ("activity".equals(forecastForm.getRbChoice())) { %>
					"שיחות בפועל ארצי",
					<%} else {%>
					"שיחות בפועל",
					<%}%>
					<%if ("activity".equals(forecastForm.getRbChoice())) { %>
					"חיזוי שיחות ארצי",
					<%} else {%>
					"חיזוי שיחות",
					<%}%>					
					"שעה",
					"&nbsp;"
					];
					var txtColor=['#000'];
					</SCRIPT>
					
					<SCRIPT>
					
					
					
							
					var myData=[
					<%
						String nodata="<span style=color:#c0c0c0;>לא קיים</span>";
						int aConst = 0;
						int aConst2 = 0;
						if (forecastData.size()>0) {
							forecastInfo=(ForecastCallsBean)forecastData.get(0);
							aConst = forecastInfo.getMokedCallLengthList().size();
							aConst2 = forecastInfo.getMokedCallLengthList().size();
						}
						int sumForecastCallsNum = forecastForm.getSumForecastCallsNum();
						int sumCallsNum = forecastForm.getSumCallsNum();
						int sumCallVal= forecastForm.getSumCallVal();
						String sumForecastCallLength=forecastForm.getSumForecastCallLengthTime();
						String sumCallLength=forecastForm.getSumCallLengthTime();
						String sumGap=forecastForm.getSumGapTime();
						String[] handelTimeMoked=forecastForm.getSumMokedCallLengthList();
						String sumCallColor="",sumGapColor="";
						if(sumCallVal<=100){
							sumCallColor="green";
						}else if(sumCallVal>100 && sumCallVal<120){
							sumCallColor="orange";
						}else if(sumCallVal>=120){
							sumCallColor="red";
						}
						if(sumGap.contains("-")){
									sumGapColor="green";
							}else{
									sumGapColor="red";
						}
						for(int i=0;i<forecastData.size();i++){
							forecastInfo=(ForecastCallsBean)forecastData.get(i);
							int callsNum=forecastInfo.getCallsNum();
							int forecastCallsNum=forecastInfo.getForecastCallsNum();
							float callsLength=forecastInfo.getCallLength();
							int tmpcl=(int)((float)callsLength*100);
							callsLength=(float)tmpcl/100;
							float forecastCallsLength=forecastInfo.getForecastCallLength();
							String forecastCallsLengthTime=forecastInfo.getForecastCallLengthTime();
							String callsLengthTime=forecastInfo.getCallLengthTime();
							String gap=forecastInfo.getGapTime();
							String callVal=nodata,lengthVal=nodata;
							String callColor="",lengthColor="";
							
							
							
							if(forecastCallsNum>0){
								float ratio=(float)callsNum/forecastCallsNum;
								ratio*=100;
								ratio = forecastInfo.getGapFromForecast();
								callVal=String.valueOf((int)ratio);
								if((int)ratio<=100)
									callColor="green";
								else if((int)ratio>100 && ratio <120)
									callColor="orange";
								else if((int)ratio>=120)
									callColor="red";
							} else {
								callVal = "0";

							}
							//if(forecastCallsLength>0){
							//	float ratio=callsLength/forecastCallsLength;
							//	ratio*=100;
							//	lengthVal=String.valueOf((int)ratio);
							//	if((int)ratio<100)
							//		lengthColor="green";
							//	else if((int)ratio>100 && ratio <120)
							//		lengthColor="orange";
							//	else if((int)ratio>=120)
							//		lengthColor="red";
							//}
							float ratio=(callsLength - forecastCallsLength);
							
							//if(ratio>0){
								//alert ( callsLength);
								//alert ( forecastCallsLength);
							    //var ratio1 = callsLength;
							    
							 
							   // alert (ratio);
							   // float ratio=callsLength - forecastCallsLength;
								//lengthVal = ratio;
							if(gap.contains("-")){
									lengthColor="green";
							}else{
									lengthColor="red";
							}
							
							Vector localCalls=forecastInfo.getMokedCallLengthList();
						    %>
						     
							
							[<%if(localCalls!=null ){
								
								for(int a=0;a<aConst;a++){
								ActivityCallsForm localActivity= new ActivityCallsForm();
								if (localCalls.size()>0) {	
										localActivity=(ActivityCallsForm)localCalls.get(a);
									} else {
									 	localActivity.setHandleTimeString("00:00");
									}
							%>							
							<%if ("activity".equals(forecastForm.getRbChoice())){ %>   <%--Igal 5.2013 --%>
								<% if ( forecastForm.getVirtualActivity().length < 2 && !forecastForm.getVirtualActivity()[0].equals("00")){
								%>
								'<%=localActivity.getHandleTimeString()%>',
								<%}%>
							<%}%>							
							<%}} %>
							
							<%if ("activity".equals(forecastForm.getRbChoice())) { %>
								<%if ( forecastForm.getVirtualActivity().length <2 && !forecastForm.getVirtualActivity()[0].equals("00")){%>
						        		'<font color="<%=lengthColor%>"><%=gap%></font>',
										'<%=callsLengthTime%>',
										'<%=forecastCallsLengthTime!=null?String.valueOf(forecastCallsLengthTime):nodata%>',
								<%}%>
							<%} else { %>
							
							<% if ("moked".equals(forecastForm.getRbChoice())) { %>    <%--Igal 5.2013 --%>
									<%if(forecastForm.getActivityList().length<2 && !"00".equals(forecastForm.getActivityList()[0])) { %>
										'<font color="<%=lengthColor%>"><%=gap%></font>',
										'<%=callsLengthTime%>',
										'<%=forecastCallsLengthTime!=null?String.valueOf(forecastCallsLengthTime):nodata%>',
									<%}%>
								<%}%>
							<%}%>
							
							
							'<font color="<%=callColor%>"><%=callVal%></font>',
							'<%=callsNum%>',
							'<%=forecastInfo.getForecastCallsNum()>0?String.valueOf(forecastInfo.getForecastCallsNum()):nodata%>',
							'<shf:shftime date="<%=forecastInfo.getTime()%>" />',
							'<%=i%5==0?"<div id=divid"+i+"><B>+</B></div>":""%>'
							<%=i%5==0?",'','','"+(i/5)+"'":",'','"+(i/5)+"'"%>]
							
						
						
						
						
						<%if(i<forecastData.size()-1){%>,<%}}%>,[	
						
						<%if ("activity".equals(forecastForm.getRbChoice())){ %>  
						<% if ( forecastForm.getVirtualActivity().length < 2 && !forecastForm.getVirtualActivity()[0].equals("00")){ %>
							 <%	if(aConst2 >0 ){
									for(int a=0;a<aConst2;a++){
								%>	
									
								'<%=handelTimeMoked[a]%>',
								<%}}%>
							  '<font color="<%=sumGapColor%>"><%=sumGap%></font>',	
							  '<%=sumCallLength%>',
							  '<%=sumForecastCallLength%>',
							  <%}%>
						  <%} else { %>
						  	<%if ("moked".equals(forecastForm.getRbChoice())) {	%>  <%--Igal 5.2013 --%>
								<% if (forecastForm.getActivityList().length < 2 && !"00".equals(forecastForm.getActivityList()[0])){ %>
									'<font color="<%=sumGapColor%>"><%=sumGap%></font>',	
							  		'<%=sumCallLength%>',
								  	'<%=sumForecastCallLength%>',
						  		<%}%>
						  	<%}%>
						  <%}%>
						  
						  '<font color="<%=sumCallColor%>"><%=sumCallVal%></font>',
						  '<%=sumCallsNum%>',
						  '<%=sumForecastCallsNum%>',
						'סה"כ']];
							drawGrid3('dataGridDiv');
						</SCRIPT>
						<%
					}
					else{
					%>
					<div class="gridNoData">אין נתונים</div>
					<%} %>
					</div>
					</TD>
					</TR>
					</TABLE>
				
</BODY>
</HTML>