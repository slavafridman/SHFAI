<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean
	id="employeeData"
	class="bzq.shf.forms.EmployeeListForm"
	scope="request">
</jsp:useBean>
<jsp:useBean
	id="row"
	class="bzq.shf.bean.EmployeeBean"
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" 
pageEncoding="WINDOWS-1255"
import="bzq.shf.bean.EmployeeBean,java.util.Vector"
%>

<HTML>
<HEAD>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<SCRIPT>
var selectedRow;
var myHeader=[
"SAP"
,"אחוז משרה"
,"צוות"
,"תפקיד בפועל"
,"תפקיד"
,"מוקד"
,"שם"
,"תעודת זהות"];
var txtColor=['#000'];
</SCRIPT>

</HEAD>

<BODY>

<%
Vector emps=(Vector)request.getAttribute("employees");
if(emps!=null && emps.size()>0){
int size=emps.size();
%>
<SCRIPT>
var myData=[
<%
for(int i=0;i<size;i++){
	row=(EmployeeBean)emps.get(i);
	String empname=row.getFname().trim()+" "+row.getLname().trim();
	String ename=bzq.shf.utils.SHFUtils.replace(empname,"'","&#39;");
%>
[
'<img src="/shf/images/<%="1".equals(row.getOptional1())?"true":"false"%>.gif">',
'<%=row.getJobTime()%>',
'<shf:tables tableName="unitCode" codeName="<%=row.getOrgUnitId()%>"/>',
'<shf:tables tableName="innerJobCode" codeName="<%=row.getInnerJobId()%>"/>',
'<shf:tables tableName="jobCode" codeName="<%= row.getJobId()%>"/>',
'<shf:tables tableName="unitCode" codeName="<%= bzq.shf.utils.SHFTableUtils.getParentUnitNameOf(row.getOrgUnitId())%>"/>',
'<shf:employee empid="<%=row.getEmployeeId()%>" empname="<%=ename%>"/>',
'<%=row.getIdNumber()%>',
'<%=row.getEmployeeId()%>']
<%if(i<size-1){%>,<%}}%>];
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

</BODY>
</HTML>
