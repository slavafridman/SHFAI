<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

	<%@page language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255" import="bzq.shf.bean.EmployeeCompletionBean"%>
	
	<jsp:useBean id="completions" scope="request" class="java.util.Vector"></jsp:useBean>
	<jsp:useBean id="completionForm" class="bzq.shf.forms.CTISearchCompletionForm" scope="request"></jsp:useBean>
	
	<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
	<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>


<%@page import="bzq.shf.utils.SHFUtils"%>
<%@page import="bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.utils.SHFConstants"%><html>
<head>

<title>cti_view_result</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">

<SCRIPT>
var myHeader=[

"שם מעדכן"
,"תאריך שינוי"
,"סטטוס"
,"סוג השלמה"
,"מערכת מקור"
,"עד שעה"
,"משעה"
,"מתאריך"
,"צוות"
,"שם"
,"סמן"
];
var txtColor=['#000'];
var selectedRow;
var onclickActive=true;
function onclickFunction(){
	top.frMsgBar.location.href="/shf/msgBar.do";
}
</SCRIPT>

</head>
<body>
<%
if(completions!=null && completions.size()>0){
int size=completions.size();
%>
<SCRIPT>
var myData=[
<%
EmployeeCompletionBean row=null;
Integer sts=null;
for(int i=0;i<size;i++){
	row=(EmployeeCompletionBean)completions.get(i);
	String source="";
	if("SHF".equals(row.getSource())) source="השלמות";
	else if("CTI".equals(row.getSource())) source="CTI";
	sts = new Integer(row.getSapStatus());
%>
[
'<%=BaseConvert.specialCharactersHTML(row.getUserName(),true,true)%>',
'<%=BaseConvert.dateToString(row.getUpdateDate(),"dd/MM HH:mm")%>',
'<%=SHFConstants.COMPLETION_STATUS_MAP.containsKey(sts)?SHFConstants.COMPLETION_STATUS_MAP.get(sts):String.valueOf(sts.intValue())%>',
'<shf:tables tableName="completionCode" codeName="<%=row.getCode()%>" />',
'<%=source%>',
'<shf:shftime date="<%=row.getCompletionEnd()%>"/>',
'<shf:shftime date="<%=row.getCompletionStart()%>"/>',
'<span name="<%=BaseConvert.dateToString(row.getCompletionStart(),"yyyyMMdd")%>"><shf:shfdate date="<%=row.getCompletionStart()%>"/></span>',
'<shf:tables tableName="unitCode" codeName="<%=row.getTeam()%>" />',
'<%=BaseConvert.specialCharactersHTML(row.getEmployeeName(),true,true)%>',
<%if("SHF".equals(row.getSource()) && row.getSapStatus()==SHFConstants.COMPLETION_STATUS_OPEN){%>
'<input type="checkbox" name="selectedCompletions" value="<%=String.valueOf(row.getId())%>"/>',
<%}else if("SHF".equals(row.getSource())){%>
'<input type="checkbox" disabled />',
<%}else{%>
'',
<%}%>
'<%=row.getId()%>'
]
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

</body>
</html>