<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@page import="bzq.utils.BaseConvert"%><HTML>
<jsp:useBean id="employeeData"
	class="bzq.shf.forms.EmployeeDataForm" 
	scope="request">
</jsp:useBean>

<jsp:useBean id="events"
	class="java.util.Vector" 
	scope="request">
</jsp:useBean>

<jsp:useBean id="event" 
	class="bzq.shf.bean.EmployeeEventBean"
	scope="page">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HEAD>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.utils.SHFConstants,java.util.Vector,bzq.shf.bean.EmployeeEventBean"
%>
<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" ></link>

<script 
	language="JavaScript"
	src="/shf/js/shfgrid.js"></script>
	
<SCRIPT>
var myHeader=[
'זמן עדכון'
,'שם מעדכן'
,'הערה'
,'מוצדק'
,'סיבה'
,'משך'
,'יום'
,'שעה'
,'תאריך'
,'סוג אירוע'];
var txtColor=['#000'];
var selectedRow;

function cancelEvent(empid){
	if(selectedRow==null || selectedRow==''){
		alert("נא לבחור אירוע קודם");
		return false;
	}
	var accept=confirm("האם אתה בטוח שברצונך למחוק אירוע זה");
	if(!accept){
		return false;
	}
	var type=selectedRow.split(",",2)[0];
	var id=selectedRow.split(",",2)[1];
	document.location="/shf/employee/cancelEvent.do?employee_day_id="+id+"&employee_id="+empid+"&serType="+type;
}

function addEvent(empid){
	document.location="/shf/jsp/add_event.jsp?employeeId="+empid;
}
</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY style="border:1px #bbbbbb solid;">
<TABLE height="100%" width="100%" cellpadding="0" cellspacing="0">
<TR>
<TD>
<TABLE width="100%" height="20px" style="background-color:#f3f3f3;" cellpadding="0" cellspacing="0">
<TR>
	<shf:security activity="card_events_update">
	<TD valign="middle" width="25px">
		<img src="/shf/images/event.png" height="20px" alt="הוסף אירוע חריג" style="cursor:hand;" onclick="addEvent(<%=employeeData.getEmployeeId()%>);">
	</TD>
	</shf:security>
	<shf:security activity="card_events_cancel">
	<TD valign="middle" align="left">
		<img src="/shf/images/add_missing.gif" alt="בטל אירוע חריג" style="cursor:hand;" onclick="cancelEvent(<%=employeeData.getEmployeeId()%>);">
	</TD>
	</shf:security>
</TR>
</TABLE>
</TD>
</TR>
<TR>
<TD height="100%">


<%
if(events!=null && events.size()>0){
int size=events.size();
%>
<SCRIPT>
var myData=[
<%
for(int i=0;i<size;i++){
	event=(EmployeeEventBean)events.get(i);
	java.util.Date time=event.getTime();
	int type=event.getSerType();
	int len=event.getLength();
	String reason=String.valueOf(event.getReason());
	String remark=event.getRemark();
	remark=bzq.shf.utils.SHFUtils.replace(remark,"'","&#39;");
	remark=bzq.shf.utils.SHFUtils.replace(remark,"\"","&#34;");
	remark=bzq.utils.BaseConvert.specialCharactersJS(remark);
%>
[
'<%=BaseConvert.dateToString(event.getCreation_time(),"dd/MM/yyyy - HH:mm")%>',
'<%=BaseConvert.specialCharacters(event.getCreation_user())%>',
'<%if(remark!=null && remark.trim().length()>0){%><img src="/shf/images/comment.gif" style="cursor:hand;" alt="<%=remark%>"><%}else{%>&nbsp;<%}%>',
'<shf:reasonMarked reason="<%=reason%>" />',
'<shf:tables tableName="eventReasonCode" codeName="<%=reason%>"/>',
'<%=len>0?String.valueOf(len):"-"%>',
'<shf:dayofweek date="<%=event.getDate()%>"/>',
<%if(time!=null){%>'<shf:shftime date="<%=time%>"/>'<%}else{%>'-'<%}%>,
'<span name=<shf:shfdate date="<%=event.getDate()%>" pattern="yyyyMMdd"/> ><shf:shfdate date="<%=event.getDate()%>" pattern="dd/MM/yyyy"/></span>',
'<%=bzq.shf.utils.SHFConstants.EVENT_DESC_MAP.get(String.valueOf(type))%>',
<%if(type==SHFConstants.STAGE_LATE_REASON){%>'<%=SHFConstants.STAGE_LATE_REASON+","+event.getEmployee_day_id()%>'<%}else if(type==SHFConstants.MISSING_REASON){%>'<%=SHFConstants.MISSING_REASON+","+event.getEmployee_day_id()%>'<%}else if(type==SHFConstants.BREAK_LATE){%>'<%=SHFConstants.BREAK_LATE+","+event.getEventId()%>'<%}else if(type==SHFConstants.LATE_REASON){%>'<%=SHFConstants.LATE_REASON+","+event.getEmployee_day_id()%>'<%}else{%>'<%=SHFConstants.EVENT_TYPE+","+event.getEventId()%>'<%}%>,
]
<%if(i<size-1){%>,<%}}%>];

</SCRIPT>

<div  style="height=100%;overflow:auto;border:1px silver solid;" id="dataGridDiv">
<SCRIPT>drawGrid2('dataGridDiv');</SCRIPT>
</div>
<%
}
else{
%>
<div class="gridNoData" style="height=100%;border-top:1px silver solid;">אין נתונים</div>
<%	
}
%>
</TD>
</TR>
</TABLE>
</BODY>
</HTML>

