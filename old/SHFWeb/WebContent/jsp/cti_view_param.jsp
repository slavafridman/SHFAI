<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean 
	id="completionForm"
	class="bzq.shf.forms.CTISearchCompletionForm" 
	scope="request">
</jsp:useBean>
<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>
<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="bzq.shf.forms.TableForm"%><html>
<head>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">

<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css"></link>
<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" ></link>
<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
<script language="JavaScript" src="/shf/js/shfutils.js"></script>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>

<script type="text/javascript">

function submitSearchCompletionForm(){
	document.forms['searchCompletionForm'].actionCode.value="";
	document.forms['searchCompletionForm'].action="/shf/completion/searchResult.do";
	document.forms['searchCompletionForm'].target="";
	document.forms['searchCompletionForm'].submit();
}

function keyPressed(){
	var k=window.event.keyCode;
	if(Number(k)==13){
		submitSearchCompletionForm();
	}
}

function maximizeResults(){
	document.getElementById('viewParamRow').style.display='none';
	hideMenu();
}

function minimizeResults(){
	document.getElementById('viewParamRow').style.display='';
	displayMenu();
}

function exportCompletions(){
	document.forms['searchCompletionForm'].actionCode.value="export";
	document.forms['searchCompletionForm'].target="_Empty";
	document.forms['searchCompletionForm'].submit();
}

function cancelCompletions(){
	
	document.forms['searchCompletionForm'].actionCode.value="cancel";
	document.forms['searchCompletionForm'].action="/shf/completion/cancel.do";
	document.forms['searchCompletionForm'].target="";
	document.forms['searchCompletionForm'].submit();
	
}

function updateCompletions(){
	
	document.forms['searchCompletionForm'].actionCode.value="update";
	document.forms['searchCompletionForm'].action="/shf/completion/update.do";
	document.forms['searchCompletionForm'].target="";
	document.forms['searchCompletionForm'].submit();
	
}

function selectAll(){
	var arr=document.getElementsByName("selectedCompletions");
	var i=0;
	for (i = 0; i < arr.length; i++)
		arr[i].checked = true ;
	
}

function clearAll(){
	var arr=document.getElementsByName("selectedCompletions");
	var i=0;
	for (i = 0; i < arr.length; i++)
		arr[i].checked = false ;
}

