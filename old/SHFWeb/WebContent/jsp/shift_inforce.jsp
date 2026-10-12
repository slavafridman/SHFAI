<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="shiftInforce"
	class="bzq.shf.forms.ShiftInforceRequestForm" scope="request"></jsp:useBean>
<jsp:useBean id="inf_request"
	class="bzq.shf.forms.ShiftInforceRequestForm" scope="page"></jsp:useBean>
	
	
<%@taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="bzq.shf.forms.ShiftInforceRequestForm,bzq.shf.bean.AgentDayBean,java.util.Vector,bzq.shf.forms.ShiftInforceRequestForm"
%>
<%@page import="org.apache.commons.validator.GenericValidator"%>


<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>shift_inforce.jsp</TITLE>

<SCRIPT>
function openCloseInforce(rowid){
	if(document.getElementById(rowid).style.display=='')
		document.getElementById(rowid).style.display='none';
	else
		document.getElementById(rowid).style.display='';

}
function confirmDelete(id){
	var accept=window.confirm("האם אתה בטוח שברצונך למחוק בקשת תגבור זו ?");
	if(accept)
		navigate("/shf/shift/inforceShift.do?mode=delete&id="+id);
	else return;
}

function searchAgents(rowid){
	if(document.getElementById("searchAgentsRes"+rowid).style.display=='')
		document.getElementById("searchAgentsRes"+rowid).style.display='none';
		
	else {
		document.getElementById("searchAgentsRes"+rowid).style.display='';
		document.getElementById("searchAgntForm"+rowid).submit();
	}
}

function exportExcel(){
	window.open("/shf/shift/exportInforce.do",null);
}
function updateShift(rowid){
    //alert("update");
  	document.forms['searchAgntForm'+rowid].action="/shf/shift/addInforceReqParam.do?mode=update_view";
   	document.forms['searchAgntForm'+rowid].target="";
	document.forms['searchAgntForm'+rowid].submit();
}


</SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<BODY>

