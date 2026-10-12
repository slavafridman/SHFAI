<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<HTML>
<HEAD>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>

<jsp:useBean id="eventReasonForm" class="bzq.shf.transfer.EventReason" scope="request"></jsp:useBean>

<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" %>
<%@ page import="bzq.shf.utils.SHFConstants,java.util.Vector,bzq.shf.transfer.EventReason"%>

<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<META http-equiv="Content-Type" content="text/html; charset=windows-1255">
<LINK href="/shf/theme/shfAdmin.css" rel="stylesheet" type="text/css">
<TITLE>eventReason</TITLE>
<SCRIPT type="text/javascript" language="javascript">
function change(checkItem)	{
	if(checkItem.value=='0')
		checkItem.value='1';
	else	
		checkItem.value='0';
}

function addReason(){
	if (document.getElementById("addReasonName").value == ""){
		alert("יש למלא את השדה סיבה");
		document.getElementById("addReasonName").focus();
	}else{
		document.addEventReason.submit();
	}
}
</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY dir="rtl">
<TABLE cellpadding="0" cellspacing="0" width=100% height="100%" >
	<TR>
		<TD><jsp:include page="submenu/admin_submenu.jsp" /></TD>
	</TR>
	<TR>
		<TD valign="top" width=100% style="padding:7px 7px 7px 7px;"
			height="100%">
			<FIELDSET class="infoAdm" style="width:100%;height:100%"><LEGEND><%=SHFConstants.EVENT_REASON_MAP.get(String.valueOf(eventReasonForm.getType()))%></LEGEND>

				<div  style="height:580;overflow:auto;border:1px silver solid;">
				<table style="text-align: center" dir="ltr" width="100%" 
					cellpadding="1" cellspacing="1">
					<THEAD>
						<tr>
							<th class="headerAdm"><%=SHFConstants.REPORT_REQUESTED%></th>
							<th class="headerAdm"><%=SHFConstants.REPORTED%></th>
							<th class="headerAdm"><%=SHFConstants.REASON_DESC%></th>
							<th class="headerAdm"><%=SHFConstants.BRANCH_ID%></th>
							<th class="headerAdm"><%=SHFConstants.REASON_ID%></th>
						</tr>
					</THEAD>
					<tbody>
						<%
						int i = 0;
						Vector eventReason = (Vector) request.getAttribute("eventReason");
						if (eventReason != null) {
						%>
						<logic:iterate id="rsult" name="eventReason">
							<tr>
								<td align="center" class="dataAdm">
								<logic:equal value="1" name="rsult" property="reportRequested">
									<img src="/shf/images/true.gif">
								</logic:equal>
								<logic:equal value="0" name="rsult" property="reportRequested">
									<img src="/shf/images/false.gif">
								</logic:equal>
								</td>
								<%String branch = ((EventReason) eventReason.get(i)).getBranch();
i++;
%>
								<td align="center"  class="dataAdm"><logic:equal
									value="1" name="rsult" property="reported">
									<img src="/shf/images/true.gif">
								</logic:equal> <logic:equal value="0" name="rsult"
									property="reported">
									<img src="/shf/images/false.gif">
								</logic:equal></td>
								<td align="center" class="dataAdm"><bean:write
									name="rsult" property="reasonName" /></td>
								<td align="center" class="dataAdm"><shf:tables
									tableName="unitCode" codeName="<%=branch%>" /></td>
								<td align="center"  class="dataAdm"><A style="color:navy;"
									href="/shf/admin.do?action=updatedeleteEventReason&reasonId=<bean:write name="rsult" property="reasonId"/>
									&branch=<bean:write name="rsult" property="branch"/>
									&reasonName=<bean:write name="rsult" property="reasonName"/>
									&reported=<bean:write name="rsult" property="reported"/>
									&reportRequested=<bean:write name="rsult" property="reportRequested"/>
									&type=<bean:write name="rsult" property="type"/>">ערוך</A></td>
							</tr>
						</logic:iterate>
						<%
}%>
					</tbody>
				</table>
				</div>
				</FIELDSET>
				
		</TD>
	</TR>
	
	<TR>
			<TD style="padding:0px 8px 7px 8px;" width=100%>
				<FORM action="/shf/admin.do" method="post" target="frMain"
					name="addEventReason">
				<table align="right" >
					<tr>
						<td align="right" class="headerAdm">אגף:</td>
						<td align="right" class="dataAdm"><shf:unitselect
							tablename="unitCode" name="branch"
							type="<%=bzq.shf.utils.SHFConstants.AGAF_UNIT%>"></shf:unitselect></td>
					</tr>
					<tr>
						<td align="right" class="headerAdm">סיבה:</td>
						<td align="right" class="dataAdm"><INPUT id="addReasonName" size="24" type="text" value=""
							name="reasonName" /></td>
					</tr>
					<tr>
						<td align="right" class="headerAdm">מוצדק:</td>
						<td align="right" class="dataAdm"><INPUT type="checkbox" value="0"
							name="reported" size="10" onchange="javascript:change(this);" /></td>
					</tr>
					<tr>
						<td align="right" class="headerAdm">דורש אישור:</td>
						<td align="right" class="dataAdm"><INPUT type="checkbox" value="0"
							name="reportRequested" size="10"
							onchange="javascript:change(this);" /></td>
					</tr>

					<TR>
						<TD align="center">
						<button onclick="addReason()"> הוסף</button>
						</TD>
					</TR>
					
					
				</table>
				
				<INPUT type="hidden" name="action" value="insertEventReason"> 
				<INPUT type="hidden" name="type" value="<%=eventReasonForm.getType()%>">

				</form>


				</TD>
			</TR>
	</TABLE>
</BODY>
</HTML>
