<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ page language="java" 
contentType="text/html; charset=WINDOWS-1255" 
pageEncoding="WINDOWS-1255"
import="bzq.shf.utils.SHFConstants"%>


<jsp:useBean id="result" class="bzq.shf.transfer.EventReason"
	scope="request"></jsp:useBean>
	
<HTML>
<HEAD>
<META http-equiv="Content-Type" content="text/html; charset=windows-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/shfAdmin.css" rel="stylesheet" type="text/css">
<TITLE>eventReason</TITLE>

<script type="text/javascript" language="javascript">
function sendForm(action){
	if (action=='save')	{
		document.getElementById('action').value='updateEventType';
	} else if (action=='delete')	{
		document.getElementById('action').value='deleteEventType';
	}
	updateEventType.submit();
}
function change(checkName)	{
	checkName.value='1';		
}

</script>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY dir="rtl">

<TABLE width=100% height=20px cellpadding="0" cellspacing="0">
	<TR>
		<TD valign="top"><jsp:include page="submenu/admin_submenu.jsp" /></TD>
	</TR>
	<TR>
		<TD valign="top" height="100%" width="100%"
			style="padding: 7px 7px 7px 7px">
		<FIELDSET class="info"><LEGEND><%=SHFConstants.EVENT_REASON_MAP.get(String.valueOf(bzq.shf.utils.SHFConstants.EVENT_TYPE))%></LEGEND>

		<FORM action="/shf/admin.do" method="post" target="frMain"
			name="updateEventType" >
		<table cellpadding="2" cellspacing="2">
			<tbody>
				<tr>
					<td align="right" width="20%" class="header"><%=SHFConstants.BRANCH_ID%></td>
					<td align="right" class="data"><shf:unitselect tablename="unitCode"
						name="branch" type="<%=bzq.shf.utils.SHFConstants.AGAF_UNIT%>"
						selectedvalue='<%=result.getBranch()%>'></shf:unitselect></td>
				</tr>
				<tr>

					<td align="right" width="40%" class="header">תיאור האירוע</td>
					<td align="right" class="data"><INPUT type="text"
						value="<%=result.getReasonName()%>" name="reasonName"
						size="20" /></td>
				</tr>
				<tr>

					<td align="right" width="20%" class="header"><%=SHFConstants.REPORTED%></td>
					<td align="right" class="data"><logic:equal value="1" name="result"
						property="reported">
						<INPUT type="checkbox" value="1" checked="checked" name="reported" />
					</logic:equal> <logic:equal value="0" name="result"
						property="reported">
						<INPUT type="checkbox" value="0" name="reported"
							onchange="javascript:change(this);" />
					</logic:equal></td>

				</tr>
				<tr>

				</tr>
				<TR>
					<TD colspan="4" align="center" style="padding-left: 3px">
					<INPUT type="hidden" value="0" name="reportRequested"> 
					<INPUT type="hidden" name="reasonId" value="<%=result.getReasonId()%>"> 
					<INPUT type="hidden" name="type" value="<%=bzq.shf.utils.SHFConstants.EVENT_TYPE%>"> 
					<INPUT type="hidden" name="action" id="action">

					<button onclick="javascript:sendForm('save');">שמור</button>
					&nbsp;
					<button onclick="javascript:sendForm('delete');">מחק</button>
					&nbsp;
					<button
						onclick="javascript:navigate('/shf/admin.do?action=showEventType&type=<%=bzq.shf.utils.SHFConstants.EVENT_TYPE%>')">חזור</button>
					</TD>
				</TR>

			</tbody>
		</table>
		</FORM>
		</FIELDSET>
		</td>
	</tr>
</table>
</BODY>

</HTML>
