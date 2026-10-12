<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@	taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<jsp:useBean id="breakForm" class="bzq.shf.forms.BreakSearchForm"
	scope="request">
</jsp:useBean>
<SCRIPT>
 
function submitBreakForm(){
	document.forms['breakForm'].action="/shf/break/searchResult.do";
	document.forms['breakForm'].target="";
	document.forms['breakForm'].submit();
	
}

function exportExcel(){
	document.forms['breakForm'].action="/shf/break/export.do";
	document.forms['breakForm'].target="_blank";
	document.forms['breakForm'].submit();
	
}
</SCRIPT>

<%@page import="bzq.shf.utils.ShfException"%>
<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="com.ibm.websphere.management.repository.Document"%>
<%@page import="java.util.HashMap"%><html:html>
<shf:reloadErrors></shf:reloadErrors>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector"
%>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></SCRIPT>
<script language="JavaScript" src="/shf/js/breakjs.js"></script>

<SCRIPT>
function updownException(){
	hideDisplay('trCurrent');
}



</SCRIPT>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<TITLE></TITLE>
<SCRIPT>
var titles = ['t0','t1','t2','t3','t4','t5'];
function doSome(size){
	if(size>0){
		try{
			for(i=1;i<=6;i+=2){
				setTimeout("document.getElementById('exceptionalBar').style.background='coral';",i*400);
				setTimeout("document.getElementById('exceptionalBar').style.background='#eeeeee';",(i+1)*400);
			}
		}catch(e){
			alert("dfg");
		}
	}
}

function keyPressed(){
	if(window.event.keyCode==13){
		submitBreakForm();
	}
}

function setClicked(i) {

	for (var ii=0; ii<=3; ii++) {
		document.getElementById('td' + ii).className='button_unClicked';
	}
	document.getElementById('td4').className='button_green_unClicked';
	document.getElementById('td5').className='button_red_unClicked';
	
	if (i<4) {  document.getElementById('td' + i).className='button_clicked'; }
	if (i==4) { document.getElementById('td' + i).className='button_green_clicked'; }
	if (i==5) { document.getElementById('td' + i).className='button_red_clicked'; }
	setSelecion(i);
	try{
	document.getElementById('groupName').innerHTML = document.getElementById('td' + i).innerHTML;//titles[i] + " " + myData.length;
	}catch(e){}
}


</SCRIPT>


<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<%
java.util.Date date = null;
Vector breakListCurr= breakForm.getBreakVecCurrent();


Vector futureBreak = null; 
Vector inBreak = null;
Vector inBreakNotReturned = null;
Vector notGoToBreak = null;
Vector endedOk = null;
Vector endedNotOk = null;
	
HashMap allTab = breakForm.getAllTab();
if (allTab != null) {
	futureBreak = (Vector)allTab.get(SHFConstants.BREAK_FUTURE); 
	inBreak = (Vector)allTab.get(SHFConstants.BREAK_CURRENT);
	inBreakNotReturned = (Vector)allTab.get(SHFConstants.BREAK_NO_ENTRY);
	notGoToBreak = (Vector)allTab.get(SHFConstants.BREAK_NO_EXIT);
	endedOk = (Vector)allTab.get(SHFConstants.BREAK_ENDED_OK);
	endedNotOk = (Vector)allTab.get(SHFConstants.BREAK_ENDED_NOT_OK);
}

java.util.Calendar cal = java.util.Calendar.getInstance();
date = new java.util.Date();
String moked = breakForm.getMoked();

int t0=0; int t1=0; int t2=0; int t3=0; int t4=0; int t5=0;
 if (futureBreak != null) {t0 = futureBreak.size();} 
 if (inBreak != null) {t1 = inBreak.size();}
 if (inBreakNotReturned != null) {t2 = inBreakNotReturned.size();}
 if (notGoToBreak != null) {t3 = notGoToBreak.size();}
 if (endedOk != null) {t4 = endedOk.size();}
 if (endedNotOk != null) {t5 = endedNotOk.size();}


%>

<BODY onkeyup="keyPressed();">

