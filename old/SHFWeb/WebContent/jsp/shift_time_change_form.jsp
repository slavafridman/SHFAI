<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="shiftChangeForm"
	class="bzq.shf.forms.ShiftChangeRequestForm" scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>shift_time_change_form.jsp</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/time_change_requests.js"></SCRIPT>


<SCRIPT>
function submitDeleteForm(approved){
	if(approved){
		window.alert("לא ניתן למחוק בקשה שאושר עבורה משמרת אחת לפחות");
		return false;
	}else{
		document.shiftTimeChangeForm.submit();
	}
}
function submitInsertForm(){
	if(!(document.shiftTimeChangeForm.agentsNum.value>0)){
		alert("השדה כמות נציגים חייב להיות מספר גדול מאפס");
		document.shiftTimeChangeForm.agentsNum.focus();
		return false;
	}
	if(validateTimeChangeForm()){
		document.shiftTimeChangeForm.submit();
	}
}
function submitChangeForm(approved){
	
	if(approved){
		if(!(document.shiftTimeChangeForm.agentsNum.value>=0 )){
			alert("השדה כמות נציגים חייב להיות מספר גדול או שווה לאפס");
			document.shiftTimeChangeForm.agentsNum.focus();
			return false;
		}
		document.shiftTimeChangeForm.submit();
	}else{
		if(validateTimeChangeForm()){
			document.shiftTimeChangeForm.submit();
		}	
	}
}

function shiftStartOptionChanged(e){
	if(e.checked){
		document.getElementById("startFromTD").innerHTML="<shf:timechooser inputname='startFrom' name='shiftChangeForm' property='startFrom' />";
		document.getElementById("startToTD").innerHTML="<shf:timechooser inputname='startTo' name='shiftChangeForm' property='startFrom' />";
	}else{
		document.getElementById("startFromTD").innerHTML="<shf:timechooser inputname='startFrom' name='shiftChangeForm' property='startTo' disabled='true'/>";
		document.getElementById("startToTD").innerHTML="<shf:timechooser inputname='startTo' name='shiftChangeForm' property='startTo' disabled='true'/>";
	}
}

function shiftEndOptionChanged(e){
	if(e.checked){
		document.getElementById("endFromTD").innerHTML="<shf:timechooser inputname='endFrom' name='shiftChangeForm' property='endFrom' />";
		document.getElementById("endToTD").innerHTML="<shf:timechooser inputname='endTo' name='shiftChangeForm' property='endFrom' />";
	}else{
		document.getElementById("endFromTD").innerHTML="<shf:timechooser inputname='endFrom' name='shiftChangeForm' property='endTo' disabled='true'/>";
		document.getElementById("endToTD").innerHTML="<shf:timechooser inputname='endTo' name='shiftChangeForm' property='endTo' disabled='true'/>";
	}
}


function shiftLengthOptionChanged(e){
	if(e.checked)
		document.getElementById("shiftLengthTD").innerHTML='<input maxlength="4" name="shiftLength" type=text style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="shiftLength"/>">'
	else
		document.getElementById("shiftLengthTD").innerHTML='<input maxlength="4" name="shiftLength" type=text style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="shiftLength"/>" disabled>'	
}


function shiftStartSelected(e){
	if(e.checked){
		document.getElementById("startRadio1").innerHTML='<input type="radio" name=changeStartOption value="newStartTime" >';
		document.getElementById("startRadio2").innerHTML='<input type="radio" name=changeStartOption value="newExtraMinutesAtStart" >';
		document.getElementById("startRadio3").innerHTML='<input type="radio" name=changeStartOption value="newLessMinutesAtStart" >';
		document.getElementById("newStartTimeTD").innerHTML="<shf:timechooser inputname='newStartTime' name='shiftChangeForm' property='newStartTime' />";
		document.getElementById("extraAtStartTD").innerHTML='<input type=text name="newExtraMinutesAtStart" maxlength="4" style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newExtraMinutesAtStart"/>">';
		document.getElementById("lessAtStartTD").innerHTML='<input type=text name="newLessMinutesAtStart" maxlength="4" style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newLessMinutesAtStart"/>">';
	}else{
		document.getElementById("startRadio1").innerHTML='<input type="radio" disabled >';
		document.getElementById("startRadio2").innerHTML='<input type="radio" disabled >';
		document.getElementById("startRadio3").innerHTML='<input type="radio" disabled >';
		document.getElementById("newStartTimeTD").innerHTML="<shf:timechooser inputname='newStartTime' name='shiftChangeForm' property='newStartTime' disabled='true' />";
		document.getElementById("extraAtStartTD").innerHTML='<input type=text  disabled style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newExtraMinutesAtStart"/>">';
		document.getElementById("lessAtStartTD").innerHTML='<input type=text  disabled style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newLessMinutesAtStart"/>">';
	}
}


