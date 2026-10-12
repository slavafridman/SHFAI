<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<HTML>
<jsp:useBean
	id="employeeData"
	class="bzq.shf.forms.EmployeeDataForm"
	scope="request">
</jsp:useBean>

<jsp:useBean
	id="courses"
	class="java.util.Vector"
	scope="request">
</jsp:useBean>

<jsp:useBean
	id="course"
	class="bzq.shf.bean.CourseBean"
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<HEAD>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector,bzq.shf.bean.CourseBean"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" ></link>

<script 
	language="JavaScript"
	src="/shf/js/shfgrid.js"></script>
	
<SCRIPT>
var myHeader=['סטטוס','משך הקורס','שם המדריך','תאריך','נושא הקורס'];
var txtColor=['#000'];
</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY style="border:1px #bbbbbb solid;">
<%
if(courses!=null && courses.size()>0){
int size=courses.size();
%>
<SCRIPT>
var myData=[
<%
for(int i=0;i<size;i++){
	course=(CourseBean)courses.get(i);
	
%>
['&nbsp;','<%=bzq.shf.utils.SHFUtils.getDaysBetween(course.getDate_begin(),course.getDate_end())%>','<%=course.getTeacherName()%>','<shf:shfdate date="<%=course.getDate_begin()%>"/>','<%=course.getCourseName()%>']
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