<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="exceptionForm" class="bzq.shf.forms.ExceptionSearchForm" scope="request"></jsp:useBean>
<jsp:useBean id="exceptions" class="java.util.Vector" scope="request"></jsp:useBean>


<%@ page language="java" contentType="text/html; charset=windows-1255" 
pageEncoding="windows-1255"
import=""
%>

<%@ taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>

<HTML>
<head>

<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>

<script type="text/javascript">
function exportExcel(){
	document.forms['exceptionForm'].target="_blank";
	document.forms['exceptionForm'].action="/shf/exceptions/export.do";
	document.forms['exceptionForm'].submit();
}

function keyPressed(){
	var k=window.event.keyCode;
	if(Number(k)==13){
		validateExceptionForm();
	}
}

function validateExceptionForm(){
	document.forms['exceptionForm'].target="";
	document.forms['exceptionForm'].action="/shf/exceptions/result.do";
	document.forms['exceptionForm'].submit();
}

function viewAddRemark(){
	if(selectedRow==null || selectedRow==''){
		window.alert("נא לבחור פעילות קודם");
		return;
	}
	var array = selectedRow.split(":");
	viewExceptionRemarkDialog(array[0],array[1],array[2],array[3]);
}

function cancelException(){
	if(selectedRow==null || selectedRow==''){
		window.alert("נא לבחור פעילות קודם");
		return;
	}
	if(!window.confirm("האם אתה בטוח שברצונך לבטל את הפעילות")){
		return;
	}
	
	var array = selectedRow.split(":");
	
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
	
	xmlHttp.open("GET","/shf/exceptions/cancelParam.do?agentDayId="+array[0]+"&fullday="+array[1]+"&stateType="+array[2]+"&from="+array[3]);
	xmlHttp.send(null);		
}

function viewExceptionRemarkDialog(agentDay,fullday,state,start_time){
	var key=agentDay+":"+fullday+":"+state+":"+start_time;
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
			document.getElementById("remarkPopupDiv").style.display='';
			document.getElementById("remarkPopupDiv").innerHTML=xmlHttp.responseText;
			document.getElementById("remarkText").value=document.getElementById("remark"+key).innerHTML;
        }
	}
	
	xmlHttp.open("GET","/shf/exceptions/viewRemarkDialog.do?agentDayId="+agentDay+"&fullday="+fullday+"&stateType="+state+"&from="+start_time);
	xmlHttp.send(null);	
}

function addExceptionRemark(){
	var agentDayId = document.forms[0].agentDayId.value;
	var fullday = document.forms[0].fullday.value;
	var stateType = document.forms[0].stateType.value;
	var from = document.forms[0].from.value;
	var key=agentDayId+":"+fullday+":"+stateType+":"+from;
	var remark = document.forms[0].remark.value;
	var remlen=remark.length;
	if(remlen>100){
		alert("אורך ההערה מוגבל ל 100 תווים בלבד");
		return false;
	}
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
			top.frMsgBar.location="/shf/msgBar.do";
			document.getElementById("remarkPopupDiv").innerHTML='';
			document.getElementById("remarkPopupDiv").style.display='none';
			document.getElementById("remark"+key).innerHTML=remark;
			if(remark==null || remark=='')
				document.getElementById("remarkImg"+key).innerHTML="&nbsp;";
			else
				document.getElementById("remarkImg"+key).innerHTML="<img src=/shf/images/edit.gif>";
        }
	}
	
	xmlHttp.open("GET","/shf/exceptions/addRemark.do?agentDayId="+agentDayId+"&fullday="+fullday+"&stateType="+stateType+"&from="+from+"&remark="+remark);
	xmlHttp.send(null);
}

function cofirmCancelException(){
	if(document.forms['cancelExceptionForm'].cancelReasonCode.value=="00"){
		alert("נא לבחור סיבת ביטול");
		return ;
	}
	document.forms['cancelExceptionForm'].submit();
}
</script>


<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<link rel="stylesheet" href="../theme/Master.css" type="text/css">
<link rel="stylesheet" href="../theme/shfgrid.css" type="text/css">
<title>exception_list</title>

<shf:reloadErrors></shf:reloadErrors>

<bzqjs:validator>
<bzqjs:form name="exceptionForm" />
</bzqjs:validator>

</head>

