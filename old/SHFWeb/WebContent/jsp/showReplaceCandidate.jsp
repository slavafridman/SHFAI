<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ page language="java" 
contentType="text/html; charset=WINDOWS-1255" 
pageEncoding="WINDOWS-1255" 
import="bzq.shf.utils.SHFConstants,bzq.utils.BaseConvert,bzq.shf.utils.SHFUtils,java.util.Date,java.util.Vector,bzq.shf.transfer.EventReason,bzq.shf.transfer.ReplaceByCritrion,bzq.shf.utils.SHFTableUtils"
%>

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>

<META http-equiv="Content-Type" content="text/html; charset=windows-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" >
<TITLE>eventReason</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></script>
<SCRIPT language="JavaScript" src="/shf/js/attendance.js"></script>
<script src="../js/jquery-1.12.0.min.js"></script>
<script src="../js/shf_responsive.js"></script>
<SCRIPT language="JavaScript">

function offerReplaceShift(){
	if(selectedRow==null || selectedRow=='') 	{
		alert("צריך לבחור את המשמרת איתה רוצים להחליף");
	} else	{	
		window.location.href='/shf/replace/offerReplace.do?'+selectedRow;
	}			
}

</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY>
<TABLE width="100%" cellpadding="0" cellspacing="0" dir="rtl" >
		<TR>
			<TD valign="top" style="height:20px;"><jsp:include page="submenu/shift_submenu.jsp"></jsp:include> </TD>
		</TR>
</TABLE>
<%

ReplaceByCritrion myShift = (ReplaceByCritrion)request.getAttribute("currentShiftNeedReplace");
request.setAttribute("currentShiftNeedReplace",myShift);
Date myStartTime = null;
Date myEndTime = null;
String shiftIdS = myShift.getShiftId();
Vector replaceCandidate = (Vector)request.getAttribute("replaceCandidate");

if (myShift!=null)	{
	myStartTime = myShift.getStartTime();
	myEndTime = myShift.getEndTime();
	
%>	
<BR class="respRemove">
<TABLE width="65%" dir="rtl" align="center" class="respRemove">	
<TR>
<TD>
<FIELDSET class="form respRemove">
<LEGEND>המשמרת שלי</LEGEND>
<TABLE cellpadding="0" cellspacing="0" align="center" dir="ltr" width="100%">	
	<TR align="right">			
		<TH  nowrap="nowrap"  class="header">תפקיד בפועל</TH>
		<TH  nowrap="nowrap"  class="header">מוקד</TH>
		<TH   nowrap="nowrap"  class="header">סיום משמרת</TH>
		<TH   nowrap="nowrap"  class="header">התחלת משמרת</TH>
 	    <TH   nowrap="nowrap"  class="header">תאריך</TH>
	</TR>	
	<TR align="right">			
		<TD  nowrap="nowrap"  class="data"><%=bzq.shf.utils.SHFTableUtils.getInnerJobName(myShift.getInnerJob())%></TD>
		<TD   nowrap="nowrap"  class="data"><%=SHFTableUtils.getUnitName(SHFTableUtils.getParentUnitNameOf(myShift.getEmployeeOrgUnit()))%></TD>	
		<TD   nowrap="nowrap"  class="data"><%=SHFUtils.formatDateToString(myEndTime,"HH:mm")%></TD>		
		<TD   nowrap="nowrap"  class="data"><%=SHFUtils.formatDateToString(myStartTime,"HH:mm")%></TD>
		<TD  nowrap="nowrap"  class="data"><%=SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy")%></TD>
	</TR>		
</TABLE>
</FIELDSET>
</TD>
</TR>
</TABLE>
<% }%>
<br class="respRemove">
<div class="tableMainWrapper showRepCand">
<TABLE width="100%" cellpadding="0" cellspacing="0" class="showRepCand">
<%if (replaceCandidate!=null){%>
<TR>
	<TD valign="top" style="padding-right:7px;padding-left:7px;" dir="ltr">
		<TABLE cellspacing="0" cellpadding="0" width="100%" style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
			<TR class="tableTotal" >
				<TD class="tableTotal" style="padding-left:2px;padding-top:2px;">	
				<img src='/shf/images/export.png' alt='הצע החלפה' onclick='offerReplaceShift();' style='cursor:hand;float:left;' height="17px" <%=replaceCandidate!=null?"":"Disabled"%> >
				<img src='/shf/images/search.png' height=16px style="float:right;"> נמצאו <%=replaceCandidate.size()%> משמרות מהמאגר
				</TD>
			</TR>
		</TABLE>
	</TD>
</TR>
<%}%>
<TR>
<TD style="padding-right:7px;padding-left:7px;direction:ltr;">