function shiftEndSelected(e){
	if(e.checked){
		document.getElementById("endRadio1").innerHTML='<input type="radio" name=changeEndOption value="newEndTime" >';
		document.getElementById("endRadio2").innerHTML='<input type="radio" name=changeEndOption value="newExtraMinutesAtEnd" >';
		document.getElementById("endRadio3").innerHTML='<input type="radio" name=changeEndOption value="newLessMinutesAtEnd" >';
		document.getElementById("newEndTimeTD").innerHTML="<shf:timechooser inputname='newEndTime' name='shiftChangeForm' property='newEndTime' />";
		document.getElementById("extraAtEndTD").innerHTML='<input type=text name="newExtraMinutesAtEnd" maxlength="4" style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newExtraMinutesAtEnd"/>">';
		document.getElementById("lessAtEndTD").innerHTML='<input type=text name="newLessMinutesAtEnd" maxlength="4" style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newLessMinutesAtEnd"/>">';
	}else{
		document.getElementById("endRadio1").innerHTML='<input type="radio" disabled >';
		document.getElementById("endRadio2").innerHTML='<input type="radio" disabled >';
		document.getElementById("endRadio3").innerHTML='<input type="radio" disabled >';
		document.getElementById("newEndTimeTD").innerHTML="<shf:timechooser inputname='newEndTime' name='shiftChangeForm' property='newEndTime' disabled='true' />";
		document.getElementById("extraAtEndTD").innerHTML='<input type=text  disabled style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newExtraMinutesAtEnd"/>">';
		document.getElementById("lessAtEndTD").innerHTML='<input type=text  disabled style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newLessMinutesAtEnd"/>">';
	}
}

