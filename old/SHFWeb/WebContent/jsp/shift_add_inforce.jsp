<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="shiftInforce"
	class="bzq.shf.forms.ShiftInforceRequestForm" 
	scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
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
<TITLE>shift_add_inforce.jsp</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/breakjs.js"></script>
<SCRIPT>
function submitAddInforce(){
	var num=document.addInforceForm.originalNumOfAgents.value;
	if(num>0)
		submitUpdateInforce();
	else{
		alert("כמות נציגים חייב להיות גדול מאפס");
		return;
	}
}

function showInforceOptionals(){
	
	if(!isValidTime(document.forms['addInforceForm'].shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.forms['addInforceForm'].shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if (validateAddInforceForm(document.all.addInforceForm)) {   
		document.forms['addInforceForm'].action="/shf/employee/searchForInforce.do";
		document.forms['addInforceForm'].target="inforceOptionsFrame";
        document.forms['addInforceForm'].submit();     
	}
}

function submitUpdateInforce(){
	if(!isValidTime(document.addInforceForm.shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.addInforceForm.shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(document.addInforceForm.activity.value=='00' || document.addInforceForm.activity.value==''){
		alert("צריך לבחור תור");
		return;
	}
	
	submitAddInforceForm();
}

function submitAddInforceForm(){
	if(!isValidTime(document.addInforceForm.shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.addInforceForm.shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if (validateAddInforceForm(document.all.addInforceForm)) {   
		document.forms['addInforceForm'].action="/shf/shift/inforceShift.do";
		document.forms['addInforceForm'].target="";
        document.addInforceForm.submit();     
	}
}
function change(checkItem)	{
	if(checkItem.value=='0')
		checkItem.value='1'
	else	
		checkItem.value='0'
}
</SCRIPT>
<bzqjs:validator>
 <bzqjs:form name="addInforceForm" />
</bzqjs:validator>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%
String hour1=null;
String hour2=null;
String hour3=null;

if(shiftInforce.getBreaksNumber()>0 && shiftInforce.getFirstBreakTime()!=null ) hour1=shiftInforce.getFirstBreakTime();
if(shiftInforce.getBreaksNumber()>1 && shiftInforce.getSecondBreakTime()!=null ) hour2=shiftInforce.getSecondBreakTime();
if(shiftInforce.getBreaksNumber()>2 && shiftInforce.getThirdBreakTime()!=null ) hour3=shiftInforce.getThirdBreakTime();

String moked=null;
if(shiftInforce!=null)
	moked=shiftInforce.getMoked();
%>
<BODY>
<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TR>
		<TD dir="rtl" valign="top" width="100%"><jsp:include
			page="submenu/shift_submenu.jsp" /></TD>
	</TR>

	<TR>
		<TD width="100%" valign="top" style="padding: 6px 6px 6px 6px;">
		<FIELDSET class="info">
		<%if(shiftInforce!=null && shiftInforce.getId()>0){%>
		<LEGEND>עדכון משמרת למאגר תגבור</LEGEND>
		<%}else{%>
		<LEGEND>הוספת משמרת למאגר תגבור</LEGEND>
		<%}%>
		<form action="/shf/shift/inforceShift.do" name="addInforceForm" method="post">
			<%if(shiftInforce!=null && shiftInforce.getId()>0){%>
			<input name="mode" type="hidden" value="update">
			<input name="id" type="hidden" value="<bzq:integer name="shiftInforce" property="id"></bzq:integer>">
			<input name="addedShiftsNum" type="hidden" value="<bzq:integer name="shiftInforce" property="addedShiftsNum"></bzq:integer>">
			<%}else{%>
			<input name="mode" type="hidden" value="add">
			<%}%>
			<!--input name="originalNumOfAgents" type="hidden"-->
			<TABLE cellspacing="5">
			<TR>
				<TD class="header">תאריך:</TD>
				<TD>
				<shf:calendar calname="date" name="shiftInforce" property="date" />
				
				</TD>
				<TD class="header">מוקד:</TD>
				
				<TD class="data">
					<shf:unitselect tablename="unitCode" name="moked"
					selectedName="shiftInforce" selectedProperty="moked"
					style="width:170px;font-size:10px;"
					type="G01" all="yes" 
					logic="onchange=setMultiTeams(this,'shiftInforce','team','200');setActivities(this,'shiftInforce','activity');" />
				</TD>
				<TD class="header">צוות:</TD>
				<TD class="data" id="teamsAjaxResult" width="22">
					<shf:orgunitCheckList parentUnit="<%=moked%>" name="shiftInforce" type="J01" property="team" optionsLength="200" length="160"></shf:orgunitCheckList> 
				</TD>
				<TD class="header">תפקיד בפועל:</TD>
				<TD class="data" valign="middle">
					<shf:innerJobCheckList name="shiftInforce" tablename="innerJobCode" property="innerJob" />
				</TD>
				<TD width="5px"></TD>
			</TR>
			<TR>
				
				<TD class="header" >לא מסורתי:</TD>
				<td><INPUT type="checkbox" value="0"
							name="trained" size="10" onchange="javascript:change(this);" /></td>
				
				<TD  class="header" >עובד מהבית:</TD>
				<td><INPUT type="checkbox" value="0"
							name="workFromHome" size="10" onchange="javascript:change(this);" /></td>
				<TD  class="header">כולל בכירים/מומחים:</TD>
				<td><INPUT type="checkbox" value="0"
							name="categoryJob" size="10" onchange="javascript:change(this);" /></td>
				<td class=header valign="top">הערה:</td>
				<td><html:textarea property="remark" name="shiftInforce" cols="30" rows="4" ></html:textarea> </td>
			</TR>	
			<TR>
				<TD class="header">משעה:</TD>
				<TD><shf:timechooser inputvalue='<%=bzq.utils.BaseConvert.dateToString(shiftInforce.getShiftStart(),"HH:mm")%>' inputname="shiftStart" /></TD>
				<TD class="header">עד שעה:</TD>
				<TD><shf:timechooser inputvalue='<%=bzq.utils.BaseConvert.dateToString(shiftInforce.getShiftEnd(),"HH:mm")%>' inputname="shiftEnd" /></TD>
				
				<TD class="header">תור:</TD>
				<TD id="activityAjaxResult">
					
					<%if(moked==null||moked.equals("-1")){%>
					<shf:activityselect tablename="activityCode" name="activity" 
					selectedName="shiftInforce" selectedProperty="activity"  
					logic=" disabled " style="width:170px;font-size:10px;"/>
					 <%}else{%>
					<shf:activityselect tablename="activityCode" name="activity" 
					selectedName="shiftInforce" selectedProperty="activity"  
					moked="<%=moked%>" style="width:170px;font-size:10px;"/>
					 <%}%>
				</TD>
			</TR>
			<tr>
				<TD class="header">כמות נציגים:</TD>
				<TD width="10px"></TD>
				<TD><input type="text" maxlength="2" name="originalNumOfAgents"
					style="width:30px;height:18px;font-size:10px;" 
					value="<bzq:integer name="shiftInforce" property="originalNumOfAgents"/>">
				</TD>
				<TD width="20px"></TD>
			</TR>		
			
			<TR>
				
				<TD class="header">מספר ההפסקות:</TD>
				<TD width="10px"></TD>
				<TD>
					<select style="height:18px;font-size:10px;" name="breaksNumber" onchange="changeBreaksNumber(addInforceForm);">
					<option value="0" <%if(shiftInforce.getBreaksNumber()==0){%> selected="selected" <%}%> >ללא</option>
					<option value="1" <%if(shiftInforce.getBreaksNumber()==1){%> selected="selected" <%}%> >1</option>
					<option value="2" <%if(shiftInforce.getBreaksNumber()==2){%> selected="selected" <%}%> >2</option>
					<option value="3" <%if(shiftInforce.getBreaksNumber()==3){%> selected="selected" <%}%> >3</option>
					</select>
				</TD>
			</TR>
			<!--   ======  הפסקות ======   -->
			<TR>
				<TD colspan="10" style="padding-top:20px;">
					<TABLE dir="rtl">
					<TR id="break1" <%if(shiftInforce.getBreaksNumber()<1){%>style="display=none;" <%}%>><TD class="header">הפסקה ראשונה:</TD><TD><shf:timechooser inputname="firstBreakTime" inputvalue="<%=hour1%>" /></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="firstBreakLength" value="<bzq:integer name="shiftInforce" property="firstBreakLength"/>"></TD></TR>
					<TR id="break2" <%if(shiftInforce.getBreaksNumber()<2){%>style="display=none;" <%}%>><TD class="header">הפסקה שנייה:</TD><TD><shf:timechooser inputname="secondBreakTime" inputvalue="<%=hour2%>"/></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="secondBreakLength" value="<bzq:integer name="shiftInforce" property="secondBreakLength"/>"></TD></TR>
					<TR id="break3" <%if(shiftInforce.getBreaksNumber()<3){%>style="display=none;" <%}%>><TD class="header">הפסקה שלישית:</TD><TD><shf:timechooser inputname="thirdBreakTime" inputvalue="<%=hour3%>"/></TD><TD width="10px"></TD><TD class="header">אורך הפסקה:</TD><TD><input type="text" maxlength="2" style="width:30px;height:18px;font-size:10px;" name="thirdBreakLength" value="<bzq:integer name="shiftInforce" property="thirdBreakLength"/>"></TD></TR>
					</TABLE>
				</TD>
			</TR>
			<!--   ======  כפתורים ======   -->
			<TR>
				<!--  TD><button onclick="showInforceOptionals();">חפש נציגים</button></TD-->
				<TD colspan="11" align="center">
				<%if(shiftInforce!=null && shiftInforce.getId()>0){%>
				<button onclick="submitUpdateInforce();">עדכן</button>&nbsp;
				<%}else{%>
				<button onclick="submitAddInforce();">אישור</button>&nbsp;
				
				<button onclick="history.go(-1);">חזור</button>
				<%}%>
				</TD>
			</TR>
			</TABLE>
		</form>
		</FIELDSET>
		</TD>
	</TR>
	
	<TR>
		<TD height="100%" width="100%" valign="top" style="padding: 6px 6px 6px 6px;">
			<table height="100%" width="100%" cellpadding="0" cellspacing="0">
				<TR>
					<TD valign="top" height="100%" width="100%" >
						<iframe id="inforceOptionsFrame" frameborder="0" width="100%" height="100%" scrolling="auto" name="inforceOptionsFrame"></iframe>
					</TD>
				</TR>
			</table>
		</TD>
	</TR>
	
</TABLE>
</BODY>
</HTML>
