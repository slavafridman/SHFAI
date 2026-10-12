<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="employeeData" class="bzq.shf.forms.EmployeeDataForm"
	scope="request">
</jsp:useBean>

<jsp:useBean id="skill" class="bzq.shf.bean.EmployeeSkillBean"
	scope="request">
</jsp:useBean>

<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="bzq.shf.utils.SHFParameters"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<SCRIPT language="JavaScript" src="/shf/js/shftabs.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>

<TITLE>emoloyee_card.jsp</TITLE>
<SCRIPT>
function updown(){
	try{
	hideDisplay('personalDetailsTable');
	}catch(e){}
	try{
	hideDisplay('orgUnitDetails');
	}catch(e){}
	try{
	hideDisplay('leftsidetable');
	}catch(e){}	
}

function changeNumOfBreaks(){
	
	var num;
	num=document.forms['addShiftForm'].breaksNumber.value;
	
	if(num==1){
		document.getElementById("break1").style.display='';
		document.getElementById("break2").style.display='none';
		document.getElementById("break3").style.display='none';
	}else if(num==2){
		document.getElementById("break1").style.display='';
		document.getElementById("break2").style.display='';
		document.getElementById("break3").style.display='none';
	}else if(num==3){
		document.getElementById("break1").style.display='';
		document.getElementById("break2").style.display='';
		document.getElementById("break3").style.display='';
	}else{
		document.getElementById("break1").style.display='none';
		document.getElementById("break2").style.display='none';
		document.getElementById("break3").style.display='none';
	}
}

function toggleSwitchSMS(empId, inputObj) {
	if ( ! confirm("? האם לעדכן את הפרמטר")) {
		if (inputObj.checked) {
			inputObj.checked = false;
		} else {
			inputObj.checked = true;
		}
		return;
	}
	try{
		xmlHttp=new XMLHttpRequest();
	}
	catch (e){
		try{
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");
		}catch (e){
			try{
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");
			}catch (e){
				alert("Your browser does not support AJAX!");      
				return false;      
			}
		}  
	}
	xmlHttp.onreadystatechange = function() {
		if ( xmlHttp.readyState == 4 && xmlHttp.status != 200 ) {
			if (inputObj.checked) {
				inputObj.checked = false;
			} else {
				inputObj.checked = true;
			}
			alert("הפעולה נכשלה");
		} else if ( xmlHttp.readyState == 4 && xmlHttp.status == 200 ) {
			alert("הפרמטר עודכן בהצלחה");
		}
	};
	xmlHttp.open("GET","/shf/employee/updateParamSMS.do?idNumber="+empId+"&receiveSwitchSMS="+(inputObj.checked ? "true" : "false"));
	xmlHttp.send(null);
}
</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<%
String idNumber = employeeData.getIdNumber();
String picName = "";
if(idNumber.length()>=8)
	picName = idNumber.substring(0,8);
int manager = employeeData.getManagerId();
String managerName = employeeData.getManagerName();

String statusDesc ="";
if(employeeData.getStatusId()==SHFConstants.EMPLOYEE_STATUS_TEMP)
	statusDesc= "לא פעיל זמנית";
else if(employeeData.getStatusId()==SHFConstants.EMPLOYEE_STATUS_INACTIVE)
	statusDesc="לא פעיל";
else if(employeeData.getStatusId()==SHFConstants.EMPLOYEE_STATUS_ACTIVE)
	statusDesc="פעיל";

String mokedCode =bzq.shf.utils.SHFTableUtils.getMokedCodeOf(employeeData.getOrgUnitId());

int locked = employeeData.getLocked();
int taxiallowed = employeeData.getTaxiAllowed();
int trained = employeeData.getTrained();
int replaceallowed = employeeData.getReplaceAllowed();
int workFromHome = employeeData.getWorkFromHome();
int ctiToSap=0,ctiToSapMode=0;
if("1".equals(employeeData.getOptional1())){
	ctiToSap=1;
}
if("1".equals(employeeData.getOptional2())){
	ctiToSapMode=1;
}
String smsAgafAllowed = SHFParameters.getAgafSendSwitchOfferSMS(SHFTableUtils.getAgafCodeOf(employeeData.getOrgUnitId())).getValue();
%>

<BODY>

<div id="loadingImgDiv" style="overflow:hidden; text-align:center; position: absolute; width: 100%; height: 100%; z-index: 200; background: white; filter: alpha(opacity=80); top: 1px; left: 1px; display: none;">
	<div style="vertical-align: middle; width: 200px; height: 200px; z-index: 500; border: 1px solid grey; margin-top:17%;">
		<span class="helper"></span>
		<img  alt="...המתן" src="/shf/images/wait.gif" style="width: 35%; vertical-align: middle;">
	</div>
	<div style="vertical-align: middle; width:256px;">נא להמתין בעת סנכרון עם מע' סופטפון</div>
	<span class="helper"></span>