</script>
<title>cti</title>
<shf:reloadErrors></shf:reloadErrors>
</head>
<%
String moked=completionForm.getMoked();
String agaf=completionForm.getAgaf();
%>
<body onkeyup="keyPressed();">
	<form action="/shf/completion/searchResult.do" name="searchCompletionForm" STYLE="margin: 0px; padding: 0px;">
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height:20px;"><jsp:include page="submenu/cti_submenu.jsp"></jsp:include> </TD>
		</TR>			
		<TR id="viewParamRow">
			<TD width="100%" valign="top" style="padding-right:6px;padding-left:6px;">
				<FIELDSET class="form">
				<legend>הצגת השלמות</legend>
				<input type="hidden" name="actionCode"/>
				<TABLE cellspacing="0" cellpadding="2" width="100%" >
					<TR>
					<TD width="100%">
					<TABLE cellspacing="0" cellpadding="2" >
					<TBODY>
						
						<TR>
							<TD class="header">אגף:</TD>
							<TD class="data">
							
							<shf:unitselect tablename="unitCode" name="agaf"
							selectedName="completionForm" selectedProperty="agaf"
							style="width:170px;font-size:10px;" type="E01" all="yes"
							logic="onchange='setMokeds();'" />
							
							</TD>
							
							<td WIDTH="20px"></td>
						
							<TD class="header">מוקד:</TD>
							<TD class="data" id="mokedsAjaxResult">
							<%if(agaf==null){%>
							<shf:unitselect tablename="unitCode" name="moked"
							style="width:170px;font-size:10px;" type="G01" all="yes"
							type="999" logic="disabled"/>
							<%}else{%>
							<shf:unitselect tablename="unitCode" name="moked"
							selectedName="completionForm" selectedProperty="moked"
							style="width:170px;font-size:10px;" type="G01" all="yes"
							logic="onchange='setTeams();'" parentunit="<%=agaf%>"/>
							</TD>
							<%}%>
							
						</TR>
		
						<TR>
							<TD class="header">צוות:</TD>
							<TD class="data" id="teamsAjaxResult">
							<%if(moked==null||moked.equals("-1")){%>
							<shf:unitselect tablename="unitCode" name="team"
							selectedName="completionForm" selectedProperty="team"
							style="width:170px;font-size:10px;" type="999" logic="disabled" />
							<%}else{%>
							<shf:unitselect tablename="unitCode" name="team"
							selectedName="completionForm" selectedProperty="team"
							style="width:170px;font-size:10px;" type="J01" all="yes" parentunit="<%=moked%>" />
							<%}%>
							</TD>
							<td WIDTH="20px"></td>
							<TD class="header">סוג השלמה:</TD>
							<TD class="data">
								<bzq:select tablename="completionCode" all="yes" name="completionCode" selectedName="completionForm" selectedProperty="completionCode" style="height:10px;width:170px;font-size:10px;" />
							</TD>
						</TR>
						<TR>
							<TD class="header">סטטוס השלמה:</TD>
							<TD class="data">
								
								<html:select property="completionStatus" name="completionForm" style="width:170px;font-size:10px;">
								<html:option value="0,10,50,99" >הכל</html:option>
								<html:option value="0">פתוח</html:option>
								<html:option value="10">סגור</html:option>
								<html:option value="50">מבוטל</html:option>
								<html:option value="99">לא מועבר</html:option>
								<html:option value="0,1,10,99" >לא מבוטל</html:option>
								</html:select>
								
								
							</TD>
							<td></td>
							<TD class="header">תעודת זהות:</TD>
							<TD class="data">
							<html:text property="id_number" name="completionForm" styleClass="formInput"></html:text>
							</TD>
							
						</TR>
						<TR>
							<TD class="header">מערכת מקור:</TD>
							<TD class="data">
								<html:select property="sourceSystem" name="completionForm" style="width:170px;font-size:10px;">
								<html:option value="0" >הכל</html:option>
								<html:option value="<%=SHFConstants.LOGIN_SYSTEM_COMPLETION%>">השלמות</html:option>
								<html:option value="<%=SHFConstants.LOGIN_SYSTEM_CTI%>">CTI</html:option>
								</html:select>
								
								
							</TD>
							<td></td>
							<TD class="header">שם פרטי:</TD>
							<TD class="data">
							<html:text property="firstName" name="completionForm" styleClass="formInput"></html:text>
							</TD>
						</TR>
						<TR>
							<TD class="header">שם מעדכן:</TD>
							<TD class="data">
								<html:select property="updatingUser" name="completionForm" style="width:170px;font-size:10px;">
									<html:option value="">הכל</html:option>
								<%
								TableForm tableForm=null;
								for(int i=0;i<completionForm.getUsers().size();i++){
									tableForm=(TableForm)completionForm.getUsers().get(i);
								%>
									<html:option value="<%=tableForm.getCode()%>"><%=tableForm.getDescription()%></html:option>
								<%}%>
								</html:select>
								
							</TD>
							
							<td></td>
							<TD class="header">שם משפחה:</TD>
							<TD class="data">
								<html:text property="lastName" name="completionForm" styleClass="formInput"></html:text>
							</TD>
						</TR>
						
						<TR>
							<td colspan="3">
							<table>
							<TR>
								<TD class="header">מתאריך:</TD>
								<TD width="10px"></TD>
								<TD class="data">
									<shf:calendar calname="completionFromDate" name="completionForm" property="completionFromDate"/>
								</TD>
								<TD width="5x"></TD>
								<TD class="data">
									<shf:timechooser inputname="completionFromTime" name="completionForm" property="completionFromTime"/>
								</TD>
							<TD width="10x"></TD>
								
							</TR>
							</table>
							</td>
							<td colspan="3">
							<table>
							<TR>
								<TD class="header">עד תאריך:</TD>
								<TD width="10px"></TD>
								<TD class="data">
									<shf:calendar calname="completionToDate" name="completionForm" property="completionToDate"/>
								</TD>
								<TD width="5px"></TD>
								<TD class="data">
									<shf:timechooser inputname="completionToTime" name="completionForm" property="completionToTime"/>
								</TD>
							</TR>
							</table>
							</td>
						</TR>
						
						
					</TBODY>
					</TABLE>
					</TD>
					</TR>
					
					<TR>
					<TD><button onclick="submitSearchCompletionForm();">חפש</button> </TD>
					</TR>
				</TABLE>
				
				</FIELDSET>
				
			</TD>
		</TR>
		<TR>
			<TD width="100%" style="padding-right:6px;-padding-left:6px;">
				<TABLE width="100%" border="0">
					<TR>
						<TD width="60px">
							<span onclick="maximizeResults();" 
							style="background-image:url('/shf/images/updown.gif');
								width:18px;background-repeat:no-repeat;background-position:left;cursor:hand;">
							</span>
							&nbsp;
							<span onclick="minimizeResults();" 
							style="background-image:url('/shf/images/updown.gif');
								width:18px;background-repeat:no-repeat;background-position:right;cursor:hand;">
							</span>
						</TD>
						<td></td>
						
						<TD align="right" style="color:#888888;">
							<a style="color:navy;font-size:12px;" href="javascript:selectAll();">סמן הכל</a>
						|
							<a style="color:navy;font-size:12px;" href="javascript:clearAll();">הורד הכל</a>
						|
							<a style="color:navy;font-size:12px;" href="javascript:updateCompletions();">עדכן השלמות</a>
						|
							<a style="color:navy;font-size:12px;" href="javascript:cancelCompletions();">בטל השלמות</a>
						</TD>
						
						<TD width="1px"></TD>
						<TD width="20px"><img src="/shf/images/excell.png" onclick="exportCompletions();" style="cursor:hand;" /></TD>
					</TR>
				</TABLE>
			</TD>		
		</TR>
		<TR>
			<TD height="100%" width="100%" valign="top" style="padding-bottom:5px;padding-right:6px;padding-left:6px;">
				<div id="dataGridDiv" style="overflow:auto;width:100%;height:100%;border:1px silver solid;">	
					<jsp:include page="cti_view_result.jsp"></jsp:include>
				</div>
			</TD>
		</TR>
	</TABLE>
	</form>
</body>
</html>