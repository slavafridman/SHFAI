<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">


<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<TITLE>forecast.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>

<SCRIPT>
function tabcolors(obj){
	var alltabs=document.getElementById("tabsContainer").getElementsByTagName("button");
	for(i=0;i<alltabs.length;i++){
		alltabs[i].className="forecast_tab";
	}
	obj.className="forecast_tab_selected";
}
function callsFrc(obj){
	tabcolors(obj);
	forecast_data_iframe.location='/shf/forecast/callsParam.do';
}

function schFrc(obj){
	tabcolors(obj);
	forecast_data_iframe.location='/shf/forecast/schParam.do';
}



</SCRIPT>

</HEAD>
<BODY>
<TABLE cellpadding="0" cellspacing="0" width="100%" height="100%">
	<TR>
		<TD width="100%" valign="top"><jsp:include page="/jsp/submenu/emptySubmenu.jsp" /></TD>
	</TR>
	<TR>
		<TD height="100%" valign="top" width="100%" dir="rtl" style="padding:7px;">
			<TABLE cellpadding="0" cellspacing="0" height="100%" width="100%">
				<TR>
					<TD valign="top" width="100%" dir="rtl" id="tabsContainer">
						<button id="callsTab" class="forecast_tab" onclick="callsFrc(this);">בקרת שיחות</button>
						<button id="schTab" class="forecast_tab" onclick="schFrc(this);">בקרת כ"א </button>
						
					</TD>
				</TR>
				<TR>
					<TD valign="top" height="100%" width="100%" dir="rtl" style="border:1px silver solid; overflow: none">
						<IFRAME name="forecast_data_iframe" style="width:100%;height:100%;padding:7px; overflow: none;" 
						frameborder="0" src="/shf/jsp/chooseOption.jsp"></IFRAME>
					</TD>
				</TR>
			</TABLE>
		</TD>
	</TR>
	
</TABLE>
</BODY>
</HTML>
