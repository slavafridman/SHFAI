<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean
	id="employeeData"
	class="bzq.shf.forms.EmployeeDataForm"
	scope="request">
</jsp:useBean>

<jsp:useBean
	id="skills"
	class="java.util.Vector"
	scope="request">
</jsp:useBean>

<jsp:useBean
	id="skill"
	class="bzq.shf.bean.EmployeeSkillBean"
	scope="request">
</jsp:useBean>


<HTML>
<HEAD>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector,bzq.shf.bean.EmployeeSkillBean"
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
var myHeader=['וותק בסקיל','רמה','תאריך הוספה','שם סקיל'];
var txtColor=['#000'];
</SCRIPT>

</HEAD>
<BODY style="border:1px #bbbbbb solid;">

<%
if(skills!=null && skills.size()>0){
int size=skills.size();
%>
<SCRIPT>
var myData=[
<%
for(int i=0;i<size;i++){
	skill=(EmployeeSkillBean)skills.get(i);
	
%>
[
'<%=bzq.shf.utils.SHFUtils.getVetek(skill.getSkillDate())%>',
'<%=skill.getSkillLevel()%>',
'<shf:shfdate date="<%=skill.getSkillDate()%>"/>',
'<shf:tables tableName="skillCode" codeName="<%=skill.getSkillId()%>"></shf:tables>'
]
<%if(i<size-1){%>,<%}}%>];

</SCRIPT>
<div id="dataGridDiv"><SCRIPT>drawGrid2('dataGridDiv');</SCRIPT></div>
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