<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>

<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255"%>
<%@ page import="java.util.Date,bzq.shf.utils.SHFConstants,bzq.shf.utils.SHFTableUtils,
				bzq.shf.utils.SHFUtils,java.util.Vector,bzq.shf.transfer.ReplaceByCritrion, bzq.utils.BaseConvert"%>

<jsp:useBean 
	id="breakBean" 
	class="bzq.shf.bean.BreakBean"
	scope="request">
</jsp:useBean>

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
	<div id="loadingImgDiv" style="overflow:hidden; text-align:center; position: absolute; width: 100%; height: 100%; z-index: 200; background: white; filter: alpha(opacity=80); top: 1px; left: 1px; display: none;">
		<div style="vertical-align: middle; width: 200px; height: 200px; z-index: 500; border: 1px solid grey; margin-top:17%;">
			<span class="helper"></span>
			<img  alt="...המתן" src="/shf/images/wait.gif" style="width: 35%; vertical-align: middle;">
		</div>
		<div style="vertical-align: middle; width:256px;">נא להמתין בעת סנכרון עם מע' סופטפון</div>
		<span class="helper"></span>
	</div>
<TABLE width="100%" cellpadding="0" cellspacing="0" dir="rtl">
		<TR>
			<TD valign="top" style="height:20px;"><jsp:include page="submenu/shift_submenu.jsp"></jsp:include> </TD>
		</TR>
</TABLE>
<%	
ReplaceByCritrion myShift = (ReplaceByCritrion)request.getAttribute("myShift");
//Date myStartTime = myShift.getStartTime();
//Date myEndTime = myShift.getEndTime();
Vector shiftsOffer = (Vector)request.getAttribute("shiftsOffer");


Date myStartTime = null;
Date myEndTime = null;
String myStartTimeS = null;
String myEmpIdNum = breakBean.getEmpIdNumber();
String myOrgUnitId = breakBean.getOrgUnitId();
String empname = breakBean.getLastName()+ " " + breakBean.getFirstName();
Vector replaceCandidate = new Vector();
replaceCandidate = (Vector)request.getAttribute("breakVec");

if (breakBean!=null)	{
	myStartTime = breakBean.getStartTime();
	myEndTime = breakBean.getEndTime();
	myStartTimeS = BaseConvert.dateToString(breakBean.getStartTime(),"dd/MM/yyyy HH:mm");
//if (myShift!=null)	{
%>
<BR>
<TABLE width="65%" dir="rtl" align="center">	
	<TR>
		<TD>
		<FIELDSET class="form">
		<LEGEND>ההפסקה שלי</LEGEND>
		<TABLE cellpadding="0" cellspacing="0" align="center" dir="ltr" width="100%">	
			<TR align="right">
				<TH nowrap class="header">סיום הפסקה</TH>
				<TH nowrap class="header">התחלת הפסקה</TH>
				<TH nowrap class="header">תאריך</TH>
			</TR>
			<TR align="right">
				<TD nowrap class="data"><%=SHFUtils.formatDateToString(myEndTime,"HH:mm")%></TD>
				<TD nowrap class="data"><%=SHFUtils.formatDateToString(myStartTime,"HH:mm")%></TD>
				<TD nowrap class="data"><%=SHFUtils.formatDateToString(myStartTime,"dd/MM/yyyy")%></TD>
			</TR>		
		</TABLE>
		</FIELDSET>
		</TD>
	</TR>
</TABLE>
<% }%>
<br>
<SCRIPT type="text/javascript" language="javascript">

function rejectReplace(myDayId, myStartTime){
	if(selectedRow==null || selectedRow=='') 	{
		alert("אנא בחר משמרת ברצונך לדחות");
	} else	{	
		var pos1=selectedRow.indexOf(",");
		var len1=selectedRow.lentgh;

		var canDayId = selectedRow.substring(0, pos1);
		var canStartDate = selectedRow.substring(pos1+1, len1);
		
		pos1 = canStartDate.indexOf("-");
		len1 = canStartDate.length;
		var canDate =  canStartDate.substring(0, pos1);
		var canTime = canStartDate.substring(pos1+1, len1);
		canStartDate = canDate + " " + canTime;

		navigate('/shf/break/rejectBreakOffer.do?agentDayId='+myDayId+'&startTime='+myStartTime+'&offerDayId='+canDayId+'&offerStartDate='+canStartDate+'&note='+ document.getElementById('noteInput').value);
	}			
}

