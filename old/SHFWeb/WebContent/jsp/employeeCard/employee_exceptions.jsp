<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="employeeData"
class="bzq.shf.forms.EmployeeActivitiesForm" 
scope="request">
</jsp:useBean>

<jsp:useBean id="exceptions"
class="java.util.Vector" 
scope="request">
</jsp:useBean>

<jsp:useBean id="exeption"
class="bzq.shf.bean.ExceptionSearchBean" 
scope="page">
</jsp:useBean>


<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>

<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="bzq.shf.bean.ExceptionSearchBean"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%><HTML>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.bean.ExceptionSearchBean"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" ></link>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
<script language="JavaScript" src="/shf/js/shfutils.js"></script>

<TITLE>employee_exceptions.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>

<script type="text/javascript">
function viewCancelExceptionPopup(){
	if(selectedRow==null || selectedRow==''){
		alert("נא לבחור פעילות קודם");
		return;
	}
	var accept=confirm("האם אתה בטוח כי ברצונך למחוק פעילות זו");
	if(!accept) return;
	
	
	var xmlHttp;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("cancelPopupDiv").style.display='';
			document.getElementById("cancelPopupDiv").innerHTML=xmlHttp.responseText;
        }
	}
	
	xmlHttp.open("GET","/shf/exceptions/cancelParam.do?"+selectedRow);
	xmlHttp.send(null);
	

}

function cofirmCancelException(){
	if(document.forms['cancelExceptionForm'].cancelReasonCode.value=="00"){
		alert("נא לבחור סיבת ביטול");
		return ;
	}
	document.forms['cancelExceptionForm'].action="/shf/exception/cancel.do";
	document.forms['cancelExceptionForm'].submit();
}
</script>

</HEAD>

<BODY>
<div id="cancelPopupDiv" style="display:none;" class="divPopup"></div>
<form action="/shf/employee/getExceptions.do"
name="employeeExceptionsForm" 
method="post" >

<input type="hidden" name="employeeId" value="<bzq:integer name="employeeData" property="employeeId"/>">

<TABLE style="direction:rtl" width="100%" height=100% cellpadding="0" cellspacing="0">
	<TR style="border-bottom:1px #d3d3d3 solid;">
		<TD class="header" style="padding-right:12px;padding-bottom:5px;text-align:right;border-left:0px;border-bottom:0px;">מתאריך: 
			<shf:calendar calname="from" name="employeeData" property="from"></shf:calendar>
			&nbsp;
			&nbsp;
			<button onclick="document.employeeExceptionsForm.submit();" style="width:50;">חפש</button>
		</TD>
	</TR>
	<%if(exceptions!=null && exceptions.size()>0){%>
	<TR>
		<TD>
			<TABLE cellspacing="0" cellpadding="0" width="100%" style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
				<TR class="tableTotal">
					<TD align=left width=100% style='text-align:left;padding-left:2px;'  class=tableTotal>
						&nbsp;
					</TD>
					<shf:security activity="exception_cancel">
					<TD align=left  style='text-align:left;padding-left:2px;' width="140px" class=tableTotal>
						<img src="/shf/images/delete-16.png" alt='בטל פעילות' style="cursor:hand;" onclick="viewCancelExceptionPopup();">
					</TD>
					</shf:security>
					
				</TR>
			</TABLE>
		</TD>
	</TR>
	<%}%>
	<TR>
		<TD valign="top" height="100%" dir="ltr">
		
		
			<SCRIPT>
			/*@cc_on @*/
			/*@if (@_win32 && @_jscript_version>=5)
			
			function window.confirm(str)
			{
			    execScript('n = msgbox("'+str+'","4132")', "vbscript");
			    return(n == 6);
			}
			@end @*/
			var myHeader=['סוג פעילות','משך','יום','שעת התחלה','תאריך'];
			var txtColor=['#000','#000','#000','#000','#449944'];
			var selectedRow;
			var onclickActive=true;
			function onclickFunction(){
				top.frMsgBar.location.href="/shf/msgBar.do";
			}
			</SCRIPT>
			
			<%
			if(exceptions!=null && exceptions.size()>0){
				int size=exceptions.size();
			
			%>
			<SCRIPT>
			
			var myData=[
			<%
			for(int i=0;i<size;i++){
				exeption=(ExceptionSearchBean)exceptions.get(i);
				int state=exeption.getStateType();
				
			%>
			[
			<%if(state!=SHFConstants.DAY_TYPE_TIMEOFF){%>
			'<shf:tables tableName="exceptionCode" codeName="<%=String.valueOf(exeption.getExceptionType())%>"/>',
			<%}else{%>
			'<%=SHFTableUtils.getTimeoffName(exeption.getTimeoffType())%>',
			<%}%>
			'<%=bzq.shf.utils.SHFUtils.getLengthFormat(exeption.getDuration())%>',
			'<shf:dayofweek date="<%=exeption.getStartTime()%>"/>',
			'<shf:shftime date="<%=exeption.getStartTime()%>"/>',
			'<shf:shfdate date="<%=exeption.getStartTime()%>"/>',
			'<%="agentDayId="+exeption.getAgentDayId()+"&from="%><shf:shfdate date="<%=exeption.getStartTime()%>"/>-<shf:shftime date="<%=exeption.getStartTime()%>"/><%="&stateType="+exeption.getStateType()+"&employeeId="+employeeData.getEmployeeId()%>&fullday=<%=exeption.getFullDay()%>'
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
			<div class="gridNoData">אין נתונים</div>
			<%	
			}
			%>
		
		
		</TD>
	</TR>
</TABLE>

</form>

</BODY>
</HTML>
