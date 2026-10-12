<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255"%>
<%@ page import="bzq.shf.utils.SHFConstants"%>

<HTML>
<HEAD>
<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>eventReason</TITLE>


<script type="text/javascript" language="javascript">
function sendForm(action){
	if (action=='save')	{
		document.getElementById('action').value='updateEventReason';
	} else if (action=='delete')	{
		document.getElementById('action').value='deleteEventReason';
	}
	updateEventReason.submit();
}
function change(checkName)	{
	checkName.value='1';		
}

</script>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY dir="rtl">

<TABLE width=100% height=20px cellpadding="0" cellspacing="0">

<TR><TD><jsp:include page="submenu/admin_submenu.jsp" /></TD></TR>

</TABLE>

<table dir="rtl" width="65%" align="right">
<tr>
<td style="padding:10px 5px 5px 5px;">
<FIELDSET class="info">
<LEGEND><%=SHFConstants.EVENT_REASON_MAP.get(request.getParameter("type"))%></LEGEND>

<FORM action="/shf/admin.do" method="post" target="frMain" name="updateEventReason">
<table cellpadding="2" cellspacing="2">
  <tbody>
    <tr>
      <td align="right" width="20%" class="header"><%=SHFConstants.BRANCH_ID%>:</td>
      <td align="right" class="data"><shf:unitselect tablename="unitCode" name="branch" type="<%=bzq.shf.utils.SHFConstants.AGAF_UNIT%>" selectedvalue='<%=request.getParameter("branch")%>'></shf:unitselect></td>
      
      </tr>
      <tr>
      <td align="right" width="40%" class="header"><%=SHFConstants.REASON_DESC%>:</td>
      <td align="right" class="data"><INPUT type="text" value="<bean:write name="result" property="reasonName"/>" name="reasonName" size="20"/></td>
      
      </tr>
      <tr>
      <td align="right" width="20%" class="header"><%=SHFConstants.REPORTED%>:</td>
      <td align="right" class="data">
	      <logic:equal value="1" name="result" property="reported"><INPUT type="checkbox" value="1" checked="checked" name="reported"/></logic:equal>
	      <logic:equal value="0" name="result" property="reported"><INPUT type="checkbox" value="0" name="reported" onchange="javascript:change(this);"/></logic:equal>
      </td>
      </tr>
      <tr>
      <td align="right" width="20%" class="header"><%=SHFConstants.REPORT_REQUESTED%>:</td>
    	<td align="right" class="data">
	      <logic:equal value="1" name="result" property="reportRequested"><INPUT type="checkbox" value="1" checked="checked" name="reportRequested"/></logic:equal>
	      <logic:equal value="0" name="result" property="reportRequested"><INPUT type="checkbox" value="0" name="reportRequested" onchange="javascript:change(this);"/></logic:equal>      
      </td>
    </tr>        
    	  
    <TR>
    	<TD colspan="4" align="center">
    	<INPUT type="hidden"  readonly="readonly" value="<bean:write name="result" property="reasonId"/>" name="reasonId" size="10"/>
    	<INPUT type="hidden" name="type" value="<%=request.getParameter("type")%>">		    	    	
    	<INPUT type="hidden" name="action" id="action">
    	<INPUT type="submit" class="button" value="שמור" onclick="javascript:sendForm('save');"/>
	    <INPUT type="submit" class="button" value="מחק" onclick="javascript:sendForm('delete');"/>
	    <INPUT type="button" class="button" value="חזור" onclick="javascript:navigate('/shf/admin.do?action=showEventReason&type=<%=request.getParameter("type")%>')"/>
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
