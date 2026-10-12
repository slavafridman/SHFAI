<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="reduceRequestForm"
	class="bzq.shf.forms.ShiftReduceRequestForm" 
	scope="request"></jsp:useBean>

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>
<HTML xmlns="http://www.w3.org/1999/xhtml" xmlns:shf>
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
<TITLE>reduce_add_reduce</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/breakjs.js"></script>
<SCRIPT>

function submitUpdateReduce(approved, sum_approved, cbName){

	if (document.addReduceForm.numberOfAgets.value < sum_approved) {
		alert("כמות נציגים חייב להיות גדול או שווה ל-" + sum_approved);
		return;
		}
	if(!isValidTime(document.addReduceForm.shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.addReduceForm.shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	
	if ( (document.addReduceForm.numberOfAgets.value - sum_approved) == 0) {
			var accept=window.confirm("האם ברצונך לדחות את כל הבקשות שלא אושרו ?");
			var mode=null;
			if(accept) 
				{
					if (approved) {mode="update_agent_decline" } else { mode="update_decline" }
				} 
			else
				{
					if (approved) {mode="update_agent"; } else {mode="update";}
				}	
		} 
		else {
		  if (approved) {mode="update_agent"; } else {mode="update";}
		}
		
		var selectedCb = checkSelection(cbName);
		document.addReduceForm.selectedExceptions.value = selectedCb;
		document.addReduceForm.mode.value=mode;		    
	    document.addReduceForm.submit();	    
}

function submitAddReduceForm(cbName){

	var moked=document.addReduceForm.mokedId.value;
	if ((moked==Number.NaN) || (moked<=0) ) {
		alert("חובה לבחור מוקד ותור");
		return;
		}
	if (document.addReduceForm.numberOfAgets.value<=0) {
		alert("כמות נציגים חייב להיות גדול מאפס");
		return;
		}
	if(!isValidTime(document.addReduceForm.shiftStart.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
		}
	if(!isValidTime(document.addReduceForm.shiftEnd.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
		}

	var selectedCb = checkSelection(cbName);
	document.addReduceForm.selectedExceptions.value = selectedCb;
	document.addReduceForm.mode.value="insert";
    document.addReduceForm.submit();
}

function checkSelection(name) {

	var x=document.getElementsByName(name);
	var selectedCb="";
	for (var i=0; i<x.length; i++ ) {
		if (x[i].checked) {
			selectedCb=selectedCb+x[i].value+";"
		}
	}
return selectedCb;
}

function choosAll(cbName) {
	var x=document.getElementById("cbChoosAll");
	if (x.checked) { 
		selectAllCb(cbName) 
//		var y=document.getElementsByName(cbName);
//		for (var i=0; i<y.length; i++ ) {
//			y[i].checked=true;
//			}
	} else { 
			deSelectAllCb(cbName); 
//		var y=document.getElementsByName(cbName);
//		for (var i=0; i<y.length; i++ ) {
//			y[i].checked=false;
//			}
	}
}

function  selectAllCb(name) {
	var x=document.getElementsByName(name);
	for (var i=0; i<x.length; i++ ) {
		x[i].checked=true;
		}
}

function  deSelectAllCb(name) {
	var x=document.getElementsByName(name);
	for (var i=0; i<x.length; i++ ) {
		x[i].checked=false;
		}
}

</SCRIPT>

<bzqjs:validator>
 <bzqjs:form name="addReduceForm" />
</bzqjs:validator>

<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<%

bzq.forms.TableInfo option;
boolean isApproved=false;
boolean defualtOption=false;
String moked=null;
String mokedForSite=null;
String siteId = null;
String mode=reduceRequestForm.getMode();
java.util.Vector  excVec=null;
if(reduceRequestForm!=null) { 
	if (reduceRequestForm.getMokedId()!=null) {
		mokedForSite=reduceRequestForm.getMokedId();
		moked=reduceRequestForm.getMokedId();
	}else {
		mokedForSite=reduceRequestForm.getAllowedMoked();
	}
	if(reduceRequestForm.getAutomaticApprove() == null) reduceRequestForm.setAutomaticApprove("0");
	siteId = bzq.shf.utils.SHFTableUtils.getSiteCodeOfUnit(mokedForSite);
	
}		
%>	
<BODY>
<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
	<TR>
		<TD dir="rtl" valign="top" width="100%"><jsp:include
			page="submenu/shift_submenu.jsp" /></TD>
	</TR>

	<TR>
		<TD width=100% height="100%" valign="top"
			style="padding: 6px 6px 6px 6px;">
		<FIELDSET class="info">
		
		<%
		if (reduceRequestForm!=null) { 
		
		if(reduceRequestForm.getMode().equals("viewForDuplicate")){
			isApproved = (reduceRequestForm.getSumApproved()>0 || reduceRequestForm.getMode().equals("view"))?true:false; %>
			<LEGEND>שכפול בקשת צמצום משמרת</LEGEND>
		<%}else if(reduceRequestForm.getMode().equals("viewForUpdate")){
			isApproved = (reduceRequestForm.getSumApproved()>0 || reduceRequestForm.getMode().equals("view"))?true:false; %>
			<LEGEND>עדכון בקשת צמצום משמרת</LEGEND>
		<%}else if (reduceRequestForm.getMode().equals("viewForInsert")){%>
			<LEGEND>הוספת בקשה לצמצום משמרת</LEGEND>
			<%defualtOption = true;%>
		<%}else if (reduceRequestForm.getMode().equals("view")) { %>
			<LEGEND>הוספת בקשה לצמצום משמרת</LEGEND>
			<%defualtOption = true;%>
		<%}%>		
		<form action="/shf/reduce/addUpdateReduceShiftReq.do" name="addReduceForm"	method="post">
				<INPUT name="selectedExceptions" type="hidden"> 
				<!--INPUT name="automaticApprove" type="hidden"-->
			<%if(reduceRequestForm.getMode().equals("viewForUpdate")){%>
				<input name="mode" type="hidden">
				<input name="reduceId" type="hidden" value="<%=reduceRequestForm.getReduceId()%>">
			<%}else if(reduceRequestForm.getMode().equals("viewForInsert")){%>
				<input name="mode" type="hidden">
			<%}else if(reduceRequestForm.getMode().equals("viewForDuplicate")){%>
				<input name="mode" type="hidden">
			<%}else if(reduceRequestForm.getMode().equals("view")){%>
				<input name="mode" type="hidden">
			<%}%>
			<!--input name="originalNumOfAgents" type="hidden"-->
			<TABLE cellspacing="5">
			<TR>
				<TD class=header>תאריך:</TD>
				<TD width=10px></TD>
				<TD>
				<%if( ( reduceRequestForm.getMode().equals("viewForUpdate") || reduceRequestForm.getMode().equals("viewForDuplicate") )&& reduceRequestForm.getShiftStart()!=null){ %>
						<shf:calendar disabled="<%=isApproved%>" calname="date" name="reduceRequestForm" property="shiftStart" />
				<%}else {%>
				<shf:calendar calname="date" name="reduceRequestForm" property="date"/>
				<%}%>
				</TD>
				<TD width="20px"></TD>
				<TD class=header>מוקד:</TD>
				<TD width=10px></TD>
				
				<TD class=data>
					<shf:unitselect disabled="<%=isApproved%>" tablename="unitCode" name="mokedId"
					selectedName="reduceRequestForm" selectedProperty="mokedId"
					style="width:160px;font-size:10px;"
					type="G01" logic="onchange=setActivities(this,0);" emptySelection="yes"/>
				</TD>
			</TR>
			<TR>
				<TD class=header>משעה:</TD>
				<TD width=10px></TD>
				<TD><shf:timechooser disabled="<%=isApproved%>" inputvalue='<%=bzq.utils.BaseConvert.dateToString(reduceRequestForm.getShiftStart(),"HH:mm")%>' inputname="shiftStart" /></TD>
				<TD width="20px"></TD>
				<TD class=header>תור:</TD>
				<TD width=10px></TD>
				<TD id="activityAjaxResult">
					
					<%if(moked==null||moked.equals("-1")){%>
					<shf:activityselect tablename="activityCode" name="activity" 
					selectedName="reduceRequestForm" selectedProperty="activity"  
					logic=" disabled " style="width:160px;font-size:10px;"/>
					 <%}else{  %>
						<shf:activityselect  disabled="<%=isApproved%>" tablename="activityCode" name="activity" 
						selectedName="reduceRequestForm" selectedProperty="activity"  
						moked="<%=moked%>" style="width:160px;font-size:10px;"/>
					 <%}%>
				</TD>
				
			</TR>
			<TR>
				<TD class=header>עד שעה:</TD>
				<TD width=10px></TD>
				<TD><shf:timechooser disabled="<%=isApproved%>" inputvalue='<%=bzq.utils.BaseConvert.dateToString(reduceRequestForm.getShiftEnd(),"HH:mm")%>' inputname="shiftEnd" /></TD>
				<TD width="20px"></TD>
				
			</TR>
			<TR>
				<TD class=header>כמות נציגים:</TD>
				<TD width=10px></TD>
				<TD><input type=text maxlength="2" name="numberOfAgets"
					style="width:30px;height:18px;font-size:10px;" 
					value="<bzq:integer name="reduceRequestForm" property="numberOfAgets"/>">
				</TD>
				<TD width="20px"></TD>
				<TD class=header>עדכון אטומטי/ידני:</TD>
				<TD width=10px></TD>
					<%if (isApproved) {%>
						<%if(reduceRequestForm.getAutomaticApprove().equals("1")){%>
							<TD>
								<select id="dd" disabled="disabled" style="height:18px;font-size:10px;" name="automaticApprove" >
								<option value="0"  >ידני</option>
								<option value="1" selected >אוטומטי</option>
								</select>
							</TD>
						<%} else {%>
							<TD>
								<select id="dd" disabled="disabled" style="height:18px;font-size:10px;" name="automaticApprove" >
								<option value="0"  selected >ידני</option>
								<option value="1" >אוטומטי</option>
								</select>
							</TD>
						<%}%>
					<%}else  if (defualtOption){%>
									<TD>
										<select  id="dd" style="height:18px;font-size:10px;" name="automaticApprove" >
										<option value="0"  >ידני</option>
										<option value="1" selected >אוטומטי</option>
										</select>
									</TD>
					
								<%} else if(reduceRequestForm.getAutomaticApprove().equals("1")){%>
									<TD>
										<select  id="dd" style="height:18px;font-size:10px;" name="automaticApprove" >
										<option value="0"  >ידני</option>
										<option value="1" selected >אוטומטי</option>
										</select>
									</TD>
								<%} else {%>
									<TD>
										<select  id="dd" style="height:18px;font-size:10px;" name="automaticApprove" >
										<option value="0"  selected >ידני</option>
										<option value="1" >אוטומטי</option>
										</select>
									</TD>
									<%}%>	

			</TR>
			<%String is_approved = (isApproved)?"dis":" ";
				  String cbName = "cbExcep";
				  String selExcep = reduceRequestForm.getSelectedExceptions();
			%>
			<TR>
				<TD colspan="6">
					<shf:exceptioncbselect site="<%=siteId%>" name="<%=cbName%>" selectedException="<%=reduceRequestForm.getSelectedExceptions()%>" cbDisabled="<%=is_approved%>"/>
				</TD>
			</TR>
			<TR>
				<TD>
					<%if (isApproved) {%>
						<INPUT type="checkbox" id="cbChoosAll" onclick='choosAll("<%=cbName%>");' disabled > בחר/הורד הכל
					<%} else {%>
						<INPUT type="checkbox" id="cbChoosAll" onclick='choosAll("<%=cbName%>");' > בחר/הורד הכל
					<%}%>	
				</TD>
			</TR>
			<!--   ======  כפתורים ======   -->
			<TR>
				<TD colspan=8 align=left>
				<button onclick="history.go(-1);">חזור</button>
				&nbsp; <% if (mode.equalsIgnoreCase("viewForUpdate")) {//if(shiftInforce!=null && shiftInforce.getId()>0){%>
				<button onclick='submitUpdateReduce(<%=isApproved%>, <%=reduceRequestForm.getSumApproved()%>, "<%=cbName%>");'>עדכן</button>
				<%}else if (mode.equalsIgnoreCase("viewForInsert")){%>
				<button onclick='submitAddReduceForm("<%=cbName%>");'>עדכן</button>
				<%}else if (mode.equalsIgnoreCase("viewForDuplicate")){%>
				<button onclick='submitAddReduceForm("<%=cbName%>");'>שכפל</button>
				<%}%>
				</TD>
				
			</TR></TABLE>
		</form>
		</FIELDSET>
		<%}//END OF -- if (reduceRequestForm!=null)%>
		</TD>
	</TR>
</TABLE>
</BODY>
</HTML>
