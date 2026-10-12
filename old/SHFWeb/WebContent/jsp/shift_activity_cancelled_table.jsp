<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ page import="bzq.shf.utils.SHFUtils"%>
<%@ page import="java.util.Date" %>

<jsp:useBean id="shift_cancelled_list" class="java.util.Vector" scope="request"></jsp:useBean>

<jsp:useBean id="shiftCancelledForm" class="bzq.shf.forms.ActivityCancelForm"
	scope="request">
</jsp:useBean>


<%@taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>


<%@page import="com.ibm.websphere.management.repository.Document"%>
<%@page import="java.util.HashMap"%>
<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="bzq.utils.BaseConvert"%><html:html>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="org.apache.commons.validator.GenericValidator"%>
<shf:reloadErrors></shf:reloadErrors>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector,bzq.shf.bean.AgentDayBean"

%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255" >
<META name="GENERATOR" content="IBM WebSphere Studio" >
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<SCRIPT language="JavaScript">
var selectedRow;
var dataGridDivCurr=null;
var myData=null;


var myHeader=["הערות","סיבת ביטול","זמן ביטול","מבטל","שינוי","תיגבור","החלפה","סוג פעילות","צוות","תור","תפקיד בפועל","שעת סיום","שעת התחלה","שם","יום"];
var txtColor=['#000','#000','#000','#000','#000','#000','#000','#000','#000', '#000','#000','#000','#000','#000','#000','#000'];
var onclickActive=true;
function onclickFunction(){
	
	top.frames['frMsgBar'].document.getElementById("messageBarArea").innerHTML=document.getElementById("remark"+selectedRow).innerHTML;
}
</SCRIPT>

<TITLE></TITLE>
</HEAD>
<BODY>

<%
String shiftEnd = null;

