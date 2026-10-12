<%@ page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<jsp:useBean id="peleIWDForm" class="bzq.shf.forms.PeleIWDForm" scope="request"/>
<%@ page import="java.util.Date"%>
<%@ page import="bzq.utils.BaseConvert"%>
<html>
<head>
	<meta http-equiv="cache-control" content="no-cache">
	<meta http-equiv="pragma" content="no-cache">
	<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
	<title>Insert title here</title>
	
	<shf:reloadErrors></shf:reloadErrors>
	
	<style type="text/css">
	 	@import "../dojo/dojo/resources/dojo.css";
	 	@import "../dojo/dijit/themes/tundra/tundra.css";
	 	@import "../dojo/dijit/themes/dijit.css";
 	</style>
	
	<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css" >
	

<!-- 	<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css"> -->
	
	<script language="javascript" src="/shf/js/shfgrid.js"></script>
	<script src="../dojo/dojo/dojo.js" djConfig="isDebug: false, parseOnLoad: true"></script>
	<script type="text/javascript">
		dojo.require("dojo.parser");
		dojo.require("dijit.Dialog");
		dojo.require("dijit.form.Button");
		dojo.require("dijit.layout.ContentPane");	
	</script>
	<script type="text/javascript">
	
	function submitFormPeleIWD() {
		document.getElementById("loadingImgDiv").style.display = "";
		document.forms['peleIWD'].submit();
	}
	
	function namesForDialog(title,nameArr){
		if(!nameArr){
			console.error("invalid params");
			return;		
		}
		if(!title)
			title = "&ensp;רשימת נציגים";
			
		var html = "<div style='font-weight: normal;font-family: \"Arial\"'>";
		
		for (var i = 0; i < nameArr.length; i++){
			html += "<div>"+(i+1)+". "+nameArr[i]+"</div>";
			console.log(nameArr[i]);
		}
		html += "</div>";
		
		openDialog(title, html);
	}
	
	function openDialog(title,content){
		if (!title || !content){
			console.error("invalid params");
			return;
		}
		
		myDialog = new dijit.Dialog({
			id: "myDialogId",
		 	style: "width: 320px",
		 	dir: "rtl",
			title: title,
			content: content
	 	 });
  		myDialog.show();
  	
	  	myDialog.connect(myDialog, "hide", function(e){
	    	dijit.byId("myDialogId").destroy(); 
		});
	}

	</script>
	
</head>
<body class="tundra">
<% if(true){} %>
<form name=peleIWD action="/shf/IWD/peleResult.do" method="post" >
	<input type="hidden" name="userAgaf" value="<%=peleIWDForm.getUserAgaf()%>">
	<table width="100%" height="100%" cellpadding="0" cellspacing="0">
		<tr>
			<td style="height:20px;"><jsp:include page="submenu/emptySubmenu.jsp" /></td>
		</tr>
		<tr>
			<td valign="top" style="padding-top: 10px; padding-bottom: 5px; padding-right: 6px; padding-left: 7px;">
				<fieldset class="form">
					<legend>תזמון לומדות ומבחני ידע IWD</legend>
						<table  cellspacing="2" cellpadding="2" width=100%>
							<tr>
								<td class="header" nowrap="nowrap" valign="top">אגף :</td>
								<td>
									<shf:unitselect tablename="unitCode" name="agaf"
									selectedName="peleIWDForm" selectedProperty="agaf"
									style="width:170px;font-size:10px;" type="<%=bzq.shf.utils.SHFConstants.AGAF_UNIT%>"
									logic="onchange='setMokeds(null,null,true);'"/>
								</td>
								<td class="header" nowrap="nowrap" valign="top">תפקיד בפועל :</td>
								<td>
									<shf:innerJobCheckList name="peleIWDForm" tablename="innerJobCode" property="innerJob" length="150" optionsLength="150" />
								</td>
								<td class="header" nowrap="nowrap" valign="top"></td>
							</tr>
							<tr>
								<td class="header" nowrap="nowrap" valign="top">מוקד :</td>
								<td id="mokedsAjaxResult">
									<shf:unitSelectCheckList name="peleIWDForm" tablename="unitCode" property="moked" length="150" optionsLength="256" 
									type="<%=bzq.shf.utils.SHFConstants.MOKED_UNIT%>" parentunit="<%=peleIWDForm.getAgaf()%>"/>
								</td>
								<td class="header" nowrap="nowrap" valign="top">לומדה :</td>
								<td>
									<shf:moduleSelectCheckList name="peleIWDForm"  property="module" length="150" optionsLength="200"/>
								</td>

								<td class="header" align="left">
									<%=(peleIWDForm.getAllowedActivities() == null ? "" :" <span>ריענון אחרון: "+BaseConvert.dateToString(new Date(),"HH:mm:ss dd/MM/yyyy")+"</span>")%>
								</td>
								<td align="left">
									<button onclick="submitFormPeleIWD();">חפש</button>
								</td>
							</tr>
						</table>
				</fieldset>
			</td>
		</tr>
		<tr>
			<td valign="top" height="100%" style="padding: 0px 7px 7px 7px;" dir="ltr">
				<div id="loadingImgDiv" style="position: absolute; width: 100%; height: 100%; z-index: 200; background: white; filter: alpha(opacity=70);  display: table-cell;vertical-align: middle; text-align: center; display: none;">
					<div style="width: 200px; height: 200px; z-index: 500; border: 1px solid grey; margin-top: 200px;">
						<img  alt="...המתן" src="/shf/images/wait.gif" style="width: 40%; margin-top: 30% !important">
					</div>
				</div>

				<div style="overflow: auto; border: 1px silver solid; height: 100%;" id="dataGridDiv">
					<jsp:include page="peleIWD_table.jsp"></jsp:include>
				</div>

			</td>
		</tr>
		<tr>
			<td align="center" valign="top" id="myExceptionsDiv" style="display: none; padding-top: 0px; padding-right: 7px; padding-left: 7px; padding-bottom: 7px;" dir="ltr"></td>
		</tr>
	</table>
	<input type="hidden" name="moduleId">
	<input type="hidden" name="mokedId">
	<input type="hidden" name="innerJobId">
	<input type="hidden" name="amountPerTiming">
	<input type="hidden" name="intervalSize">
	<input type="hidden" name="totalForTiming">
</form>
<!-- <div id="dialogTableId" dojoType="dijit.Dialog" title="My Dialog Title"> -->
<!--     <div dojoType="dijit.layout.TabContainer" style="width: 200px; height: 300px;"> -->
<!--         <div dojoType="dijit.layout.ContentPane" title="foo">Content of Tab "foo"</div> -->
<!--         <div dojoType="dijit.layout.ContentPane" title="boo">Hi, I'm Tab "boo"</div> -->
<!--     </div> -->
<!-- </div> -->

<!-- <div dojotype="dijit.Dialog" id="dialogTableId" title="" layoutalign="right" align="center"  -->
<!-- 	preload="false" errorMessage="לא ניתן להציג טבלה"  -->
<!-- 	"> -->
<!-- </div> -->

</body>
</html>