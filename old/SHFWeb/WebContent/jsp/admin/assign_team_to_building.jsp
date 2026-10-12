<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.shf.forms.BuildingForm"
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>

<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>
<%@taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>

<html>
<head>

<link rel="stylesheet" href="../../theme/Master.css" type="text/css">

<title>manage_buildings</title>
<meta http-equiv="Content-Type"
	content="text/html; charset=windows-1255">

<shf:reloadErrors></shf:reloadErrors>


<script type="text/javascript">
function buildingChanged(team){
	var bld=document.getElementById("building"+team).value;
	document.getElementById("action"+team).innerHTML="<button onclick=saveTeam('" +team+ "'," +bld+ ")>שמירה</button>";
}

function saveTeam(team,building){
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
			if( xmlHttp.responseText.match("success") != null ){
				document.getElementById("action"+team).innerHTML="<font color=#559955>העדכון בוצע בהצלחה</font>";
			}else{
				document.getElementById("action"+team).innerHTML="<font color=#995555>אירעה שגיאה</font>";
				replaceMessage(team,building);
			}
        }
	}
	xmlHttp.open("GET","/shf/admin/updateTeamBuilding.do?code="+team+"&buildingId="+building);
	xmlHttp.send(null);
}

function replaceMessage(team,bldng){
	
	setTimeout("document.getElementById(\"action"+team+").innerHTML=\"<button onclick=saveTeam('" +team+ "'," +bldng+")>שמירה</button>\"",2000);
}

function load(){
	document.getElementById("teamsDiv").style.height=document.body.clientHeight-80;
}
</script>

</head>

<body dir="rtl" onload="load();">
	
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height: 20px;"><jsp:include page="../submenu/admin_submenu.jsp"></jsp:include></TD>
		</TR>


		<TR>
			<TD valign="top" width=100% style="padding:10px;" >
				<h3><shf:tables tableName="unitCode" codeName="${moked}" /></h3>
				<button type="button" onclick="javascript:navigate('/shf/admin/manageBuildings.do?action=view');">חזרה</button>
				<br><br>
				<div style="overflow:auto;" id="teamsDiv">
				<table cellpadding="3" cellspacing="3" style="border:1px silver solid;">
				<c:forEach var="team" items="${teams}" varStatus="sts"> 
					<tr>
						<td style="background-color:#f4f4f4;color:#567899;">${sts.index + 1 }</td>
						<td style="background-color:#f4f4f4;">${team.description }</td>
						<td style="background-color:#f4f4f4;"><shf:buildingSelectTag teamId="${team.code}" building="${team.buildingId}" moked="${moked}" onchange="buildingChanged('${team.code}');" /> </td>
						<td style="background-color:#f4f4f4;" id="action${team.code}"></td>
					</tr>
				</c:forEach>
				</table>
				</div>
			</TD>
		</TR>
		
	</TABLE>
</body>
</html>