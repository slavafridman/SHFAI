<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.bean.AgentDayBean"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<jsp:useBean id="shiftDataForm" class="bzq.shf.forms.ShiftDataForm" scope="request"></jsp:useBean>
<jsp:useBean id="firstDay" class="bzq.shf.bean.AgentDayBean" scope="request"></jsp:useBean>
<jsp:useBean id="switchForm" class="bzq.shf.forms.SwitchForm" scope="request"></jsp:useBean>
	
<HTML>
<HEAD>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
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
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>replace_shift.jsp</TITLE>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT>
function setTeamEmp(){
	var moked;
	var xmlHttp;
	moked=document.getElementsByName("moked")[0].value;
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
	xmlHttp.onreadystatechange=function(){
		if(xmlHttp.readyState==4){
			document.getElementById("teamsAjaxResult").innerHTML=xmlHttp.responseText;
		}
	}
	xmlHttp.open("GET","/shf/jsp/set_team_emps.jsp?moked="+moked,true);
	xmlHttp.send(null);	
}

function setEmps(){
	var team;
	var xmlHttp;
	document.getElementById("employeesAjaxResult").innerHTML="<img src='/shf/images/wait.gif'>";
	team=document.getElementsByName("team")[0].value;
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
	xmlHttp.onreadystatechange=function(){
		if(xmlHttp.readyState==4){
			document.getElementById("employeesAjaxResult").innerHTML=xmlHttp.responseText;
		}
	}
	xmlHttp.open("GET","/shf/employee/getTeamMembers.do?team="+team,true);
	xmlHttp.send(null);	
}

function viewShiftsForSwitch(){
	var emp;
	emp=employeeSwitchForm.employeeId.options[employeeSwitchForm.employeeId.options.selectedIndex].value;
	document.getElementById("shiftsAjaxResult").innerHTML="<div width=100% align=center><img style='text-align:center;height:40px;' src='/shf/images/wait.gif'></div>";
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
	xmlHttp.onreadystatechange=function(){
		
		if(xmlHttp.readyState==4){
			//alert(xmlHttp.responseText);
			document.getElementById("shiftsAjaxResult").innerHTML=xmlHttp.responseText;
		}
	}
	xmlHttp.open("GET","/shf/employee/getShiftsForSwitch.do?employeeId="+emp,true);
	xmlHttp.send(null);	
}

function doSwitch(){
	var sbDiv;
	sbDiv=document.getElementById("wait");
	sbDiv.innerHTML="נא להמתין...";
	document.forceSwitchForm.submit();
	
}
function conSwitchFalse(){
		var sbDiv;
		sbDiv=document.getElementById("standBy");
		sbDiv.innerHTML="...החלפה בוטלה, נא להמתין";
		document.location="/shf/switch/usrCancelForcedSwitch.do";
		
	
}
function conSwitchTrue(){
	
		var sbDiv;
		sbDiv=document.getElementById("standBy");
		sbDiv.innerHTML="...החלפה מתבצעת, נא להמתין";
		document.location="/shf/switch/forceSwitch.do";
	
}

