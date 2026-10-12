<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">


<jsp:useBean
	id="addShift"
	class="bzq.shf.forms.AddShiftRequestForm"
	scope="request">
</jsp:useBean>
<jsp:useBean
	id="employeeData"
	class="bzq.shf.forms.EmployeeInforceListForm"
	scope="request">
</jsp:useBean>
<jsp:useBean
	id="row"
	class="bzq.shf.bean.EmployeeBean"
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
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">


<SCRIPT>
var myHeader=["הוסף","עיר","טלפון נוסף","טלפון נייד","מסורתי","עובד מהבית","תפקיד בפועל","אחוז משרה","צוות","מוקד","שם"];
var txtColor=['#000'];
function addSubmit(num) {
	//window.top.document.body.style.filter="gray";
	document.getElementById("waitImgDiv").style.display="";
	document.getElementById("dataGridDiv2").style.display="none";
	document.getElementById("addAgntShift"+num).submit();
	
}
function hideWaitImg(){
	document.getElementById("dataGridDiv2").style.display="";
	document.getElementById("waitImgDiv").style.display="none";
}
//function grey(){
	//window.top.document.body.style.filter="";
//} 
</SCRIPT>

<shf:reloadErrors></shf:reloadErrors>

</HEAD>
<BODY onload="hideWaitImg();">

<%
bzq.shf.bean.EmployeeBean[] emps=employeeData.getEmployee();
if(emps!=null && emps.length>0){
int size=emps.length;
%>
<div id="dataGridDiv2">
<SCRIPT>
var myData=[
<%
for(int i=0;i<size;i++){
	row=emps[i];
	
	String empname=row.getFname()+" "+row.getLname();
	String ename=empname.replace('\'',' ');
	String benzoogPhone=row.getBenzoogTel();
	String cellularPhone=row.getPhoneCellular();
	String job = row.getJobName();
	String homePhone=row.getPhoneHome();
	String city= row.getCity();
	if(job ==null){
		job="לא קיים";
	}
	if(city ==null){
		job="לא קיים";
	}
	if(cellularPhone==null ){
		cellularPhone="לא קיים";	
	}
	if(benzoogPhone==null ){
		if(homePhone==null){
		  benzoogPhone="לא קיים";
		}else{
		  benzoogPhone=homePhone;			
		}
	}
	String traditional="לא מסורתי";
	if(row.getTrained()==0){
		traditional="מסורתי ";
	}
	String workFromHome="לא עובד מהבית";
	if(row.getWorkFromHome()==1){
		workFromHome="עובד מהבית";
	}
%>

[
'<button type="button" class=button style="cursor:hand;"  onclick=addSubmit(<%=i%>)>הוסף משמרת</button>',
'<%=row.getCity()%>',
'<%=benzoogPhone%>',
'<%=cellularPhone%>',
'<%=traditional%>',
'<%=workFromHome%>',
'<%=row.getJobName()%>',
'<%=row.getJobTime()%>',
'<shf:tables tableName="unitCode" codeName="<%=row.getOrgUnitId()%>"/>',
'<shf:tables tableName="unitCode" codeName="<%=SHFTableUtils.getMokedCodeOf(row.getOrgUnitId())%>"/>',
'<shf:employee empid="<%=row.getEmployeeId()%>" empname="<%=ename%>"/>']
<%if(i<size-1){%>,<%}}%>];
drawGrid2('dataGridDiv2');
</SCRIPT>
</div>
<div class="gridNoData" id="waitImgDiv" style="width: 100%; overflow-x: scroll;">
		<img height="40px" src="/shf/images/wait.gif">
</div>

<%	
addShift.setFrom(bzq.utils.BaseConvert.dateToString(employeeData.getShiftStart(),"HH:mm"));
addShift.setTo(bzq.utils.BaseConvert.dateToString(employeeData.getShiftEnd(),"HH:mm"));

for(int i=0;i<size;i++){
	row=emps[i];
%>
	<FORM id="addAgntShift<%=i%>" action="/shf/shift/addShift.do" target="frMain"> <!-- AddShiftRequestForm -->
		<input type="hidden"  value="<shf:shfdate date="<%=employeeData.getDate()%>"/>" name="date">
		<input type="hidden" value="<%=addShift.getFrom()%>" name="from"/>
		<input type="hidden" value="<%=addShift.getTo()%>" name="to">
		<input type="hidden" value="<%=employeeData.getActivity()%>" name="activity">
		<input type="hidden" value="<%=employeeData.getMoked()%>" name="moked">
		<input type="hidden" value="<%=employeeData.getId()%>" name="inforceRequestId">
		<input name="empIdNumber" type="hidden" value="<%=row.getIdNumber()%>">
		<input name="sourceWindow" type="hidden" value="shift_inforce">
		
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
