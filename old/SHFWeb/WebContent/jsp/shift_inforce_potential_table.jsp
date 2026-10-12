<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.utils.BaseConvert"%>
<%@page import="javax.swing.text.html.HTML"%>
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
<jsp:useBean id="potentialInforce"
	class="bzq.shf.forms.PotentialInforceForm" 
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
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<%@page import="bzq.shf.bean.PotentialEmployeeBean"%>
<%@page import="bzq.shf.bean.EmployeeBean"%>
<%@page import="java.util.Vector"%>
<%@page import="org.apache.commons.validator.GenericValidator"%>
<HTML>
<HEAD>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">


<SCRIPT>
var myHeader=[
"עיר",
"טל נוסף",
"טל נייד",
"מסורתי",
"עובד מהבית",
"תפקיד בפועל",
"אחוז משרה",
"צוות",
"זמין עד שעה",
"זמין משעה",
"שם",
"בחירה"
,"יום"];
var txtColor=['#000'];
function addSubmit(num) {
	document.getElementById("addAgntShift"+num).submit();
}
</SCRIPT>

<shf:reloadErrors></shf:reloadErrors>

</HEAD>
<BODY>

<%
Vector potentialVec = potentialInforce.getPotentialInforceData(); 
//bzq.shf.bean.EmployeeBean[] emps=employeeData.getEmployee();
if(potentialVec!=null && potentialVec.size()>0){
int size=potentialVec.size();
PotentialEmployeeBean potentialEmployeeBean = new PotentialEmployeeBean();
%>
<div id="dataGridDiv">
<SCRIPT>
var myData=[
<%
for(int i=0;i<size;i++){
	potentialEmployeeBean = (PotentialEmployeeBean)potentialVec.get(i);
	row=potentialEmployeeBean.getEmployeeBean();
	
	String checked = new String();
	String benzoogTel=row.getBenzoogTel();
	if(GenericValidator.isBlankOrNull(benzoogTel)){
		benzoogTel=row.getPhoneHome();
	}
	String empname=row.getFname()+" "+row.getLname();
	String ename = BaseConvert.specialCharactersHTML(empname, false, false);
	//String ename=empname.replace('\'',' ');
	String from_date = bzq.utils.BaseConvert.dateToString(potentialEmployeeBean.getStart_Potential(), "dd/MM/yyyy HH:mm");
%>

[
'<%=GenericValidator.isBlankOrNull(row.getCity())?"&nbsp;":BaseConvert.specialCharactersHTML(row.getCity(), false, false)%>',
'<%=GenericValidator.isBlankOrNull(benzoogTel)?"&nbsp;":benzoogTel%>',
'<%=GenericValidator.isBlankOrNull(row.getPhoneCellular())?"&nbsp;":row.getPhoneCellular()%>',
'<%=((row.getTrained()==0)?"כן":"לא")%>',
'<%=((row.getWorkFromHome()==1)?"כן":"לא")%>',
'<shf:tables tableName="innerJobCode" codeName="<%=row.getInnerJobId()%>"/>',
'<%=row.getJobTime()%>',
'<shf:tables tableName="unitCode" codeName="<%=row.getOrgUnitId()%>"/>',
'<shf:shftime date="<%=potentialEmployeeBean.getEnd_Potential()%>" pattern="HH:mm" />',
'<shf:shftime date="<%=potentialEmployeeBean.getStart_Potential()%>" pattern="HH:mm" />',
'<shf:employee empid="<%=row.getEmployeeId()%>" empname="<%=ename%>"/>',
'<input type="checkbox" "+<%=potentialEmployeeBean.getChecked()%>+" name="selectedPotential" id="<%=i%>" value="<%=row.getEmployeeId()+";"+from_date%>"</input>',
'<shf:dayofweek date="<%=potentialEmployeeBean.getStart_Potential()%>"/>']
<%if(i<size-1){%>,<%}}%>];
drawGrid2('dataGridDiv');
</SCRIPT>
</div>
<%	
for(int i=0;i<size;i++){
	potentialEmployeeBean = (PotentialEmployeeBean)potentialVec.get(i);
	row=potentialEmployeeBean.getEmployeeBean();
%>

	<FORM name="addAgntShiftForm" id="addAgntShift<%=i%>" action="/shf/shift/addShift.do" target="frMain"> <!-- AddShiftRequestForm -->
	
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