<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	
	<TR>
		<TD dir="rtl" valign="top" width="100%">
		<jsp:include page="submenu/shift_submenu.jsp" />
		</TD>
	</TR>
	
	<TR>
		<TD dir=rtl width=100% height="100%" valign="top" style="padding:7px 7px 7px 7px;">
			<FIELDSET style="overflow:auto;height:100%;">
			<LEGEND>
			<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;margin-top:2px;position:absolute;' width=18px>
			&nbsp;&nbsp;&nbsp;&nbsp;
			חיפוש בקשות תגבור משמרות</LEGEND>
			<div style="overflow:auto;height:95%;">
			
			<TABLE width=100% cellpadding="0" cellspacing="0">
			<%
			Vector add_requests=(Vector)request.getAttribute("inforces");
			if(add_requests!=null && add_requests.size()>0){
			int daysSize=0;
			AgentDayBean[] days=null;
			//ShiftInforceRequestForm inf_request=null;
			for(int i=0;i<add_requests.size();i++){
				inf_request=(ShiftInforceRequestForm)add_requests.get(i);
				String moked=inf_request.getMoked();
				days=inf_request.getDays();
				String[] team=inf_request.getTeam();
				String[] innerJob=inf_request.getInnerJob(); 
				daysSize=0;
				inf_request.setNumOfAgents(0);
				if(days!=null) {daysSize=days.length;inf_request.setNumOfAgents(days.length);}%>
				
				<TR>
					<TD valign="top" dir="rtl" style="padding:10px 6px 6px 6px;">
					<TABLE width=100% cellpadding="1" cellspacing="0" style="border:1px #dbeaf5 dotted;">
						<TR>
						<TD align="right" colspan=3 style="background-color:#dbeaf5;color:black;font-weight:bold;"><shf:tables tableName="unitCode" codeName="<%=inf_request.getMoked()%>"></shf:tables></TD>
						<TD align="right"colspan=2 style="background-color:#dbeaf5;color:black;font-weight:bold;"><shf:tables tableName="activityCode" codeName="<%=inf_request.getActivity()%>"></shf:tables></TD>
						<TD colspan=1 style="background-color:#dbeaf5;color:black;font-weight:bold;">תאריך:</TD>
						<TD colspan=2 style="background-color:#dbeaf5;color:black;font-weight:bold;"><shf:shfdate date='<%=inf_request.getDate()%>'/></TD>
						<td colspan=3 style="background-color:#dbeaf5;color:black;font-weight:bold;">
						<%if(inf_request.getTrained()==1){%>לא מסורתי<%}else{%>מסורתי:הכל<%}%></td>
						<td colspan=2 style="background-color:#dbeaf5;color:black;font-weight:bold;">
						<%if(inf_request.getWorkFromHome()==1){%>עובד מהבית<%}else{%>עובד מהבית:הכל<%}%></td> 
						<td colspan=1 style="background-color:#dbeaf5;color:black;font-weight:bold;">
						<%if(inf_request.getCategoryJob()==1){%>נציג/בכיר<%}else{%>נציגים<%}%></td>  
						</TR>
						<tr>
						<td  align="right" colspan=2 style="border-bottom:1px silver dotted;background-color:#dbeaf5;color:#0000cc;font-weight:bold;">
						<select  style="border-bottom:1px silver dotted;background-color:#dbeaf5;color:black;font-weight:bold;width: 200px" name ="teamSelect" >
						    <%if(team.length!=0 && team!=null ){
						    	for(int j=0;j<team.length;j++){
						    	%>
						        <option style="size:20;" value="j"><%=team[j]%> </option>
						      <%}}%>    
						</select>
						</td>
						<td  align="right" colspan=2 style="border-bottom:1px silver dotted;background-color:#dbeaf5;color:#0000cc;font-weight:bold;">
						<select  style="border-bottom:1px silver dotted;background-color:#dbeaf5;color:black;font-weight:bold;width: 200px" name ="jobSelect">
						    <%if(innerJob.length!=0 && innerJob!=null ){
						    	for(int j=0;j<innerJob.length;j++){
						    	%>
						        <option style="size:20; value="j"><%=innerJob[j]%></option>
						    <%}}%>    
						</select>
						</td>
						<td colspan=10 style="border-bottom:1px silver dotted;background-color:#dbeaf5;color:black;font-weight:bold;"></td>
						</tr>
						<TR>
						<TD rowspan=2 style="border-left:1px silver dotted;"><img src="/shf/images/open_down.png" style="cursor:hand;" onclick="openCloseInforce('req<%=inf_request.getId()%>');"></TD>
						<TD class=header>תאריך:</TD><TD width=10px></TD><TD><shf:shfdate date='<%=inf_request.getDate()%>'/></TD><TD width=10px></TD>
						<TD class=header>שעת התחלה:</TD><TD width=10px></TD><TD><shf:shftime date="<%=inf_request.getShiftStart()%>"/></TD><TD width=10px></TD>
						<TD class=header>שעת סיום:</TD><TD width=10px></TD><TD><shf:shftime date="<%=inf_request.getShiftEnd()%>"/></TD>
						</TR>
						<TR>
						<TD class=header>מקומות פנויים:</TD><TD width=10px></TD><TD id="numOfAgents"><%=inf_request.getOriginalNumOfAgents()-daysSize%></TD><TD width=10px></TD>
						<TD class=header>מתוך:</TD><TD width=10px></TD><TD><%=inf_request.getOriginalNumOfAgents()%></TD>
						</TR>
						
						<TR id="req<%=inf_request.getId()%>" style="display:none">
						<TD colspan=15 valign="top" style="border-top:1px silver solid;">
							<table width=100% bgcolor="#f3f3f3" dir=rtl>
								<%
								if(days!=null && days.length>0){
								%>
								<TR><TD colspan=2 style="color:#dbeaf5;font-size:12px;">נציגים שהוסיפו משמרת לפי בקשה זו</TD></TR>
								<%
								for(int j=0;j<days.length;j++){
									AgentDayBean day=days[j];
								%>
								<TR>
								<TD style="color:purple;font-size:13px;"><%=(j+1) +") "+day.getFirstName()+" "+day.getLastName()%></TD><TD align="right" style="color:purple;font-size:13px;"><shf:tables tableName="unitCode" codeName="<%=day.getOrgUnitCode()%>"/></TD>
								</TR>
								<%}}else{%>
								<TR>
								<TD style="color:coral;" colspan=8>אין נציגים שהוסיפו משמרות לבקשה זו</TD>
								</TR>
								<%}%>
								<TR id="searchAgentsRes<%=inf_request.getId()%>" style="display:none;">
									<TD colspan=3>
										<IFRAME name="srchIf<%=inf_request.getId()%>"  style="width:100%;height:200px">
											
										</IFRAME>
									</TD>
								</TR>
								<TR>
								<TD style="padding:2px 2px 2px 2px;font-size:12px;">
								<shf:security activity="shift_inforce_update">
								<%if(inf_request.getOriginalNumOfAgents()-(days==null?0:days.length)>0){%>
								<a style="color:navy;cursor:hand;" onclick="updateShift('<%=inf_request.getId()%>')">עדכון</a>
								<%}%>
								</shf:security>
								<shf:security activity="shift_inforce_addshift">
								<%if(inf_request.getOriginalNumOfAgents()-(days==null?0:days.length)>0){%>
								|
								<a style="color:navy;cursor:hand;" onclick="searchAgents('<%=inf_request.getId()%>');">חפש נציגים</a> 
								<%}%>
								</shf:security>
								<%if(days==null || days.length==0){%>
								<shf:security activity="shift_inforce_update">
								|
								<a style="color:navy;cursor:hand;" onclick="confirmDelete('<%=inf_request.getId()%>');">מחק</a>
								</shf:security>
								<%}%>
								</TD>
								</TR>
							</table>
							<form id="searchAgntForm<%=inf_request.getId()%>" action="/shf/employee/searchForInforce.do" target="srchIf<%=inf_request.getId()%>"> <!-- EmployeeInforceListForm  -->
								<INPUT type="hidden" name="skill" value="<%=inf_request.getSkill()%>">
								<input type=hidden value="<shf:shfdate date="<%=inf_request.getDate()%>"/>" name="date">
								<input type=hidden value="<shf:shftime date="<%=inf_request.getShiftStart()%>"/>" name="shiftStart">
								<input type=hidden value="<shf:shftime date="<%=inf_request.getShiftEnd()%>"/>" name="shiftEnd">
								<input type=hidden value="<%=inf_request.getActivity()%>" name="activity">
								<input type=hidden value="<%=inf_request.getMoked()%>" name="moked">
								<input type=hidden value="<%=inf_request.getId()%>" name="id">
								<input type=hidden value="<%=inf_request.getNumOfAgents()%>" name="numOfAgents">
								<input type=hidden value="<%=inf_request.getCategoryJob()%>" name="categoryJob">
								<input type=hidden value="<%=inf_request.getWorkFromHome()%>" name="workFromHome">
								<input type=hidden value="<%=inf_request.getTrained()%>" name="trained">
								<input type=hidden value="<%=inf_request.getOriginalNumOfAgents()%>" name="originalNumOfAgents">
								<input type=hidden value="<%=inf_request.getBreaksNumber()%>" name="breaksNumber">
								<input type=hidden value="<%=inf_request.getFirstBreakLength()%>" name="firstBreakLength">
								<input type=hidden value="<%=inf_request.getFirstBreakTime()%>"  name="firstBreakTime">
								<input type=hidden value="<%=inf_request.getSecondBreakLength()%>" name="secondBreakLength">
								<input type=hidden value="<%=inf_request.getSecondBreakTime()%>" name="secondBreakTime">
								<input type=hidden value="<%=inf_request.getThirdBreakLength()%>" name="thirdBreakLength">
								<input type=hidden value="<%=inf_request.getThirdBreakTime()%>" name="thirdBreakTime">
								<% if(!GenericValidator.isBlankOrNull(inf_request.getRemark())){%>
								<input type=hidden value="<%=inf_request.getRemark()%>" name="remark">
								<%}%>
								<%for (int k=0; k<inf_request.getTeamNumber().length; k++) { %>
									<input type=hidden value="<%=inf_request.getTeamNumber()[k]%>" name="teamNumber" id=<%=k%>>
									<input type=hidden value="<%=inf_request.getTeamNumber()[k]%>" name="team" id=<%=k%>>
								<%}%>
								<%for (int m=0; m<inf_request.getInnerJobNumber().length; m++) { %>
									<input name="innerJobNumber" type="hidden" value="<%=inf_request.getInnerJobNumber()[m]%>" id=<%=m%>>
									<input name="innerJob" type="hidden" value="<%=inf_request.getInnerJobNumber()[m]%>" id=<%=m%>>
								<%}%>
															
							</form>
						</TD>
						</TR>
					</TABLE>
					<br>
					</TD>
				</TR>
			<%}}else{%>
			<TR>
			<TD ><div class=gridNoData>לא נמצאו נתונים</div></TD>
			</TR>
			<%}%>
			
			
		</TABLE>
		</div>
		</FIELDSET>
		
		</TD>
	</TR>
</TABLE>
</BODY>
</HTML>
