<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" %>
<%@ page import="bzq.shf.utils.SHFConstants,java.util.Vector,bzq.shf.transfer.EventReason"%>

<jsp:useBean id="rsult" class="bzq.shf.transfer.EventReason"
	scope="page"></jsp:useBean>
<HTML>
<HEAD>

<META http-equiv="Content-Type"
	content="text/html; charset=windows-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfAdmin.css" rel="stylesheet" type="text/css">

<TITLE>eventTypes</TITLE>
<SCRIPT type="text/javascript" language="javascript">
function change(checkItem)	{
	if(checkItem.value=='0')
		checkItem.value='1';
	else	
		checkItem.value='0';
}

function addReason(){
	if (document.getElementById("addReasonName").value == ""){
		alert("יש למלא את השדה תיאור האירוע");
		document.getElementById("addReasonName").focus();
	}else{
		document.addEventReason.submit();
	}
}
</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY dir="rtl">

<TABLE width="100%" height=100% cellpadding="0" cellspacing="0" >

	<TR>
		<TD colspan=2 valign="top"><jsp:include	page="submenu/admin_submenu.jsp" /></TD>
	</TR>

	<TR>
		<TD colspan=2 height="100%" valign="top"
			style="padding: 7px 7px 7px 7px">
		<FIELDSET class="infoAdm" style="width:100%;height:100%"><LEGEND><%=SHFConstants.EVENT_REASON_MAP.get(String.valueOf(SHFConstants.EVENT_TYPE))%></LEGEND>

		<div  style="height:600;overflow:auto;border:1px silver solid;">
		<TABLE style="text-align: center" dir="ltr" width=100% height="100%"
			cellpadding="1" cellspacing="1">
			<TR>
				<TD valign="top" width=100% height="100%">
				<DIV style="height: 100%; overflow: auto">
				<table width="100%">
					<THEAD>
						<tr class=info>
							<th class="headerAdm"><%=SHFConstants.REASON_ID%></th>
							<th class="headerAdm"><%=SHFConstants.REPORTED%></th>
							<th class="headerAdm"><%=SHFConstants.BRANCH_ID%></th>
							<th class="headerAdm">תיאור האירוע</th>
						</tr>
					</THEAD>
					<tbody>
	<%
		if (((Vector) request.getAttribute("eventReason")) != null) {
		Vector vector=(Vector) request.getAttribute("eventReason");
		for(int i=0;i<vector.size();i++){
		rsult=(EventReason)vector.get(i);
	%>
						
							<tr>
								<td align="center" class=grid_td2>
									<A style="color:navy"
									href="/shf/admin.do?action=updatedeleteEventType&reasonId=<%=rsult.getReasonId()%>
									&branch=<%=rsult.getBranch()%>
									&reasonName=<%=rsult.getReasonName()%>
									&reported=<%=rsult.getReported()%>
									&reportRequested=<%=rsult.getReportRequested()%>
									&type=<%=SHFConstants.EVENT_TYPE%>">ערוך</A>
								</td>
								<td align="center" class=grid_td2>
								<logic:equal value="1" name="rsult" property="reported">כן</logic:equal> 
								<logic:equal value="0" name="rsult" property="reported">לא</logic:equal>
								</td>
								<td align="center" class=grid_td2><shf:tables tableName="unitCode" codeName="<%=rsult.getBranch()%>" /></td>
								<td align="center" class=grid_td2><%=rsult.getReasonName()%></td>
							</tr>
						
			<%}}%>
					</tbody>
				</table>
				</DIV>

				</TD>
			</TR>
		</TABLE>
		</div>
		</FIELDSET>
		</TD>
	</TR>
	<TR>
		<TD style="padding: 7px 7px 7px 7px">
		<FORM action="/shf/admin.do" method="post" target="frMain"
			name="addEventReason">
	<!-- 	<FIELDSET class=info style="width:50%"><LEGEND>הוסף סוג אירוע חדש</LEGEND>  -->
		<table dir=rtl>
			<TR>
				<th class=header align="right"><%=SHFConstants.BRANCH_ID%>:</th>
				<td align="right"><shf:unitselect tablename="unitCode" name="branch"
					type="<%=bzq.shf.utils.SHFConstants.AGAF_UNIT%>" selectedvalue="3"></shf:unitselect></td>
			</TR>
			<TR>
				<th class=header align="right">תיאור האירוע:</th>
				<td align="right"><INPUT id="addReasonName" size="24"type="text" value="" name="reasonName"
					></td>
			</TR>
			<TR>
				<th class=header align="right"><%=SHFConstants.REPORTED%>:</th>
				<td align="right"><INPUT type="checkbox" value="0" name="reported"
					size="10" onchange="javascript:change(this);" /></td>
			</TR>
			<TR>
				<TD><button onclick="addReason()" class="button" >הוסף</button></TD>
			</TR>
		</table>

	<!--	</FIELDSET>  -->
		<INPUT type="hidden" value="0" name="reportRequested"> 
		<INPUT type="hidden" name="action" value="insertEventType">
		<INPUT type="hidden" name="type" value="<%=SHFConstants.EVENT_TYPE%>">
		</form>

		</TD>

	</TR>
</TABLE>

</BODY>
</HTML>
