<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="jobs" class="java.util.Vector" scope="request"></jsp:useBean>
<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>

<html>
<head>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<script type="text/javascript">
function validateAddInnerJob(){
	if(document.forms[0].description.value==''){
		alert("נא לרשום את תיאור התפקיד");
		return false;
	}
	return true;
}

function confirmDeleteInnerJob(){
	if(!(confirm("האם אתה בטוח כי ברצונך למחוק את התפקיד הזה"))){
		return false;
	}
	return true;
}

function deleteJob(jobid){
	if(confirmDeleteInnerJob()){
		document.location="/shf/admin/manageInnerJobs.do?action=delete&code="+jobid;
	}
	
}

function viewUpdate(jobid){
	var xmlHttp;
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
				return false;      
			}    
		}  
	}
	xmlHttp.onreadystatechange=function(){
		if (xmlHttp.readyState==4 && xmlHttp.status==200) {
			document.getElementById("popupDiv").style.display='';
			document.getElementById("popupDiv").innerHTML=xmlHttp.responseText;
        }
	}
	
	xmlHttp.open("GET","/shf/admin/manageInnerJobs.do?action=viewUpdate&code="+jobid);
	xmlHttp.send(null);
	
	//document.location="/shf/admin/manageInnerJobs.do?action=viewUpdate&code="+jobid;
}

function viewGroupMap(){
	var agaf=document.getElementsByName("groupAgaf")[0].value;
	document.location="/shf/admin/manageInnerJobs.do?action=groups&orgUnit="+agaf
}

</script>
<shf:reloadErrors/>
</head>



<body dir="rtl">
	<div style="display:none;position:absolute;" id="popupDiv" class="divPopup"></div>
	<TABLE cellpadding="0" cellspacing="0" width="100%" height="100%">
		<TR>
			<TD><jsp:include page="../submenu/admin_submenu.jsp" /></TD>
		</TR>
		<TR>
			<TD>
				<div style="padding:5px 0 10px 0;">
					<table>
						<tr>
							<TD>
								<shf:unitselect tablename="unitCode" name="groupAgaf" style="width:200px;font-size:10px;"
								type="<%=bzq.shf.utils.SHFConstants.AGAF_UNIT%>" />
								
							</TD>
							<TD>
								<button onclick="viewGroupMap();" style="width:140px;">הצג מפת קבוצות</button>
							</TD>
						</tr>
					</table>
				</div>
			</TD>
		</TR>
		<TR>
			<TD valign="top" width=100% style="padding:7px 7px 7px 7px;height:100%;" >
				
				<div  style="width:100%;height:100%;overflow:auto;border :solid 1px silver;">
						<table width=100% dir="ltr" cellspacing="0">
							<thead>
								<tr bgcolor="white">
									<th>&nbsp;</th>
									<th class="headerAdm">פעיל</th>
									<th class="headerAdm">קבוצה</th>
									<th class="headerAdm">אגף</th>
									<th class="headerAdm">שם</th>
									<th class="headerAdm">קוד</th>
									
								</tr>
							</thead>
							<tbody>
								<logic:iterate id="job" name="jobs">
									<tr>
										<td align="center" class="data" style="border-bottom:1px silver solid;"><a href="javascript:viewUpdate(<bzq:string name="job" property="code"></bzq:string>);" style="color:#4477bb;">עדכון</a><span style="color:gray;"> | </span><a href="javascript:deleteJob(<bzq:string name="job" property="code"></bzq:string>);" style="color:#4477bb;">מחיקה</a></td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;">
											<logic:equal value="1" name="job" property="active">כן</logic:equal>
											<logic:equal value="0" name="job" property="active">לא</logic:equal>	
										</td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;"><bzq:integer name="job" property="groupId"/></td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;"><shf:tables tableName="unitCode" name="job" property="orgUnit" scope="page" /> </td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;"><bzq:string name="job" property="description"/></td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;"><bzq:string name="job" property="code"/></td>
										
									</tr>
								</logic:iterate>
							</tbody>
						</table>
					
				
				</div>
				
			</TD>
		</TR>
		<tr>
			<td valign="bottom" style="padding:7px 7px 7px 7px;">
			<html:form action="/admin/manageInnerJobs" type="bzq.shf.forms.InnerJobForm" name="innerJobForm" onsubmit="return validateAddInnerJob();">
			<FIELDSET  style="width:100%;height:100%;background-color:#ffffee;padding:2px;"><LEGEND>הוסף תפקיד חדש</LEGEND>
			<html:hidden property="action" name="innerJobForm" value="add"></html:hidden>
			<table cellpadding="2" cellspacing="4" style="height:100%;">
				<tr>
					<td class=header>תיאור:</td>
					<td><html:text property="description" name="innerJobForm"
						style="font-size:12px; " value=""></html:text></td>
				</tr>
				<tr>
					<td class=header>אגף:</td>
					<td><shf:unitselect tablename="unitCode" name="orgUnit"
						type="E01" style="font-size:12px;" selectedName="innerJobForm" selectedProperty="orgUnit" /></td>
				</tr>
				<tr>
					<td class=header>קבוצה:</td>
					<td><html:text property="groupId" name="innerJobForm" style="font-size:12px;" size="4" maxlength="4"></html:text> </td>
				</tr>
				<tr>
					<td class=header>פעיל:</td>
					<td>
						<html:select property="active" value="1" name="innerJobForm" style="font-size:12px; ">
							<html:option value="1">כן</html:option>
							<html:option value="0">לא</html:option>
						</html:select>
					</td>
				</tr>
				<tr>
					<td><html:submit styleClass="button">שמור</html:submit></td>
				</tr>
			</table>
			</FIELDSET>
			</html:form>
				
			</td>
		</tr>
	</TABLE>
</body>
</html>