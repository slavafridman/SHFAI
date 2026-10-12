<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean
	id="attendanceForm"
	class="bzq.shf.forms.EmployeeArriveForm"
	scope="request">
</jsp:useBean>

<jsp:useBean
	id="attendanceBean"
	class="bzq.shf.bean.AgentDayBean"
	scope="page">
</jsp:useBean>


<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>


<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="org.apache.commons.validator.GenericValidator"%><HTML>
<HEAD>

<%@ page 
language="java"
contentType="text/html;charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.utils.BaseConvert,bzq.shf.utils.SHFUtils,bzq.shf.bean.AgentDayBean,java.util.Vector"
%>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">


<SCRIPT>
/*@cc_on @*/
/*@if (@_win32 && @_jscript_version>=5)

function window.confirm(str)
{
    execScript('n = msgbox("'+str+'","4132")', "vbscript");
    return(n == 6);
}
@end @*/
</SCRIPT>

</HEAD>

<BODY>

<SCRIPT language="javascript">
<%
//******************************************************
//DO NOT CHANGE THE COLUMN ORDER AND PLACE !!!! (Yuval)
//******************************************************
boolean exit=true;
if(!attendanceForm.getAttendanceDate().before(new java.util.Date())){
exit=false;
%>
var myHeader=new Array(
"ביטול לוגין"
,"הערה"
,"כניסה"
,"חיסור"
,"שינוי"
,"פיצול"
,"תגבור"
,"החלפה"
,"מיקום"
,"תור"
,"תפקיד בפועל"
,"צוות"
,"סיום"
,"התחלה"
,"שם"
,"נוכח"
,"תדריך"
,"&nbsp;");
var txtColor=new Array('#000','#338833','#000','#000','#338833','#000','#000','#000','#000');
<%}else{%>
var myHeader=new Array(
"ביטול לוגין"
,"הערה"
,"יציאה"
,"כניסה"
,"חיסור"
,"שינוי"
,"פיצול"
,"תגבור"
,"החלפה"
,"מיקום"
,"תור"
,"תפקיד בפועל"
,"צוות"
,"סיום"
,"התחלה"
,"שם"
,"נוכח"
,"תדריך"
,"&nbsp;");
var txtColor=new Array('#000','red','#338833','#000','#000','#000','#000','#000','#000','#000','#338833');
<%}%>
var selectedRow;
var onclickActive=true;
function onclickFunction(){
	top.frames['frMsgBar'].document.getElementById("messageBarArea").innerHTML=document.getElementById("remark"+selectedRow).innerHTML;
}

