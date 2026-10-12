<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="employeeForm" 
	class="bzq.shf.forms.EmployeeDataForm"
	scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>

<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="bzq.shf.utils.SHFUtils"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="bzq.shf.utils.TablesConstants"%><HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>employee_parameters.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>

<SCRIPT>
function saveParameters(){
	document.forms['employeeParametersForm'].action="/shf/admin/saveEmployeeParameters.do";
	submitParamForm();
}

function submitParamForm(){
	if(validateEmployeeParametersForm(document.all.employeeParametersForm)) {   
        document.forms['employeeParametersForm'].submit();     
	}
}
    
</SCRIPT>

<bzqjs:validator>
 <bzqjs:form name="employeeParametersForm" />
</bzqjs:validator>

</HEAD>

<%
String idNumber = null;
String picName = null;
if(employeeForm!=null){
	idNumber=employeeForm.getIdNumber();
	if(idNumber!=null)
		picName=idNumber.substring(0, 8);
}
%>
<BODY>
<form name="employeeParametersForm" action="/shf/admin/viewEmployeeParameters.do">
	
<TABLE dir="rtl" cellpadding="0" cellspacing="0" width="100%" height="100%">
		
	<TR>
		<TD valign="top" colspan="3"><jsp:include page="submenu/emptySubmenu.jsp" /></TD>
	</TR>

	<TR>
		<TD width="100%" valign="top" style="padding: 8px 8px 8px 8px">
		<FIELDSET class="info"><legend>חיפוש עובד</legend>
		<TABLE width="100%" cellpadding="5" cellspacing="0">
			<TR>
				<TD class="header">מספר עובד:
				&nbsp;<input style="height:17px;width:80px;font-size:11px;" type="text" value="<%=employeeForm.getEmployeeId()%>" name="employeeId"></TD>
				<TD align="left">
					<button onclick="submitParamForm();">חפש</button>
				</TD>
			</TR>
		</TABLE>
		
		</FIELDSET>
		</TD>
		<%if(picName!=null){%>
		<TD valign="top" rowspan="15"  Style="padding:8px 8px 8px 8px;">
		<IMG src="http://pic.bezeq.com/bezeqpic/<%=picName%>.JPG" width="120px" >
		</TD>
		<%}%>
	</TR>
	<TR>
		<TD height="100%" width="100%" valign="top" style="padding:8px 8px 8px 8px;">
		<%if(employeeForm!=null && employeeForm.getEmployeeId()>0){
		int empid=employeeForm.getEmployeeId();
		String empname=employeeForm.getFname()+" "+employeeForm.getLname();
		%>
	
		<TABLE cellpadding="2" cellspacing="0" width="100%" style="border:1px silver solid;margin-bottom:8px;">
		<TR bgcolor="#f3f3f3">
		<TD height="20px" class="header">שם:</TD>
		<TD align="right">
		<shf:employee empname="<%=empname%>" empid="<%=empid%>" />
		</TD>
		<TD class="header">ת.ז:</TD>
		<TD align="right"><bzq:string name="employeeForm" property="idNumber"/></TD>
		<TD class="header">צוות:</TD>
		<TD align="right"><shf:tables tableName="unitCode" codeName="<%=String.valueOf(employeeForm.getOrgUnitId())%>" /></TD>
		
		</TR>
		</TABLE>
		
		<FIELDSET>
		<table height="100%" width="100%" cellpadding="0" cellspacing="2" >
			
  
			<TR>
				<TD class="header">עובד נעול:</TD><TD width="10px"></TD>
				<TD><input type="checkbox" value="1" name="locked" <%=employeeForm.getLocked()==1?" checked":""%>></TD>
				<TD></TD>
			</TR>

			<!--TR>
				<TD class=header>משתמש במוניות:</TD><TD width=10px></TD>
				<TD><input type="checkbox" value=1 name="taxiAllowed" <%=employeeForm.getTaxiAllowed()==1?" checked":""%>></TD>
				
			</TR>
			
			<TR>
				<TD class=header>כתובת הסעה:</TD><TD width=10px></TD>
				<TD><input name="monitAddress" style="width:300;height:18px;font-size:11px;" value="<bzq:string name="employeeForm" property="monitAddress"/>"></TD>
			</TR-->

			<TR>
				<TD class="header">משתמש בהחלפות:</TD><TD width="10px"></TD>
				<TD><input type="checkbox" value="1" name="replaceAllowed" <%=employeeForm.getReplaceAllowed()==1?" checked":""%>></TD>
				<TD></TD>
			</TR>
			<TR>
				<TD class="header">נציג מסורתי:</TD><TD width="10px"></TD>
				<TD><input type="checkbox" value="2" name="trained" <%=employeeForm.getTrained()==0?" checked":""%>></TD>
				<TD></TD>
			</TR>
			<TR>
				<TD class="header">עובד מהבית:</TD><TD width="10px"></TD>
				<TD><input type="checkbox" value="1" name="workFromHome" <%=employeeForm.getWorkFromHome()==1?" checked":""%>></TD>
				<TD></TD>
			</TR>
			<TR>
				<TD class="header">מועבר ל SAP:</TD><TD width="10px"></TD>
				<TD><input type="checkbox" value="1" name="optional1" <%="1".equals(employeeForm.getOptional1())?" checked":""%>></TD>
				<TD></TD>
			</TR>
			<TR>
				<TD class="header">העברה ל SAP:</TD><TD width="10px"></TD>
				<TD>
				<html:select property="optional2" name="employeeForm" style="width:110px;font-size:10px;">
					<html:option value="0">לפי תפקיד (אוטומטי)</html:option>
					<html:option value="1">ידנית</html:option>
				</html:select>
				
				</TD>
				<TD></TD>
			</TR>
			<TR>
				<TD class="header">טלפון נוסף:</TD><TD width="10px"></TD>
				<TD><input style="width:110px;height:18px;font-size:11px;" maxlength="12" dir="ltr" type="text" name="benzoogTel" value="<bzq:string name="employeeForm" property="benzoogTel"/>"></TD>
				<TD></TD>
			</TR>
			<TR>
				<TD class="header">סטטוס:</TD><TD width="10px"></TD>
				<TD>
				<html:select property="statusId" name="employeeForm" style="width:110px;font-size:10px;">
					<html:option value="<%=String.valueOf(SHFConstants.EMPLOYEE_STATUS_ACTIVE)%>" >פעיל</html:option>
					<html:option value="<%=String.valueOf(SHFConstants.EMPLOYEE_STATUS_TEMP)%>" >לא פעיל זמנית</html:option>
					<html:option value="<%=String.valueOf(SHFConstants.EMPLOYEE_STATUS_INACTIVE)%>" >לא פעיל</html:option>
				</html:select>
				<!-- select name="statusId" style="width:110px;font-size:10px;">
					<option value="3" <%=employeeForm.getStatusId()==SHFConstants.EMPLOYEE_STATUS_ACTIVE?"selected":""%> >פעיל</option>
					<option value="1" <%=employeeForm.getStatusId()==SHFConstants.EMPLOYEE_STATUS_TEMP?"selected":""%> >לא פעיל זמנית</option>
					<option value="2" <%=employeeForm.getStatusId()==SHFConstants.EMPLOYEE_STATUS_INACTIVE?"selected":""%> >לא פעיל</option>
				</select-->
				</TD>
				<TD></TD>
			</TR>
			<TR>
				<TD class="header">תפקיד בפועל:</TD><TD width="10px"></TD>
				<TD>
				<shf:innerJobSelect emptySelection="yes" style="width:110px;font-size:10px;" name="innerJobId" tablename="<%=TablesConstants.INNER_JOB_TABLE %>" selectedName="employeeForm" selectedProperty="innerJobId" />
				</TD>
			</TR>
			<TR>
			<TD colspan="4"></TD>
			<TD align="left" height="40px" valign="bottom">
			<shf:security activity="admin_emparam_update">
			<INPUT class="button" type="reset" name="אפס" value="איפוס">&nbsp;
			<button onclick="saveParameters();">שמור</button>
			</shf:security>
			</TD>
			</TR>
		</table>
		</FIELDSET>
		<%}%>
		</TD>
	</TR>
	
	</table>
	</form>
</BODY>
</HTML>
