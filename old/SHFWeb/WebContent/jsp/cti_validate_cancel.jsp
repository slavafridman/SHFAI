<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean 
	id="completionForm"
	class="bzq.shf.forms.CTISearchCompletionForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="completions" scope="request" class="java.util.Vector"></jsp:useBean>
	
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
<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
<script language="JavaScript" src="/shf/js/shfutils.js"></script>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>

<script type="text/javascript">


function cancelCompletions(){
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

<body>
	<form action="/shf/completion/confirmCancel.do" name="searchCompletionForm" STYLE="margin: 0px; padding: 0px;">
	
	<input type="hidden" name="agaf" value="<%=completionForm.getMoked()%>">
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
		<TR id="viewParamRow">
			<TD width="100%" valign="top" style="padding-right:7px;padding-left:7px;">
				<FIELDSET class="form">
				<legend>הצגת השלמות</legend>
				
				<TABLE cellspacing="0" cellpadding="2" width="100%" >
					<TR>
					<TD width="100%" dir="rtl">
					האם אתה בטוח שברצונך לבטל את ההשלמות הבאות ?
					</TD>
					</TR>
					
					<TR>
					<TD style="padding:10px;">
						<button onclick="cancelCompletions();">אישור</button> 
						&nbsp;
						<button onclick="goBack();">ביטול</button> 
					</TD>
					</TR>
				</TABLE>
				
				</FIELDSET>
				
			</TD>
		</TR>
		<TR>
			<TD width="100%" height="100%">
				<TABLE width="100%" height="100%">
					<TR>
						<TD height="100%" width="100%" valign="top" style="padding:6px;">
							<div id="dataGridDiv" style="overflow:auto;width:100%;height:100%;border:1px silver solid;">	
								<SCRIPT>
								var myHeader=[
								
								"סטטוס"
								,"סוג השלמה"
								,"מערכת מקור"
								,"עד שעה"
								,"משעה"
								,"מתאריך"
								,"צוות"
								,"שם"
								
								];
								var txtColor=['#000'];
								var selectedRow;
								
								</SCRIPT>
								
								<%
								if(completions!=null && completions.size()>0){
								int size=completions.size();
								%>
								<SCRIPT>
								var myData=[
								<%
								EmployeeCompletionBean row=null;
								Integer sts=null;
								for(int i=0;i<size;i++){
									row=(EmployeeCompletionBean)completions.get(i);
									String source="";
									if("SHF".equals(row.getSource())) source="השלמות";
									else if("CTI".equals(row.getSource())) source="CTI";
									sts = new Integer(row.getSapStatus());
								%>
								[
								'<%=SHFConstants.COMPLETION_STATUS_MAP.containsKey(sts)?SHFConstants.COMPLETION_STATUS_MAP.get(sts):String.valueOf(sts.intValue())%>',
								'<shf:tables tableName="completionCode" codeName="<%=row.getCode()%>" />',
								'<%=source%>',
								'<shf:shftime date="<%=row.getCompletionEnd()%>"/>',
								'<shf:shftime date="<%=row.getCompletionStart()%>"/>',
								'<shf:shfdate date="<%=row.getCompletionStart()%>"/>',
								'<shf:tables tableName="unitCode" codeName="<%=row.getTeam()%>" />',
								'<%=BaseConvert.specialCharactersHTML(row.getEmployeeName(),true,true)%>',
								
								
								'<%=row.getId()%>'
								]
								<%if(i<size-1){%>,<%}}%>];
								drawGrid2('dataGridDiv');
								</SCRIPT>
								
								<%
								}
								else{
								%>
								<div class="gridNoData">אין נתונים</div>
								<%	
								}
								%>
							</div>
						</TD>
					</TR>
				</TABLE>
			</TD>		
		</TR>
		
	</TABLE>
	</form>
</body>
</html>