<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean 
	id="completionForm"
	class="bzq.shf.forms.CTISearchCompletionForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="completions" scope="request" class="java.util.Vector"></jsp:useBean>
<jsp:useBean id="row" scope="page" class="bzq.shf.bean.EmployeeCompletionBean"></jsp:useBean>
	
<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>



<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="bzq.shf.forms.TableForm"%>
<%@page import="bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.bean.EmployeeCompletionBean"%><html>
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
<script language="JavaScript" src="/shf/js/shfutils.js"></script>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>

<script type="text/javascript">


function updateCompletions(){
	document.forms['searchCompletionForm'].submit();
}

function goBack(){
	document.forms['searchCompletionForm'].action="/shf/completion/searchResult.do";
	document.forms['searchCompletionForm'].submit();
}


</script>
<title>cti</title>
<shf:reloadErrors></shf:reloadErrors>
</head>

<body dir="rtl">
	<form action="/shf/completion/confirmUpdate.do" name="searchCompletionForm" STYLE="margin: 0px; padding: 0px;">
	
	<input type="hidden" name="agaf" value="<%=completionForm.getAgaf()%>">
	<%if(completionForm.getMoked()!=null){%>
	<input type="hidden" name="moked" value="<%=completionForm.getMoked()%>">
	<%}%>
	<input type="hidden" name="team" value="<%=completionForm.getTeam()%>">
	<input type="hidden" name="completionCode" value="<%=completionForm.getCompletionCode()%>">
	<input type="hidden" name="completionStatus" value="<%=completionForm.getCompletionStatus()%>">
	<input type="hidden" name="id_number" value="<%=completionForm.getId_number()%>">
	<input type="hidden" name="sourceSystem" value="<%=completionForm.getSourceSystem()%>">
	<input type="hidden" name="firstName" value="<%=completionForm.getFirstName()%>">
	<input type="hidden" name="updatingUser" value="<%=completionForm.getUpdatingUser()%>">
	<input type="hidden" name="lastName" value="<%=completionForm.getLastName()%>">
	<input type="hidden" name="completionFromDate" value="<%=completionForm.getCompletionFromDate()%>">
	<input type="hidden" name="completionFromTime" value="<%=completionForm.getCompletionFromTime()%>">
	<input type="hidden" name="completionToDate" value="<%=completionForm.getCompletionToDate()%>">
	<input type="hidden" name="completionToTime" value="<%=completionForm.getCompletionToTime()%>">
	
	<%
	for(int i=0;i<completionForm.getSelectedCompletions().length;i++){
	%>
	<input type="hidden" name="selectedCompletions" value="<%=completionForm.getSelectedCompletions()[i]%>">
	<%}%>
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height:20px;"><jsp:include page="submenu/cti_submenu.jsp"></jsp:include> </TD>
		</TR>			
		
		<TR>
			<TD width="100%" height="100%">
				<TABLE width="100%" height="100%">
					<tr>
						<td height="100%" width="100%" valign="top" style="padding:6px;">
							<div id="dataGridDiv" style="overflow:auto;width:100%;height:100%;border:1px silver solid;">	
								<%
								if(completions!=null && completions.size()>0){
								 %>
								<table style="text-align: center; direction: ltr;" width="100%"
								cellpadding="0" cellspacing="0" style="color:#666666;">
								<thead>
								<tr>
								<th>סוג השלמה חדש</th>
								<th>סיום חדש</th>
								<th>התחלה חדשה</th>
								<th>סוג השלמה</th>
								<th>עד שעה</th>
								<th>משעה</th>
								<th>מתאריך</th>
								<th>צוות</th>
								<th>שם</th>
								</tr>
								</thead>
								
								<%
								
								int size=completions.size();
								
								row=null;
								Integer sts=null;
								for(int i=0;i<size;i++){
									row=(EmployeeCompletionBean)completions.get(i);
									String from=BaseConvert.dateToString(row.getCompletionStart(),"HH:mm");
									String to=BaseConvert.dateToString(row.getCompletionEnd(),"HH:mm");
									String dateFrom=BaseConvert.dateToString(row.getCompletionStart(),"dd/MM/yyyy");
									String dateTo=BaseConvert.dateToString(row.getCompletionEnd(),"dd/MM/yyyy");
								%>
								<html:hidden property="selectedCompletions" value="<%=String.valueOf(row.getId())%>"></html:hidden>
								<html:hidden property="completionsStartDates" value="<%=dateFrom%>"></html:hidden>
								<html:hidden property="completionsEndDates" value="<%=dateTo%>"></html:hidden>
								
								<TR bgcolor="<%=i%2==0?"#f7f7f7":"#ffffff"%>">
								<td class="data"><bzq:select tablename="completionCode" name="completionsCodes"  selectedvalue="<%=row.getCode()%>" style="height:10px;width:140px;font-size:10px;" /></td>
								<td class="data" dir="rtl"><shf:timechooser inputname="completionsEnd" inputid="<%=i%>"  inputvalue="<%=to %>" /></td>
								<td class="data" dir="rtl"><shf:timechooser inputname="completionsStart" inputid="<%=i%>" inputvalue="<%=from %>" /></td>
								<td class="data" dir="rtl"><shf:tables tableName="completionCode" codeName="<%=row.getCode()%>" /></td>
								<td class="data" dir="rtl"><shf:shftime date="<%=row.getCompletionEnd()%>"/></td>
								<td class="data" dir="rtl"><shf:shftime date="<%=row.getCompletionStart()%>"/></td>
								<td class="data" dir="rtl"><shf:shfdate date="<%=row.getCompletionStart()%>"/></td>
								<td class="data" dir="rtl"><shf:tables tableName="unitCode" codeName="<%=row.getTeam()%>" /></td>
								<td class="data" dir="rtl"><%=BaseConvert.specialCharactersHTML(row.getEmployeeName(),true,true)%></td>
								</tr>
								
								
								<%
								}
								
								
								%>
								</table>
								<%} %>
							</div>
						</TD>
					</TR>
				</TABLE>
			</TD>		
		</TR>
		<TR id="viewParamRow">
			<TD width="100%" valign="top" style="padding-right:7px;padding-left:7px;padding-bottom:7px;">
				
				<button onclick="goBack();">חזרה</button>
				<input type="reset" value="איפוס" class="button"/>&nbsp;
				<button onclick="updateCompletions();">שמירה</button>
				
				
			</TD>
		</TR>
	</TABLE>
	</form>
</body>
</html>