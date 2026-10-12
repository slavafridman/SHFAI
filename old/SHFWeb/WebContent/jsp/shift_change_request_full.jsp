<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="chageRequestForm"
	class="bzq.shf.forms.ShiftChangeRequestForm" scope="request"></jsp:useBean>
<HTML>
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
<TITLE>shift_change_request_full.jsp</TITLE>
</HEAD>
<BODY dir="rtl">
<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height: 20px"><jsp:include
				page="submenu/shift_submenu.jsp"></jsp:include></TD>
		</TR>
	
		<TR>
			<TD width="100%" valign="top" style="height:100%;padding-bottom:5px;padding-top:10px;padding-right:6px;padding-left:6px">
				<TABLE>
					<TR>
						<TD><h2>אושרה כל המכסה של בקשת השינוי</h2></TD>
					</TR>
					<TR>
						<TD>האם ברצונך לדחות את כל הבקשות הלא מאושרות ?</TD>
					</TR>
					<TR>
						<TD>
						<button onclick="javascript:document.rejectAllCandidatesForm.submit();">כן</button>&nbsp;
						<button onclick="javascript:navigate('/shf/shift/viewShiftTimeChangeRequests.do');">לא</button></TD>
					</TR>
				</TABLE>
			</TD>
		</TR>
		
	</TABLE>
	<form name="rejectAllCandidatesForm" action="/shf/shift/shiftChangeRejectAll.do" method="post">
		<INPUT type="hidden" name="requestId" value="<%=chageRequestForm.getRequestId()%>">
	</form>
</BODY>
</HTML>
