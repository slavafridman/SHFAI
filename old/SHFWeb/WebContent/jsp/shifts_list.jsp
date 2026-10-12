
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@	taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<jsp:useBean 
	id="shiftForm" 
	class="bzq.shf.forms.ShiftDataForm"
	scope="request">
</jsp:useBean>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<SCRIPT>

function exportExcel(){
	document.forms['shiftForm'].action = "/shf/shift/currentExport.do";
	document.forms['shiftForm'].target="_blank";
	document.forms['shiftForm'].submit();
}

function loadPage(){
	document.getElementById('emplistframe').style.display='none';
}
function sub() {
		if(!isValidTime(document.shiftForm.currentTime.value)){
			alert("HH:MM הזן שעה בפורמט");
			return;
		}
		document.forms['shiftForm'].target="";
		document.forms['shiftForm'].action = "/shf/shift/currentResult.do";
		document.forms['shiftForm'].submit();
		}
function cbSub() {
		document.forms['shiftForm'].target="";
		document.forms['shiftForm'].action = "/shf/shift/currentParam.do";
		var ccc=document.getElementById('idCbCheked').checked;

		
		if (ccc) 
			{

				document.getElementById('idCbCheked').value='1';
				document.forms['shiftForm'].action = "/shf/shift/currentResult.do";
				document.forms['shiftForm'].submit();
			} else
			{
				
				document.getElementById('idCbCheked').value='0';
				document.forms['shiftForm'].submit();
			}

}

function updown(){

	hideDisplay('shiftsTable');
	hideDisplay('shiftsSum');
	
}
function getTreeNodeTotal(){
	return treeNode.getTotal();
}

function keyPressed(){
	if(window.event.keyCode==13){
		sub();
	}
}

</SCRIPT>
<html:html>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector"
%>

<SCRIPT language="JavaScript" src="/shf/js/calendar.js"></SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
<script  src="/shf/js/shfgrid.js"></script>
<script  src="/shf/js/attendance.js"></script>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" >

<TITLE></TITLE>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>
<%
java.util.Date date=null;
try{
date = bzq.utils.BaseConvert.stringToDate("12/01/2009","dd/MM/yyyy");
}catch(bzq.utils.ConvertException e){}
%>

<BODY onkeyup="keyPressed();">

<%
Vector shiftsList=(Vector)request.getAttribute("shifts_list");
java.util.Calendar cal= java.util.Calendar.getInstance();

//yuval
bzq.shf.bean.ShiftTreeNodeBean treeNode=shiftForm.getTree();

%>
<form name=shiftForm method=post action="/shf/shift/searchResult.do" >
			
