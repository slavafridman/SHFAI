<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean 
	id="employeeData"
	class="bzq.shf.forms.EmployeeInforceListForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean 
	id="reduceRequestForm"
	class="bzq.shf.forms.ShiftReduceRequestForm" 
	scope="request">
	
</jsp:useBean>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
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

<TITLE>employee_list.jsp</TITLE>


<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY>
<TABLE width=100% height=100% cellpadding="0" cellspacing="0">	
	<TR>
		<TD valign=top height="100%" width="100%">
		
		<jsp:include page="reduce_shift_table.jsp"></jsp:include>
		
		</TD>
	</TR>
</TABLE>

</BODY>
</HTML>