<%
int i = 0;
String isNewShiftReplace = SHFUtils.getParameter(request.getParameter("isNewShiftReplace"),"0");
Date endDate;
Date startDate;
ReplaceByCritrion replaceByCritrion;

if (replaceCandidate!=null && replaceCandidate.size() > 0 )	{
%>  
<SCRIPT language="javascript">
	var myHeader=new Array("תפקיד בפועל","מוקד","שם","שעת סיום<span style='display: none;' class='respHdr respHdrHide'/>","שעת התחלה<span style='display: none;' class='respHdr respHdrHide'/>","תאריך<span style='display: none;' class='respHdr respHdrOnly respHdrHide'/>");
	var txtColor=new Array("#000","#000","#000","#000","#000");
	var selectedRow;
	var myData=[<%=replaceCandidate.size()%>];
</SCRIPT>

<logic:iterate id="replace" name="replaceCandidate">
<%
replaceByCritrion = (ReplaceByCritrion)replaceCandidate.get(i);
endDate = replaceByCritrion.getEndTime();
startDate = replaceByCritrion.getStartTime();
String moked=SHFTableUtils.getUnitName(SHFTableUtils.getParentUnitNameOf(replaceByCritrion.getEmployeeOrgUnit()));
%>  
<SCRIPT>
myData[<%=i%>] = [
'<%=SHFTableUtils.getInnerJobName(replaceByCritrion.getInnerJob())%>',
'<%=BaseConvert.specialCharactersHTML(moked,true,true)%>',
'<%=BaseConvert.specialCharactersHTML(replaceByCritrion.getFullname(),true,true)%>',
'<%=SHFUtils.formatDateToString(endDate,"HH:mm")%>',
'<%=SHFUtils.formatDateToString(startDate,"HH:mm")%>',
'<%=SHFUtils.formatDateToString(startDate,"dd/MM/yyyy")%>',
'<%="shiftId="+replaceByCritrion.getShiftId()+"&activity="+replaceByCritrion.getActivity()+"&endTime="+SHFUtils.formatDateToString(replaceByCritrion.getEndTime(),"dd/MM/yyyy-HH:mm")+"&startTime="+SHFUtils.formatDateToString(replaceByCritrion.getStartTime(),"dd/MM/yyyy-HH:mm")+"&employeeId="+replaceByCritrion.getEmployeeId()+"&offer="+myShift.getShiftId()+"&offerFullname="+BaseConvert.specialCharactersHTML(myShift.getFullname(),true,true)+"&offerStartTime="+SHFUtils.formatDateToString(myShift.getStartTime(),"dd/MM/yyyy-HH:mm")+"&offerEmployeeId="+myShift.getEmployeeId()+"&offerEndTime="+SHFUtils.formatDateToString(myShift.getEndTime(),"dd/MM/yyyy-HH:mm")%>']
</SCRIPT>
<%
i++;
%>	
</logic:iterate>

<DIV id="dataGridDiv">
<SCRIPT>
drawGrid2('dataGridDiv');
</SCRIPT>
</DIV>
<%
}else{%>
<div class="gridNoData">אין נתונים</div>
<%}%>
</TD>
</TR>
<TR>
  <%if ("1".equals(isNewShiftReplace))	{%>
  	<TD align="center"><br class="respRemove"><span>במידה ואין משמרת נוחה להחלפה / לא נמצאו משמרות</span><br/><A href="/shf/replace/insertShiftToRepository.do?shiftId=<%=myShift.getShiftId()%>
								&fullname=<%=myShift.getFullname()%>  	
								&activity=<%=myShift.getActivity()%>
								&endTime=<%=SHFUtils.formatDateToString(myEndTime,"dd/mm/yyyy HH:mm")%>
								&startTime=<%=SHFUtils.formatDateToString(myStartTime,"dd/mm/yyyy HH:mm")%>
								&employeeId=<%=myShift.getEmployeeId()%>
								" onclick="this.href=this.href+'&shiftNote='+document.getElementById('txtShiftNote').value;">באפשרותך לשמור את המשמרת במאגר ההחלפות</A>
								<div id="repRemark">
									<br/><br/>
									<span style="font-size: 12px;">• ניתן להוסיף הערה בעת הכנסת המשמרת למאגר (מוגבל ל64 תווים)</span><br/>
									<textarea id="txtShiftNote" rows="6" cols="32" maxlength="64" onkeypress="return ( this.value.replace(/\n\r|\r\n|\r|\n/g,'').length < this.getAttribute('maxlength') )"></textarea>
								</div>
	</TD>
  <%}else{%>									
  	<TD align="center" style="padding-top:10px;"><A href="/shf/replace/manageReplace.do" style="color:navy;font-size:16px;">חזור</A></TD>
  <%}%>
</TR>
</TABLE>
</div>
<br>
<br>
</BODY>
</HTML>