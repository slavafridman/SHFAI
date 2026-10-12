<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">



<jsp:useBean
	id="shiftForm"
	class="bzq.shf.forms.ShiftDataForm"
	scope="request">
</jsp:useBean>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector,bzq.shf.bean.AgentDayBean"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<SCRIPT language="JavaScript">
/*@cc_on @*/
/*@if (@_win32 && @_jscript_version>=5)

function window.confirm(str)
{
    execScript('n = msgbox("'+str+'","4132")', "vbscript");
    return(n == 6);
}
@end @*/


var myHeader=["נוכחות","צוות","מיקום","תור","תפקיד בפועל","סיום","התחלה","תאריך","שם","יום"];
var txtColor=['#000','#000','#000','#000','#000','#448844','#000','#000','#000','#000'];
var selectedRow;

</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY>

<%
Vector list=(Vector)request.getAttribute("shifts_list");
AgentDayBean shiftBean = null;
if(list!=null && list.size()>0){
int size=list.size();
%>
<SCRIPT>
var myData=[
<%
for(int i=0;i<size;i++){
	shiftBean=(AgentDayBean)list.get(i);
	String empname=shiftBean.getFirstName()+" "+shiftBean.getLastName();
	String team = shiftBean.getOrgUnitCode();
	String moked=bzq.shf.utils.SHFTableUtils.getUnitByCode(team).getParent();
	long agentDay = shiftBean.getAgentDayId();
	int job = shiftBean.getJobCode();
	String source = shiftBean.getShiftSource();
	java.util.Date missingTime = shiftBean.getMissingTime();
	String stationUser = shiftBean.getStationArrivalUser();
	java.util.Date stationTime = shiftBean.getStationArrivalTime();
	java.util.Date stageTime = shiftBean.getStageArrivalTime();
	String stageUser = shiftBean.getStageArrivalUser();
	int missingReason = shiftBean.getMissingReasonId();
	int lateMinutes = shiftBean.getLateMinutes();
	int lateReason = shiftBean.getLateReasonId();
	String reasonDesc=bzq.shf.utils.SHFTableUtils.getReasonDesc(missingReason);
	String ename=bzq.shf.utils.SHFUtils.replace(empname,"'","&#39;");	
	
%>

[
<%if(shiftBean.getMissingReasonId()>0){%>'<IMG src=/shf/images/rem.gif alt="<shf:tables tableName="eventReasonCode" codeName="<%=String.valueOf(shiftBean.getMissingReasonId())%>"/>" >'<%}else if(shiftBean.getStationArrivalTime()!=null){%>'<shf:shftime date="<%=shiftBean.getStationArrivalTime()%>"/>'<%}else{%>'<span style="color:red;font-weight:bold;">-</span>'<%}%>,
'<shf:tables tableName="unitCode" codeName="<%=String.valueOf(team)%>"/>',
//'<shf:tables tableName="unitCode" codeName="<%=moked%>"/>',
'<%=shiftBean.isWorkingFromHome() ? "בית" : "מוקד"%>',
'<%=bzq.shf.utils.SHFTableUtils.getActivityNames(shiftBean.getShiftActivity())%>',
'<%=bzq.shf.utils.SHFTableUtils.getInnerJobName(shiftBean.getInnerJobId())%>',
'<shf:shftime date="<%=shiftBean.getShiftEnd()%>"/>',
'<shf:shftime date="<%=shiftBean.getShiftStart()%>"/>',
'<shf:shfdate date="<%=shiftBean.getShiftStart()%>"/>',
'<shf:employee empid="<%=shiftBean.getEmployeeId()%>" empname="<%=ename%>" />',
'<shf:dayofweek date="<%=shiftBean.getShiftStart()%>"/>',
'<%=agentDay%>'
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