<form name="breakForm" method="post" action="/shf/break/searchResult.do">
<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0" dir="rtl">
	<TBODY>
		<TR>
			<TD valign="top" style="height: 20px" width="100%"><jsp:include
				page="submenu/emptySubmenu.jsp"></jsp:include></TD>
		</TR>
		<TR>
			<TD valign="top" style="padding-top:3px;padding-bottom:3px;padding-right:6px;padding-left:7px;">
			<FIELDSET class="form"><legend> חיפוש הפסקות </legend>
			<TABLE cellspacing="0" cellpadding="0" width="100%">
				<TBODY>
					<TR>
						<TD class="header" nowrap="nowrap">תאריך:</TD>
						<TD class="data" valign="middle"><shf:calendar calname="date"
							name="breakForm" property="date" /></TD>
						<TD width="20px"></TD>
						<TD class="header" nowrap="nowrap">מוקד:</TD>
						<TD class="data"><shf:unitselect tablename="unitCode" name="moked"
							selectedName="breakForm" selectedProperty="moked"
							style="width:170px;font-size:10px;" type="G01" all="yes"
							logic="onchange=setMultiTeams(this,'breakForm','teamCode','200');setMultiActivities(this,'breakForm','activity');" /></TD>
						<TD width=20px></TD>
						<TD class="header" nowrap="nowrap">שם פרטי:</TD>
						<TD class="data" valign="middle">
							<INPUT type="text" maxlength="15"
							align="right" class="formInput" name="firstName"
							value="<bzq:string name="breakForm" property="firstName"/>"></TD>
						<TD width="20px"></TD>
						
						<TD class="header" nowrap="nowrap"></TD>
						<TD  align=left><span class=header> שעת רענון: </span> <b>&nbsp;<bzq:string property="refhreshed_time"  name="breakForm" /></b></TD>
					</TR>
					<TR>
						<TD class="header" nowrap="nowrap">משעה:</TD>
						<TD class="data"><shf:timechooser inputname="time"
							inputvalue="<%=breakForm.getTime()%>" /></TD>
							
						<TD width=20px></TD>

						<!--TD class=header nowrap="nowrap">תור:</TD>
						<TD class=data id="activityAjaxResult">
							<shf:activityCheckList name="breakForm" moked="<!--%=moked%>" property="activity" />
						</TD-->

						<TD class="header" nowrap="nowrap">תפקיד בפועל:</TD>
						<TD class="data" valign="middle" >
						<shf:innerJobCheckList name="breakForm" tablename="innerJob" property="innerJob" optionsLength="150"/>
						</TD>
						
						<TD width="20px"></TD>
						<TD class="header" nowrap="nowrap">שם משפחה:</TD>
						<TD class="data" valign="middle">
							<INPUT type="text" maxlength="15"
							align="right" class="formInput" name="lastName"
							value="<bzq:string name="breakForm" property="lastName"/>"></TD>
										
						
					</TR>
					<TR>
						<TD class="header" nowrap="nowrap">עד שעה:</TD>
						<TD class="data"><shf:timechooser inputname="to_time" 
							inputvalue="<%=breakForm.getTo_time()%>" /></TD>
						<TD width="20px"></TD>
						
						<TD class="header"	nowrap="nowrap">צוות:</TD>
						<TD class="data" id="teamsAjaxResult">
							<shf:orgunitCheckList parentUnit="<%=moked%>" name="breakForm" type="J01" property="teamCode" length="170" optionsLength="200"></shf:orgunitCheckList>
						</TD>
						
						<TD width="20px"></TD>
						<TD class="header">מיקום:</TD>
						<TD class="data">
							<shf:shiftLocationCheckList name="breakForm" property="shiftLocation" optionsLength="120" length="120"/>
						</TD>						
						
						<TD colspan=6 class=header align=left >
							<button onclick="submitBreakForm();">חפש</button>
						</TD>
					</TR>
				</TBODY>
			</TABLE>

			</FIELDSET>

			</TD>
		</TR>
		<tr>
			<td style="padding-bottom:3px;padding-left:7px;padding-right:7px;width:100%;">

				<table style="border: medium;" align="center" >
					<tr>
						<TD style='float:write;' width=20px>
							 <img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;' >
						</TD>
						<td class="button_unClicked" width="130px" onclick="setClicked(0)" id="td0">
						עתידים לצאת : <%=t0 %>
						</td>
						<td width="5">
						</td>
						<td class="button_unClicked" width="110px" onclick="setClicked(1)" id="td1">
						בהפסקה : <%=t1 %>
						</td>
						<td width="5">
						</td>
						<td class="button_unClicked" width="110px" onclick="setClicked(2)" id="td2">
						לא חזרו : <%=t2 %>							
						</td>
						<td width="5">
						</td>
						<td class="button_unClicked" width="110px" onclick="setClicked(3)" id="td3">
						לא יצאו : <%=t3 %>
						</td>
						<td width="5">
						</td>
						<td class="button_green_unClicked" width="110px" onclick="setClicked(4)" id="td4">
							סיימו : <%=t4 %>
						</td>
						<td width="5">
						</td>
						<td class="button_red_unClicked"  width="110px" onclick="setClicked(5);" id="td5">
							סיימו חריג : <%=t5 %>
						</td>
					</tr>
				</table>
			</td>
		</tr>
		
		<TR id="shiftsSum">
			<TD valign="top" style="padding-right:7px;padding-left:7px;" dir="ltr">
				<TABLE cellspacing=0 cellpadding=0 width=100% style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;background-color:#f3f3f3;">
					<TR class=tableTotal >
						
						<TD valign=top height="100%" style="padding: 0px 7px 7px 7px" align="right">
							סה"כ
							 <span id="groupName"> </span>
							 מתוך <%=breakListCurr!=null?breakListCurr.size():0%> הפסקות בטווח הנבחר 
						</TD>						
					</TR>
				</TABLE>
			</TD>
		</TR>
		
		<TR id="trCurrent">
			<TD valign=top height="100%" width="100%" style="padding: 0px 7px 7px 7px" dir="ltr">
				<div id="bigDiv" style="width:100%;"> </div>
				<div style="overflow: auto; border: 1px silver solid;height: 100%;width:100%;" id="dataGridDiv">
					<jsp:include page="break_current_search_table.jsp"></jsp:include>
				</div>
			</TD>
		</TR>
	</TBODY>
</TABLE>
</form>

</BODY>
</html:html>