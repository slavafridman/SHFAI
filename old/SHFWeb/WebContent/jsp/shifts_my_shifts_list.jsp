<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@	taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<jsp:useBean 
	id="shiftForm" 
	class="bzq.shf.forms.ShiftDataForm"
	scope="request">
</jsp:useBean>
<jsp:useBean 
	id="breakForm" 
	class="bzq.shf.forms.BreakSearchForm"
	scope="request">
</jsp:useBean>
<jsp:useBean 
	id="breakBean" 
	class="bzq.shf.bean.BreakBean"
	scope="request">
</jsp:useBean>
<script src="../js/jquery-1.12.0.min.js"></script>
<script src="../js/shf_responsive.js"></script>

<SCRIPT>


function loadPage(){
	document.getElementById('emplistframe').style.display='none';
}
function sub() {
	document.forms['shiftForm'].target="";
	document.forms['shiftForm'].action = "/shf/shift/myShiftResult.do";
	document.forms['shiftForm'].submit();
}
function switchShift( isPotential ){
	if(selectedRow==null || selectedRow=='') 
		alert("צריך לבחור משמרת להחלפה");	
	else
		checkShiftForSwitch( isPotential );			
}

function keyPressed(){
	if(window.event.keyCode==13){
		sub();
	}
}
function exportExcel(){
	document.forms['shiftForm'].target="_blank";
	document.forms['shiftForm'].action = "/shf/shift/exportMyShifts.do";
	document.forms['shiftForm'].submit();
}

</SCRIPT>
<html:html>
<HEAD>
<link rel="stylesheet" type="text/css"
	href="../dojo/dijit/themes/dijit.css">
<link rel="stylesheet" type="text/css"
	href="../dojo/dijit/themes/nihilo/nihilo.css">





<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector"
%>



<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script  src="/shf/js/shfgrid.js"></script>
<script  src="/shf/js/attendance.js"></script>
<script  src="/shf/js/breakjs.js"></script>
<script  src="/shf/js/shiftjs.js"></script>
<script  src="/shf/js/exceljs.js"></script>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<META http-equiv="CACHE-CONTROL" CONTENT="NO-CACHE">
<META http-equiv="PRAGMA" CONTENT="NO-CACHE">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" >

<TITLE></TITLE>
<shf:reloadErrors></shf:reloadErrors>
<script type="text/javascript"
	djconfig="isDebug: false, parseOnLoad: true" src="../dojo/dojo/dojo.js"></script>
<script type="text/javascript">
dojo.require("dojo.parser");
dojo.require("dijit.form.Form");
</script>
</HEAD>
<%
Boolean replace=(Boolean)request.getAttribute("replaceAllowed");
boolean replaceAllowed=replace.booleanValue();
java.util.Date date=null;
try{
date = bzq.utils.BaseConvert.stringToDate("12/01/2009","dd/MM/yyyy");
}catch(bzq.utils.ConvertException e){}

Vector shiftsList=(Vector)request.getAttribute("shifts_list");
java.util.Calendar cal= java.util.Calendar.getInstance();

bzq.shf.profile.UserProfile user=(bzq.shf.profile.UserProfile)session.getAttribute("userProfile");
String userId = shiftForm.getUserId();
%>

<BODY class="nihilo">

<form name=shiftForm method=post action="/shf/shift/myShiftResult.do" >

<TABLE width=100% height=100% cellpadding="0" cellspacing="0" dir="rtl">
		<TR>
			<TD valign="top" style="height:20px;"><jsp:include page="submenu/shift_submenu.jsp"></jsp:include> </TD>
		</TR>
		<TR>
			<TD valign=top style="padding-top:3px;padding-bottom:5px;padding-right:7px;padding-left:7px;">

			<FIELDSET class=form >
			<legend> המשמרות שלי </legend>
			<TABLE cellspacing="0" cellpadding="2">
				<TBODY>
					<TR>
						<TD class=header>מתאריך:</TD>
						<TD class=data valign="middle" style="min-width: 90px;">
							<shf:calendar  calname="newShiftStart"  name="shiftForm" property="newShiftStart"/>
						</TD>
						<TD width=20px></TD>
						<TD class=header colspan="3">עבור:  <%="  " + user.getFirstName() + " " + user.getLastName() %> </TD>
						<TD width=20px></TD>
						
						<TD width=220px ></TD>
						<TD class=header >
						<button onclick="sub();" id=cbclick>חפש</button>
						</TD>
					</TR>
				</TBODY>
			</TABLE>

			</FIELDSET>
				
			</TD>
		</TR>
	<% if (shiftsList !=null && shiftsList.size()>0) {%>	
	<TR>
		<TD valign="top" style="padding-right:7px;padding-left:7px;" dir="ltr">
		<TABLE class="myShiftsTable" cellspacing=0 cellpadding=0 width=100% style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
		<TR class=tableTotal >
		<%if(replaceAllowed){%>
		<TD style='text-align:left' class=tableTotal style="padding-left:5px; padding-top:2px;">
			<img src='/shf/images/export.png' alt='הצע החלפה מהמאגר' onclick='switchShift();' style='cursor:hand;' height=20px width=20px>
		</TD>
		<TD style='text-align:left' class=tableTotal style="padding-left:10px;padding-top:2px;">
			<img src='/shf/images/export-potensial.png' alt='הצג פוטנציאל להחלפה לפי סידור' onclick='switchShift(true);' style='cursor:hand;' height=20px width=20px>
		</TD>
		<%}%>
		
		<TD style='text-align:left' class=tableTotal style="padding-left:10px; padding-top:2px;">
			<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;' >
		</TD>
		
		<TD style='text-align:right' width=100% class=tableTotal><img src='/shf/images/search.png' height=16px> נמצאו <%=shiftsList.size()%> רשומות</TD>
						
		</TR>
		</TABLE>
		</TD>
	</TR>
	<%}%>
	<TR>
		<TD height="100%" valign=top style="padding-top:0px;padding-right:7px;padding-left:7px;padding-bottom:7px;" dir="ltr">
		<div  style="overflow:auto;border:1px silver solid;height:100%; direction: rtl;" id="dataGridDiv">
		<jsp:include page="shifts_my_shifts_table.jsp"></jsp:include>
		</div>
		</TD>
	</TR>
	<TR>
		<TD align="center" valign="middle" style="padding-top:0px;padding-right:7px;padding-left:7px;padding-bottom:7px;" dir="ltr">
		<div  style="width:100%;display:none;overflow:auto;align:center;" id="myExceptionsDiv">
			
		</div>
		</TD>	
	</TR>


</TABLE>
	<span id="mySpan">
	</span>
		</form>	
</BODY>
</html:html>
