<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>

<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255"%>
<%@ page import="java.util.Date,bzq.shf.utils.SHFConstants,bzq.shf.utils.SHFTableUtils,bzq.shf.utils.SHFUtils,java.util.Vector,bzq.shf.transfer.ReplaceByCritrion,bzq.utils.BaseConvert"%>
<META http-equiv="Content-Type" content="text/html; charset=windows-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" >
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></script>
<SCRIPT language="JavaScript" src="/shf/js/attendance.js"></script>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY>
<TABLE width=100% cellpadding="0" cellspacing="0" dir="rtl">
		<TR>
			<TD valign="top" style="height:20px;"><jsp:include page="submenu/shift_submenu.jsp"></jsp:include> </TD>
		</TR>
</TABLE>
<%	
ReplaceByCritrion myShift = (ReplaceByCritrion)request.getAttribute("myShift");
Date myStartTime = myShift.getStartTime();
Date myEndTime = myShift.getEndTime();
Vector shiftsOffer = (Vector)request.getAttribute("shiftsOffer");

if (myShift!=null)	{
%>	
<BR>
<TABLE width="65%" dir="rtl" align="center">	
<TR>
<TD>
<FIELDSET class="form">
<LEGEND>המשמרת שלי</LEGEND>
<TABLE cellpadding="0" cellspacing="0" align="center" dir="ltr" width="100%">	
	<TR align="right">			
		<TH  nowrap  class="header">תפקיד בפועל</TH>
		<TH  nowrap  class="header">מוקד</TH>
		<TH   nowrap  class="header">סיום משמרת</TH>
		<TH   nowrap  class="header">התחלת משמרת</TH>
 	    <TH   nowrap  class="header">תאריך</TH>
	</TR>	
	<TR align="right">			
		<TD  nowrap  class="data"><%=SHFTableUtils.getInnerJobName(myShift.getInnerJob()) %></TD>
		<TD  nowrap  class="data"><%=SHFTableUtils.getUnitName(SHFTableUtils.getParentUnitNameOf(myShift.getEmployeeOrgUnit()))%></TD>
		<TD   nowrap  class="data"><%=SHFUtils.formatDateToString(myEndTime,"HH:mm")%></TD>		
		<TD   nowrap  class="data"><%=SHFUtils.formatDateToString(myStartTime,"HH:mm")%></TD>
		<TD  nowrap  class="data"><%=SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy")%></TD>
	</TR>		
</TABLE>
</FIELDSET>
</TD>
</TR>
</TABLE>
<% }%>
<br>
<SCRIPT type="text/javascript" language="javascript">

function rejectReplace(){
	if(selectedRow==null || selectedRow=='') 	{
		alert("אנא בחר משמרת ברצונך לדחות");
	} else	{	
//		alert(selectedRow);
		navigate('/shf/replace/rejectOffer.do?'+selectedRow);
	}			
}

function replaceShifts(){
	if(selectedRow==null || selectedRow=='') 	{
		alert("אנא בחר משמרת ברצונך להחליף");
	} else	{	
//		alert(selectedRow);
		navigate('/shf/replace/acceptOffer.do?'+selectedRow+'&note='+ document.getElementById('noteInput').value);
	}			
}
function showElement()	{
	document.getElementById('note').style.display='';
}
function hideElement()	{
	document.getElementById('note').style.display='none';
}

