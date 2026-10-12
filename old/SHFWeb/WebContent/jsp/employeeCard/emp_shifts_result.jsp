
<%@page import="org.apache.commons.validator.GenericValidator"%>
<%@page import="bzq.utils.BaseConvert"%><HTML>
<jsp:useBean
	id="employeeData"
	class="bzq.shf.forms.EmployeeActivitiesForm"
	scope="request">
</jsp:useBean>

<jsp:useBean
	id="activity"
	class="bzq.shf.bean.AgentDayBean"
	scope="page">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<HEAD>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.bean.AgentDayBean,java.util.Vector,bzq.shf.utils.SHFTableUtils,bzq.shf.utils.SHFUtils"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">


<SCRIPT>

var myHeader=[
'הערות'
,'פיצול'
,'תגבור'
,'מיקום'
,'תור'
,'משך'
,'יום'
,'שעת סיום'
,'שעת התחלה'
,'תאריך'];
var txtColor=['#000','#000','#000','#000','#000','#339933','#000','#000','#000','#000'];
var selectedRow;
var onclickActive=true;
function onclickFunction(){
	var shiftId=selectedRow.split("=",2)[1];
	top.frames['frMsgBar'].document.getElementById("messageBarArea").innerHTML=document.getElementById("remark"+shiftId).innerHTML;
}
</SCRIPT>

</HEAD>
<BODY>

<%
Vector activities=(Vector)request.getAttribute("shifts");
if(activities!=null && activities.size()>0){
int size=activities.size();

%>
<SCRIPT>

var myData=[
<%

for(int i=0;i<size;i++){

	activity=(AgentDayBean)activities.get(i);	
	
	long agentDay=activity.getAgentDayId();
	String remark=BaseConvert.specialCharactersJS(activity.getRemark());
		
	java.util.Date shiftStartTime=activity.getShiftStart();
	java.util.Date shiftEndTime=activity.getShiftEnd();
	
	String activityDesc="";
	int length=0;
	String lengthStr="";
	if(activity.getDayType()==4){
		activityDesc=SHFTableUtils.getActivityName(activity.getShiftActivity());
		if(activity.isShiftSplit()){
			length=SHFUtils.getMinutesBetween(activity.getShiftStart(),activity.getSplitStart()) + SHFUtils.getMinutesBetween(activity.getSplitEnd(),activity.getShiftEnd());
		} else {
			length=SHFUtils.getMinutesBetween(shiftStartTime,shiftEndTime);
		}
		
		lengthStr=SHFUtils.getLengthFormat(length);
	}
	String ns=bzq.utils.BaseConvert.dateToString(activity.getShiftStart(),"HH:mm");
	String ne=bzq.utils.BaseConvert.dateToString(activity.getShiftEnd(),"HH:mm");
	String ss=bzq.utils.BaseConvert.dateToString(activity.getSplitShiftStart(),"HH:mm");
	String se=bzq.utils.BaseConvert.dateToString(activity.getSplitShiftEnd(),"HH:mm");
	double shiftDur = activity.getSplitShiftDurationHours();
%>
[
'<div id="remarkCell<%=agentDay%>"><span id="remark<%=agentDay%>" style="display:none;"><%=remark%></span><span id="remarkImg<%=agentDay%>"><%=GenericValidator.isBlankOrNull(remark)?"&nbsp;":"<img src=/shf/images/edit.gif>"%></span></div>',
'<%= activity.isShiftSplit() ? "<span><img src=/shf/images/shiftSplit.png onclick=showShiftSplitDetails(\\'"+ns+"\\',\\'"+ss+"\\',\\'"+se+"\\',\\'"+ne+"\\',\\'"+shiftDur+"\\');></span>" : "&nbsp;" %>',
'<%=activity.getShiftSource().startsWith("f")?"<img src=/shf/images/plus.gif 	/>":""%>',
'<%=activity.isWorkingFromHome() ? "בית" : "מוקד"%>',
'<%=activityDesc%>',
'<%=lengthStr%>',
'<shf:dayofweek date="<%=shiftStartTime%>"/>',
'<shf:shftime date="<%=shiftEndTime%>"/>',
'<shf:shftime date="<%=shiftStartTime%>"/>',
'<shf:shfdate date="<%=shiftStartTime%>"/>',
'<%="agentDayId="+activity.getAgentDayId()%>'
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

</BODY>
</HTML>