<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean 
	id="completionForm"
	class="bzq.shf.forms.CTICompletionForm" 
	scope="request">
</jsp:useBean>
<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>


<html>
<head>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<title>cti</title>
<script type="text/javascript">
function submitCompletionForm(){
	document.completionForm.submit();
}

function keyPressed(){
	if(window.event.keyCode==13){
		submitCompletionForm();
	}
}
</script>
<shf:reloadErrors></shf:reloadErrors>
</head>
<%
String moked=completionForm.getMoked();
String agaf=completionForm.getAgaf();
%>
<body dir="rtl">
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height:20px;"><jsp:include page="submenu/cti_submenu.jsp"></jsp:include> </TD>
		</TR>			
		<TR>
			<TD width="100%" valign="top" style="padding-top: 3px; padding-bottom: 5px; padding-right: 6px; padding-left: 6px;">
				<table>
					<TR><TD></TD></TR>
					<shf:security activity="login_add_completion">
					<TR>
						<TD>
							<img src="/shf/images/drop.png">
						</TD>
						<TD>
							<a style="color:navy;font-size:18px;font-family:arial;cursor:hand;" onclick="document.location='/shf/completion/addParam.do'">טופס השלמת דיווח יומי</a>
						</TD>
					</TR>
					</shf:security>
					<shf:security activity="login_view_completion">
					<TR>
						<TD>
							<img src="/shf/images/drop.png">
						</TD>
						<TD>
							<a style="color:navy;font-size:18px;font-family:arial;cursor:hand;" onclick="document.location='/shf/completion/viewParam.do'">הצגת משמרות CTI + השלמה</a>
						</TD>
					</TR>
					</shf:security>
					<shf:security activity="login_assign_jobtosap">
					<TR>
						<TD>
							<img src="/shf/images/drop.png">
						</TD>
						<TD>
							<a style="color:navy;font-size:18px;font-family:arial;cursor:hand;" onclick="window.navigate('/shf/cti/viewJobsToSap.do');">תפקידים ל SAP</a>
						</TD>
					</TR>
					</shf:security>
				</table>
				
			</TD>
		</TR>
	</TABLE>
</body>
</html>