if(shift_cancelled_list!=null && shift_cancelled_list.size()>0){

%>
<SCRIPT>

myData=[
<%
int size=shift_cancelled_list.size();
for(int i=0;i<size;i++){

	AgentDayBean agentDayBean=(AgentDayBean)shift_cancelled_list.get(i);
	String team = agentDayBean.getOrgUnitCode();
	String cancelReasonCode = agentDayBean.getCancelReasonCode();
	long agentDay = agentDayBean.getAgentDayId();
	String  reinforcing = "";
		if (agentDayBean.getShiftSource()!= null  ){
	
	    reinforcing = agentDayBean.getShiftSource().substring(0,1);
	    if (reinforcing.contains("f")) {
	        reinforcing = "<img src=/shf/images/plus.gif />";
	     
		} 
		else{
	    reinforcing = "";
		}
	}	
	String empname=agentDayBean.getFirstName()+" "+agentDayBean.getLastName();
	String empnameMod=agentDayBean.getModificationUser();
	String flag="",flagUser="";
	if(agentDayBean.getFlag()!=null){
		flag=agentDayBean.getFlag().substring(0,1);
		flagUser=agentDayBean.getFlag().substring(2,agentDayBean.getFlag().length());
	}
	String activity = SHFTableUtils.getActivityNames(agentDayBean.getWmActivityId());
	
	//String moked=bzq.shf.utils.SHFTableUtils.getUnitByCode(team).getParent();
	//long agentDay = agentDayBean.getAgentDayId();
	String enameMod=bzq.shf.utils.SHFUtils.replace(empnameMod,"'","&#39;");
	String ename=bzq.shf.utils.SHFUtils.replace(empname,"'","&#39;");
	String remark=BaseConvert.specialCharactersJS(agentDayBean.getCancelReasonRemark());
	String od=bzq.utils.BaseConvert.dateToString(agentDayBean.getWmShiftStartTime(),"dd/MM/yyyy");
	String os=bzq.utils.BaseConvert.dateToString(agentDayBean.getWmShiftStartTime(),"HH:mm");
	String oe=bzq.utils.BaseConvert.dateToString(agentDayBean.getWmShiftEndTime(),"HH:mm");
	String nd=bzq.utils.BaseConvert.dateToString(agentDayBean.getShiftStart(),"dd/MM/yyyy");
	String ns=bzq.utils.BaseConvert.dateToString(agentDayBean.getShiftStart(),"HH:mm");
	String ne=bzq.utils.BaseConvert.dateToString(agentDayBean.getShiftEnd(),"HH:mm");
	String user=BaseConvert.specialCharacters(agentDayBean.getModificationUser());
	String sr=bzq.shf.utils.SHFTableUtils.getEventReasonName(String.valueOf(agentDayBean.getStartChangeReason()));
	String er=bzq.shf.utils.SHFTableUtils.getEventReasonName(String.valueOf(agentDayBean.getEndChangeReason()));
	sr=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(sr);
	er=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(er);
	sr=bzq.shf.utils.SHFUtils.replace(sr,"\'","&#39;");
	er=bzq.shf.utils.SHFUtils.replace(er,"\'","&#39;");
	user=bzq.shf.utils.SHFUtils.replaceWhiteSpacesWithNbsp(user);
	user=bzq.shf.utils.SHFUtils.replace(user,"\'","&#39;");
%>

[
'<div id="remarkCell<%=agentDay%>"><span id="remark<%=agentDay%>" style="display:none;"><%=remark%></span><span id="remarkImg<%=agentDay%>"><%=GenericValidator.isBlankOrNull(remark)?"&nbsp;":"<img src=/shf/images/edit.gif>"%></span></div>',
'<shf:tables tableName="eventReasonCode" codeName="<%=String.valueOf(cancelReasonCode)%>"/>',
'<shf:shftime date="<%=agentDayBean.getModificationTime()%>" pattern="dd/MM/yyyy HH:mm" />',
<%
if(agentDayBean.getModificationUser()!=null  ){
%>
'<%=enameMod%>',
<%}else{%>
'&nbsp;',
<%}%>

<%
if(agentDayBean.getNewShiftStart()!=null || agentDayBean.getNewShiftEnd()!=null ){
%>
'<span style="color:<%=agentDayBean.getShiftLengthChange()>=0?"green":"red"%>;" onclick=showChangeReason("<%=od%>","<%=os%>","<%=oe%>","<%=nd%>","<%=ns%>","<%=ne%>","<%=user%>","<%=sr%>","<%=er%>");><%=SHFUtils.getLengthFormat(agentDayBean.getShiftLengthChange()) %></span>',
<%}else{%>
'&nbsp;',
<%}%>

'<%=reinforcing%>',
'<%=(agentDayBean.getSwitchDayId()>0 )?"<img src=/shf/images/fswitch2.gif />":""%>',
<%if(agentDayBean.getExceptionTypeId()>0){%>
'<shf:tables tableName="exceptionCode" codeName="<%=String.valueOf(agentDayBean.getExceptionTypeId() )%>"/>',
<%}else if(agentDayBean.getTimeoffTypeId()>0){%>
'<shf:tables tableName="timeoffCode" codeName="<%=String.valueOf(agentDayBean.getTimeoffTypeId())%>"/>',
<%}else if(agentDayBean.getWmActivityId()==null){%>
'<%=SHFTableUtils.getTimeoffName(null)%>',
<%}else{%>
'',
<%}%>
'<shf:tables tableName="unitCode" codeName="<%=String.valueOf(team)%>"/>',
'<%=activity%>',
'<shf:tables tableName="innerJobCode" codeName="<%=agentDayBean.getInnerJobId()%>"/>',
'<shf:shftime date="<%=agentDayBean.getShiftEnd()%>"/>',
'<shf:shftime date="<%=agentDayBean.getShiftStart()%>"/>',

'<shf:employee empid="<%=agentDayBean.getEmployeeId()%>" empname="<%=ename%>" />',
'<shf:dayofweek date="<%=agentDayBean.getShiftStart()%>"/>',
'<%=agentDay%>'
]

<%if(i<size-1){%>,<%}}%>];

drawGrid2('dataGridDiv');
</script>


<%
}else{
%>
<div class="gridNoData">אין נתונים</div>
<%	
}
%>


</BODY>
</html:html>

