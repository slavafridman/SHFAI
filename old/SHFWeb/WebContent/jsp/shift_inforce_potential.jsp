<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="potentialInforceForm"
	class="bzq.shf.forms.PotentialInforceForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean 
	id="employeeData"
	class="bzq.shf.forms.EmployeeInforceListForm" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="employeeInforce"
	class="bzq.shf.bean.PotentialEmployeeBean" 
	scope="request">
</jsp:useBean>
<jsp:useBean id="shiftInforce"
	class="bzq.shf.forms.ShiftInforceRequestForm" 
	scope="request">
</jsp:useBean>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/bzq-js.tld" prefix="bzqjs"%>

<%@page import="java.util.Vector"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" %>
<%@page import="org.apache.commons.validator.GenericValidator"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" ></link>
<TITLE>shift_inforce_potential.jsp</TITLE>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script src="/shf/js/shfgrid.js"></script>


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
	
	if(!isValidTime(document.forms['potentialInforceForm'].startPotential.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(!isValidTime(document.forms['potentialInforceForm'].endPotential.value)){
		alert("HH:MM הזן שעה בפורמט");
		return;
	}
	if(document.potentialInforceForm.moked.value=='-1' || document.potentialInforceForm.moked.value==''){
		alert("לא הוזנו כל שדות החובה");
		return;
	}
	var currentTime = new Date();
	var date1 = document.getElementById('date').value;
	var time1 = document.getElementById('startPotential').value;
	var hh = parseInt(time1.substring(0,2),10);
	var mm = parseInt(time1.substring(3,5),10); 
    var dt1  = parseInt(date1.substring(0,2),10); 
	var mon1 = parseInt(date1.substring(3,5)-1,10 );
    var yr1  = parseInt(date1.substring(6,10),10);
    var shiftTime = new Date(yr1, mon1, dt1, hh, mm);
   	if (currentTime > shiftTime) {
		alert("לא ניתן להגדיר משמרת בזמן עבר");
		return false;
	}
	
	
	
	
	//alert("1");
//	if (validateAddInforceForm(document.all.potentialInforceForm)) {   
		document.forms['potentialInforceForm'].action="/shf/shift/InforcePotentialData.do";
		//document.forms['addInforceForm'].target="inforceOptionsFrame";
		document.forms['potentialInforceForm'].target="";
        document.forms['potentialInforceForm'].submit();     
//	}
//	alert("2");
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
		if(document.getElementById("selectRemoveAll").value=='1'  ) {
		checkItem.value='0';
		checkItem.checked == true;
		selectAll();
		}	
	else {	
		checkItem.value='1'
		checkItem.checked == false;
		clearAll();
		}
}
function setInforcrForAgante() {
	arr=document.getElementsByName("selectedPotential");
	var test = false;
	for (var i = 0; i < arr.length; i++) {
		if (arr[i].checked == true) test=true ;
	}
	if (test) {	

	document.forms['potentialInforceForm'].action="/shf/shift/InforcePotentialAdd.do";
	document.forms['potentialInforceForm'].target="";
    document.forms['potentialInforceForm'].submit();
    } else
    {
    alert("לא נבחרו נציגים לשיבוץ למשמרת תגבור");
    }   
}

function addInforceReq() {
	if(document.potentialInforceForm.moked.value=='-1' || document.potentialInforceForm.moked.value==''){
		alert("לא הוזנו כל שדות החובה");
		return;
	} else {
		document.addInforceForm.moked.value = document.potentialInforceForm.moked.value;		
		//alert(document.potentialInforceForm.team.value);
		//document.addInforceForm.team.value = document.potentialInforceForm.team.value;
	}	
	document.addInforceForm.categoryJob.value = ((document.potentialInforceForm.categoryJob.checked)?1:0);
	document.addInforceForm.workFromHome.value = ((document.potentialInforceForm.workFromHome.checked)?1:0);
	document.addInforceForm.trained.value = ((document.potentialInforceForm.trained.checked)?1:0);
	document.addInforceForm.date.value = document.potentialInforceForm.date.value;
	document.addInforceForm.shiftStart.value = document.potentialInforceForm.startPotential.value;
	document.addInforceForm.shiftEnd.value = document.potentialInforceForm.endPotential.value;
	
	//var x[]=document.potentialInforceForm.team.value;
	//alert(x[0]);
	
	document.forms['addInforceForm'].action="/shf/shift/addInforceReqParam.do";
	document.forms['addInforceForm'].target="";
    document.forms['addInforceForm'].submit();
}
function exportExcel(){
	document.forms['potentialInforceForm'].action="/shf/shift/exportPotentialInforce.do";
	document.forms['potentialInforceForm'].target="_blank";
	document.forms['potentialInforceForm'].submit();
}

function selectAll(){
	arr=document.getElementsByName("selectedPotential");
	for (i = 0; i < arr.length; i++)
		arr[i].checked = true ;
	
}

function clearAll(){
	arr=document.getElementsByName("selectedPotential");
	for (i = 0; i < arr.length; i++)
		arr[i].checked = false ;
}

function save(){
 
  if(document.getElementById('selectRemoveAll').checked){
    document.getElementById("selectRemoveAll").value='0';
   }
} 
</SCRIPT>
<bzqjs:validator>
 <bzqjs:form name="addInforceForm" />
</bzqjs:validator>


</HEAD>

<%
String hour1=null;
String hour2=null;
String hour3=null;
String check= null;
String moked=null;
if(potentialInforceForm!=null)
	moked=potentialInforceForm.getMoked();
%>
<BODY onload="save();" > 
<%Vector potentialVec = potentialInforceForm.getPotentialInforceData(); %>
<%bzq.shf.bean.EmployeeBean[] emps=employeeData.getEmployee(); %>
<form action="/shf/shift/InforcePotentialData.do" name="potentialInforceForm" method="post">
<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0" >
	<TR>
		<TD dir="rtl" valign="top" width="100%"><jsp:include
			page="submenu/shift_submenu.jsp" /></TD>
	</TR>

	<TR>
		<TD width="100%" valign="top" style="padding: 6px 0px 6px 6px;">
		<FIELDSET class="form">
		<LEGEND>פוטנציאל נציגים למשמרת תגבור</LEGEND>
			<TABLE cellspacing="5" width="100%">
			<TR>
				<td>
					<table>
						<tr>
							<TD class="header">תאריך:</TD>
							<TD>
								<shf:calendar calname="date" name="potentialInforceForm" property="date" />
							</TD>
							<TD width="15px"></TD>
							<TD class="header">מוקד:</TD>
							
							<TD class="data">
								<shf:unitselect tablename="unitCode" name="moked"
								selectedName="potentialInforceForm" selectedProperty="moked"
								style="width:170px;font-size:10px;"
								type="G01"
								logic="onchange=setMultiTeams(this,'potentialInforceForm','team','200');setActivities(this,'potentialInforceForm','activity');" />
							</TD>
							<TD width="15px"></TD>
							<TD class="header">צוות:</TD>
							<TD class="data" id="teamsAjaxResult" width="22">
								<shf:orgunitCheckList parentUnit="<%=moked%>" name="potentialInforceForm" type="J01" property="team" optionsLength="200" length="160"></shf:orgunitCheckList> 
							</TD>
							<TD width="15px"></TD>
							<TD class="header" nowrap="nowrap">תפקיד בפועל:</TD>
							<TD class="data" valign="middle">
								<shf:innerJobCheckList name="potentialInforceForm" tablename="innerJobCode" property="innerJob" />
							</TD>
						</tr>
					</table>
				</td>	
			</TR>
			<TR>
				<td>
					<table>
						<tr>
							<TD class="header">שם פרטי:</TD>
							<TD class="data">
								<input type="text" maxlength="15" name="firstName" class="formInput" value="<bzq:string name="potentialInforceForm" property="firstName"/>">
							</TD>
							<TD width="15px"></TD>							
							<TD class="header" nowrap="nowrap">שם משפחה:</TD>
							<TD class="data">
								<input type="text" maxlength="15" name="lastName" class="formInput" value="<bzq:string name="potentialInforceForm" property="lastName"/>" >
							</TD>
							<TD width="15px"></TD>
							<TD class="header" nowrap="nowrap" >לא מסורתי:</TD>
							<td>
								<!-- INPUT type="checkbox" value="<bzq:integer name="potentialInforceForm" property="trained"/>" name="trained" size="10" onchange="javascript:change(this);" /-->
								<shf:checkbox inputname="trained" name="potentialInforceForm" property="trained"/>
							</td>
							<TD width="15px"></TD>
							<TD class="header" nowrap="nowrap">עובד מהבית:</TD>
							<td>
								<!-- INPUT type="checkbox" value="0" name="workFromHome" size="10" onchange="javascript:change(this);" /-->
								<shf:checkbox inputname="workFromHome" name="potentialInforceForm" property="workFromHome"/>
							</td>
							<TD width="15px"></TD>
							<TD class="header" nowrap="nowrap">כולל בכירים/מומחים:</TD>
							<td>
								<!--  INPUT type="checkbox" value="0" name="categoryJob" size="10" onchange="javascript:change(this);" /-->
								<shf:checkbox inputname="categoryJob" name="potentialInforceForm" property="categoryJob" checked=""/>
							</td>
						</tr>
					</table>
				</td>
			</TR>
			<tr> 
				<td colspan="12">
					<hr />
				</td>
			</tr>
			<TR>
				<td>
					<table>
						<tr>
							<TD width="15px"></TD>	
							<TD class="header">משעה:</TD>
							<TD>
								<shf:timechooser inputvalue='<%=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getStartPotential(),"HH:mm")%>' inputname="startPotential" />
							</TD>
							<TD width="15px"></TD>
							<TD class="header" nowrap="nowrap">עד שעה:</TD>
							<TD>
								<shf:timechooser inputvalue='<%=bzq.utils.BaseConvert.dateToString(potentialInforceForm.getEndPotential(),"HH:mm")%>' inputname="endPotential" />
							</TD>
							<TD width="50px"></TD>
							<TD align="left"><button onclick="showInforceOptionals();">חפש </button></TD>
						</tr>
					</table>
				</td>
			</TR>
			</TABLE>

		</FIELDSET>
		</TD>
	</TR>
	<%if (potentialVec != null && potentialVec.size() > 0)  {%>
	<tr>
		<td>
			<table cellspacing="0" cellpadding="0" width="100%" border="0"
				style="border-top: 1px silver solid; border-left: 1px silver solid; border-right: 1px silver solid;" >
				<tr style="tableTotal">
					<td style="text-align: right;" class="tableTotal" width="150px">
						<img src='/shf/images/search.png' height="16px"> נמצאו <%=potentialVec.size()%>	רשומות
					</td>
					
					<td style="text-align: right;" class="tableTotal" width="50px"> בחר הכל</td>
					<td style="text-align: right;" class="tableTotal" >
						<input type="checkbox"   id="selectRemoveAll"   value ='1' onclick="javascript:change(this);" >
					</td>
					
					<td style='text-align:left' width=20px class=tableTotal style="padding-left:2px;padding-top:2px;" dir="ltr">
				 		<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;' >
					</td>
				</tr>
			</table>
		</td>
	</tr>	
	<%} %>
	<TR>
		<TD height="100%" width="100%" valign="top" style="padding: 6px 6px 6px 6px;">
			<table height="100%" width="100%" cellpadding="0" cellspacing="0">
				<TR>
					<!-- TD valign="top" height="100%" width="100%" >
						<iframe id="inforceOptionsFrame" frameborder="0" width="100%" height="100%" scrolling="auto" name="inforceOptionsFrame"></iframe>
					</TD-->
					<td valign="top" height="100%" style="padding: 0px 7px 7px 7px;" dir="ltr">
						<div style="overflow:auto;border:1px silver solid;height:100%;"
							id="dataGridDiv"><jsp:include page="shift_inforce_potential_table.jsp"></jsp:include>
						</div>
					</td>
				</TR>
			</table>
			
		</TD>
	</TR>
	
	<tr>
		<TD height="100%" width="100%" valign="top" style="padding: 6px 6px 6px 6px;">
			<table height="100%" width="100%" cellpadding="0" cellspacing="0" >
				<tr>
					<TD width="150px"></TD>
					<TD align="center"><button  style="width: 200px;" onclick="setInforcrForAgante();">שיבוץ נציגים למשמרת תגבור</button></TD>
					<TD align="center" ><button style="width: 200px;" onclick="addInforceReq();">הוספת משמרות תגבור למאגר </button></TD>
					<TD width="150px"></TD>
				</TR>
			</table>
		</TD>
	</tr>

</TABLE>
</form>

<FORM name="addInforceForm" action="/shf/shift/addInforceReqParam.do">
	<input type="hidden" name="moked">
	<input type="hidden" name="categoryJob" >
	<input type="hidden" name="workFromHome" > 
	<input type="hidden" name="trained" >
	<input type="hidden" name="shiftStart" >
	<input type="hidden" name="shiftEnd" >
	<input type="hidden" name="date" >


<%
if ((potentialInforceForm.getTeam() != null)) {
int s = potentialInforceForm.getTeam().length;
for(int i=0;i<potentialInforceForm.getTeam().length;i++){
%>
	<input name="team" type="hidden" value="<%=potentialInforceForm.getTeam()[i]%>" id=<%=i%> %>>
<%
	}
}
%>
<%
if ((potentialInforceForm.getInnerJob() != null)) {

	for(int ii=0;ii<potentialInforceForm.getInnerJob().length;ii++){
%>
	<input name="innerJob" type="hidden" value="<%=potentialInforceForm.getInnerJob()[ii]%>" id=<%=ii%> %>>
<%
	}
}
%>
</FORM>
</BODY>
</HTML>
