<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean 
	id="employeeData"
	class="bzq.shf.forms.EmployeeListForm" 
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>


<%@page import="org.apache.commons.validator.GenericValidator"%><HTML>
<HEAD>

<%@ page 
language="java" pageEncoding="windows-1255"
contentType="text/html; charset=windows-1255"
import="java.util.Vector,bzq.shf.bean.EmployeeBean"
%>

<META http-equiv="Content-Type" content="text/html; charset=windows-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css"></link>
<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" ></link>
<script src="/shf/js/shfgrid.js"></script>
<script src="/shf/js/shfutils.js"></script>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>

<TITLE>employee_list.jsp</TITLE>

<SCRIPT>
function exportExcel(){
	document.forms['employeeListForm'].action="/shf/employee/export.do";
	document.forms['employeeListForm'].target="_blank";
	document.forms['employeeListForm'].submit();  
}

function submitEmployeeForm(){
	if (validateEmployeeListForm(document.all.employeeListForm)) {  
		document.forms['employeeListForm'].action="/shf/employee/searchResult.do";
		document.forms['employeeListForm'].target=""; 
        document.forms['employeeListForm'].submit();     
	}
}

function keyPressed(){
	if(window.event.keyCode==13){
		submitEmployeeForm();
	}
}

function changeNumOfBreaks(){
	
	var num;
	num=document.forms['addShiftForm'].breaksNumber.value;
	
	if(num==1){
		document.getElementById("break1").style.display='';
		document.getElementById("break2").style.display='none';
		document.getElementById("break3").style.display='none';
	}else if(num==2){
		document.getElementById("break1").style.display='';
		document.getElementById("break2").style.display='';
		document.getElementById("break3").style.display='none';
	}else if(num==3){
		document.getElementById("break1").style.display='';
		document.getElementById("break2").style.display='';
		document.getElementById("break3").style.display='';
	}else{
		document.getElementById("break1").style.display='none';
		document.getElementById("break2").style.display='none';
		document.getElementById("break3").style.display='none';
	}
}


</SCRIPT>

<bzqjs:validator>
 <bzqjs:form name="employeeListForm" />
</bzqjs:validator>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%
Vector employees=(Vector)request.getAttribute("employees");
String moked = employeeData.getMoked();
%>
<BODY onkeyup="keyPressed();">

<div id="popupDiv" style="display:none;" class="divPopup"></div>

<form name="employeeListForm" action="/shf/employee/searchResult.do" 
method="post" >
<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TR>
		<TD style="height:20px;"><jsp:include page="submenu/emptySubmenu.jsp" /></TD>
	</TR>

	<TR>
		<TD valign="top" style="padding-bottom:5px;padding-top:3px;padding-right:6px;padding-left:6px;">
		
		<FIELDSET class="form">
		<legend>חיפוש עובדים</legend>
		<TABLE cellspacing="0" cellpadding="2">
			<TBODY>
				<TR>
					<TD class="header">שם פרטי:</TD>
					<TD class="data">
					<input type="text" maxlength="15" name="first_name" class="formInput" value="<bzq:string name="employeeData" property="first_name"/>">
					</TD>
					
					<TD width="10px"></TD>
					<TD class="header">מוקד:</TD>
					<TD class="data">
					
					<shf:unitselect tablename="unitCode" name="moked"
					selectedName="employeeData" selectedProperty="moked"
					style="width:170px;font-size:10px;" type="G01" all="yes"
					logic="onchange=setMultiTeams(this,'employeeData','team','200');" />
					
					</TD>
					<TD width="10px"></TD>
					<TD class="header">סטטוס:</TD>
					<TD>
					
					<html:select property="status" name="employeeData" style="width:110px;font-size:10px;">
						<html:option value="0">הכל</html:option>
						<html:option value="3">פעיל</html:option>
						<html:option value="1">לא פעיל זמנית</html:option>
						<html:option value="2">לא פעיל</html:option>
					</html:select>
					
					</TD>
					
				</TR>

				<TR>
					<TD class="header">שם משפחה:</TD>
					<TD class="data">
					<input type="text" maxlength="15" name="last_name" class="formInput" value="<bzq:string name="employeeData" property="last_name"/>">
					</TD>
					
					<TD width="10px"></TD>
					<TD class="header">תפקיד:</TD>
					<TD class="data"><bzq:select name="job" tablename="jobCode"
						selectedName="employeeData" selectedProperty="job"
						all="yes" style="width:170px;font-size:10px;" /></TD>
					
					<TD width="10px"></TD>
					<TD class="header">מועבר ל SAP:</TD>
					<TD>
					<select name="optional1" style="width:110px;font-size:10px;">
						<option value="-1" <%=GenericValidator.isBlankOrNull(employeeData.getOptional1())?"selected":""%> >הכל</option>
						<option value="1" <%="1".equals(employeeData.getOptional1())?"selected":""%> >כן</option>
						<option value="0" <%="0".equals(employeeData.getOptional1())?"selected":""%> >לא</option>
					</select>
					</TD>
				</TR>
				<TR>
					<TD class="header">תעודת זהות:</TD>
					<TD class="data">
					<input dir="ltr" maxlength="9" type="text"
						name="id_number" class="formInput"
						value="<bzq:string name="employeeData" property="id_number"></bzq:string>">
					</TD>
					<TD width="10px"></TD>
					<TD class="header">צוות:</TD>
					<TD class="data" id="teamsAjaxResult">
					
					<shf:orgunitCheckList parentUnit="<%=moked%>" name="employeeData" type="J01" property="team" optionsLength="200"></shf:orgunitCheckList>
					
					</TD>
					
					
					<TD width="10px"></TD>
					<TD class="header">תפקיד בפועל:</TD>
					<TD class="data" valign="middle">
						<shf:innerJobCheckList name="employeeData" tablename="innerJobCode" property="innerJob" length="140" optionsLength="140" />
					</TD>
					</TR>
					<TR>
					<TD class="data" align="left">
					<button onclick="submitEmployeeForm();">חפש</button>
					</TD>
				</TR>
			</TBODY>
		</TABLE>
		
		</FIELDSET>
		
		</TD>
	</TR>
	<%if(employees!=null && employees.size()>0){%>
	<TR>
		<TD valign="top" style="padding-right:6px;padding-left:6px;">
		<TABLE cellspacing="0" cellpadding="0" width="100%" style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
		<TR class="tableTotal">
		<TD style='text-align:left' width=20px class=tableTotal style="padding-left:2px;padding-top:2px;">
			 <img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;' >
		</TD>
		<shf:security activity="add_shift">
		<TD style='text-align:left' width=20px class=tableTotal style="padding-left:2px;padding-top:2px;">
			 <img src='/shf/images/plus.gif' alt='הוסף משמרת' onclick="viewAddShift();" style='cursor:hand;' >
		</TD>
		</shf:security>
		<TD style='text-align:right' class="tableTotal"><img src='/shf/images/search.png' height="16px"> נמצאו <%=employees.size()%> רשומות</TD>
		</TR>
		</TABLE>
		</TD>
	</TR>
	<%}%>
	<TR>
		<TD valign="top" height="100%" style="padding-right:6px;padding-left:6px;padding-bottom:5px;">
		<div  style="height:100%;overflow:auto;border:1px silver solid;" id="dataGridDiv">
		<jsp:include page="employee_table.jsp"></jsp:include>
		</div>
		</TD>
	</TR>
</TABLE>
</form>
</BODY>
</HTML>