</SCRIPT>
<TABLE width="100%" cellpadding="0" cellspacing="0">
<%if (shiftsOffer!=null){%>
<TR>
	<TD valign="top" style="padding-right:7px;padding-left:7px;" dir="ltr">
		<TABLE cellspacing=0 cellpadding=0 width=100% style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
			<TR class=tableTotal >
				<TD  style='text-align:left' class=tableTotal style="padding-left:2px;padding-top:2px;" >	
					<img src='/shf/images/add_missing.gif' alt='דחה החלפה' onclick='javascript:rejectReplace();' style='cursor:hand;' height=17px <%=shiftsOffer!=null?"":"disabled"%>>
					<img src='/shf/images/handshake.png' alt='בצע החלפה' onclick='javascript:replaceShifts();' style='cursor:hand;' height=20px <%=shiftsOffer!=null?"":"disabled"%>>
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
Date endTime;
Date startTime;
ReplaceByCritrion replaceByCritrion;

if (shiftsOffer!=null)	{
%>  
<SCRIPT>
	var myHeader=["תפקיד בפועל","מוקד","שם","שעת סיום","שעת התחלה","תאריך"];
	var txtColor=['#000','#000','#000','#000','#000'];
	var selectedRow;
	var myData=[<%=shiftsOffer.size()%>];
</SCRIPT>
    <logic:iterate id="result" name="shiftsOffer">		  		
<%
replaceByCritrion = (ReplaceByCritrion)shiftsOffer.get(i);
endTime = replaceByCritrion.getEndTime();
startTime = replaceByCritrion.getStartTime();
String moked=SHFTableUtils.getUnitName(SHFTableUtils.getParentUnitNameOf(replaceByCritrion.getEmployeeOrgUnit()));
%>  
<SCRIPT>
myData[<%=i%>] = 
[
'<%=SHFTableUtils.getInnerJobName(replaceByCritrion.getInnerJob())%>',
'<%=BaseConvert.specialCharactersHTML(moked,true,true)%>',
'<%=BaseConvert.specialCharactersHTML(replaceByCritrion.getFullname(),true,true)%>',
'<%=SHFUtils.formatDateToString(endTime,"HH:mm")%>',
'<%=SHFUtils.formatDateToString(startTime,"HH:mm")%>',
'<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy")%>',
'<%="offerManagerId="+replaceByCritrion.getManagerId()+"&activity="+myShift.getActivity()+"&offerStartTime="+SHFUtils.formatDateToString(startTime,"dd/MM/yyyy-HH:mm")+"&offerEndTime="+SHFUtils.formatDateToString(endTime,"dd/MM/yyyy-HH:mm")+"&offerEmployeeId="+replaceByCritrion.getEmployeeId()+"&offerEmployeeIdNum="+replaceByCritrion.getEmployeePersonalId()+"&offer="+replaceByCritrion.getShiftId()+"&employeePersonalId="+myShift.getEmployeePersonalId()+"&employeeId="+myShift.getEmployeeId()+"&shiftId="+myShift.getShiftId()+"&startTime="+SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy-HH:mm")+"&endTime="+SHFUtils.formatDateToString(myEndTime,"dd/MM/yyyy-HH:mm")+"&fullname="+BaseConvert.specialCharactersHTML(myShift.getFullname(),true,true)+"&managerId="+myShift.getManagerId()%>'
];
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
</TD>  
</TR>
</TABLE>
<TABLE width="100%">
<TR>
<TD class="data" align="center">
<DIV id="note" style="position:absolute;z-index:999;display:none;">
	<TABLE dir="rtl" width="20%">
	 <TR>
	  <TD>
	   <FIELDSET class="info">
		<LEGEND>הערה</LEGEND>
		 <TABLE dir="rtl">
		  <tr>
		   <TD dir="rtl">
		    <INPUT type="text" id="noteInput" size="35"/>
		   </td>
		  </tr>
		  <TR>
		   <td valign="bottom"><A href="javascript:hideElement();"/>סגור</a></td>
		  </tr>
		 </TABLE>
	   </FIELDSET>
	  </td>
	 </TR>
	</table>
</DIV>

<A href="javascript:showElement();" style="color:navy;font-size:16px;">הוסף הערה</A>
<%
}
else{
%>
<div class="gridNoData">אין נתונים</div>
<%}%>
</TD>  
</TR>
<TR>
<TD align="center" style="padding-top:10px;"><A href="/shf/replace/manageReplace.do" style="color:navy;font-size:16px;">חזור</A></TD>
</TR>
</TABLE>
</BODY>
</HTML>
