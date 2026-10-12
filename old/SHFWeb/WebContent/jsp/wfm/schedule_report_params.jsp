<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@page import="bzq.forms.TableForm"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255"%>

<jsp:useBean id="schedules" class="java.util.ArrayList" scope="request"></jsp:useBean>
<jsp:useBean id="wfmReportForm" class="bzq.wfm.report.WfmReportForm" scope="request"></jsp:useBean>

<HTML>
<HEAD>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">
<TITLE>activity_aim.jsp</TITLE>

<script>
function setData(scheduleInput){
	setForecast(scheduleInput);
	setSites(scheduleInput);
}


function setForecast(scheduleInput){
	document.getElementById("forecast_result").innerHTML="<img src='images/wait.gif'>";
	var scheduleId;
	var xmlHttp;
	scheduleId=scheduleInput.value;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return ;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if(xmlHttp.readyState==4){
			document.getElementById("forecast_result").innerHTML=xmlHttp.responseText;
		}
	}
	xmlHttp.open("POST","/shf/wfmReport/getForecast.do?scheduleId="+scheduleId,true);
	xmlHttp.send(null);	
}

function setSites(scheduleInput){
	document.getElementById("sites_result").innerHTML="<img src='images/wait.gif'>";
	var scheduleId;
	var xmlHttp;
	scheduleId=scheduleInput.value;
	try{  
		xmlHttp=new XMLHttpRequest();  
	}
	catch (e){  
		try{    
			xmlHttp=new ActiveXObject("Msxml2.XMLHTTP");    
		}catch (e){    
			try{      
				xmlHttp=new ActiveXObject("Microsoft.XMLHTTP");      
			}catch (e){      
				alert("Your browser does not support AJAX!");      
				return ;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if(xmlHttp.readyState==4){
			document.getElementById("sites_result").innerHTML=xmlHttp.responseText;
		}
	}
	xmlHttp.open("POST","/shf/wfmReport/getSites.do?scheduleId="+scheduleId,true);
	xmlHttp.send(null);	
}


function submitReport(){
	var frc;
	var sch=document.forms[0].scheduleId.value;
	if(document.forms[0].forecastId!=null){
		frc=document.forms[0].forecastId.value;
	}
	if(sch==null || sch=='' || frc==null || frc==''){
		alert("נא לבחור סידור עבודה ותחזית");
		return;
	}
	document.forms[0].submit();
}

</script>

</HEAD>

<body dir="rtl">

	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height: 20px;"><jsp:include page="../submenu/emptySubmenu.jsp"></jsp:include></TD>
		</TR>

		
		
		<TR>
			<TD valign="top" width=100% style="padding:7px 7px 7px 7px;" >
				<form action="/shf/wfmReport.do" name="reportForm">
				<input type="hidden" name="mode" value="build">
				<table cellpadding="4" cellspacing="4">
					<tr>
						<td class="header">סידור עבודה:</td>
						
						<td>
							<select name="scheduleId" onchange="setData(this);">
							<option value=""></option>
							<%
							if(schedules!=null){
							String str=null;
							for(int i=0;i<schedules.size();i++){
								TableForm sch=(TableForm)schedules.get(i);
								str="";
								if(wfmReportForm!=null && sch.getCode().equals(wfmReportForm.getScheduleId())){
									str="selected";
								}
								%>
								<option value="<%=sch.getCode()%>" <%=str%> ><%=sch.getDescription() %></option>
								<%
							}
							}
							 %>
							</select>
						</td>
					</tr>
					<tr>
						<td class="header">תחזית:</td>
						
						<td id="forecast_result">
							<select name="forecastId" disabled="disabled"></select>
						</td>
					</tr>
					<tr>
						<td class="header">מוקד:</td>
						
						<td id="sites_result">
							<select name="siteId" disabled="disabled"></select>
						</td>
					</tr>
					
					
					<tr>
						<td><button class="button" type="button" onclick="submitReport();">אישור</button></td>
					</tr>
				
				</table>
				</form>
				
			</TD>
		</TR>
		<TR>
			<TD valign="top" style="height:100%;padding:10px;">
				<%if(wfmReportForm!=null && wfmReportForm.getPath()!=null){%>
				<a href="<%=wfmReportForm.getPath()%>">לחץ כאן לפתיחת הדוח</a>
				<%}%>
			</TD>
		</TR>
	</TABLE>
</body>
</html>