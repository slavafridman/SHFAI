<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="employees" class="java.util.Vector" scope="request"></jsp:useBean>
<jsp:useBean id="completionForm" class="bzq.shf.forms.CTICompletionForm" scope="request"></jsp:useBean>

<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255" import="java.util.Vector"%>


<%@page import="bzq.shf.bean.EmployeeBean"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="bzq.shf.bean.AgentDayBean"%><html>
<head>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
<title>cti</title>

<script type="text/javascript">
function selectAll(){
	arr=document.getElementsByName("selectedEmployees");
	for (i = 0; i < arr.length; i++)
		arr[i].checked = true ;
	
}

function clearAll(){
	arr=document.getElementsByName("selectedEmployees");
	for (i = 0; i < arr.length; i++)
		arr[i].checked = false ;
}

function submitCtiForm(){
	arr=document.getElementsByName("selectedEmployees");
	var selected=false;
	
	for (i = 0; i < arr.length; i++){
		if(arr[i].checked){
			selected=true;
			break;
		}
	}
	if(!selected){
		alert("נא לסמן את העובדים הנדרשים להשלמה");
		return false;
	}
	
	document.forms['addCompletionForm'].submit();
}

function goBack(){
	document.addCompletionForm.action="/shf/completion/addParam.do";
	document.addCompletionForm.actionCode.value="back";
	document.addCompletionForm.submit();
}

</script>
<shf:reloadErrors></shf:reloadErrors>
</head>

