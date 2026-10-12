<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.dao.SimpleFactoryDao"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>

<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255"%>
<%@ page import="java.util.Date,bzq.shf.utils.SHFConstants,bzq.shf.utils.SHFUtils,java.util.Vector,bzq.shf.transfer.OfferReplaceByCritrion"%>
<META http-equiv="Content-Type" content="text/html; charset=windows-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<script src="../js/jquery-1.12.0.min.js"></script>
<script src="../js/shf_responsive.js"></script>
<SCRIPT type="text/javascript" language="javascript">
var suggestionsRows = [];
function showElement(row){
	document.getElementById(row).style.display='';
}
function hideElement(row){
	document.getElementById(row).style.display='none';
}
function expandColapse (parentTrId) {
	var allRows = document.getElementById("gridTable").getElementsByTagName("tr");
	var img = document.getElementById("collapseExpand"+parentTrId);
	var collapsed = false;
	
	for ( i=0; i<allRows.length; i++ ) {
		if ( hasClass(allRows[i], parentTrId) ) {
			if( allRows[i].style.display == '' ) {
				allRows[i].style.display = 'none';
				collapsed = true;
			} else { 
				allRows[i].style.display = '';
			}
		}
	}
	if ( collapsed ) {
		img.src = "/shf/images/expand-medium-blue.png";
	} else {
		img.src = "/shf/images/collapse-medium-blue.png";
	}
}
function hasClass(element, cls) {
    return (' ' + element.className + ' ').indexOf(' ' + cls + ' ') > -1;
}

</SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY>

<div id="loadingImgDiv" style="position: absolute; width: 100%; height: 100%; z-index: 200; background: white; filter: alpha(opacity=50); display: none;">
	<div style="margin-right: 40%; margin-top: 15%; width: 200px; height: 200px; border: 1px solid black; background: white; filter: alpha(opacity=80);">
		<img  alt="...המתן" src="/shf/images/wait.gif" style="width: 40%; width: 40%; margin-right: 35%; margin-top: 35%;">
	</div>
</div>
<div class="tableMainWrapper">
<TABLE style="height:100%;width:100%;" cellpadding="0" cellspacing="0" dir="rtl" border="1" class="respMngRepMain">
	<TR>
		<TD valign="top" style="height:20px;"><jsp:include page="submenu/shift_submenu.jsp"></jsp:include> </TD>
	</TR>
	<TR>
	<TD dir="ltr" style="height:100%;width:100%;padding:10px 7px 7px 7px;vertical-align: top;">
	<form method="post" action="/shf/replace/searchForCandidate.do" style="display:inline;">
	
	<div style="overflow:auto;height:100%;width:100%">
	<fieldset style="direction: rtl">
	<legend>מאגר משמרות</legend>
	
	<TABLE  id="gridTable" width="100%" cellpadding="0" cellspacing="0" align="right" style="direction:ltr" class="respDataTable respMngRep">	