</SCRIPT>
<%
Vector list=(Vector)request.getAttribute("shifts_list");
if(list!=null && list.size()>0){
int size=list.size();
boolean regStationAllowed=attendanceForm.getAllowedActivities().contains("attend_reg_station");
boolean regStageAllowed=attendanceForm.getAllowedActivities().contains("attend_reg_stage");
boolean addMissingAllowed=attendanceForm.getAllowedActivities().contains("attend_add_missing");

%>
<SCRIPT>
var myData=[
<%
for(int i=0;i<size;i++){
	attendanceBean=(AgentDayBean)list.get(i);
	String empname=attendanceBean.getFirstName()+" "+attendanceBean.getLastName();
	String team = attendanceBean.getOrgUnitCode();
	String moked=bzq.shf.utils.SHFTableUtils.getUnitByCode(team).getParent();
	long agentDay = attendanceBean.getAgentDayId();
	String activity = SHFTableUtils.getActivityNames(attendanceBean.getShiftActivity());
	if(GenericValidator.isBlankOrNull(activity.trim())){
		if(attendanceBean.getExceptionTypeId()>0){
			activity="<font color=red><b>*</b></font> "+ SHFTableUtils.getExceptionName(String.valueOf(attendanceBean.getExceptionTypeId()));
		}
	}
	
	String innerJob = SHFTableUtils.getInnerJobName(attendanceBean.getInnerJobId());
	String cancelLoginRemark=attendanceBean.getCancelLoginRemark();
	cancelLoginRemark=bzq.shf.utils.SHFUtils.replace(cancelLoginRemark,"\'","&#39;");
	cancelLoginRemark=bzq.shf.utils.SHFUtils.replace(cancelLoginRemark,"\"","&nbsp;");
	cancelLoginRemark=BaseConvert.specialCharactersJS(cancelLoginRemark);
	cancelLoginRemark=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(cancelLoginRemark);
	cancelLoginRemark=bzq.shf.utils.SHFUtils.replace(cancelLoginRemark,"\\n","&nbsp;");
	
	String applierName=BaseConvert.specialCharactersJS(attendanceBean.getApplierName());
	applierName=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(applierName);
	applierName=bzq.shf.utils.SHFUtils.replace(applierName,"\'","&#39;");
	
	String updaterName=BaseConvert.specialCharactersJS(attendanceBean.getUpdaterName());
	updaterName=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(updaterName);
	updaterName=bzq.shf.utils.SHFUtils.replace(updaterName,"\'","&#39;");
	
	
	String remark=BaseConvert.specialCharactersJS(attendanceBean.getRemark());
	String source = attendanceBean.getShiftSource();
	java.util.Date missingTime = attendanceBean.getMissingTime();
	String stationUser = attendanceBean.getStationArrivalUser();
	java.util.Date stationTime = attendanceBean.getStationArrivalTime();
	java.util.Date stageTime = attendanceBean.getStageArrivalTime();
	java.util.Date exitTime = attendanceBean.getStationExitTime();
	String stageUser = attendanceBean.getStageArrivalUser();
	int tadreech = attendanceBean.getTadreech();
	int missingReason = attendanceBean.getMissingReasonId();
	int lateMinutes = attendanceBean.getLateMinutes();
	int lateReason = attendanceBean.getLateReasonId();
	String ename=SHFUtils.replace(empname,"'","&#39;");
	String flag="",flagUser="";
	if(attendanceBean.getFlag()!=null){
		flag=attendanceBean.getFlag().substring(0,1);
		flagUser=attendanceBean.getFlag().substring(2,attendanceBean.getFlag().length());
	}
		
	String od=bzq.utils.BaseConvert.dateToString(attendanceBean.getWmShiftStartTime(),"dd/MM/yyyy");
	String os=bzq.utils.BaseConvert.dateToString(attendanceBean.getWmShiftStartTime(),"HH:mm");
	String oe=bzq.utils.BaseConvert.dateToString(attendanceBean.getWmShiftEndTime(),"HH:mm");
	String nd=bzq.utils.BaseConvert.dateToString(attendanceBean.getShiftStart(),"dd/MM/yyyy");
	String ns=bzq.utils.BaseConvert.dateToString(attendanceBean.getShiftStart(),"HH:mm");
	String ne=bzq.utils.BaseConvert.dateToString(attendanceBean.getShiftEnd(),"HH:mm");
	String user=BaseConvert.specialCharacters(attendanceBean.getModificationUser());
	String sr=bzq.shf.utils.SHFTableUtils.getEventReasonName(String.valueOf(attendanceBean.getStartChangeReason()));
	String er=bzq.shf.utils.SHFTableUtils.getEventReasonName(String.valueOf(attendanceBean.getEndChangeReason()));
	boolean shiftLocationChanged = false;
	String ol = "";
	String nl = "";
	if(attendanceBean.getWmEmpIdNumber().equals(attendanceBean.getNewEmpIdNumber())){
		shiftLocationChanged = attendanceBean.getNewWorkFromHome() == null ? false : attendanceBean.getNewWorkFromHome().equals(attendanceBean.getWorkFromHome()) ? false : true;
		ol = "Y".equals(attendanceBean.getWorkFromHome()) ? "בית" : "מוקד";
		nl = attendanceBean.getNewWorkFromHome() != null ? "Y".equals(attendanceBean.getNewWorkFromHome()) ? "בית" : "מוקד" : ol;
	}
	
	sr=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(sr);
	er=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(er);
	sr=bzq.shf.utils.SHFUtils.replace(sr,"\'","&#39;");
	er=bzq.shf.utils.SHFUtils.replace(er,"\'","&#39;");
	user=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(user);
	user=bzq.shf.utils.SHFUtils.replace(user,"\'","&#39;");
	String ss=bzq.utils.BaseConvert.dateToString(attendanceBean.getSplitShiftStart(),"HH:mm");
	String se=bzq.utils.BaseConvert.dateToString(attendanceBean.getSplitShiftEnd(),"HH:mm");
	double shiftDur = attendanceBean.getSplitShiftDurationHours();
%>

[
'<div id="remarkLoginCell<%=agentDay%>" value=<%=GenericValidator.isBlankOrNull(applierName)?"0":"1"%> ><span id="cancelRemarkImg<%=agentDay%>"><%=GenericValidator.isBlankOrNull(applierName)?"&nbsp;":"<img onclick=showCancelRemarkDialog("+"\""+updaterName+"\","+"\""+applierName+"\","+"\""+cancelLoginRemark+"\""+") src=/shf/images/cancel_login_click.png>"%></span></div>',
'<div id="remarkCell<%=agentDay%>"><span id="remark<%=agentDay%>" style="display:none;"><%=remark%></span><span id="remarkImg<%=agentDay%>"><%=GenericValidator.isBlankOrNull(remark)?"&nbsp;":"<img src=/shf/images/edit.gif>"%></span></div>',
<%
//******************************************************
//DO NOT CHANGE THE COLUMN ORDER AND PLACE !!!! (Yuval)
//******************************************************
if(exit){
if(attendanceBean.getStationExitTime()!=null){%>
'<div name="<%=exitTime%>" id="exit<%=agentDay%>"><shf:shftime date="<%=exitTime%>"/></div>',
<%}else{%>
'&nbsp;',
<%}}%>
'<div name="<%=stationTime%>" id="setStation<%=agentDay%>">'+ stationCol(<%=regStationAllowed+","+agentDay+","+((stationTime==null)?"''":"'"+BaseConvert.dateToString(stationTime, "HH:mm" )+"'")+","+lateMinutes+","+missingReason+","+lateReason+","+((exitTime==null)?"''":"'"+BaseConvert.dateToString(exitTime, "HH:mm" )+"'")%>)+'</div>',
'<div name="m<%=missingReason>0?1:0%>" value="<%=missingReason>0?1:0%>" id="setMissing<%=agentDay%>">'+ missingCol(<%=addMissingAllowed+","+agentDay+","+((stageTime==null)?"''":"'"+stageTime+"'")+","+missingReason+","+((stationTime==null)?"''":"'"+stationTime+"'")+","+bzq.shf.utils.SHFConstants.MISSING_REASON%>)+'</div>',
<%
if( ( attendanceBean.getNewShiftStart()!=null && (!attendanceBean.getNewShiftStart().equals(attendanceBean.getWmShiftStartTime())) ) || ( attendanceBean.getNewShiftEnd()!=null && (!attendanceBean.getNewShiftEnd().equals(attendanceBean.getWmShiftEndTime())) ) || shiftLocationChanged ){
%>
'<span style="color:<%=attendanceBean.getShiftLengthChange()>=0?"green":"red"%>;" onclick=showChangeReason("<%=od%>","<%=os%>","<%=oe%>","<%=nd%>","<%=ns%>","<%=ne%>","<%=user%>","<%=sr%>","<%=er%>","<%=ol%>","<%=nl%>");><%=SHFUtils.getLengthFormat(attendanceBean.getShiftLengthChange()) %></span>',
<%}else{%>
'&nbsp;',
<%}%>
'<%= attendanceBean.isShiftSplit() ? "<span><img src=/shf/images/shiftSplit.png onclick=showShiftSplitDetails(\\'"+ns+"\\',\\'"+ss+"\\',\\'"+se+"\\',\\'"+ne+"\\',\\'"+shiftDur+"\\');></span>" : "&nbsp;" %>',
'<%=source.startsWith("f")?"<img src=/shf/images/plus.gif />":""%>',
'<%=(attendanceBean.getNewEmpIdNumber()!=null && (!attendanceBean.getNewEmpIdNumber().equals(attendanceBean.getWmEmpIdNumber())))?"<span><img onclick=viewOriginalShift("+attendanceBean.getSwitchDayId()+"); src=/shf/images/fswitch2.gif /></span>":""%>',
'<%= attendanceBean.isWorkingFromHome() ? "בית" : "מוקד"%>',
'<%=activity%>',
'<%=innerJob%>',
'<shf:tables tableName="unitCode" codeName="<%=String.valueOf(team)%>"/>',
'<shf:shftime date="<%=attendanceBean.getShiftEnd()%>"/>',
'<shf:shftime date="<%=attendanceBean.getShiftStart()%>"/>',
'<shf:employee empid="<%=attendanceBean.getEmployeeId()%>" empname="<%=ename%>" />',
attendCol(<%=(stageTime!=null)+","+(missingReason>0)+","+agentDay+","+regStageAllowed+","+attendanceBean.getEmployeeId()%>),
tadrechCol(<%=(tadreech==1)+","+(missingReason>0)+","+agentDay+","+regStageAllowed+","+attendanceBean.getEmployeeId()%>),
'<div name="<%=flag%>" id="flag<%=agentDay%>">'+flagCol("<%=flag%>","<%=flagUser%>")+'</div>',
'<%=agentDay%>'

]
<%if(i<size-1){%>,<%}}%>];
drawGrid2("dataGridDiv");
</SCRIPT>

<%}else{%><div  class="gridNoData">אין נתונים</div><%}%>

</BODY>
</HTML>

