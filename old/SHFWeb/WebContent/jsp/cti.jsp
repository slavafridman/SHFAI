<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<jsp:useBean 
	id="completionForm"
	class="bzq.shf.forms.CTICompletionForm" 
	scope="request">
</jsp:useBean>
<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>


<html>
<head>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<title>cti</title>
<script type="text/javascript">
function submitCompletionForm(){
	var shiftData=document.getElementsByName("shiftData")[0].checked;
	var unitData=document.getElementsByName("unitData")[0].checked;
	var personalData=document.getElementsByName("personalData")[0].checked;
	if(!(personalData || unitData || shiftData)){
		alert("נא לסמן חיפוש לפי אופציה אחת לפחות");
		return;
	}
	document.forms['completionForm'].submit();
}

function keyPressed(){
	if(Number(window.event.keyCode)==13){
		submitCompletionForm();
	}
}

function shiftDataCheck(e){
	if(e.checked){
		document.getElementsByName("byShiftStart")[0].disabled=false;
		document.getElementsByName("byShiftEnd")[0].disabled=false;
		document.getElementsByName("byShiftActivity")[0].disabled=false;
		document.getElementsByName("shiftDate")[0].disabled=false;
	}
	else{
		document.getElementsByName("byShiftStart")[0].disabled=true;
		document.getElementsByName("byShiftEnd")[0].disabled=true;
		document.getElementsByName("byShiftActivity")[0].disabled=true;
		document.getElementsByName("shiftDate")[0].disabled=true;
	}
}

function agafChanged (agafObj) {
	var callBack = false;
	if (agafObj.value === '-1') {
		document.getElementsByName("moked")[0].value = '-1';
	} else {
		callBack = 'setTeams';
	}
	setMokeds(<%= (completionForm.getCtiAllowedMoked() == null ? "null" : completionForm.getCtiAllowedMoked()) %>,callBack);
	if ( ! callBack) {
		setTeams();
	}

}

</script>
<shf:reloadErrors></shf:reloadErrors>
</head>
<%
String moked = completionForm.getMoked() == null ? (completionForm.getCtiAllowedMoked() == null ? null : completionForm.getCtiAllowedMoked()) : completionForm.getMoked();
String agaf = completionForm.getAgaf() == null ? (completionForm.getCtiAllowedMoked() == null ? null : SHFTableUtils.getAgafCodeOf(completionForm.getCtiAllowedMoked())) : completionForm.getAgaf();
String allowedMoked = completionForm.getCtiAllowedMoked() == null ? "onchange='setMokeds();setTeams();'" : "onchange='setMokeds("+completionForm.getCtiAllowedMoked()+");setTeams();'";

