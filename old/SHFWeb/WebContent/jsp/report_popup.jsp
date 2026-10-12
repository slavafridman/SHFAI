<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="attendanceForm"
	class="bzq.shf.forms.AttendanceDataForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="reports"
	class="java.util.Vector" 
	scope="request">
</jsp:useBean>

<HTML>
<HEAD>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
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
<TITLE>report_popup</TITLE>

</HEAD>
<BODY style="height:100%;width:100%">


<table style="height:90%;width:100%;background-color:transparent;">
	<TR>
		<TD width="100%" height="100%" valign="top">

		<table width="100%" height="100%">
			<tr>
				<td valign="top" height="100%" width="100%">
							
					<jsp:include page="/jsp/report_popup_fs.jsp"></jsp:include>
				</TD>
			</TR>
		</TABLE>

		</TD>
	</TR>
</TABLE>

</BODY>
</HTML>