<%
String moked=exceptionForm.getMoked();
%>
<body onkeyup="keyPressed();">
<div id="remarkPopupDiv" style="display:none;" class="divPopup"></div>
<div id="cancelPopupDiv" style="display:none;" class="divPopup"></div>

	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TR>
	<TD dir="rtl" valign="top" style="height:20px;"><jsp:include page="submenu/shift_submenu.jsp"></jsp:include> </TD>
	</TR>
	
		
	<TR>
	<TD valign="top" style="padding-top:3px;padding-bottom:5px;padding-right:6px;padding-left:6px;">
		<form name="exceptionForm" method="get" action="/shf/exceptions/result.do" style="margin:0px;padding:0px;">
		<FIELDSET class="form" >
		<legend>ניהול פעילויות</legend>
		
		<TABLE cellspacing="0" cellpadding="2">
			<TBODY>
			
			<TR>
				<TD class="header">תאריך:</TD>
				<TD class="data" valign="middle">
				<shf:calendar calname="date" name="exceptionForm" property="date" marginBottom="30" marginRight="-20" />
				</TD>
				<TD width="10px"></TD>
				
				<TD class="header">משעה:</TD>
				<TD class="data">
				<shf:timechooser inputname="timeFrom" name="exceptionForm" property="timeFrom" />
				</TD>
				
				<TD width="10px"></TD>
				<TD class="header">עד:</TD>
				<TD class="data">
				<shf:timechooser inputname="timeTo" name="exceptionForm" property="timeTo" />
				</TD>
				
				
			</TR>
			
			<TR>	
				
				<TD class="header">מוקד:</TD>
				<TD class="data"><shf:unitselect tablename="unitCode" name="moked" 
					selectedName="exceptionForm" selectedProperty="moked"
					style="width:170px;font-size:10px;"
					type="<%=bzq.shf.utils.SHFConstants.MOKED_UNIT%>" all="yes"
					logic="onchange=setMultiTeams(this,'exceptionForm','team','200');setMultiActivities(this,'exceptionForm','activity');setMultiExceptions(this,'exceptionForm','exceptionCode');setMultiTimeoff(this,'exceptionForm','timeoffCode');" />
				</TD>
				
				<TD width="10px"></TD>
				
				<TD class="header">תפקיד בפועל:</TD>
				<TD class="data" valign="middle">
					<shf:innerJobCheckList name="exceptionForm" tablename="innerJobCode" property="innerJob" length="170" />
				</TD>
				
				<TD width="10px"></TD>
				
				<TD class="header">צוות:</TD>
				<TD class="data" id="teamsAjaxResult">
					<shf:orgunitCheckList parentUnit="<%=moked%>" name="exceptionForm" type="J01" property="team" optionsLength="200" ></shf:orgunitCheckList> 
				</TD>
				
				
				
			</TR>
			
			<TR>
				<TD class="header">סוג חריגה:</TD>
				<TD id="exceptionAjaxResult">
					<shf:exceptionCheckList name="exceptionForm" moked="<%=moked%>" property="exceptionCode"/>
				</TD>
				
				<td width="10px"></td>
				
				<TD class="header">סוג חופש:</TD>
				<TD colspan=4 id="timeoffAjaxResult">
					<shf:timeoffCheckList name="exceptionForm" moked="<%=moked%>" property="timeoffCode"/>
				</TD>
			</TR>
			<TR>
				
				<TD colspan=8 align="right">
					<button onclick="validateExceptionForm();">חפש</button>
				</TD>
			</TR>
			</TBODY>
		</TABLE>
		
		</FIELDSET>
		</form>
	</TD>
	</TR>
	
	<%if(exceptions!=null && exceptions.size()>0){ %>
	<TR>
		<TD style="padding-right: 6px; padding-left: 6px;">
		<TABLE cellspacing="0" cellpadding="0" width="100%"
			style="border-top: 1px silver solid; border-left: 1px silver solid; border-right: 1px silver solid;">
			<TR class="tableTotal">
				<TD style='text-align: right' class="tableTotal">
					<img src='/shf/images/search.png' height="16px"> נמצאו <%=exceptions.size()%> רשומות
				</TD>
				<shf:security activity="shift_add_remark">
					<TD style='text-align: left; padding-right: 3px' width="20px"
						class="tableTotal" style="padding-left:2px;padding-top:2px;">
					<img src='/shf/images/edit.gif' alt='הוסף הערה' onclick="viewAddRemark();" style="cursor:hand;">
					</TD>
				</shf:security>
				<shf:security activity="exception_cancel">
					<TD style='text-align:left;padding-left:2px;' width="20px" class=tableTotal>
						<img src="/shf/images/delete-16.png" alt='בטל פעילות' style="cursor:hand;" onclick="cancelException();">
					</TD>
				</shf:security>
				<TD style='text-align: left' width=20px class=tableTotal style="padding-left:2px;padding-top:2px;" width="20px">
					<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor: hand;'>
				</TD>
			</TR>
		</TABLE>
		</TD>
	</TR>
	<%}%>
	
	<TR>
		<TD valign="top" height="100%" style="padding-top: 0px; padding-right: 6px; padding-left: 6px;padding-bottom: 6px;">
			<div class=tableContainerDiv id="dataGridDiv">
				<jsp:include page="exceptions_table.jsp"></jsp:include>
			</div>
		</TD>
	</TR>


</TABLE>
	</TD>
	</TR>
	</TABLE>
	</TD>
	</TR>
	
	
	</TABLE>
	
	
</body>
</HTML>