%>
<body onkeyup="keyPressed();">
	<form action="/shf/completion/result.do" name="completionForm">
	<input type="hidden" name="ctiAllowedMoked" value="<%=completionForm.getCtiAllowedMoked() %>">
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height:20px;"><jsp:include page="submenu/cti_submenu.jsp"></jsp:include> </TD>
		</TR>			
		<TR>
			<TD width="100%" valign="top" style="padding-top: 3px; padding-bottom: 5px; padding-right: 6px; padding-left: 6px;">
				<FIELDSET class="form">
				<legend>חיפוש עובדים</legend>
				
				<TABLE cellspacing="2" cellpadding="2" width="100%">
					<TR>
					<TD valign="top" style="padding:5px;">
					<shf:checkbox inputname="personalData" name="completionForm" property="personalData" checked="<%=completionForm.isPersonalData()?1:0%>"/>
					<span class="bigHeader"><u>לפי פרטים אישיים:</u></span>
					<br>
					<TABLE cellspacing="0" cellpadding="2" style="margin-top:10px;">
					<TBODY>
						<TR>
							<TD class="header">שם פרטי:</TD>
							<TD class="data">
							<html:text property="first_name" name="completionForm" styleClass="formInput"></html:text>
							</TD>
							
							<TD width="20px"></TD>
						
							<TD class="header">שם משפחה:</TD>
							<TD class="data">
							<html:text property="last_name" name="completionForm" styleClass="formInput"></html:text>
							</TD>
							
							<TD width="20px"></TD>
						
						
							<TD class="header">תעודת זהות:</TD>
							<TD class="data">
							<html:text property="id_number" name="completionForm" styleClass="formInput"></html:text>
							</TD>
							
						</TR>
						
						
					</TBODY>
					</TABLE>
					</TD>
					</TR>
					
					<TR>
					<TD valign="top" style="padding:5px;">
						<shf:checkbox inputname="unitData" name="completionForm" property="unitData" checked="<%=completionForm.isUnitData()?1:0%>"/>
					<span class="bigHeader"><u>לפי שיוך ארגוני:</u></span>
					<br>
					<TABLE cellspacing="0" cellpadding="2" style="margin-top:10px;">
					<TBODY>
						<TR>
							<TD class="header">אגף:</TD>
							<TD class="data">
							<%if (completionForm.getCtiAllowedMoked() == null) { %>
							
								<shf:unitselect tablename="unitCode" name="agaf"
								selectedName="completionForm" selectedProperty="agaf"
								style="width:170px;font-size:10px;" type="E01" all="yes"
								logic="onchange='agafChanged(this);'"/>
							<%} else { %>
								<shf:unitselect tablename="unitCode" name="agaf"
								selectedName="completionForm" selectedProperty="agaf"
								style="width:170px;font-size:10px;" type="E01" all="yes"
								logic="onchange='agafChanged(this);'" selectedvalue="<%=agaf %>"/>
							<%} %>
							
							</TD>
							
							<TD width="20px"></TD>
						
							<TD class="header">מוקד:</TD>
							<TD class="data" id="mokedsAjaxResult">
							<% if (completionForm.getCtiAllowedMoked() == null) { %>
								<% if(agaf==null){ %>
									<shf:unitselect tablename="unitCode" name="moked"
									style="width:170px;font-size:10px;" type="G01" all="yes"
									type="999" logic="disabled"/>
								<%} else {%>
									<shf:unitselect tablename="unitCode" name="moked"
									selectedName="completionForm" selectedProperty="moked"
									style="width:170px;font-size:10px;" type="G01" all="yes"
									logic="onchange='setTeams();setActivities(this,1);'" parentunit="<%=agaf%>"/>
								<%} %>
							 <%} else { %>
							 	<% if(agaf==null){ %>
									<shf:unitselectSinlgeMoked name="moked" mokedUnitId="<%=completionForm.getCtiAllowedMoked() %>" style="width:170px;font-size:10px;" disabled="disabled"/>
								<% } else { %>
									<shf:unitselectSinlgeMoked name="moked" mokedUnitId="<%=completionForm.getCtiAllowedMoked() %>" logic="onchange='setTeams();setActivities(this,1);'" style="width:170px;font-size:10px;"/>
								<% } %>
							<% } %>
							</TD>
						</TR>
		
						<TR>
							<TD class="header">צוות:</TD>
							<TD class="data" id="teamsAjaxResult">
							<%if(moked==null||moked.equals("-1")){%>
							<shf:unitselect tablename="unitCode" name="team"
							selectedName="completionForm" selectedProperty="team"
							style="width:170px;font-size:10px;" type="999" logic="disabled" />
							<%}else{%>
							<shf:unitselect tablename="unitCode" name="team"
							selectedName="completionForm" selectedProperty="team"
							style="width:170px;font-size:10px;" type="J01" all="yes" parentunit="<%=moked%>" />
							<%}%>
							</TD>
						
							<TD width="20px"></TD>
							
							<TD class="header">תפקיד:</TD>
							<TD class="data"><bzq:select name="job" tablename="jobCode"
								selectedName="completionForm" selectedProperty="job"
								all="yes" style="width:170px;font-size:10px;" /></TD>
							
							
						</TR>
						<TR>
							<TD class="header">סטטוס:</TD>
							<TD class="data">
								<select name="statusId" style="width:110px;font-size:10px;">
									<option value="0" <%=completionForm.getStatusId()==0?"selected":""%> >הכל</option>
									<option value="3" <%=completionForm.getStatusId()==3?"selected":""%> >פעיל</option>
									<option value="1" <%=completionForm.getStatusId()==1?"selected":""%> >לא פעיל זמנית</option>
									<option value="2" <%=completionForm.getStatusId()==2?"selected":""%> >לא פעיל</option>
								</select>
							</TD>
							
							
						</TR>
						
					</TBODY>
					</TABLE>
					</TD>
					</TR>
					
					<TR>
					<TD width="100%" style="padding:5px;">
					<shf:checkbox logic="onclick=shiftDataCheck(this);" inputname="shiftData" name="completionForm" property="shiftData" checked="<%=completionForm.isShiftData()?1:0%>"/>
					<span class="bigHeader"><u>לפי סידור עבודה:</u></span>
					<br>
					<TABLE cellspacing="0" cellpadding="2" style="margin-top:10px;">
					<TBODY>
						<TR>
							<TD class="header">תאריך משמרת:</TD>
							<TD class="data">
								<shf:calendar calname="shiftDate" name="completionForm" property="shiftDate"/>
							</TD>
						</TR>
						<TR>
							<TD align="center"><shf:checkbox inputname="byShiftStart" name="completionForm" property="byShiftStart" checked="<%=completionForm.isByShiftStart()?1:0%>"/></TD>
							<TD class="header">התחלת משמרת משעה:</TD>
							<TD class="data">
								<shf:timechooser inputname="shiftStartFrom" name="completionForm" property="shiftStartFrom"/>
							</TD>
							<TD class="header">עד שעה:</TD>
							<TD class="data">
								<shf:timechooser inputname="shiftStartTo" name="completionForm" property="shiftStartTo"/>
							</TD>	
							
						</TR>
						<TR>
							<TD align="center"><shf:checkbox inputname="byShiftEnd" name="completionForm" property="byShiftEnd" checked="<%=completionForm.isByShiftEnd()?1:0%>"/></TD>
							<TD class="header">סיום משמרת משעה:</TD>
							<TD class="data">
								<shf:timechooser inputname="shiftEndFrom" name="completionForm" property="shiftEndFrom"/>
							</TD>
							<TD class="header">עד שעה:</TD>
							<TD class="data">
								<shf:timechooser inputname="shiftEndTo" name="completionForm" property="shiftEndTo"/>
							</TD>	
							
						</TR>
						<TR>
							<TD align="center"><shf:checkbox inputname="byShiftActivity" name="completionForm" property="byShiftActivity" checked="<%=completionForm.isByShiftActivity()?1:0%>"/></TD>
							<TD class="header">תור:</TD>
							<TD id="activityAjaxResult">
								<%if(moked==null||moked.equals("-1")){%>
								<shf:activityselect tablename="activityCode" name="activity" 
								logic=" disabled " style="width:170px;font-size:10px;"/>
								 <%}else{%>
								<shf:activityselect tablename="activityCode" name="activity" 
								selectedName="completionForm" selectedProperty="activity"  
								moked="<%=moked%>" all="yes" style="width:170px;font-size:10px;"/>
								 <%}%>
							</TD>
						</TR>
						
					</TBODY>
					</TABLE>
					</TD>
					</TR>
					
				</TABLE>
				
				</FIELDSET>
			</TD>
		</TR>
		<TR>
			<TD valign="top" style="padding:5px;">
				<fieldset class="info">
				<legend>פרטי השלמה</legend>
					<TABLE cellspacing="1" cellpadding="1" style="margin-top:5px;margin-bottom:5px;">
						<TBODY>
							<TR>
								<TD class="header">מתאריך :</TD>
								<TD width="10px"></TD>
								<TD class="data">
									<shf:calendar calname="completionFromDate" name="completionForm" property="completionFromDate" marginBottom="-170" marginRight="0"/>
								</TD>
								<TD class="data">
									<shf:timechooser inputname="completionStart" name="completionForm" property="completionStart" />
								</TD>
							</TR>
							<TR>
								<TD class="header">עד תאריך :</TD>
								<TD width="10px"></TD>
								<TD class="data">
									<shf:calendar calname="completionToDate" name="completionForm" property="completionToDate" marginBottom="-170" marginRight="0"/>
								</TD>
								<TD class="data">
									<shf:timechooser inputname="completionEnd" name="completionForm" property="completionEnd"/>
								</TD>
							</TR>
							<TR>
								<TD class="header">סוג השלמה:</TD>
								<TD width="10px"></TD>
								<TD class="data" colspan="2">
									<bzq:select tablename="completionCode" name="completionCode" selectedName="completionForm" selectedProperty="completionCode" style="height:10px;width:160px;font-size:10px;" />
								</TD>
								
							</TR>
							
						</TBODY>
					</TABLE>
				</fieldset>
			</TD>
		</TR>
		<TR>
			<TD valign="top" height="100%" style="padding-right:6px;" align="right"><button onclick="submitCompletionForm();">הבא</button> </TD>
		</TR>
	</TABLE>
	</form>
</body>
</html>