<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean
	id="reduceRequestForm"
	class="bzq.shf.forms.ShiftReduceRequestForm"
	scope="request">
</jsp:useBean>
<jsp:useBean
	id="rowEmp"
	class="bzq.shf.forms.ShiftReduceListForm"
	scope="request">
</jsp:useBean>


<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>

<HTML>
<HEAD>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">


<SCRIPT>
var myHeader=["הוסף","צוות","שם","תעודת זהות"];
var txtColor=['#000'];
function addSubmit(num) {
	document.getElementById("reduceAgntShift"+num).submit();
}
</SCRIPT>

<shf:reloadErrors></shf:reloadErrors>

</HEAD>
<BODY>

<%

bzq.shf.forms.ShiftReduceListForm[] reqList=reduceRequestForm.getReduceList();
if (reqList!=null && reqList.length>0) {
int size=reqList.length;

%>
<div id="dataGridDiv2">
<SCRIPT>
var myData=[
<%
for(int i=0;i<size;i++){
//	row=emps[i];
	rowEmp=reqList[i];
	
	String empname=rowEmp.getFirstName()+" "+rowEmp.getLastName();
	String ename=empname.replace('\'',' ');
%>

[
'<button type="button" class=button style="cursor:hand;"  onclick=addSubmit(<%=i%>)>צמצם משמרת</button>',
'<shf:tables tableName="unitCode" codeName="<%=rowEmp.getOrgUnitCode()%>"/>',
'<shf:employee empid="<%=rowEmp.getEmployeeId()%>" empname="<%=ename%>"/>',
'<%=rowEmp.getEmpIdNumber()%>']
<%if(i<size-1){%>,<%}}%>];
drawGrid2('dataGridDiv2');
</SCRIPT>
</div>
<%	
for(int i=0;i<size;i++){
	rowEmp=reqList[i];
%>
	<FORM id="reduceAgntShift<%=i%>" action="/shf/reduce/reduceShift.do" target="frMain"> <!-- AddShiftRequestForm -->
		<input type="hidden" value="<%=reduceRequestForm.getReduceId()%>" name="reduceId"/>
		<input type="hidden" value="<%=rowEmp.getAgentDayId()%>" name="agentDayId"/>
		<input type="hidden" value="<%=rowEmp.getEmpIdNumber()%>" name="wmEmpIdNumber">
		<input type="hidden" value="<%=rowEmp.getEmployeeId()%>" name="employeeId">
		<INPUT type="hidden" value="<%=reduceRequestForm.getAutomaticApprove()%>" name="automaticApprove">
		<input type="hidden" value="reduce_shift" name="sourceWindow" >
		<input type="hidden" value="<shf:shfdate date="<%=rowEmp.getShiftStart()%>"/>" name="date">
		<input type="hidden" value="<shf:shftime date="<%=rowEmp.getShiftStart()%>"/>" name="startTime">
		<input type="hidden" value="<shf:shftime date="<%=rowEmp.getShiftEnd()%>"/>" name="endTime">
		
	</FORM>
	
<%
	}
}
else{
%>
<div class="gridNoData">אין נתונים</div>
<%	
}
%>

</BODY>
</HTML>