<body dir="rtl">
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height: 20px;"><jsp:include page="submenu/cti_submenu.jsp"></jsp:include> </TD>
		</TR>			
		<TR>
			<TD height="100%" width="100%" valign="top" style="padding-top: 3px; padding-bottom: 5px; padding-right: 6px; padding-left: 6px;">
				<html:form type="bzq.shf.forms.CTICompletionForm" name="addCompletionForm" action="/completion/setCompletion">
					<input type="hidden" name="allchecked">
					<input type="hidden" name="personalData" value="<%=completionForm.isPersonalData()?true:false%>">
					<input type="hidden" name="unitData" value="<%=completionForm.isUnitData()?true:false%>">
					<input type="hidden" name="shiftData" value="<%=completionForm.isShiftData()?true:false%>">
					<input type="hidden" name="byShiftStart" value="<%=completionForm.isByShiftStart()?true:false%>">
					<input type="hidden" name="byShiftEnd" value="<%=completionForm.isByShiftEnd()?true:false%>">
					<input type="hidden" name="byShiftActivity" value="<%=completionForm.isByShiftActivity()?true:false%>">
					
					<input type="hidden" name="shiftEndTo" value="<%=completionForm.getShiftEndTo()%>">
					<input type="hidden" name="shiftEndFrom" value="<%=completionForm.getShiftEndFrom()%>">
					<input type="hidden" name="shiftStartTo" value="<%=completionForm.getShiftStartTo()%>">
					<input type="hidden" name="shiftStartFrom" value="<%=completionForm.getShiftStartFrom()%>">
					<input type="hidden" name="shiftDate" value="<%=completionForm.getShiftDate()%>">
					
					<input type="hidden" name="activity" value="<%=completionForm.getActivity()%>">
					<input type="hidden" name="statusId" value="<%=completionForm.getStatusId()%>">
					<input type="hidden" name="team" value="<%=completionForm.getTeam()%>">
					<input type="hidden" name="job" value="<%=completionForm.getJob()%>">
					<%if(completionForm.getMoked()!=null){ %>
					<input type="hidden" name="moked" value="<%=completionForm.getMoked()%>">
					<%} %>
					<input type="hidden" name="agaf" value="<%=completionForm.getAgaf()%>">
					<input type="hidden" name="id_number" value="<%=completionForm.getId_number()%>">
					<input type="hidden" name="last_name" value="<%=completionForm.getLast_name()%>">
					<input type="hidden" name="first_name" value="<%=completionForm.getFirst_name()%>">
					<input type="hidden" name="actionCode"/>
					
					<input type="hidden" name="completionFromDate" value="<%=completionForm.getCompletionFromDate()%>">
					<input type="hidden" name="completionStart" value="<%=completionForm.getCompletionStart()%>">
					<input type="hidden" name="completionToDate" value="<%=completionForm.getCompletionToDate()%>">
					<input type="hidden" name="completionEnd" value="<%=completionForm.getCompletionEnd()%>">
					<input type="hidden" name="completionCode" value="<%=completionForm.getCompletionCode()%>">
					
					
					<table height="100%" width="100%">
						<tr>
							<td>
								<fieldset class="form">
								<table cellpadding="2" cellspacing="2">
									<TR>
										<TD class="data" colspan="2">נמצאו <%=employees.size() %> עובדים</TD>
									</TR>
									<%if(employees!=null && employees.size()>0){ %>
									<TR>
										<TD class="header" colspan="2">בחר את העובדים שברצונך להוסיף להם השלמה ולחץ על כפתור "הבא" למטה.</TD>
									</TR>
									<TR>
										<TD><button onclick="selectAll();">סמן הכל</button></TD>
										<TD><button onclick="clearAll();">הורד הכל</button></TD>
									</TR>
									<%} %>
								</table>
								</fieldset>
							</td>
						</tr>
						<tr>
							<td height="100%" width="100%">
								<table width="100%" height="100%" cellpadding="0" cellspacing="0">
									<TR>
									<%if(completionForm.isShiftData()){ %>
										<TD height="100%" width="100%">
											<div class="tableContainerDiv" dir="ltr" id="dataGridDiv">
											<%if(employees!=null && employees.size()>0){ %>
											<script type="text/javascript">
											var myHeader=new Array(
											"יציאה"
											,"כניסה"
											,"חיסור"
											,"מוקד"
											,"צוות"
											,"סיום"
											,"התחלה"
											,"שם נציג"
											,"סמן");
											var txtColor=new Array("#000","#000","#000","#000");
											var selectedRow;
											var onclickActive=false;
											var myData=[
											
											
											<%
											AgentDayBean employee=null;
											String empname="";
											int size=employees.size();
											for(int i=0;i<size;i++){ 
												employee=(AgentDayBean)employees.get(i);
												empname=employee.getFirstName().trim()+" "+employee.getLastName().trim();
												empname=bzq.shf.utils.SHFUtils.replace(empname,"'","&#39;");
											%>
											[
												'<shf:shftime date="<%=employee.getStationExitTime()%>"/>',
												'<shf:shftime date="<%=employee.getStationArrivalTime()%>"/>',
												'<%=employee.getMissingReasonId()>0?"<img src=/shf/images/rem.gif border=0>":""%>',
												'<shf:tables tableName="unitCode" codeName="<%=SHFTableUtils.getMokedCodeOf(employee.getOrgUnitCode())%>"/>',
												'<shf:tables tableName="unitCode" codeName="<%=employee.getOrgUnitCode()%>"/>',
												'<shf:shftime date="<%=employee.getShiftEnd()%>"/>',
												'<shf:shftime date="<%=employee.getShiftStart()%>"/>',
												'<shf:employee empid="<%=employee.getEmployeeId()%>" empname="<%=empname%>"/>',
												'<input type="checkbox" name="selectedEmployees" value="<%=String.valueOf(employee.getEmployeeId())%>">'
												





												
											]	
											<%
											if(i<size-1){%>,<%}}%>];
											drawGrid2("dataGridDiv");
											</SCRIPT>
											<%
											}else{
											%>
												<div class="gridNoData">אין נתונים</div>
											<% 
											}
											%>
											</div>
											
										</TD>
										<%}else{ %>
										<TD height="100%" width="100%">
											<div class="tableContainerDiv" dir="ltr" id="dataGridDiv">
											<%if(employees!=null && employees.size()>0){ %>
											<script type="text/javascript">
											var myHeader=new Array(
											"מוקד"
											,"צוות"
											,"שם נציג"
											,"תעודת זהות"
											,"סמן");
											var txtColor=new Array("#000","#000","#000","#000");
											var selectedRow;
											var onclickActive=false;
											var myData=[
											
											
											<%
											EmployeeBean employee=null;
											String empname="";
											int size=employees.size();
											for(int i=0;i<size;i++){ 
												employee=(EmployeeBean)employees.get(i);
												empname=employee.getFname().trim()+" "+employee.getLname().trim();
												empname=bzq.shf.utils.SHFUtils.replace(empname,"'","&#39;");
											%>
											[
												'<shf:tables tableName="unitCode" codeName="<%=SHFTableUtils.getMokedCodeOf(employee.getOrgUnitId())%>"/>',
												'<shf:tables tableName="unitCode" codeName="<%=employee.getOrgUnitId()%>"/>',
												'<shf:employee empid="<%=employee.getEmployeeId()%>" empname="<%=empname%>"/>',
												'<%=employee.getIdNumber()%>',
												'<input type="checkbox" name="selectedEmployees" value="<%=employee.getEmployeeId()%>"/>',
												'<%=employee.getEmployeeId()%>'
											]	
											<%
											if(i<size-1){%>,<%}}%>];
											drawGrid2("dataGridDiv");
											</SCRIPT>
											<%
											}else{
											%>
												<div class="gridNoData">אין נתונים</div>
											<% 
											}
											%>
											</div>
	
										</TD>
										<%} %>
									</TR>
								</table>
							</td>
						</tr>
						<tr>
							<td>
								<fieldset class="form">
								<table cellpadding="2" cellspacing="2">
									<tr>
										<TD><button onclick="goBack();">הקודם</button> </TD>
										<%if(employees!=null && employees.size()>0){%>
										<TD><button onclick="submitCtiForm();">הבא</button> </TD>
										<%}%>
									</tr>
								</table>
								</fieldset>
							</td>
						</tr>	
					</table>
				</html:form>
			</TD>
		</TR>
	</TABLE>
</body>
</html>