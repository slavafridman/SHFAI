<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.shf.forms.BuildingForm"
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>

<jsp:useBean id="building" class="bzq.shf.forms.BuildingForm" scope="request"></jsp:useBean>

<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>

<html>
<head>
<link rel="stylesheet" type="text/css"
	href="../../dojo/dijit/themes/dijit.css">
<link rel="stylesheet" type="text/css"
	href="../../dojo/dijit/themes/nihilo/nihilo.css">
<link rel="stylesheet" href="../../theme/Master.css" type="text/css">
<title>manage_buildings</title>
<meta http-equiv="Content-Type"
	content="text/html; charset=windows-1255">
<script type="text/javascript"
	djconfig="isDebug: false, parseOnLoad: true"
	src="../../dojo/dojo/dojo.js"></script>
<shf:reloadErrors></shf:reloadErrors>


<script type="text/javascript">
function validateUpdateBuilding(){
	if(document.forms['addBuildingForm'].name.value==null || document.forms['addBuildingForm'].name.value==''){
		alert("נא לרשום את שם האתר");
		return false;
	}
	if(document.forms['addBuildingForm'].address.value==null || document.forms['addBuildingForm'].address.value==''){
		alert("נא לרשום את כתובת האתר");
		return false;
	}
	if(document.forms['addBuildingForm'].seatsNum.value==null || document.forms['addBuildingForm'].seatsNum.value==''){
		alert("נא לרשום את מספר העמדות");
		return false;
	}
	return true;
}



</script>

</head>

<body dir="rtl" class="nihilo">

	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height: 20px;"><jsp:include page="../submenu/admin_submenu.jsp"></jsp:include></TD>
		</TR>


		<TR>
			<TD valign="top" width=100% style="padding:7px 7px 7px 7px;height:100%;" >

				<html:form action="/admin/manageBuildings.do" name="updateBuildingForm" type="bzq.shf.forms.BuildingForm" onsubmit="return validateAddBuilding();">
				<html:hidden property="action" name="addBuildingForm" value="update"></html:hidden>
				<html:hidden property="code" name="addBuildingForm" value="<%=String.valueOf(building.getCode()) %>"></html:hidden>
				<FIELDSET  style="width:100%;height:100%;background-color:#ffffee;padding:2px;">
				<LEGEND>עדכון אתר</LEGEND>
				
				<table cellpadding="2" cellspacing="4" style="height:100%;">
					<tr>
						<td class=header>תיאור:</td>
						<td><html:text property="name" name="updateBuildingForm" style="font-size:12px;width:230px;"  value="<%=building.getName()%>"></html:text></td>
					</tr>
					<tr>
						<td class=header>מוקד:</td>
						<td><shf:unitselect tablename="unitCode" name="orgUnit"	type="G01" style="font-size:12px;" selectedName="building" selectedProperty="orgUnit" /></td>
					</tr>
					<tr>
						<td class=header>כתובת:</td>
						<td><html:text property="address" name="updateBuildingForm" style="font-size:12px;width:230px;" value="<%=building.getAddress()%>"></html:text></td>
					</tr>
					<tr>
						<td class=header>מספר עמדות:</td>
						<td><html:text property="seatsNum" name="updateBuildingForm" style="font-size:12px;width:40px;" maxlength="4" value="<%=String.valueOf(building.getSeatsNum())%>"></html:text></td>
					</tr>
					<tr>
						<td><html:submit styleClass="button">שמור</html:submit></td>
					</tr>
				</table>
				</FIELDSET>
				</html:form>
				
			</TD>
		</TR>
	</TABLE>
</body>
</html>