<%	
	Vector shownOffers = new Vector();
	if (((Vector)request.getAttribute("manageReplace"))!=null)	{
%>	
	<%
		/*	explanation for below html tag <span style='display: none;' class='respHdr'/>
			this tag is for mobile version, respHdr = in title and when expanded, respHdrOnly = in title only, respHdrHide = show content only in title, respHide = hide in title and body
		*/
	%>
	<THEAD>
	<TR align="right" bgcolor="red" style="position:relative;top: expression(offsetParent.scrollTop);height:20px;">			
		<TH height="20px" colspan="3" align="center" class="header">פעולות</TH>
		<TH class="header">פרטים</TH>
		<TH class="header">סטטוס<span style='display: none;' class='respHdr respHdrOnly'/></TH>	
		<TH class="header">תור<span style='display: none;' class='respHdr respHide'/></TH>
		<TH class="header">מוקד<span style='display: none;' class='respHdr respHide'/></TH>
		<TH class="header">תפקיד בפועל<span style='display: none;' class='respHdr respHide'/></TH>
		<TH class="header">עובד<span style='display: none;' class='respHdr respHide'/></TH>
		<TH class="header">סיום</TH>
		<TH align="right" class="header">התחלה</TH>
		<TH align="right" class="header">תאריך<span style='display: none;' class='respHdr respHdrOnly respHdrHide'/></TH>
		<TH class="header">&nbsp<span style='display: none;' class='respHdr respHide'/></TH>
	</TR>	
	</THEAD>
<% 
int i = 1;
int a = 1;

%>	
    <logic:iterate id="result" name="manageReplace">		  		
<%

OfferReplaceByCritrion offerReplaceByCritrion = ((OfferReplaceByCritrion) (((Vector)request.getAttribute("manageReplace")).get(a-1)));

boolean shown = false;
for ( int m=0; m<shownOffers.size(); m++) {
	OfferReplaceByCritrion shownOffer = (OfferReplaceByCritrion)shownOffers.get(m);
	if ( offerReplaceByCritrion.getShiftId().equals( shownOffer.getShiftId()) ) {
		shown = true;
		break;
	}
}
if ( ! shown ) {
shownOffers.add(offerReplaceByCritrion);

Date startTime = offerReplaceByCritrion.getStartTime();
Date endTime = offerReplaceByCritrion.getEndTime();
Date offerStartTime = offerReplaceByCritrion.getOfferStartTime();
Date offerEndTime = offerReplaceByCritrion.getOfferEndTime();
String status = offerReplaceByCritrion.getStatus();
String statusDisplay = "";
String activity=bzq.shf.utils.SHFTableUtils.getActivityName(offerReplaceByCritrion.getActivity());
String innerJob=bzq.shf.utils.SHFTableUtils.getInnerJobName(offerReplaceByCritrion.getInnerJob());
String site=offerReplaceByCritrion.getSite();
String moked=SHFTableUtils.getUnitName(SHFTableUtils.getParentUnitNameOf(offerReplaceByCritrion.getEmployeeOrgUnit()));
String fullname = offerReplaceByCritrion.getFullname().replaceAll("'","\\\\'");


Vector allOffers = (Vector)request.getAttribute("manageReplace");
Vector currentOffers = new Vector();
Vector offersToMe = new Vector();
for ( int j=0; j<allOffers.size(); j++) {
	OfferReplaceByCritrion offer = (OfferReplaceByCritrion)allOffers.get(j);
	if ( offerReplaceByCritrion.getShiftId().equals( offer.getShiftId()) && offer.getStatus().equals(SimpleFactoryDao.WAIT_FOR_ANS_STATUS) && offer.getOffer() != null ) {
		currentOffers.add(offer);
	}/*  else {
		if ( ! offerReplaceByCritrion.getShiftId().equals( offer.getShiftId()) && offer.getStatus().equals(SimpleFactoryDao.WAIT_FOR_ANS_STATUS) &&  offer.getOffer().equals(offerReplaceByCritrion.getShiftId()) ) {
			offersToMe.add(offer);
		}
	} */
}
 
if ( currentOffers.size() > 0 ) {
	statusDisplay += "מחכה לתשובה("+currentOffers.size()+")";
} 
if (offerReplaceByCritrion.getOffersToMe().size() > 0) {
	statusDisplay +=(currentOffers.size() > 0 ? " \\ ": "") +" ממתין לאישורך("+offerReplaceByCritrion.getOffersToMe().size()+")";
}	
if (currentOffers.size() < 1 && offerReplaceByCritrion.getOffersToMe().size() < 1)
	statusDisplay = "פתוח להצעות"; 

%>    
	<TR align="center" bgcolor="<%=i%2==0?"#f5f5f5":"#ffffff"%>" class="colapsed" id="parent<%=i %>" >
	<!-- <table> -->
		<!-- <tr>	 -->
			<%if(false)	{%>
<%-- 				<TD colspan="3" class="data"></TD>
				<TD class="data">
					<DIV id="detail<%=i%>" style="position: absolute ;left:20px;z-index: 999;display:none;">
					 <FIELDSET class="info">
					 <TABLE width="400px" dir="rtl">
					  <tr>
					   <TD dir="rtl">הצעתך ל <bean:write name="result" property="offerFullName"/>  להחליפו במשמרתו  </td>
					  </tr>
					  <tr>
					   <TD> המתחילה ב <%=SHFUtils.formatDateToString(offerStartTime,"dd/MM/yyyy HH:mm")%>  ומסתיימת ב <%=SHFUtils.formatDateToString(offerEndTime,"dd/MM/yyyy HH:mm")%>    </td></tr><TR><td valign="bottom"><A href="javascript:hideElement('detail<%=i%>');"/>סגור</a></td>
					  </tr>
					 </TABLE>
					 </FIELDSET>
					</DIV>
					<A href="javascript:showElement('detail<%=i%>');" style="color:navy;">הצג</a>
				</TD> --%>
			<%}else{%>
				<TD class="data" height="26" width="26"><img src="/shf/images/add_missing_red.gif" style="cursor:hand;" alt="בטל חילוף והוצא משמרת מהמאגר" 
					onclick="javascript:this.src='/shf/images/wait.gif'; this.height='24'; window.location.href='/shf/replace/cancelShiftReplace.do?fullname=<%=fullname %>&activity=<bean:write name="result" property="activity"/>&startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>&endTime=<%=SHFUtils.formatDateToString(endTime,"dd/MM/yyyy HH:mm")%>&employeeId=<bean:write name="result" property="employeeId"/>&shiftId=<bean:write name="result" property="shiftId"/>&site=<bean:write name="result" property="site"/>'; this.onclick='function(){return true;}'; this.alt='המתן';"/>
				</TD>							
				<TD class="data" height="26" width="26"><%-- <img src="/shf/images/notepad.gif" style="cursor:hand;" height="25px" alt="כנס להצעות" onclick="javascript:navigate('/shf/replace/lookForOffers.do?activity=<bean:write name="result" property="activity"/>&startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>&endTime=<%=SHFUtils.formatDateToString(endTime,"dd/MM/yyyy HH:mm")%>&employeePersonalId=<bean:write name="result" property="employeePersonalId"/>&shiftId=<bean:write name="result" property="shiftId"/>&site=<%=site%>&managerId=<bean:write name="result" property="managerId"/>&innerJob=<%=offerReplaceByCritrion.getInnerJob()%>&employeeOrgUnit=<%=offerReplaceByCritrion.getEmployeeOrgUnit()%>')"/> --%></TD>
				<TD class="data" height="26" width="26"><img src="/shf/images/search2.png" style="cursor:hand;" alt="חפש חילוף" 
					onclick="javascript:this.src='/shf/images/wait.gif'; this.height='24'; window.location.href='/shf/replace/searchForCandidate.do?activity=<bean:write name="result" property="activity"/>&startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>&endTime=<%=SHFUtils.formatDateToString(endTime,"dd/MM/yyyy HH:mm")%>&employeeId=<bean:write name="result" property="employeeId"/>&employeePersonalId=<bean:write name="result" property="employeePersonalId"/>&shiftId=<bean:write name="result" property="shiftId"/>&site=<bean:write name="result" property="site"/>&innerJob=<%=offerReplaceByCritrion.getInnerJob()%>&employeeOrgUnit=<%=offerReplaceByCritrion.getEmployeeOrgUnit()%>'; this.onclick='function(){return true;}'; this.alt='המתן';"/>
				</TD>		
				<TD class="data" height="26" width="26">
				<% if (offerReplaceByCritrion.getNote() != null && offerReplaceByCritrion.getNote() != "") { %>
					<DIV id="detail<%=i%>" style="position: absolute ;left:20px;z-index: 999;display:none;">
						<FIELDSET class="info">
							<TABLE width="400px" dir="rtl">
								<tr>
						   			<TD dir="rtl"><%=offerReplaceByCritrion.getNote() %></td>
						  		</tr>
						  		<tr>
						   			<td><A href="javascript:hideElement('detail<%=i%>');">סגור</a></td>
						  		</tr>
						 	</TABLE>
						</FIELDSET>
					</DIV>
					<A href="javascript:showElement('detail<%=i%>');" style="color:navy;">הצג</a>
				<%} %>
				</TD>
			<%}%>
				<TD class="data" style="color:#aa5555;" dir="rtl"><%= statusDisplay %></TD>
				<TD class="data"><%=activity%></TD>
				<TD class="data"><%=moked%></TD>
				<TD class="data"><%=innerJob%></TD>
				<TD class="data"><bean:write name="result" property="fullname"/></TD>	
				<TD class="data"><%=SHFUtils.formatDateToString(endTime,"HH:mm")%></TD>
				<TD class="data" style="color:#66aa66;"><%=SHFUtils.formatDateToString(startTime,"HH:mm")%></TD>
		    	<TD class="data"><%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy")%></TD>
		    	<TD class="data colExpParent">
		    	<% if ( ! "OPEN".equals(status)  || ( "OPEN".equals(status) && offerReplaceByCritrion.getOffersToMe() != null && offerReplaceByCritrion.getOffersToMe().size() > 0 ) )	{ %>
		    		<img id="collapseExpandparent<%=i %>" alt="הרחב/צמצם" src="/shf/images/expand-medium-blue.png" onClick="expandColapse('parent<%=i %>');" style="cursor: pointer;">
		    	<% } %>
		    	</TD>
	    	<!-- <tr> -->
	<!-- </table>	 -->		
	</TR>
	<% //if ( ! "OPEN".equals(status) )	{ %>
		<% for ( int f=0; f < currentOffers.size(); f++) { %>
		<% OfferReplaceByCritrion suggestion = (OfferReplaceByCritrion)currentOffers.get(f); %>
			<TR align="center" bgcolor="<%=i%2==0?"#f5f5f5":"#ffffff"%>" class="parent<%=i %>" style="display:none;">
				<TD class="data cellCollapsed" height="26" width="26">&nbsp;</TD>
				<TD class="data cellCollapsed" height="26" width="26">&nbsp;</TD>
				<TD class="data cellCollapsed" height="26" width="26"><img src="/shf/images/add_missing.gif" style="cursor:hand;" alt="בטל הצעתך" 
					onclick="javascript:this.src='/shf/images/wait.gif'; this.height='24'; window.location.href='/shf/replace/cancelOffer.do?activity=<bean:write name="result" property="activity"/>&startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>?&endTime=<%=SHFUtils.formatDateToString(endTime,"dd/MM/yyyy HH:mm")%>&employeeId=<bean:write name="result" property="employeeId"/>&employeePersonalId=<bean:write name="result" property="employeePersonalId"/>&shiftId=<bean:write name="result" property="shiftId"/>&offerEmployeeId=<%=suggestion.getOfferEmployeeId()%>&offer=<%=suggestion.getOffer()%>&offerStartTime=<%=SHFUtils.formatDateToString(suggestion.getOfferStartTime(),"dd/MM/yyyy HH:mm")%>&offerEndTime=<%=SHFUtils.formatDateToString(suggestion.getOfferEndTime(),"dd/MM/yyyy HH:mm")%>&fullname=<%=suggestion.getFullname().replaceAll("'","\\\\'") %>'; this.onclick='function(){return true;}'; this.alt='המתן';">
				</TD>
				<TD class="data cellCollapsed" height="26" width="26">&nbsp;</TD>
				
				<TD class="data cellCollapsed" style="color:#aa5555;"><%="מחכה לתשובה"%></TD>
				<TD class="data cellCollapsed">&nbsp;</TD>
				<TD class="data cellCollapsed"><%=SHFTableUtils.getMokedNameOfSite( SHFTableUtils.getSiteCodeOfUnit( SHFTableUtils.getMokedCodeOf(suggestion.getOfferOrgUnitID()) ) )%></TD>
				<TD class="data cellCollapsed">&nbsp;</TD>
				<TD class="data cellCollapsed"><%= suggestion.getOfferFullName() %></TD>
				<TD class="data cellCollapsed"><%=SHFUtils.formatDateToString(suggestion.getOfferEndTime(),"HH:mm")%></TD>		
				<TD class="data cellCollapsed" style="color:#66aa66;"><%=SHFUtils.formatDateToString(suggestion.getOfferStartTime(),"HH:mm")%></TD>
		    	<TD class="data cellCollapsed"><%=SHFUtils.formatDateToString(suggestion.getOfferStartTime(),"dd/MM/yyyy")%></TD>
		    	<TD class="data cellCollapsed">&nbsp;</TD>
			
			</TR>
		<% } %>
	<%// } else if ( offerReplaceByCritrion.getOffersToMe() != null && offerReplaceByCritrion.getOffersToMe().size() > 0 ) { %>
		<% for ( int k=0; k < offerReplaceByCritrion.getOffersToMe().size(); k++) { %>
		<% OfferReplaceByCritrion offerToMe =  (OfferReplaceByCritrion)offerReplaceByCritrion.getOffersToMe().get(k); %>
					<TR align="center" bgcolor="<%=i%2==0?"#f5f5f5":"#ffffff"%>" class="parent<%=i %>" style="display:none;" >
						<TD class="data cellCollapsed" height="26" width="26"><img src='/shf/images/handshake.png' alt='בצע החלפה' style='cursor:hand;' height=18px 
							onclick="javascript:this.src='/shf/images/wait.gif'; this.height='24'; window.location.href='/shf/replace/acceptOffer.do?activity=<bean:write name="result" property="activity"/>'
							+'&startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>'
							+'&endTime=<%=SHFUtils.formatDateToString(endTime,"dd/MM/yyyy HH:mm")%>'
							+'&employeePersonalId=<bean:write name="result" property="employeePersonalId"/>'
							+'&shiftId=<bean:write name="result" property="shiftId"/>'
							+'&site=<bean:write name="result" property="site"/>'
							+'&fullname=<%=fullname %>'
							+'&offerStartTime=<%=SHFUtils.formatDateToString(offerToMe.getStartTime(),"dd/MM/yyyy-HH:mm")%>'
							+'&offerEndTime=<%=SHFUtils.formatDateToString(offerToMe.getEndTime(),"dd/MM/yyyy-HH:mm")%>'
							+'&offer=<%=offerToMe.getShiftId()%>&offerEmployeeId=<%=offerToMe.getEmployeeId()%>'
							+'&offerFullName=<%=offerToMe.getFullname().replaceAll("'","\\\\'")%>'
							+'&offerEmployeeIdNum=<%=offerToMe.getEmployeePersonalId()%>'
							+'&offerEmployeeId=<%=offerToMe.getEmployeeId()%>'
							+'&offerOrgUnitID=<%=offerToMe.getEmployeeOrgUnit()%>'
							+'&screen=<%="manageReplace"%>'
							+'&employeeId=<%=offerToMe.getOfferEmployeeId()%>'
							+'&offerManagerId=<%=offerToMe.getManagerId()%>'; this.onclick='function(){return true;}'; this.alt='המתן'; document.getElementById('loadingImgDiv').style.display = ''; "/>
						</TD>
						<TD class="data cellCollapsed" height="26" width="26">&nbsp;</TD>	
						<TD class="data cellCollapsed" height="26" width="26"><img src="/shf/images/add_missing.gif" style="cursor:hand;" alt="דחה הצעה" 
							onclick="javascript:this.src='/shf/images/wait.gif'; this.height='24'; window.location.href='/shf/replace/rejectOffer.do?activity=<bean:write name="result" property="activity"/>'
							+'&startTime=<%=SHFUtils.formatDateToString(startTime,"dd/MM/yyyy HH:mm")%>'
							+'&endTime=<%=SHFUtils.formatDateToString(endTime,"dd/MM/yyyy HH:mm")%>'
							+'&employeePersonalId=<bean:write name="result" property="employeePersonalId"/>'
							+'&shiftId=<bean:write name="result" property="shiftId"/>'
							+'&site=<bean:write name="result" property="site"/>'
							+'&fullname=<%=fullname %>'
							+'&offerStartTime=<%=SHFUtils.formatDateToString(offerToMe.getStartTime(),"dd/MM/yyyy-HH:mm")%>'
							+'&offerEndTime=<%=SHFUtils.formatDateToString(offerToMe.getEndTime(),"dd/MM/yyyy-HH:mm")%>'
							+'&offer=<%=offerToMe.getShiftId()%>&offerEmployeeId=<%=offerToMe.getEmployeeId()%>'
							+'&offerFullName=<%=offerToMe.getFullname().replaceAll("'","\\\\'")%>'
							+'&screen=<%="manageReplace"%>'
							+'&employeeId=<%=offerToMe.getOfferEmployeeId()%>'
							+'&offerManagerId=<%=offerToMe.getManagerId()%>'; this.onclick='function(){return true;}'; this.alt='המתן';"/>
						</TD>							
						<TD class="data cellCollapsed" height="26" width="26">&nbsp;</TD>
						
						<TD class="data cellCollapsed" style="color:#66aa66;"><%="ממתין לאישורך"%></TD>
						<TD class="data cellCollapsed">&nbsp;</TD>
						<TD class="data cellCollapsed"><%=SHFTableUtils.getMokedNameOfSite(offerToMe.getSite()) %></TD>
						<TD class="data cellCollapsed">&nbsp;</TD>
						<TD class="data cellCollapsed"><%= offerToMe.getFullname() %></TD>		
						<TD class="data cellCollapsed"><%=SHFUtils.formatDateToString(offerToMe.getEndTime(),"HH:mm")%></TD>		
						<TD class="data cellCollapsed" style="color:#66aa66;"><%=SHFUtils.formatDateToString(offerToMe.getStartTime(),"HH:mm")%></TD>
				    	<TD class="data cellCollapsed"><%=SHFUtils.formatDateToString(offerToMe.getStartTime(),"dd/MM/yyyy")%></TD>
				    	<TD class="data cellCollapsed">&nbsp;</TD>
			    	</TR>
		<% } %>
	<%// } %>
<% } if ( shown ) {i += 2;} else{ i++; } a++;%>	
    </logic:iterate>        	
<%}else{%>

	<TR>
	<TD colspan=20>
		<div class="gridNoData">אין הצעות החלפה זמינות</div>
	</TD>
	</TR>

<%}%>    
</TABLE>
</fieldset>
</div>
</form>

</TD>
</TR>
</TABLE>
</div>

</BODY>
</HTML>