function validateTimeChangeForm(){
	
	
	
	if(!(document.shiftTimeChangeForm.moked.value>0)){
		alert("נא לבחור מוקד");
		document.shiftTimeChangeForm.moked.focus();
		return false;
	}
	
	if(!(document.shiftTimeChangeForm.activity.value>0)){
		alert("נא לבחור תור");
		document.shiftTimeChangeForm.activity.focus();
		return false;
	}
	
	if(document.shiftTimeChangeForm.autoApprove.checked){
		document.shiftTimeChangeForm.autoApprove.value=1;
	}else document.shiftTimeChangeForm.autoApprove.value=0;
	
	
	if(document.shiftTimeChangeForm.shiftStartOption.checked){
		document.shiftTimeChangeForm.shiftStartOption.value=1;
	}else document.shiftTimeChangeForm.shiftStartOption.value=0;
	if(document.shiftTimeChangeForm.shiftEndOption.checked){
		document.shiftTimeChangeForm.shiftEndOption.value=1;
	}else document.shiftTimeChangeForm.shiftEndOption.value=0;
	if(document.shiftTimeChangeForm.shiftLengthOption.checked){
		document.shiftTimeChangeForm.shiftLengthOption.value=1;
	}else document.shiftTimeChangeForm.shiftLengthOption.value=0;
	
	if( !document.shiftTimeChangeForm.shiftStartOption.checked &&
		!document.shiftTimeChangeForm.shiftEndOption.checked &&
		!document.shiftTimeChangeForm.shiftLengthOption.checked){
		alert("חובה לבחור אופציה אחת לפחחות מבין: התחלת משמרת,סיום משמרת,משך משמרת");
		return false;
	}
	
	/////////////////////////
	
	if(document.shiftTimeChangeForm.shiftLengthOption.checked){
		if(!(document.shiftTimeChangeForm.shiftLength.value>0)){
			alert("השדה משך משמרת חייב להיות מספר גדול מאפס");
			document.shiftTimeChangeForm.shiftLength.focus();
			return false;
		}
	}
	/////////////////////////
	
	
	var startFrom=document.shiftTimeChangeForm.startFrom.value;
	var startTo=document.shiftTimeChangeForm.startTo.value;
	var endFrom=document.shiftTimeChangeForm.endFrom.value;
	var endTo=document.shiftTimeChangeForm.endTo.value;
	var newEnd=document.shiftTimeChangeForm.newEndTime.value;
	var newStart=document.shiftTimeChangeForm.newStartTime.value;
	
	if(!isValidTime(startFrom)){
		alert("שעה לא תקינה בהתחלת משמרת");
		return false;
	}
	if(!isValidTime(startTo)){
		alert("שעה לא תקינה בהתחלת משמרת");
		return false;
	}
	if(!isValidTime(endFrom)){
		alert("שעה לא תקינה בסיום משמרת");
		return false;
	}
	if(!isValidTime(endTo)){
		alert("שעה לא תקינה בסיום משמרת");
		return false;
	}
	
	/////////////////////////
	
	if(document.shiftTimeChangeForm.changeStartSelected.checked){
		document.shiftTimeChangeForm.changeStartSelected.value=1;
	}else document.shiftTimeChangeForm.changeStartSelected.value=0;
	if(document.shiftTimeChangeForm.changeEndSelected.checked){
		document.shiftTimeChangeForm.changeEndSelected.value=1;
	}else document.shiftTimeChangeForm.changeEndSelected.value=0;
	
	
	if( !document.shiftTimeChangeForm.changeStartSelected.checked &&
		!document.shiftTimeChangeForm.changeEndSelected.checked ){
		alert("חובה לבחור אופציה אחת לפחחות מבין: שינוי התחלת משמרת,שינוי סיום משמרת");
		return false;
	}
	
	//////////////////////////
	
	if(document.shiftTimeChangeForm.changeStartSelected.checked){
		var changeStartOption=getSelectedRadioValue(document.getElementsByName("changeStartOption"));
		
		
		if(changeStartOption==''){
			alert("חובה לבחור אופציה אחת לפחות בשינוי תחילת משמרת");
			return false;
		}
		if(changeStartOption=="newStartTime"){
			if(!isValidTime(newStart)){
				alert("שעה לא תקינה בשינוי תחילת משמרת");
				return false;
			}
			document.shiftTimeChangeForm.newExtraMinutesAtStart.value=0;
			document.shiftTimeChangeForm.newLessMinutesAtStart.value=0;
		}
		if(changeStartOption=="newExtraMinutesAtStart"){
			if(!(document.shiftTimeChangeForm.newExtraMinutesAtStart.value>0)){
				alert("השדה הוספת דקות בתחילת משמרת חייב להיות מספר גדול מאפס");
				document.shiftTimeChangeForm.newExtraMinutesAtStart.focus();
				return false;
			}
			document.shiftTimeChangeForm.newLessMinutesAtStart.value=0;
		}
		if(changeStartOption=="newLessMinutesAtStart"){
			if(!(document.shiftTimeChangeForm.newLessMinutesAtStart.value>0)){
				alert("השדה קיצור דקות בתחילת משמרת חייב להיות מספר גדול מאפס");
				document.shiftTimeChangeForm.newLessMinutesAtStart.focus();
				return false;
			}
			document.shiftTimeChangeForm.newExtraMinutesAtStart.value=0;
		}
	}
	
	if(document.shiftTimeChangeForm.changeEndSelected.checked){
		var changeEndOption=getSelectedRadioValue(document.getElementsByName("changeEndOption"));
		
		if(changeEndOption==''){
			alert("חובה לבחור אופציה אחת לפחות בשינוי סיום משמרת");
			return false;
		}
		
		if(changeEndOption=="newEndTime"){
			if(!isValidTime(newEnd)){
				alert("שעה לא תקינה בשינוי סיום משמרת");
				return false;
			}
			document.shiftTimeChangeForm.newExtraMinutesAtEnd.value=0;
			document.shiftTimeChangeForm.newLessMinutesAtEnd.value=0;
		}
		if(changeEndOption=="newExtraMinutesAtEnd"){
			if(!(document.shiftTimeChangeForm.newExtraMinutesAtEnd.value>0)){
				alert("השדה הוספת דקות בסיום משמרת חייב להיות מספר גדול מאפס");
				document.shiftTimeChangeForm.newExtraMinutesAtEnd.focus();
				return false;
			}
			document.shiftTimeChangeForm.newLessMinutesAtEnd.value=0;
		}
		if(changeEndOption=="newLessMinutesAtEnd"){
			if(!(document.shiftTimeChangeForm.newLessMinutesAtEnd.value>0)){
				alert("השדה קיצור דקות בסיום משמרת חייב להיות מספר גדול מאפס");
				document.shiftTimeChangeForm.newLessMinutesAtEnd.focus();
				return false;
			}
			document.shiftTimeChangeForm.newExtraMinutesAtEnd.value=0;
		}
	}
	return true;
	
}
</SCRIPT>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%
String moked=shiftChangeForm.getMoked();
if(!("update".equals(shiftChangeForm.getMode())||"delete".equals(shiftChangeForm.getMode())))
	shiftChangeForm.setAprovedNum(0);
