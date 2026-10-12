<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>submenu.jsp</TITLE>


<SCRIPT>
var openPop=null;
function popVisible(pop,over)
{ 
	thePop=document.getElementById(pop);
	if(thePop.style.visibility=='hidden')
	{
		try{
		openPop.style.visibility='hidden';
		}catch(e)
		{}
		thePop.style.visibility='visible';
		openPop=thePop;
	}else{
		if(over==0 && openPop!=null){
			thePop.style.visibility='hidden';
			openPop=null;
		}
	}
	
}
function closePop()
{
	try{
		openPop.style.visibility='hidden';
	}catch(e){}
}
</SCRIPT>

</HEAD>
<BODY>
<TABLE width=100% cellpadding="0" cellspacing="0" align=right>
	<TBODY>
		<TR bgcolor="#F4C531">
			<TD style="padding-left:10px;"
				width="100"
				align="left"
				valign="top"
				nowrap
				dir="ltr"
				height="14">
						
				<jsp:include page="left_side_menu.jsp"></jsp:include>
			</TD>
		</TR>
	</TBODY>
</TABLE>
</BODY>
</HTML>
