<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="attendanceForm"
	class="bzq.shf.forms.EmployeeArriveForm" 
	scope="request"></jsp:useBean>
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
<TITLE>employee_locked.jsp</TITLE>
</HEAD>
<BODY dir=rtl>
<TABLE width=100% cellpadding="0" cellspacing="0">
	<TR>
	<TD valign="top" style="height:20px;"><jsp:include page="submenu/emptySubmenu.jsp"></jsp:include> </TD>
	</TR>

	<TR>
		<TD valign=top height=100% width=100% style="padding:5px 5px 5px 5px;">
			<FIELDSET class=form><legend> שלום <bzq:string name="attendanceForm" property="firstName" /> <bzq:string name="attendanceForm" property="lastName" /></legend>

			
			<TABLE cellpadding="10px" width=100% cellspacing="5">
				<TBODY>
					
					<TR>
						<TD>
						
						</TD>
						<TD rowspan=12 align=left valign=top><IMG
							src="http://pic.bezeq.com/bezeqpic/<%=attendanceForm.getEmpIdNumber()%>.JPG"
							style="background-color: #e3e3e3; border: 1px solid gray"
							width=140px></TD>
					</TR>
					<TR>
						<TD>
						<p style="text-align: center; font-size: 22pt; color: #bababa; font-family: Arial">
						אתה נעול במערכת נא לגשת למנהל שלך כדי לשחרר את הנעילה</p>
						</TD>
					</TR>
				
				
				</TABLE>
				</FIELDSET>	
			</TD>
		</TR>
</TABLE>
</BODY>
</HTML>