</div>

<script type="text/javascript">
var selectedRow=<%=employeeData.getEmployeeId()%>;
</script>

<div id="popupDiv" style="display:none;" class="divPopup"></div>

<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TR>
		<TD colspan="3" style="height:20px" valign="top" dir="rtl"><jsp:include
			page="submenu/employee_submenu.jsp" /></TD>
	</TR>
	<TR>
		<TD height="100%" style="width:170px;overflow:visible" align="left"
			valign="top" id="leftsidetable">
		<TABLE width="100%">
			<TR>
				<TD align="center" valign="top">
				<IMG src="http://pic.bezeq.com/bezeqpic/<%=picName%>.JPG" class="empimg">
				</TD>
			</TR>
			<shf:security activity="card_personal_data">
			<TR>
				<TD valign="top" align="left" width="100%">
				<fieldset class="info">
				<legend><img src="/shf/images/pin.jpg" height="23px"> הגדרות עובד</legend>
				<TABLE align="right" width="100%">
					<TBODY>
						<TR>
							<TD class="header">עובד נעול</TD>
							<TD class="data"><img src="/shf/images/<%=locked>0?"true":"false"%>.gif"></TD>
						</TR>
						<!--TR>
							<TD class=header>משתמש במוניות</TD>
							<TD class=data><img src="/shf/images/<%=taxiallowed>0?"true":"false"%>.gif"></TD>
						</TR-->
						<TR>
							<TD class="header">משתמש בהחלפות</TD>
							<TD class="data"><img src="/shf/images/<%=replaceallowed>0?"true":"false"%>.gif"></TD>
						</TR>
						<TR>
							<TD class="header">נציג מסורתי</TD>
							<TD class="data"><img src="/shf/images/<%=trained==0?"true":"false"%>.gif"></TD>
						</TR>
						<TR>
							<TD class="header">סטטוס עובד:</TD>
							<TD class="data" style="font-size:12px;"><%=statusDesc%></TD>
						</TR>
						<TR>
							<TD class="header" dir="rtl">מועבר ל SAP</TD>
							<TD class="data"><img src="/shf/images/<%=ctiToSap>0?"true":"false"%>.gif"></TD>
						</TR>
						<TR>
							<TD class="header" dir="rtl">העברה ל SAP:</TD>
							<TD class="data"><%=ctiToSapMode>0?"ידנית":"אוטומטית"%></TD>
						</TR>
						<TR>
							<TD class="header">עובד מהבית</TD>
							<TD class="data"><img src="/shf/images/<%=workFromHome>0?"true":"false"%>.gif"></TD>
						</TR>
					</TBODY>
				</TABLE>
				<% if (Boolean.parseBoolean(smsAgafAllowed)) { %>
				</fieldset>
				<fieldset class="info">
					<legend><img src="/shf/images/pin.jpg" height="23px"> הגדרות שלי</legend>
					<table>
						<tbody>
							<tr>
								<td class="header">קבלת SMS בהחלפות</td>
								<td class="data"><input type="checkbox" id="sms<%=idNumber%>" onclick="toggleSwitchSMS('<%=idNumber%>', this);" <%= employeeData.getReceiveSwitchSMS().equals("1") == true ? "checked" : ""%> value="<%= employeeData.getReceiveSwitchSMS().equals("1") == true ? "1" : "0"%>"></td>
							</tr>
						</tbody>
					</table>
				</fieldset>
				<% } %>
				</TD>
			</TR>
			<TR id="empTelephones">
				<TD align="left" valign="top">
				<fieldset class="info"><legend>טלפונים</legend>
				<TABLE width="100%">
					<TBODY>
						<%if(employeeData.getPhoneHome()!=null){%>
						<TR>
							<TD class="header" align="right">בית:</TD>
							<TD class="data"><bzq:string name="employeeData"
								property="phoneHome" /></TD>
						</TR>
						<%}if(employeeData.getPhoneCellular()!=null){%>
						<TR>
							<TD class="header" align="right">נייד:</TD>
							<TD class="data"><bzq:string name="employeeData"
								property="phoneCellular" /></TD>
						</TR>
						<%}if(employeeData.getPhoneWork()!=null){%>
						<TR>
							<TD class="header" align="right">עבודה:</TD>
							<TD class="data"><bzq:string name="employeeData"
								property="phoneWork" /></TD>
						</TR>
						<%}if(employeeData.getBenzoogTel()!=null){%>
						<TR>
							<TD class="header" align="right" valign="top">בן זוג:</TD>
							<TD class="data">
							<bzq:string name="employeeData" property="benzoogTel" />
							<br><bzq:string name="employeeData" property="benzoogName" />
							</TD>
						</TR>
						<%}%>
					</TBODY>
				</TABLE>
				</fieldset>
				</TD>
			</TR>
			</shf:security>
			<shf:security activity="admin_emparam_view">
			<TR>
				<TD dir="rtl" valign="middle">
					<FIELDSET class="info">
					<img src="/shf/images/upd_param.png">
					<a class="header" style="cursor:hand;" onclick="javascript:navigate('/shf/admin/viewEmployeeParameters.do?employeeId=<%=employeeData.getEmployeeId()%>');">עדכון פרמטרים</a>
					</FIELDSET>
				</TD>
			</TR>
			</shf:security>
			
		</TABLE>
		</TD>

		<TD valign="top" height="100%">
		<TABLE width="100%" height="100%">
			<TBODY>
			<shf:security activity="card_personal_data">
				<TR>
					<TD valign="top" id="personalDetailsTable" style="padding-right:4px">
					<fieldset class="info"><legend><img src="/shf/images/pin.jpg"
						height="23px"> פרטים אישיים</legend>
					<TABLE width="100%" height="100%">
						<TBODY>
							<TR>
								<TD align="right" valign="top">
								<TABLE>
									<TBODY>
										<TR>
											<TD class="header" valign="top">שם פרטי:</TD>
											<td width=10px></td>
											<TD class="data" valign="top"><bzq:string name="employeeData"
												property="fname" /></TD>
											<td width=20px></td>
											<TD class="header" valign="top">שם משפחה:</TD>
											<td width=10px></td>
											<TD class="data" valign="top"><bzq:string name="employeeData"
												property="lname" /></TD>
											<td width=20px></td>
											<TD class="header" valign="top">ת.ז.:</TD>
											<td width=10px></td>
											<TD class="data" valign="top"><bzq:string name="employeeData"
												property="idNumber" /></TD>

										</TR>
										<TR>
											<TD class="header" valign="top">מס' עובד:</TD>
											<td width=10px></td>
											<TD class="data" valign="top"><bzq:integer name="employeeData"
												property="employeeId" pattern="#" /></TD>
											<td width=20px></td>
											<TD class="header" valign="top">מין:</TD>
											<td width=10px></td>
											<TD class="data" valign="top"><bzq:string name="employeeData"
												property="gender" /></TD>
											<td width=20px></td>
											<TD class="header" valign="top">תאריך לידה:</TD>
											<td width=10px></td>
											<TD class="data" valign="top"><bzq:date name="employeeData"
												property="birthDate" pattern="dd/MM/yyyy"></bzq:date></TD>

										</TR>

										<TR>
											<TD class="header" valign="top">עיר/ישוב:</TD>
											<td width=10px></td>
											<TD class="data" valign="top"><bzq:string name="employeeData"
												property="city" /></TD>
											<td width=20px></td>
											<TD class="header" valign="top">מיקוד:</TD>
											<td width=10px></td>
											<TD class="data" valign="top"><bzq:integer name="employeeData"
												property="zipCode" pattern="#" /></TD>
											<td width=20px></td>
											<TD class="header">חלקיות משרה:</TD>
											<td width=10px></td>
											<TD class="data"><bzq:integer name="employeeData"
												property="jobTime" /></TD>
											<!--TD class="header" valign="top">מצב משפחתי:</TD>
											<TD class=data valign="top"><bzq:string name="employeeData"
												property="socialStatus" /></TD-->

										</TR>
										<TR>
											<TD class="header" valign="top">כתובת:</TD>
											<td width=10px></td>
											<TD class="data" colspan="6" valign="top"><bzq:string
												name="employeeData" property="address" /></TD>
										</TR>
										<%if(!org.apache.commons.validator.GenericValidator.isBlankOrNull(employeeData.getEmail())){%>
										<TR>
											<TD class="header" valign="top">דוא"ל:</TD>
											<td width=10px></td>
											<TD class="data" colspan="6" valign="top" >
											<a style="color:#6666cc;" href="mailto:<bzq:string name="employeeData" property="email" />"><bzq:string name="employeeData" property="email" /></a>
											</TD>
										</TR>
										<%}if(employeeData.getTaxiAllowed() > 0 && employeeData.getMonitAddress() != null) {%>
										<TR>
											<TD class="header" valign="top">כתובת הסעה:</TD>
											<td width=10px></td>
											<TD class="data" colspan="4" valign="top"><bzq:string
												name="employeeData" property="monitAddress" /></TD>
										</TR>
										<%}%>
									</TBODY>
								</TABLE>
								</TD>
							</TR>
						</TBODY>
					</TABLE>
					</fieldset>
					</TD>
				</TR>
				</shf:security>
				<shf:security activity="card_orgunit_data">
				<TR>
					<TD valign="top" id="orgUnitDetails" style="padding-right:4px">
					<fieldset class="info" dir="rtl"><legend><img
						src="/shf/images/pin.jpg" height="23px"> שיוך ארגוני</legend>
					<TABLE width="100%">
						<TBODY>

							<TR>
								<TD class="header">צוות\יחידה:</TD>
								<TD class="data"><shf:tables tableName="unitCode"
									codeName="<%=String.valueOf(employeeData.getOrgUnitId())%>" /></TD>
								<TD width="10"></TD>
								<TD class="header">מנהל ישיר:</TD>
								<TD class="data">
								<%if(employeeData.getAllowedActivities().contains("card_manager_link")){%>
								<shf:employee empid="<%=manager%>" empname="<%=managerName%>" />
								<%}else{%>
								<%=managerName%>
								<%}%>
								</TD>
							</TR>
							<TR>
								<TD class="header">מוקד:</TD>
								<TD class="data"><shf:tables tableName="unitCode"
									codeName="<%=mokedCode%>" /></TD>
								<TD width="10"></TD>
								<TD class="header">תפקיד:</TD>
								<TD class="data"><shf:tables tableName="jobCode"
									codeName="<%=employeeData.getJobId()%>" /></TD>
							</TR>
							<TR>
								<TD class="header">סוג חוזה:</TD>
								<TD class="data"><bzq:string name="employeeData"
									property="contractDesc" /></TD>
								<TD width="10"></TD>
								<TD class="header">תפקיד בפועל:</TD>
								<TD class="data"><shf:tables scope="request" tableName="innerJobCode" name="employeeData"
									property="innerJobId" /></TD>
							</TR>
							<TR>
								<TD class="header">קליטה לבזק:</TD>
								<TD class="data"><bzq:date name="employeeData"
									property="bezeqStartDate" pattern="dd/MM/yyyy"></bzq:date></TD>
								<TD width="10"></TD>
								<TD class="header">קליטה למוקד:</TD>
								<TD class="data"><bzq:date name="employeeData"
									property="mokedStartDate" pattern="dd/MM/yyyy"></bzq:date></TD>
							</TR>

						</TBODY>
					</TABLE>
					</fieldset>
					</TD>
				</TR>
				</shf:security>
				<TR>
					<TD dir="rtl" valign="top" height="100%" style="padding-right:4px">

					<table height="100%" width="100%" cellpadding="0" cellspacing="0">
						<TR>
							<TD id="mytabsdiv">
								<SCRIPT language="JavaScript">
										var titles=["פעילויות","כישורים","אירועים חריגים","הסעות"];
										var actions=['actForm','eduForm','evntForm','taxiForm'];
							
										drawTabs(titles,actions,"tabcontentdiv");
										
								</SCRIPT>
							</TD>
							<td style="text-align: right">
								<img src="/shf/images/updown.gif" style="cursor: hand" onclick="updown();">
							</TD>
						</TR>

						<TR>
							<TD colspan="2" width="100%" class="tabcontentdiv" valign="top">
							<IFRAME scrolling="no" height="100%" 
									width="100%" frameborder="0"
									name="tabcontentFrame" height="100%"  src="/shf/jsp/chooseOption.jsp">
									
							</IFRAME>
							</TD>
						</TR>
					</TABLE>

					</TD>
				</TR>
			</TBODY>
		</TABLE>
		</TD>
	</TR></TABLE>

<form id="actForm" action="/shf/employee/getDays.do"
	target="tabcontentFrame"><input type="hidden" name="employeeId"
	value="<bzq:integer name="employeeData" property="employeeId" pattern="#"/>">
</form>

<form id="eduForm" action="/shf/employee/getEducation.do"
	target="tabcontentFrame"><input type="hidden" name="employeeId"
	value="<bzq:integer name="employeeData" property="employeeId" pattern="#"/>">
</form>

<form id="evntForm" method="post" action="/shf/employee/getEvents.do" target="tabcontentFrame">
	<input type="hidden" name="employeeId" value="<bzq:integer name="employeeData" property="employeeId" pattern="#"/>">
</form>

<form id="taxiForm" action="/shf/employee/getTaxiOrders.do"
	target="tabcontentFrame"><input type="hidden" name="employeeId"
	value="<bzq:integer name="employeeData" property="employeeId" pattern="#"/>">
</form>

</BODY>
</HTML>