function replaceBreaks(myDayId, myStartTime, myEmpIdNum, myOrgUnitId){
	if(selectedRow==null || selectedRow=='') 	{
		alert("אנא בחר משמרת ברצונך להחליף");
	} else	{
		var selectedRowArr = selectedRow.split(",");
		var canDayId = selectedRowArr[0];
		canStartDate = selectedRowArr[1].replace("-"," ");
		document.getElementById("loadingImgDiv").style.display = "";
		navigate('/shf/break/acceptBreakOffer.do?agentDayId='+myDayId+'&startTime='+myStartTime+'&empIdNumber='+myEmpIdNum+'&orgUnitId='+myOrgUnitId
			+'&offerDayId='+canDayId+'&offerStartDate='+canStartDate+'&offerEmpIdNumber='+selectedRowArr[2]+'&offerOrgUnitId='+selectedRowArr[3]+'&note='+ document.getElementById('noteInput').value);
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
<%if (replaceCandidate!=null && replaceCandidate.size()>0){%>
<TR>
	<TD valign="top" style="padding-right:7px;padding-left:7px;" dir="ltr">
		<TABLE cellspacing=0 cellpadding=0 width=100% style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
			<TR class=tableTotal >
				<TD  style='text-align:left' class=tableTotal style="padding-left:2px;padding-top:2px;" >	
					<img src='/shf/images/add_missing.gif' alt='דחה החלפה' onclick="javascript:rejectReplace(<%=breakBean.getAgentDayId()%>, '<%=myStartTimeS%>');" style='cursor:hand;' height=17px <%=replaceCandidate!=null?"":"disabled"%>>
					<img src='/shf/images/handshake.png' alt='בצע החלפה' onclick="javascript:replaceBreaks(<%=breakBean.getAgentDayId()%>, '<%=myStartTimeS%>', '<%=myEmpIdNum %>','<%=myOrgUnitId %>');" style='cursor:hand;' height=20px <%=replaceCandidate!=null?"":"disabled"%>>
				</TD>
				
			</TR>
		</TABLE>
	</TD>
</TR>
<%}%>
<TR>
<TD style="padding-right:7px;padding-left:7px;direction:ltr;">

			<%
			bzq.shf.bean.BreakBean[] list=null;
			list = (bzq.shf.bean.BreakBean[])replaceCandidate.toArray(new bzq.shf.bean.BreakBean[replaceCandidate.size()]);
			bzq.shf.bean.BreakBean breakOfferBean = new bzq.shf.bean.BreakBean();
			int size=0;
			if(list!=null && list.length>0){
				size=list.length;
				}			
			Date startDate=null;
			Date endDate=null;
			
			if (replaceCandidate!=null && replaceCandidate.size()>0)	{
			%>
				<SCRIPT>
				var myHeader=["שעת סיום","שעת התחלה","תאריך","שם נציג"];
				var txtColor=['#000','#000','#000','#000','#000'];
				var selectedRow;
				var myData=[<%=list.length%>];
				</SCRIPT>
			<%
			for(int i=0;i<size;i++){
				breakOfferBean=(bzq.shf.bean.BreakBean)list[i];
				String listEmpname=BaseConvert.specialCharactersHTML(breakOfferBean.getFirstName()+" "+breakOfferBean.getLastName(),true,true);
				long agentDay = breakOfferBean.getAgentDayId();
				endDate = breakOfferBean.getEndTime();
				startDate = breakOfferBean.getStartTime();
				String startDateS = BaseConvert.dateToString(startDate,"dd/MM/yyyy-HH:mm");
				String agentDayS = Long.toString(agentDay);
				String orgUnitId = breakOfferBean.getOrgUnitId();
				String empIdNumber = breakOfferBean.getEmpIdNumber();
				String candidateKey = agentDayS + "," + startDateS+","+empIdNumber+","+orgUnitId;
				
				
			%>
			<SCRIPT>
			myData[<%=i%>] =			
			[
			'<%=SHFUtils.formatDateToString(endDate,"HH:mm")%>',
			'<%=SHFUtils.formatDateToString(startDate,"HH:mm")%>',
			'<%=SHFUtils.formatDateToString(startDate,"dd/MM/yyyy")%>',
			'<%=listEmpname%>',
			'<%=candidateKey%>'
			]
			</SCRIPT>
			<%}%>

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
<DIV id="note" style="position:absolute;z-index: 999;display:none;">
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

<!--A href="javascript:showElement();" style="color:navy;font-size:16px;">הוסף הערה</A-->
<%
}
else{
%>
<div class="gridNoData">אין נתונים</div>
<%}%>
</TD>  
</TR>
<TR>
<TD align="center" style="padding-top:10px;"><A href="/shf/break/showManageBreak.do" style="color:navy;font-size:16px;">חזור</A></TD>
</TR>
</TABLE>
</BODY>
</HTML>
