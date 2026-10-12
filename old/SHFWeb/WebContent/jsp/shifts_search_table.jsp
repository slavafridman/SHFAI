<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ page import="java.util.Date,bzq.shf.utils.SHFConstants,bzq.shf.utils.SHFUtils"%>

<jsp:useBean
	id="shiftForm"
	class="bzq.shf.forms.ShiftDataForm"
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>



<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="org.apache.commons.validator.GenericValidator"%>
<%@page import="bzq.utils.BaseConvert"%><HTML>
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
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" >
<SCRIPT language="JavaScript">
/*@cc_on @*/
/*@if (@_win32 && @_jscript_version>=5)

function window.confirm(str)
{
    execScript('n = msgbox("'+str+'","4132")', "vbscript");
    return(n == 6);
}
@end @*/


var myHeader=[
"ביטול לוגין"
,"הערה"
,"שינוי"
,"פיצול"
,"תגבור"
,"החלפה"
,"צוות"
,"שלוחה"
,"מיקום"
,"תור"
,"תפקיד בפועל"
,"שעת סיום"
,"שעת התחלה"
,"שם"
,"תאריך"
,"יום"];
var txtColor=['#000','#000','#000','#000','#000','#000','#000','#000'];
var selectedRow;
var onclickActive=true;
function onclickFunction(){
	var shiftId=selectedRow.split("&",1)[0];
	var agentDay=shiftId.split("=",2)[1];
	viewBreak(agentDay);
	top.frames['frMsgBar'].document.getElementById("messageBarArea").innerHTML=document.getElementById("remark"+agentDay).innerHTML;
}
</SCRIPT>

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
	String ename=bzq.utils.BaseConvert.specialCharactersHTML(empname,true,true);
	
	String activity = SHFTableUtils.getActivityNames(shiftBean.getShiftActivity());
	if(GenericValidator.isBlankOrNull(activity.trim())){
		if(shiftBean.getExceptionTypeId()>0){
			activity="<font color=red><b>*</b></font> "+ SHFTableUtils.getExceptionName(String.valueOf(shiftBean.getExceptionTypeId()));
		}
	}
	String remark=BaseConvert.specialCharactersJS(shiftBean.getRemark());
	
	String cancelLoginRemark=shiftBean.getCancelLoginRemark();
	cancelLoginRemark=bzq.shf.utils.SHFUtils.replace(cancelLoginRemark,"\'","&#39;");
	cancelLoginRemark=bzq.shf.utils.SHFUtils.replace(cancelLoginRemark,"\"","&nbsp;");
	cancelLoginRemark=BaseConvert.specialCharactersJS(cancelLoginRemark);
	cancelLoginRemark=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(cancelLoginRemark);
	cancelLoginRemark=bzq.shf.utils.SHFUtils.replace(cancelLoginRemark,"\\n","&nbsp;");
	
	String applierName=BaseConvert.specialCharactersJS(shiftBean.getApplierName());
	applierName=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(applierName);
	applierName=bzq.shf.utils.SHFUtils.replace(applierName,"\'","&#39;");
	
	String updaterName=BaseConvert.specialCharactersJS(shiftBean.getUpdaterName());
	updaterName=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(updaterName);
	updaterName=bzq.shf.utils.SHFUtils.replace(updaterName,"\'","&#39;");
	
	String od=bzq.utils.BaseConvert.dateToString(shiftBean.getWmShiftStartTime(),"dd/MM/yyyy");
	String os=bzq.utils.BaseConvert.dateToString(shiftBean.getWmShiftStartTime(),"HH:mm");
	String oe=bzq.utils.BaseConvert.dateToString(shiftBean.getWmShiftEndTime(),"HH:mm");
	String nd=bzq.utils.BaseConvert.dateToString(shiftBean.getShiftStart(),"dd/MM/yyyy");
	String ns=bzq.utils.BaseConvert.dateToString(shiftBean.getShiftStart(),"HH:mm");
	String ne=bzq.utils.BaseConvert.dateToString(shiftBean.getShiftEnd(),"HH:mm");
	String user=BaseConvert.specialCharacters(shiftBean.getModificationUser());
	String sr=bzq.shf.utils.SHFTableUtils.getEventReasonName(String.valueOf(shiftBean.getStartChangeReason()));
	String er=bzq.shf.utils.SHFTableUtils.getEventReasonName(String.valueOf(shiftBean.getEndChangeReason()));
	boolean shiftLocationChanged = false;
	String ol = "";
	String nl = "";
	if(shiftBean.getWmEmpIdNumber().equals(shiftBean.getNewEmpIdNumber())){
		shiftLocationChanged = shiftBean.getNewWorkFromHome() == null ? false : shiftBean.getNewWorkFromHome().equals(shiftBean.getWorkFromHome()) ? false : true;
		ol = "Y".equals(shiftBean.getWorkFromHome()) ? "בית" : "מוקד";
		nl = shiftBean.getNewWorkFromHome() != null ? "Y".equals(shiftBean.getNewWorkFromHome()) ? "בית" : "מוקד" : ol;
	}	
	sr=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(sr);
	er=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(er);
	sr=bzq.shf.utils.SHFUtils.replace(sr,"\'","&#39;");
	er=bzq.shf.utils.SHFUtils.replace(er,"\'","&#39;");
	user=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(user);
	user=bzq.shf.utils.SHFUtils.replace(user,"\'","&#39;");
	String ss=bzq.utils.BaseConvert.dateToString(shiftBean.getSplitShiftStart(),"HH:mm");
	String se=bzq.utils.BaseConvert.dateToString(shiftBean.getSplitShiftEnd(),"HH:mm");
	double shiftDur = shiftBean.getSplitShiftDurationHours();
	
