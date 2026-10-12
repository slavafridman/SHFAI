<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="exceptions" type="java.util.Vector" scope="request"></jsp:useBean>


<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>


<%@page import="bzq.shf.bean.ExceptionSearchBean"%>


<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="bzq.utils.BaseConvert"%>
<%@page import="org.apache.commons.validator.GenericValidator"%>
<html>
<head>
<link rel="stylesheet" href="../theme/Master.css" type="text/css">
<title>exceptions_table</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">

<SCRIPT language="javascript">
/*@cc_on @*/
/*@if (@_win32 && @_jscript_version>=5)

function window.confirm(str)
{
    execScript('n = msgbox("'+str+'","4132")', "vbscript");
    return(n == 6);
}
@end @*/

var myHeader=new Array(
"הערה"
,"סוג פעילות"
,"צוות"
,"תפקיד בפועל"
,"שעת סיום"
,"שעת התחלה"
,"שם"
,"תאריך"
,"יום"
);
var txtColor=new Array('#000','#000','#000','#000','#000','#338833','#000','#000');

var selectedRow;
var onclickActive=true;
function onclickFunction(){
	top.frames['frMsgBar'].document.getElementById("messageBarArea").innerHTML=document.getElementById("remark"+selectedRow).innerHTML;
}

</script>

</head>
<body>
<%if(exceptions!=null && exceptions.size()>0){ 
	int size=exceptions.size();
%>

<script type="text/javascript">
var myData=[
<%
ExceptionSearchBean exp=null;
for(int i=0;i<size;i++){
	exp=(ExceptionSearchBean)exceptions.get(i);
	String remark=BaseConvert.specialCharacters(exp.getRemark());
	String key=exp.getAgentDayId()+":"+exp.getFullDay()+":"+exp.getStateType()+":"+BaseConvert.dateToString(exp.getStartTime(),"ddMMyyyyHHmm");
%>
[
'<div id="remarkCell<%=key%>"><span id="remark<%=key%>" style="display:none;"><%=remark%></span><span id="remarkImg<%=key%>"><%=GenericValidator.isBlankOrNull(remark)?"&nbsp;":"<img src=/shf/images/edit.gif>"%></span></div>',
'<%=(exp.getStateType()==SHFConstants.DAY_TYPE_TIMEOFF?"<span name="+SHFTableUtils.getTimeoffName(exp.getTimeoffType())+" style=color:red;>"+SHFTableUtils.getTimeoffName(exp.getTimeoffType())+"</span>" :SHFTableUtils.getExceptionName(exp.getExceptionType()))%>',
'<shf:tables tableName="unitCode" codeName="<%=exp.getTeam() %>" />',
'<shf:tables tableName="innerJobCode" codeName="<%=exp.getInnerJob() %>" />',
'<shf:shftime date="<%=exp.getEndTime()%>" />',
'<shf:shftime date="<%=exp.getStartTime()%>" />',
'<shf:employee empid="<%=exp.getEmployeeId()%>" empname="<%=exp.getHTMLFullName()%>"/>',
'<shf:shfdate date="<%=exp.getStartTime()%>" />',
'<shf:dayofweek date="<%=exp.getStartTime()%>"/>',
'<%=key%>'
]
<%if(i<size-1){%>,
<%
}
}
%>
];
drawGrid2("dataGridDiv");
</script>

<%}else{ %>
<div  class="gridNoData">אין נתונים</div>
<%}%>
</body>
</html>