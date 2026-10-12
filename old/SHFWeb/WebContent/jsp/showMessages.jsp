<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>
<script type="text/javascript" src="../dojo/dojo/dojo.js"
	djConfig="isDebug: false, parseOnLoad: true"></script>
<style type="text/css">
@import "../dojo/dojo/resources/dojo.css";

@import "../dojo/dijit/themes/nihilo/nihilo.css";

@import "../dojo/dijit/themes/dijit.css";
</style>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<%@ page import="java.util.Date,bzq.shf.utils.SHFConstants,bzq.shf.utils.SHFUtils,java.util.Vector,bzq.shf.transfer.ReplaceMassage"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/shfgrid.css" rel="stylesheet" type="text/css">
<TITLE>showMessages.jsp</TITLE>
<SCRIPT type="text/javascript" language="javascript">
function showElement(row)	{
//	alert(row);
	var table=document.getElementById('messagesTable');
	var divs=table.getElementsByTagName('DIV');
	for(i=0;i<divs.length;i++){
		divs[i].style.display='none';
	}
	document.getElementById(row).style.display='';
}
function hideElement(row)	{
//	alert(row);
	document.getElementById(row).style.display='none';
}

</SCRIPT>
<script type="text/javascript">
dojo.require("dojo.parser");
dojo.require("dijit.Dialog");
</script>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY class="nihilo">

<TABLE width=100% height=20px cellpadding="0" cellspacing="0">
<TR><TD valign="top" style="height:20px;"><jsp:include page="submenu/emptySubmenu.jsp"></jsp:include> </TD></TR>

<TR>
<TD height="100%" width="100%" align=right>

<TABLE dir=rtl cellpadding="0" cellspacing="0" width=100%>
<TR>
<TD height="100%" width="100%"  style="padding:8px 8px 8px 8px;">

<form method=post action="/shf/replace/searchForCandidate.do" >
<%
Vector vec=(Vector)request.getAttribute("messages");
if(vec!=null && vec.size()>0){
%>
<h3 style="color:navy;"> הודעות:</h3>
<%}%>
<TABLE width=100% cellpadding="0" cellspacing="0" align="right" dir=rtl >	
		
<%	
	if(vec!=null && vec.size()>0)	{
%>	
	<TR>
	<TD width=100%>
	<TABLE cellpadding="0" cellspacing="0" align="right" dir=rtl id="messagesTable" width="85%" style="border:1px silver solid;">
	<THEAD>
	<TR align="right">			
		<Th  nowrap valign="top" class="header">&nbsp;</Th>
		<Th  nowrap valign="top" class="header">תאריך</Th>
		<Th  nowrap valign="top" class="header">שעה</Th>
		<Th  nowrap valign="top" class="header">נושא</Th>
		<Th nowrap valign="top" class="header">תוכן</Th>
		<Th nowrap valign="top" class="header">הערה</Th>
		<Th nowrap valign="top" class="header">&nbsp;</Th>
	</TR>	
	</THEAD>
	<tbody>
<% 
int i = 1;

%>	
    <logic:iterate id="result" name="messages">		  		
<%
ReplaceMassage replaceMassage = ((ReplaceMassage) (((Vector)request.getAttribute("messages")).get(i-1)));
String note = replaceMassage.getNote();
Date creationDate = replaceMassage.getCreationDate();
%>    
	<TR align="right" bgcolor="<%=i%2==0?"white":"#f3f3f3"%>" >
		<TD align=center class="data"><%=i%></TD>
		<TD align=center class="data"><shf:shfdate date="<%=creationDate%>"/></TD>
		<TD align=center class="data"><shf:shftime date="<%=creationDate%>"/></TD>
		<TD align=center class="data"><bean:write name="result" property="subject"/></TD>
    	<TD align=center class="data">

		<div dojoType="dijit.Dialog" id="dialog<%=i%>" dir=rtl style="font-size:14px;width:350px;font-weight:normal;" >
    	<bean:write name="result" property="text"/>
    	</div>
    	
    	<A href="javascript:dijit.byId('dialog<%=i%>').show();" style="color:navy;"/>הצג</a>
    	
    	</TD>
		
		<TD align=center class="data">
		<%if(!SHFUtils.isEmpty(note)){%>
			<DIV id="note<%=i%>" style="position:absolute;z-index:999;display:none;margin-right:-220px;"><FIELDSET class="info"><TABLE width="280px"><tr><TD><bean:write name="result" property="note"/></td><td valign="bottom"><A href="javascript:hideElement('note<%=i%>');"/>סגור</a></td></tr></TABLE></FIELDSET></DIV><A href="javascript:showElement('note<%=i%>');" style="color:navy;"/>הצג</a>
		<%}%>
		</TD>
		<TD align=center class="data"><a href="/shf/messages/readMessage.do?messageId=<%=replaceMassage.getId()%>" style="color:navy;">מחק</a></TD>
					
	</TR>
<% i++;%>	
    </logic:iterate> 
    </tbody>
    </Table>
    </TD>
    </TR>       	
<%}else{%>


	<TR>
	<TD align="center" colspan=10>
		<TABLE width=100% style="border:1px silver solid;"><TR><TD  width=100% align="center"><div class="gridNoData">אין לך הודעות חדשות</div></TD></TR></TABLE>
		
	</TD>
	
	</TR>
<%}%>    
</TABLE>
</form>

</TD>
</TR>
</TABLE>

</TD>
</TR>
</TABLE>

</BODY>
</HTML>
