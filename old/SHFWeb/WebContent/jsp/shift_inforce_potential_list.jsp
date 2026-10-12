<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean 
	id="employeeData"
	class="bzq.shf.forms.EmployeeInforceListForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="potentialInforce"
	class="bzq.shf.forms.PotentialInforceForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="employeePotentialInforce"
	class="bzq.shf.bean.PotentialEmployeeBean" 
	scope="request">
</jsp:useBean>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<%@page import="bzq.shf.bean.PotentialEmployeeBean"%>
<%@page import="bzq.shf.bean.EmployeeBean"%>
<%@page import="java.util.Vector"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>

<%@ page 
language="java" pageEncoding="windows-1255"
contentType="text/html; charset=windows-1255"
%>

	
<META http-equiv="Content-Type"
	content="text/html; charset=windows-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" ></link>
<script src="/shf/js/shfgrid.js"></script>
<script src="/shf/js/shfutils.js"></script>
<script type="text/javascript">
function exportExcel(){
	document.forms['addAgntShiftForm'].action="/shf/shift/export.do";
	document.forms['addAgntShiftForm'].target="_blank";
	document.forms['addAgntShiftForm'].submit();
}
</script>


<TITLE>shift_inforce_potential_list.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY>
<%Vector potentialVec = potentialInforce.getPotentialInforceData(); %>
<%bzq.shf.bean.EmployeeBean[] emps=employeeData.getEmployee(); %>
<TABLE width=100% height=80% cellpadding="0" cellspacing="0">	
<%if (potentialVec != null && potentialVec.size() > 0)  {%>
	<tr>
		<td>
			<table cellspacing="0" cellpadding="0" width="100%"
				style="border-top: 1px silver solid; border-left: 1px silver solid; border-right: 1px silver solid;" >
				<tr style="tableTotal">
				<TD style='text-align:left' width=20px class=tableTotal style="padding-left:2px;padding-top:2px;">
			 		<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;' >
					</TD>
				<TD style="text-align: right;" class="tableTotal"><img
					src='/shf/images/search.png' height="16px"> נמצאו <%=potentialVec.size()%>
				רשומות</TD>
			</TR>
		</TABLE>
		</td>
	</tr>	
	<%} %>
	<TR>
		<TD valign=top height="100%" width="100%" style="border:1px silver solid;">
			<jsp:include page="shift_inforce_potential_table.jsp"></jsp:include>
		</TD>
	</TR>
</TABLE>

</BODY>
</HTML>
