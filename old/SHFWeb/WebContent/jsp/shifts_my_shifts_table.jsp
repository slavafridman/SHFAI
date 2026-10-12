<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ page import="java.util.Date,bzq.shf.utils.SHFConstants,bzq.shf.utils.SHFUtils,bzq.shf.bean.AgentDayBean"%>

<jsp:useBean
	id="attendanceBean"
	class="bzq.shf.bean.AgentDayBean"
	scope="page">
</jsp:useBean>

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

/*
Yuval 10.05.09
function switchShift(){
	if(selectedRow==null || selectedRow=='') 
		alert("צריך לבחור משמרת לעדכון");	
	else				
	    document.location='/shf/replace/searchForCandidate.do?'+selectedRow;	
}
*/

</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY>

<%
Vector list=(Vector)request.getAttribute("shifts_list");
AgentDayBean shiftBean = null;
String ename=null;
if(list!=null && list.size()>0){
int size=list.size();
%>

<SCRIPT>
var myHeader=["צוות","תור","שעת סיום<span style='display: none;' class='respHdr respHdrHide'/>","שעת התחלה<span style='display: none;' class='respHdr respHdrHide'/>","שם<span style='display: none;' class='respHdr respHide'/>","תאריך<span style='display: none;' class='respHdr respHdrOnly respHdrHide'/>","יום"];
var txtColor=['#000','#000','#000','#000','#000','#000','#000'];
var selectedRow;
var onclickActive=true;
function onclickFunction(){
	
	var tmp=selectedRow.split("=",2)[1];
	var agentDay=tmp.split("&",1)[0];
	viewBreak(agentDay);
	top.frMsgBar.location="/shf/msgBar.do";
}
myData=[
<%
for(int i=0;i<size;i++){

	shiftBean=(AgentDayBean)list.get(i);
	String empname=shiftBean.getFirstName()+" "+shiftBean.getLastName();
	String moked=bzq.shf.utils.SHFTableUtils.getUnitCodeOfSite(shiftBean.getSiteId());
	String team = shiftBean.getOrgUnitCode();
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
	String fieldName = "shiftId";
	String fieldDesc = "הצע החלפה";
	String reasonDesc=bzq.shf.utils.SHFTableUtils.getReasonDesc(missingReason);
	int shiftId = shiftBean.getWmShiftId();
	
	ename=bzq.utils.BaseConvert.specialCharactersHTML(empname,true,true);
	String ee=bzq.utils.BaseConvert.specialCharactersJS(empname);
	
	
%>

[
'<shf:tables tableName="unitCode" codeName="<%=String.valueOf(team)%>"/>',
'<%=bzq.shf.utils.SHFTableUtils.getActivityName(shiftBean.getShiftActivity())%>',
'<shf:shftime date="<%=shiftBean.getShiftEnd()%>"/>',
'<shf:shftime date="<%=shiftBean.getShiftStart()%>"/>',
'<shf:employee empid="<%=shiftBean.getEmployeeId()%>" empname="<%=ename%>" />',
'<shf:shfdate date="<%=shiftBean.getShiftStart()%>"/>',
'<shf:dayofweek date="<%=shiftBean.getShiftStart()%>"/>',
'<%="shiftId="+agentDay+"&isNewShiftReplace=1&site="+shiftBean.getSiteId()
+"&employeePersonalId="+shiftBean.getEmpIdNumber()
+"&startTime="+SHFUtils.formatDateToString(shiftBean.getShiftStart(),"dd/MM/yyyy-HH:mm")
+"&endTime="+SHFUtils.formatDateToString(shiftBean.getShiftEnd(),"dd/MM/yyyy-HH:mm")
+"&activity="+shiftBean.getShiftActivity()
+"&employeeId="+shiftBean.getEmployeeId()
+"&employeeOrgUnit="+shiftBean.getOrgUnitCode()
%>'

]
<%if(i<size-1){%>,<%}}%>];
drawGrid2('dataGridDiv');

</SCRIPT>

<%
}else{
%>
<div class="gridNoData">אין נתונים</div>
<%	
}
%>

</BODY>
</HTML>
