<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.shf.forms.BuildingForm"
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>

<jsp:useBean id="buildings" class="java.util.ArrayList" scope="request"></jsp:useBean>
<jsp:useBean id="building" class="bzq.shf.forms.BuildingForm" scope="page"></jsp:useBean>
<jsp:useBean id="addBuildingForm" class="bzq.shf.forms.BuildingForm" scope="request"></jsp:useBean>

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
function validateAddBuilding(){
	if(document.forms['addBuildingForm'].name.value==null || document.forms['addBuildingForm'].name.value==''){
		alert("נא לרשום את שם האתר");
		document.getElementById('nameDesc').focus();
		//document.forms['addBuildingForm'].name.focus=true;
		return false;
	}
	if(document.forms['addBuildingForm'].address.value==null || document.forms['addBuildingForm'].address.value==''){
		alert("נא לרשום את כתובת האתר"); 
		document.getElementById('siteAddress').focus();
		return false;
	}
	if(document.forms['addBuildingForm'].seatsNum.value==null || document.forms['addBuildingForm'].seatsNum.value==''){
		alert("נא לרשום את מספר העמדות"); 
		document.getElementById('seatsAmount').focus();
		return false;
	}
	return true;
}


function viewUpdate(bcode){
	document.forms['updateBuildingForm'].code.value=bcode;
	document.forms['updateBuildingForm'].action.value='view_update';
	document.forms['updateBuildingForm'].submit();
}


function deleteBuilding(bcode){
	var accept=confirm("? האם אתה בטוח שברצונך למחוק את האתר\n (במידה וקיים שיוך צוותים לאתר, השיוך יתבטל)");
	if(accept){
		document.forms['updateBuildingForm'].code.value=bcode;
		document.forms['updateBuildingForm'].action.value='delete';
		document.forms['updateBuildingForm'].submit();
	}
}
</script>

</head>

<body dir="rtl" class="nihilo">

	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height: 20px;"><jsp:include page="../submenu/admin_submenu.jsp"></jsp:include></TD>
		</TR>

		<TR>
			<TD style="padding:7px 7px 7px 7px;font-size:16px;" valign="top" class="header">רשימת אתרים</TD>
		</TR>
		
		<TR>
			<TD valign="top" width=100% style="padding:7px 7px 7px 7px;height:100%;" >
				
				
				<div  style="width:100%;height:100%;overflow:auto;border:solid 1px silver;">
				
						<table width=100% dir="ltr" cellspacing="0">
							<thead>
								<tr bgcolor="white">
									<th>&nbsp;</th>
									<th class="headerAdm">מספר עמדות</th>
									<th class="headerAdm">מוקד</th>
									<th class="headerAdm">כתובת</th>
									<th class="headerAdm">שם</th>
									<th class="headerAdm">קוד</th>
								</tr>
							</thead>
							<tbody>
								<%if(buildings!=null){
									for(int i=0;i<buildings.size();i++){
										building=(BuildingForm)buildings.get(i);
								 %>
									<tr>
										<td align="center" class="data" style="border-bottom:1px silver solid;"><a href="javascript:viewUpdate(<%=building.getCode() %>);" style="color:#4477bb;">עדכון</a><span style="color:gray;"> | </span><a href="javascript:deleteBuilding(<%=building.getCode() %>);" style="color:#4477bb;">מחיקה</a></td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;"><%=building.getSeatsNum() %></td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;"><a href="/shf/admin/assignTeamToBuilding.do?orgUnit=<%=building.getOrgUnit()%>"><shf:tables tableName="unitCode" codeName="<%=building.getOrgUnit() %>" /></a> </td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;"><%=building.getAddress() %></td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;"><%=building.getName() %></td>
										<td align="center" class="data" style="border-bottom:1px silver solid;border-left:1px silver solid;"><%=building.getCode() %></td>
										
									</tr>
								<%}
								} %>
							</tbody>
						</table>
					
				
				</div>
				
			</TD>
		</TR>
		
		<TR>
			<TD style="padding:6 6 6 6;">
				<html:form action="/admin/manageBuildings.do" name="addBuildingForm" type="bzq.shf.forms.BuildingForm" onsubmit="return validateAddBuilding();">
				<html:hidden property="action" name="addBuildingForm" value="add"></html:hidden>
				<FIELDSET  style="width:100%;height:100%;background-color:#ffffee;padding:2px;">
				<LEGEND>הוסף אתר חדש</LEGEND>
				
				<table cellpadding="2" cellspacing="4" style="height:100%;">
					<tr>
						<td class=header>תיאור:</td>
						<td><input id="nameDesc" name="name" style="font-size:12px;width:230px;" value="<bzq:string name="addBuildingForm" property="name"/>" /> </td>
					</tr>
					<tr>
						<td class=header>מוקד:</td>
						<td><shf:unitselect tablename="unitCode" name="orgUnit"	type="G01" style="font-size:12px;" selectedName="addBuildingForm" selectedProperty="orgUnit" /></td>
					</tr>
					<tr>
						<td class=header>כתובת:</td>
						<td><html:text  styleId="siteAddress" property="address" name="addBuildingForm" style="font-size:12px;width:230px;" ></html:text></td>
					</tr>
					<tr>
						<td class=header>מספר עמדות:</td>
						<td><html:text styleId="seatsAmount" property="seatsNum" name="addBuildingForm" style="font-size:12px;width:40px;" maxlength="4" value=""></html:text></td>
					</tr>
					<tr>
						<td><html:submit styleClass="button">שמור</html:submit></td>
					</tr>
				</table>
				</FIELDSET>
				</html:form>
				
				<html:form action="/admin/manageBuildings.do" name="updateBuildingForm" type="bzq.shf.forms.BuildingForm">
				<html:hidden property="action" name="updateBuildingForm"></html:hidden>
				<html:hidden property="code" name="updateBuildingForm"></html:hidden>
				</html:form>
			</TD>
		</TR>
	</TABLE>

</body>
</html>