<TABLE width=100% height=100% cellpadding="0" cellspacing="0" dir="rtl">
		<TR>
			<TD valign="top" style="height:20px;">
				<jsp:include page="submenu/shift_submenu.jsp"></jsp:include> 
			</TD>
		</TR>
		<TR>
			<TD valign=top style="padding-top:10px;padding-bottom:5px;padding-right:7px;padding-left:7px;">

			<FIELDSET class=form >
			<legend> משמרות </legend>
			<TABLE cellspacing="2" cellpadding="2">
				<TBODY>
					<TR>
						<TD class=header>תאריך:</TD>
						<TD class=data valign="middle">
							<%if(("1".equals(request.getParameter("cbChecked")))){%>
							<shf:calendar  calname="attendanceDate" name="shiftForm" property="attendanceDate" disabled="true" marginBottom="35" />
							<%}else{%>
							<shf:calendar  calname="attendanceDate" name="shiftForm" property="attendanceDate" marginBottom="35"/>
							<%}%>
						</TD>
						
						<TD width=10px></TD>
						<TD class=header>שעה:</TD>
						<TD class=data>
						
						<%if(("1".equals(request.getParameter("cbChecked")))){%>
						<shf:timechooser inputname="currentTime" inputvalue="<%=shiftForm.getCurrentTime()%>" disabled="true" />
						<%}else{%>
						<shf:timechooser inputname="currentTime" inputvalue="<%=shiftForm.getCurrentTime()%>" />
						<%}%>
						</TD>
						
						
					</TR>
					<TR>	
						<TD class=header>מוקד:</TD>
						<TD class=data>
						
						<shf:unitselect tablename="unitCode" name="moked"
							selectedName="shiftForm" selectedProperty="moked"
							style="width:180px;font-size:10px;" type="G01" all="yes"/>
						</TD>	
						<TD></TD>			
						
						<TD class=header>
						מצב עדכני:
						</TD>
						<TD> 
						<INPUT type="checkbox" name="cbChecked" id="idCbCheked" onclick="cbSub();"  <%=("1".equals(request.getParameter("cbChecked")))?" checked":""%> > 
						</TD>
						<TD width=30px></TD>
						<TD>
						<%if(("1".equals(request.getParameter("cbChecked")))){%>
						<button onclick="sub();" id=cbclick disabled>חפש</button>
						<%}else{%>
						<button onclick="sub();" id=cbclick>חפש</button>
						<%}%>
						
						
						</TD>
					</TR>
				</TBODY>
			</TABLE>

			</FIELDSET>
				
			</TD>
		</TR>
	<% if (shiftsList !=null && shiftsList.size()>0) {%>	
	<TR id="shiftsSum">
		<TD valign="top" style="padding-right:7px;padding-left:7px;" dir="rtl">
		<TABLE cellspacing=0 cellpadding=0 width=100% style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
		<TR class=tableTotal >
		<!--TD style='text-align:left' class=tableTotal ><img src='/shf/images/save3.png' alt='יצא לאקסל' onclick='exportToExcel();' style='cursor:hand;' height=17px></TD-->
		<TD style='text-align:right' class=tableTotal><img src='/shf/images/search.png' height=16px> נמצאו <%=shiftsList.size()%> רשומות</TD>
		
		<TD style='text-align:left' width=20px class=tableTotal style="padding-left:2px;padding-top:2px;">
			<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor:hand;' >
		</TD>
		
		</TR>
		</TABLE>
		</TD>
		
		
	</TR>
	<%}%>
		<TR id="shiftsTable">
			<TD valign="top" height="270px" style="padding:0px 7px 0px 7px;" dir="ltr">
			<div  style="height=100%;overflow:auto;border:1px silver solid;" id="dataGridDiv">
			<jsp:include page="shifts_table.jsp"></jsp:include>
			</div>
			</TD>
		</TR>
		<TR>
			<TD>
		  		<div  dir="ltr" >
				<TABLE>
				  	<tr>
				  		<TD style="padding-left:6px;" ><img src="/shf/images/updown.gif" style="cursor:hand;" onclick="updown();"></TD>
				  		<%
						if(treeNode != null && treeNode.getSons() != null && !treeNode.getSons().isEmpty()) { 
							java.util.HashMap tree=treeNode.getSons();
						%>
				  		<td colspan="2" width="100%">
							<TABLE dir align="right">
							  	<tr>
							  		<td class="treeMoked" style="color: graytext; " align="right"><%=(treeNode.getTotal() - treeNode.getMissSum() - treeNode.getExistSum())%>- לא ביצעו רישום</td>
							  		<td class="treeMoked" style="color: red; " align="right">,<%=treeNode.getMissSum()%>- חיסורים</td>
							  		<td class="treeMoked" style="color: green; " align="right">,<%=treeNode.getExistSum()%>- נוכחים</td>
							  		<TD class="treeMoked" >,<%=treeNode.getTotal()%>- סה"כ :    נציגים</TD>
							  	</tr>
						  	</table>
						</td>
						<%}%>  	
					</tr>
				</Table>
				</div>
			</TD>
		</TR>
		<TR>
			<TD valign="top" height="100%" style="padding:0px 7px 7px 7px;">
			<div  style="height:100%;overflow:auto;" >
			<TABLE width="100%" height="100%" style="border:1px silver solid;" cellpadding="0" cellspacing="0">
			<TR>
				<TD height="100%" valign="top" width="100%">
				
				<jsp:include page="shift_sum.jsp"/>
				
				</TD>
			
			</TR>
			</TABLE>	
			</div>
			</TD>
			
		</TR>
	
</TABLE>
		</form>	
</BODY>
</html:html>