</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<%
long agentDayId=shiftDataForm.getAgentDayId();
String moked=shiftDataForm.getAllowedMoked();
%>
<BODY>
<%if ("false".equals(request.getSession(false).getAttribute("switchLimit")) || request.getSession(false).getAttribute("switchLimit")==null){ %>

<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TBODY>
		<TR>
			<TD dir="rtl" valign="top" width="100%"><jsp:include
				page="submenu/shift_submenu.jsp" /></TD>
		</TR>

		<TR>
			<TD dir=rtl width=100% height="100%" valign="top" style="padding: 7px 7px 7px 7px">
			<TABLE width="100%" cellpadding="0" cellspacing="0">
				<TR>
					<TD valign="top" height="100%">
					<FIELDSET>
					<LEGEND>החלפת משמרת</LEGEND>
					<TABLE width=100% height="100%" cellpadding="0" cellspacing="0">
						<TBODY>
							<TR>
								<TD width="100%" height="100%" colspan=12 valign="top">
									<TABLE dir="rtl" cellpadding="2" cellspacing="2">
										<TR>
											<TD class=header colspan=4>משמרת ראשונה:</TD>
										</TR>
										<TR>
											<TD class=header>שם העובד:</TD>
											<TD width="10px"></TD>
											<TD class=data align="right"><%=firstDay.getFirstName()+" "+firstDay.getLastName()%></TD>
											<TD width="30px"></TD>
											<TD class=header>תאריך:</TD>
											<TD width="10px"></TD>
											<td><%=BaseConvert.dateToString(firstDay.getShiftStart(),"dd/MM/yyyy") %>
											<TD width="30px"></TD>
											<TD class=header>זמן משמרת:</TD>
											<TD width="10px"></TD>
											<TD>
												<shf:shftime date="<%=firstDay.getShiftStart()%>"/>
												-
												<shf:shftime date="<%=firstDay.getShiftEnd()%>"/>
											</TD>
											<TD width="30px"></TD>
											<TD class=header>תפקיד בפועל:</TD>
											<TD width="10px"></TD>
											<TD><%=bzq.shf.utils.SHFTableUtils.getInnerJobName(firstDay.getInnerJobId())%></TD>
										</TR>
									</TABLE>
								</TD>
							</TR>
							<TR>
								<TD colspan=12 height="20px" valign="middle"><hr></TD>
							</TR>
							<TR>
								<TD class=header colspan=6>בחר משמרת שניה:</TD>
							</TR>
							<TR>
								<TD height="5px"></TD>
							</TR>
							<TR style="padding-bottom:10px;">
								<TD class=header>מוקד:</TD>
								<TD width=10px></TD>
								
								<TD class=data><shf:unitselect tablename="unitCode" name="moked"
									style="width:170px;font-size:10px;" type="G01" all="yes"
									logic="onchange='setTeamEmp();'" selectedProperty="allowedMoked" selectedName="shiftDataForm"/></TD>
								<TD width=10px></TD>
								
								
								<TD class=header>צוות:</TD>
								<TD width=20px></TD>
								
								<TD class=data id="teamsAjaxResult">
								
								<%if(moked==null||moked.equals("-1")){ %>
									<shf:unitselect tablename="unitCode" name="team"
									style="width:170px;font-size:10px;" type="999" logic="disabled" />
								<%}else{ %> <shf:unitselect tablename="unitCode" name="team"
									style="width:170px;font-size:10px;"
									type="<%=bzq.shf.utils.SHFConstants.TEAM_UNIT%>" emptySelection="yes"
									parentunit="<%=moked%>" logic="onchange='setEmps();'" /> <%}%>
								
								</TD>

								<TD width=20px></TD>

								<TD class=data id="employeesAjaxResult"></TD> <%-- Employee names שם העובד --%>
								
		
						</TBODY>
					</TABLE>
					</FIELDSET>
					</TD>
				</TR>
				<TR>
					<TD valign="top" height="100%">
						<form action="/shf/switch/check.do" name="forceSwitchForm">
							<input type="hidden" name="firstDayId" value="<%=agentDayId%>">
							<TABLE cellpadding="0" cellspacing="0" height="100%" width="100%">
								<TR>
									<TD valign="top" id="shiftsAjaxResult"></TD> <%-- List of available shifts for switch --%>
								</TR>
								
							</TABLE>
						</form>
					</TD>
				</TR>
			</TABLE>
			</TD>
		</TR>

	</TBODY>

</TABLE>
	<%} else { %>
	<div id="standBy" style="text-align: right; font-size: 20px; color: navy;"></div>
	<script type="text/javascript">
	if(confirm("<%=switchForm.getMessage()%>")){
		conSwitchTrue();
	} else {
		conSwitchFalse();
	}
	</script>
	
	<%} %>

</BODY>
</HTML>