int aprovedNum=shiftChangeForm.getAprovedNum();
%>

<BODY dir=ltr>
<FORM name="shiftTimeChangeForm" method="post" action="/shf/shift/addUpdateShiftTimeChange.do">
<TABLE width=100% height=100% cellpadding="0" cellspacing="0">
	<TR>
		<TD dir=rtl valign="top" style="height: 20px"><jsp:include
			page="submenu/shift_submenu.jsp"></jsp:include></TD>
	</TR>


	<TR>
		<TD valign=top
			style="padding-top: 10px; padding-bottom: 5px; padding-right: 6px; padding-left: 6px">
		
		<FIELDSET class=form><legend>שינוי משמרות המוני</legend>
		
		<TABLE cellpadding="3" cellspacing="3" style="margin-bottom:10px;margin-top:10px;">
			<TR>
				<TD class=header>תאריך:</TD>
				<TD><shf:calendar disabled="<%=aprovedNum>0%>" calname="date" name="shiftChangeForm" property="date"/></TD>
				<TD width=20px></TD>
				
				<TD class=header>מוקד:</TD>
				<TD>
				<%if(!(aprovedNum>0)){%>
				<shf:unitselect tablename="unitCode" name="moked"
					selectedName="shiftChangeForm" selectedProperty="moked"
					style="width:170px;font-size:10px;" type="G01"
					logic="onchange='setActivities(this,0);'" emptySelection="yes"  />
				<%}else{%>
				<input type="text" name="mtmp" style="width:180px;font-size:10px;color:gray" readonly  value="<shf:tables tableName="unitCode" codeName="<%=shiftChangeForm.getMoked()%>" />" >
				<input type="hidden" name="moked" value="<%=shiftChangeForm.getMoked()%>" >
				<%}%>
				</TD>

				
			</TR>
			<TR>
				<TD class=header>כמות נציגים:</TD>
				<TD><input type=text style="width:40px;height:18px;font-size:11px;" maxlength="3" name="agentsNum" value="<bzq:integer name="shiftChangeForm" property="agentsNum"></bzq:integer>"></TD>
				<TD width=20px></TD>
				<TD class=header>תור:</TD>

				<TD id="activityAjaxResult">
				<%if(moked==null||moked.equals("-1")){%>
				<shf:activityselect tablename="activityCode" name="activity"
					selectedName="shiftChangeForm" selectedProperty="activity"
					logic=" disabled " style="width:160px;font-size:10px;" /> <%}else if(aprovedNum==0){%>
				<shf:activityselect tablename="activityCode" name="activity"
					selectedName="shiftChangeForm" selectedProperty="activity"
					moked="<%=moked%>" style="width:160px;font-size:10px;" /> <%}else{%>
				
				<input type="text" name="atmp" style="width:180px;font-size:10px;color:gray" readonly  value="<shf:tables tableName="activityCode" codeName="<%=bzq.shf.utils.SHFTableUtils.getActivityCodeWithoutColon(shiftChangeForm.getActivity())%>" />" >
				<input type="hidden" name="activity"  value="<%=bzq.shf.utils.SHFTableUtils.getActivityCodeWithoutColon(shiftChangeForm.getActivity())%>" >
				
				<%}%>
				</TD>
					
			</TR>
			
			<TR>
				<TD colspan=8 style="padding-top:15px;">
					<TABLE>
						<TR>
							<TD><shf:checkbox inputname="autoApprove" name="shiftChangeForm" property="autoApprove" /></TD>
							<TD class=header>אישור אוטומטי</TD>
						</TR>
						<TR>
							<TD><logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><shf:checkbox
							inputname="shiftStartOption" name="shiftChangeForm"
							property="shiftStartOption"
							logic="onclick='shiftStartOptionChanged(this); '" /></logic:equal> </TD>
							<TD class=header>התחלת משמרת</TD>
							<TD class=header>מ:</TD>
							<TD id="startFromTD"><shf:timechooser inputname="startFrom" name="shiftChangeForm" property="startFrom" disabled="<%=shiftChangeForm.getShiftStartOption()!=1 || aprovedNum>0%>"/> </TD>
							<TD width=10px></TD>
							<TD class=header>עד:</TD>
							<TD id="startToTD"><shf:timechooser inputname="startTo" name="shiftChangeForm" property="startTo" disabled="<%=shiftChangeForm.getShiftStartOption()!=1 || aprovedNum>0%>"/> </TD>
						</TR>
						<TR>
							<TD><logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><shf:checkbox inputname="shiftEndOption" name="shiftChangeForm" property="shiftEndOption" logic="onclick='shiftEndOptionChanged(this); '"/></logic:equal></TD>
							<TD class=header>סיום משמרת</TD>
							<TD class=header>מ:</TD>
							<TD id="endFromTD"><shf:timechooser inputname="endFrom" name="shiftChangeForm" property="endFrom" disabled="<%=shiftChangeForm.getShiftEndOption()!=1 || aprovedNum>0%>"/> </TD>
							<TD width=10px></TD>
							<TD class=header>עד:</TD>
							<TD id="endToTD"><shf:timechooser inputname="endTo" name="shiftChangeForm" property="endTo" disabled="<%=shiftChangeForm.getShiftEndOption()!=1 || aprovedNum>0%>" /> </TD>
						</TR>
						<TR>
							<TD><logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><shf:checkbox inputname="shiftLengthOption" name="shiftChangeForm" property="shiftLengthOption" logic="onclick='shiftLengthOptionChanged(this);'" /></logic:equal></TD>
							<TD class=header>משך משמרת:</TD>
							<TD class=header></TD>
							<TD class=header colspan=5 id="shiftLengthTD"><input name="shiftLength" maxlength="4" <%=shiftChangeForm.getShiftLengthOption()==1?"":"disabled"%> type=text style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="shiftLength" pattern="#" />"> (דקות)</TD>
						</TR>
						
					</TABLE>
				</TD> 
			</TR>
			
			
		</TABLE>
		</FIELDSET>
		</TD>
	</TR>

	<TR>
		<TD width="100%" valign="top" dir=rtl>
		<TABLE width="100%" cellpadding="2" cellspacing="2" >
			<TR>
				<TD width=50% valign="top">
				<FIELDSET class=info><legend>
				<logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><shf:checkbox inputname="changeStartSelected" name="shiftChangeForm" property="changeStartSelected" logic="onclick='shiftStartSelected(this);'" /></logic:equal>
				 שינוי התחלת משמרת </legend>
				<TABLE cellpadding="3" cellspacing="3">
					<TR>
						<TD id="startRadio1"><logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><input type="radio" name=changeStartOption value="newStartTime" <%=shiftChangeForm.getChangeStartSelected()==1?"":"disabled"%> <%="newStartTime".equals(shiftChangeForm.getChangeStartOption())?"checked":""%> ></logic:equal></TD>
						<TD class=header>שעה:</TD>
						<TD id="newStartTimeTD"><shf:timechooser inputname="newStartTime" name="shiftChangeForm" property="newStartTime" disabled="<%=shiftChangeForm.getChangeStartSelected()!=1 || aprovedNum>0%>" /></TD>
					</TR>
					<TR>
						<TD id="startRadio2"><logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><input type="radio" name=changeStartOption value="newExtraMinutesAtStart" <%=shiftChangeForm.getChangeStartSelected()==1?"":"disabled"%> <%="newExtraMinutesAtStart".equals(shiftChangeForm.getChangeStartOption())?"checked":""%> ></logic:equal></TD>
						<TD class=header>הוספה (דקות)</TD>
						<TD id="extraAtStartTD"><input type=text <%=aprovedNum>0||shiftChangeForm.getChangeStartSelected()!=1?"readonly style=color:gray;":""%> name="newExtraMinutesAtStart" maxlength="4" style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newExtraMinutesAtStart" pattern="#" />"></TD>
					</TR>
					<TR>
						<TD id="startRadio3"><logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><input type="radio" name=changeStartOption value="newLessMinutesAtStart" <%=shiftChangeForm.getChangeStartSelected()==1?"":"disabled"%> <%="newLessMinutesAtStart".equals(shiftChangeForm.getChangeStartOption())?"checked":""%> ></logic:equal></TD>
						<TD class=header>קיצור (דקות)</TD>
						<TD id="lessAtStartTD"><input type=text <%=aprovedNum>0||shiftChangeForm.getChangeStartSelected()!=1?"readonly style=color:gray;":""%> name="newLessMinutesAtStart" maxlength="4" style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newLessMinutesAtStart" pattern="#" />"></TD>
					</TR>
				</TABLE>
				</FIELDSET>
				</TD>
				<TD width=50% valign="top">
				<FIELDSET class=info><legend>
				<logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><shf:checkbox inputname="changeEndSelected" name="shiftChangeForm" property="changeEndSelected" logic="onclick='shiftEndSelected(this);'"  /></logic:equal>
				 שינוי סיום משמרת</legend> 
				<TABLE cellpadding="3" cellspacing="3">
					<TR>
						<TD id="endRadio1"><logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><input type="radio" name=changeEndOption value="newEndTime" <%=shiftChangeForm.getChangeEndSelected()==1?"":"disabled"%> <%="newEndTime".equals(shiftChangeForm.getChangeEndOption())?"checked":""%> ></logic:equal></TD>
						<TD class=header>שעה:</TD>
						<TD id="newEndTimeTD"><shf:timechooser inputname="newEndTime" name="shiftChangeForm" property="newEndTime" disabled="<%=shiftChangeForm.getChangeEndSelected()!=1 || aprovedNum>0%>"/></TD>
					</TR>
					<TR>
						<TD id="endRadio2"><logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><input type="radio"  name=changeEndOption value="newExtraMinutesAtEnd" <%=shiftChangeForm.getChangeEndSelected()==1?"":"disabled"%> <%="newExtraMinutesAtEnd".equals(shiftChangeForm.getChangeEndOption())?"checked":""%> ></logic:equal></TD>
						<TD class=header>הוספה (דקות):</TD>
						<TD id="extraAtEndTD"><input type=text <%=aprovedNum>0||shiftChangeForm.getChangeEndSelected()!=1?"readonly style=color:gray;":""%> name="newExtraMinutesAtEnd" maxlength="4" style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newExtraMinutesAtEnd" pattern="#" />"></TD>
					</TR>
					<TR>
						<TD id="endRadio3"><logic:equal  name="shiftChangeForm" property="aprovedNum" value="0"  ><input type="radio"  name=changeEndOption value="newLessMinutesAtEnd" <%=shiftChangeForm.getChangeEndSelected()==1?"":"disabled"%> <%="newLessMinutesAtEnd".equals(shiftChangeForm.getChangeEndOption())?"checked":""%> ></logic:equal></TD>
						<TD class=header>קיצור (דקות):</TD>
						<TD id="lessAtEndTD"><input type=text <%=aprovedNum>0||shiftChangeForm.getChangeEndSelected()!=1?"readonly style=color:gray;":""%> name="newLessMinutesAtEnd" maxlength="4"  style="width:40px;height:18px;font-size:11px;" value="<bzq:integer name="shiftChangeForm" property="newLessMinutesAtEnd" pattern="#" />"></TD>
					</TR>
				</TABLE>
				
				</FIELDSET>
				
				</TD>
			</TR>
		</TABLE>
		</TD>
	</TR>
	<TR>
		<TD height="100%" valign="top" dir=rtl style="padding-right:6px;">
		<%if("insert".equals(shiftChangeForm.getMode())){%>
			<button class="button" onclick="submitInsertForm(<%=aprovedNum>0%>);">הוסף</button>&nbsp;
		<%}else if("update".equals(shiftChangeForm.getMode())){%>
			<button class="button" onclick="submitChangeForm(<%=aprovedNum>0%>);">עדכן</button>&nbsp;
		<%}else if("delete".equals(shiftChangeForm.getMode())){%>
			<button class="button" onclick="submitDeleteForm(<%=aprovedNum>0%>);">מחק</button>&nbsp;
		<%}%>
		<button class="button" onclick="history.go(-1);">חזרה</button>&nbsp;
		
		
		</TD>
	</TR>
</TABLE>
<input type="hidden" name="mode" value="<%=shiftChangeForm.getMode()%>">
<input type="hidden" name="requestId" value="<%=shiftChangeForm.getRequestId()%>">
<input type="hidden" name="aprovedNum" value="<%=shiftChangeForm.getAprovedNum()%>">
</FORM>
</BODY>
</HTML>