%>
[

'<div id="remarkLoginCell<%=agentDay%>" value=<%=GenericValidator.isBlankOrNull(applierName)?"0":"1"%> ><span id="remarkLogin<%=agentDay%>" style="display:none;"><%=cancelLoginRemark%></span><span id="cancelRemarkImg<%=agentDay%>"><%=GenericValidator.isBlankOrNull(applierName)?"&nbsp;":"<img onclick=showCancelRemarkDialog("+"\""+updaterName+"\","+"\""+applierName+"\","+"\""+cancelLoginRemark+"\""+") src=/shf/images/cancel_login_click.png>"%></span></div>',
'<div id="remarkCell<%=agentDay%>"><span id="remark<%=agentDay%>" style="display:none;"><%=remark%></span><span id="remarkImg<%=agentDay%>"><%=GenericValidator.isBlankOrNull(remark)?"&nbsp;":"<img src=/shf/images/edit.gif>"%></span></div>',
<%
if( ( shiftBean.getNewShiftStart()!=null  && (!shiftBean.getNewShiftStart().equals(shiftBean.getWmShiftStartTime()))  ) || ( shiftBean.getNewShiftEnd()!=null && (!shiftBean.getNewShiftEnd().equals(shiftBean.getWmShiftEndTime()))) || shiftLocationChanged){
%>
'<span style="color:<%=shiftBean.getShiftLengthChange()>=0?"green":"red"%>;" onclick=showChangeReason("<%=od%>","<%=os%>","<%=oe%>","<%=nd%>","<%=ns%>","<%=ne%>","<%=user%>","<%=sr%>","<%=er%>","<%=ol%>","<%=nl%>");><%=SHFUtils.getLengthFormat(shiftBean.getShiftLengthChange()) %></span>',
<%}else{%>
'&nbsp;',
<%}%>
'<%= shiftBean.isShiftSplit() ? "<span><img src=/shf/images/shiftSplit.png onclick=showShiftSplitDetails(\\'"+ns+"\\',\\'"+ss+"\\',\\'"+se+"\\',\\'"+ne+"\\',\\'"+shiftDur+"\\');></span>" : "&nbsp;" %>',
'<%=source.startsWith("f")?"<img src=/shf/images/plus.gif />":""%>',
'<%=(shiftBean.getNewEmpIdNumber()!=null && (!shiftBean.getNewEmpIdNumber().equals(shiftBean.getWmEmpIdNumber())) )?"<span><img onclick=viewOriginalShift("+shiftBean.getSwitchDayId()+"); src=/shf/images/fswitch2.gif /></span>":""%>',
'<shf:tables tableName="unitCode" codeName="<%=String.valueOf(team)%>"/>',
'<%= shiftBean.isWorkingFromHome() ? "<span><img class=extImg src=\"/shf/images/" + (shiftBean.getShiftExtNum() != null ? "extension_exist" : "extension_absent") + ".png\" style=\"height:14px;\" " + (shiftBean.getShiftExtNum() != null ? "alt=\""+shiftBean.getShiftExtNum()+"\"" : shiftBean.getShiftExtErr() != null ? "alt=\""+shiftBean.getShiftExtErr()+"\"" : "") + "/></span>" : "" %>',
'<%= shiftBean.isWorkingFromHome() ? "בית" : "מוקד" %>',
'<%=activity%>',
'<shf:tables tableName="innerJobCode" codeName="<%=shiftBean.getInnerJobId()%>"/>',
'<shf:shftime date="<%=shiftBean.getShiftEnd()%>"/>',
'<shf:shftime date="<%=shiftBean.getShiftStart()%>"/>',
'<shf:employee empid="<%=shiftBean.getEmployeeId()%>" empname="<%=ename%>" />',
'<shf:shfdate  date="<%=shiftBean.getShiftStart()%>"/>',
'<shf:dayofweek date="<%=shiftBean.getShiftStart()%>"/>',
'<%="shiftId="+agentDay+"&innerJob="+shiftBean.getInnerJobId()+"&employeeOrgUnit="+team+"&isNewShiftReplace=1&site="+shiftBean.getSiteId()+"&employeePersonalId="+shiftBean.getEmpIdNumber()+"&activity="+shiftBean.getShiftActivity()+
	"&startTime="+SHFUtils.formatDateToString(shiftBean.getShiftStart(),"dd/MM/yyyy-HH:mm")+
	"&endTime="+SHFUtils.formatDateToString(shiftBean.getShiftEnd(),"dd/MM/yyyy-HH:mm")+
	"&timeFrom="+shiftForm.getTimeFrom()+"&timeTo="+shiftForm.getTimeTo()%>&attendanceDate=<bzq:date name="shiftForm" property="attendanceDate"/><%="&agentDayId="+agentDay+"&employeeId="+shiftBean.getEmployeeId()+"&workFromHome=" + (shiftBean.isWorkingFromHome() ? "Y" : "N") + "&shiftExtNum="+(shiftBean.getShiftExtNum() != null ? "true" : "false" )%>'
]
<%if(i<size-1){%>,<%}}%>];
drawGrid2('dataGridDiv');
</SCRIPT>
<%
} else {
%>
<div class="gridNoData">אין נתונים</div>
<%	
}
%>

</BODY>
</HTML>

