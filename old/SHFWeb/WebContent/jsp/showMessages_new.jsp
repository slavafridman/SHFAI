<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.utils.BaseConvert,java.io.PrintWriter"%>
<%@page import="bzq.shf.dao.FactoryDao, bzq.shf.utils.SHFUtils"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>

<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" %>
<%@ page import="bzq.shf.transfer.ReplaceMassage, bzq.shf.utils.SHFUtils"%>

<jsp:useBean id="messages" class="java.util.Vector" scope="request" />

<HTML>
	<HEAD>
		
		<META http-equiv="CACHE-CONTROL" CONTENT="NO-CACHE">
		<META http-equiv="PRAGMA" CONTENT="NO-CACHE">
		<META http-equiv="Content-Type"	content="text/html; charset=WINDOWS-1255">
		<META name="GENERATOR" content="IBM WebSphere Studio">
		<META http-equiv="Content-Style-Type" content="text/css">
		

		<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
		<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">
		
		<TITLE>showMessages_new.jsp</TITLE>
		<style type="text/css">
			@import "../dojo/dojo/resources/dojo.css";
			
			@import "../dojo/dijit/themes/nihilo/nihilo.css";
			
			@import "../dojo/dijit/themes/dijit.css";
		</style>
		<script  src="/shf/js/shfgrid.js"></script>
		<script type="text/javascript" src="../dojo/dojo/dojo.js" djConfig="isDebug: false, parseOnLoad: true"></script>
		<script src="../js/jquery-1.12.0.min.js"></script>
		<script src="../js/shf_responsive.js"></script>
		<SCRIPT type="text/javascript" language="javascript">
			dojo.require("dojo.parser");
			dojo.require("dijit.Dialog");
			window.onload = onLoad;

			function onLoad() {
//				document.getElementById("loadingImgDiv").style.display = "none"; 
			}
			<%
				/* explanation for below html tag <span style='display: none;' class='respHdr'/>
					this tag is for mobile version, respHdr = in title and when expanded, respHdrOnly = in title only
				*/
			%>
			var myHeader=[
				"הערה"
				,"פעולות"
				,"משמרת מוצעת"
				,"משמרת שלי"
				,"נושא<span style='display: none;' class='respHdr'/>"
				,"תאריך"
				,"מאת<span style='display: none;' class='respHdr'/>"
				,"<input type='checkbox' name='selectAllCheckBox' class='checkBox' onclick='selectAllToggle(this);'><span style='display: none;' class='respHdr respHdrOnly respHdrHide'/>"
				,'<span style="display: none;" class="respHdr respHdrOnly respHdrHide"/>'
			];
			var txtColor=['#000','#000','#000','#000','#000','#000','#000','#000'];
			var selectedRow;
			var onclickActive=true;
			var onBeforeclickActive=true;
			function onclickFunction(){
			}
			
			function onBeforeclickFunction(){
			}
			
			<%// TODO IE9 compatibility  %>
			function checkBoxClick(checkBoxObj,event){
				event.cancelBubble = true;
  				var tr = checkBoxObj.parentNode.parentNode;
  				var index = -1;
  				
  				if ($(tr).find('.respColapse').length){
  					var myTr = $(tr).closest('tr.respTrTitle');
  					var allHdrs = $(tr).closest('table.respDataTableRslt').find('tr.respTrTitle');
  					for (var i=0;i<allHdrs.length;i++){
  						if($(allHdrs[i]).is(myTr)){
	  						index = i;
	  						break;
  						}
  					}
  					//console.log($(tr).closest('div#dataGridDiv').find('table.respDataTable').find('tbody tr')[index]);
  					//$($(tr).closest('div#dataGridDiv').find('table.respDataTable').find('tbody tr')[index]).click();
  				}
  				if(index>-1){
  					tr = $(tr).closest('div#dataGridDiv').find('table.respDataTable').find('tbody tr')[index];
  				}
  				var clickEvent;
  				if ( document.createEventObject ) {
  					clickEvent = document.createEventObject(window.event);
  				} else {
  					clickEvent = jQuery.Event( "click" );
  				}
  							
                clickEvent.ctrlKey = 1;  // ctrl click
                if ( tr.fireEvent ) {
					 tr.fireEvent ("onclick", clickEvent);
				} else {
					$(tr).trigger( clickEvent );
				}
				
			}
			function deleteMessages() {
				if(selectedRow == null || selectedRow=='') {
					alert("אנא בחר הודעה/ות למחיקה");
					return;
				} else {
					if ( confirm("? האם ברצונך למחוק את ההודעות המסומנות\n שים לב! במידה ויש הצעות להחלפה\n רלוונטיות עבורך הן ידחו אוטומטית") ) {
						document.messagesFormDelete.selectedRows.value = selectedRow;	
						document.messagesFormDelete.submit();
//						document.getElementById("loadingImgDiv").style.display = ""; 
						document.getElementById("deleteMessagesImg").onclick = function() { return true; };
						document.getElementById("acceptOfferImg").onclick = function() { return true; };
					}
				}
			}
			
			function acceptOffer() {
				if( ! selectedRow || selectedRow == '') {
					alert("אנא בחר הצעה להחלפה");
					return;
				} else if (selectedRow.split(";").length > 1) {
					alert("פעולה זו אפשרית על שורה מסומנת אחת");
					return;
				} else if (selectedRow.indexOf("msgType") == -1) {
					alert("לא ניתן לבצע פעולה זו");
					return;
				} else if (selectedRow.substring(selectedRow.indexOf("msgType"), selectedRow.length).split("&")[0].split("=")[1] != '<%= FactoryDao.MSG_TYPE_OFFER_REPLACE%>') {
					alert("זוהי איננה הצעה להחלפה, אנא בחר הצעה מתאימה ונסה שנית");
					return;
				} else {
				var test = selectedRow.substring(selectedRow.indexOf("msgType"), selectedRow.length).split("&")[0].split("=")[1];
					document.messagesFormAcceptOffer.selectedRows.value = selectedRow;	
					document.messagesFormAcceptOffer.submit();
					document.getElementById("loadingImgDiv").style.display = "";
					document.getElementById("acceptOfferImg").onclick = function() { return true; };
					document.getElementById("deleteMessagesImg").onclick = function() { return true; };
				}
			}
			
			function selectAllToggle(btnObj) {
				selectedRow = "";
				var allCheckBoxes = document.getElementsByName("msgSelect");
				var alltable = document.getElementById('dataTable');
				var rows = alltable.getElementsByTagName('tr');
				
				if (btnObj.checked) {
					for (var i=0; i<myData.length; i++) {
						selectedRow += myData[i][myData[i].length-1];
						if (i < myData.length-1) { selectedRow += ";"; }
						allCheckBoxes[i].checked = true;
					}
					for(i=0;i<rows.length;i++) {
						var cells = rows[i].getElementsByTagName('td');
						for(var j=0; j<cells.length; j++) {
						if (j == 0) {
							continue;
						}
							cells[j].className = 'tr_selected';
						}
					}
					
				} else {
					for (var i=0; i<allCheckBoxes.length; i++) {
						allCheckBoxes[i].checked = false;
					}
					for(i=0;i<rows.length;i++) {
						var cells = rows[i].getElementsByTagName('td');
						for(var j=0; j<cells.length; j++){
							if(i%2==0) cells[j].className='grid_td';
							else cells[j].className='grid_td2';
						}
					}
				}
//				alert(selectedRow);
			}


		</SCRIPT>
		
		
		<shf:reloadErrors></shf:reloadErrors>
	
	</HEAD>
	<BODY class="nihilo" style="text-align: center;">

	<span style="height: 1%;"><jsp:include page="submenu/emptySubmenu.jsp"></jsp:include></span>
	<div id="loadingImgDiv" style="position: absolute; width: 100%; height: 100%; z-index: 200; background: white; filter: alpha(opacity=70); top: 1px; left: 1px; display: none;">
		<div style="margin-left: 50%; margin-top: 15%; width: 200px; height: 200px; z-index: 500; border: 1px solid grey; ">
			<img  alt="...המתן" src="/shf/images/wait.gif" style="width: 40%; width: 40%; margin-left: 35%; margin-top: 35%;">
		</div>
	</div>
	<% if (messages != null & messages.size() > 0) { %>
	<div class="tableMainWrapper">
		<table  class="messageMainTable">
			<TR class=tableTotal >
				<TD class="tableTotal">
					<div >
						<img id="acceptOfferImg" src='/shf/images/handshake.png' alt='בצע החלפה עם המשמרת המסומנת' onclick='acceptOffer();' style='cursor:hand; float: left; margin-right:15px; margin-left:5px' height="20px">
						<img id="deleteMessagesImg" src='/shf/images/delete-16.png' alt='מחק הודעות שנבחרו' onclick='deleteMessages();' style='cursor: hand;float: left; margin-right:15px' height="18px">
						<img src='/shf/images/search.png' height=16px> נמצאו <%=messages.size()%> 
						הודעות
					</div>
				</TD>
			</TR>
			<tr>
				<td >
					<div  style="overflow:auto; height: 100%; width: 100%"  id="dataGridDiv">
						<SCRIPT language="JavaScript">
							var myData=[
							<% for (int i=0; i<messages.size(); i++) { %>
							<% ReplaceMassage msg = (ReplaceMassage)messages.get(i);%>
							<% String params = "id="+msg.getId()
								+"&empId="+msg.getEmpId()
								+((msg.getMsgType() == null) ? "" : "&msgType="+msg.getMsgType())
								+((msg.getShiftId() == 0) ? "" : "&shiftId="+msg.getShiftId())
								+((msg.getShiftStart() == null) ? "" : "&shiftStart="+SHFUtils.formatDateToString(msg.getShiftStart(),"dd/MM/yyyy-HH:mm") )
								+((msg.getShiftEnd() == null) ? "" : "&shiftEnd="+SHFUtils.formatDateToString(msg.getShiftEnd(),"dd/MM/yyyy-HH:mm") )
								+((msg.getOfferShiftId() == 0) ? "" : "&offerShiftId="+msg.getOfferShiftId() )
								+((msg.getOfferShiftStart() == null) ? "" : "&offerShiftStart="+SHFUtils.formatDateToString(msg.getOfferShiftStart(),"dd/MM/yyyy-HH:mm") )
								+((msg.getOfferShiftEnd() == null) ? "" : "&offerShiftEnd="+SHFUtils.formatDateToString(msg.getOfferShiftEnd(),"dd/MM/yyyy-HH:mm") )
								+((msg.getOfferEmployeeId() == 0) ? "" : "&offerEmployeeId="+msg.getOfferEmployeeId() );%>
							[
							<% if (msg.getNote() != null ) { %>
							'<div dojoType="dijit.Dialog" id="dialogNote<%=i%>" dir=rtl style="font-size:14px;width:350px;font-weight:normal;" ><%=msg.getNote().replaceAll("[\n\r]", " ")%></div><a href="javascript:dijit.byId(\'dialogNote<%=i%>\').show();" style="color:navy;"/>הצג</a>',
							<% } else {%>'',
							<%}%>
							'<%=(msg.getMsgType() == null) ? "" :( msg.getMsgType().equals(FactoryDao.MSG_TYPE_OFFER_REPLACE) ) ? "<a href=\"#\" onclick=\"selectedRow=\\'"+params+"\\' ; deleteMessages();\">דחה ומחק</a>&nbsp; | &nbsp;<a href=\"#\" onclick=\"selectedRow=\\'"+params+"\\' ; acceptOffer();\">אישור</a>" : "<a href=\"#\" onclick=\"selectedRow=\\'"+params+"\\' ; deleteMessages();\">מחק</a>" %>',
//							'<div dojoType="dijit.Dialog" id="dialogContents<%=i%>" dir=rtl style="font-size:14px;width:350px;font-weight:normal;" ><%=msg.getText().replaceAll("[\n\r]", " ")%></div><a href="javascript:dijit.byId(\'dialogContents<%=i%>\').show();" style="color:navy;"/>הצג</a>',
							'<%=(msg.getOfferShiftStart() == null) ? "" : SHFUtils.formatDateToString(msg.getOfferShiftEnd(),"HH:mm")+"-"+SHFUtils.formatDateToString(msg.getOfferShiftStart(),"HH:mm dd/MM/yyyy")%>',
							'<%=(msg.getShiftStart() == null) ? "" : SHFUtils.formatDateToString(msg.getShiftEnd(),"HH:mm")+"-"+SHFUtils.formatDateToString(msg.getShiftStart(),"HH:mm dd/MM/yyyy")%>',
							'<%=msg.getSubject()%>',
							'<%=SHFUtils.formatDateToString(msg.getCreationDate(),"HH:mm dd/MM/yyyy")%>',
							'<%=(msg.getOfferFullName()==null) ? "" : BaseConvert.specialCharacters(msg.getOfferFullName()) %>',
							'<input type="checkbox" name="msgSelect" class="msg checkBox" onclick="checkBoxClick(this,event);">',
							'<%= ( "0".equals(msg.getIsRead()) ) ? "<img src=\"/shf/images/msg_error.gif\" alt=\"חדש\" title=\"הודעה חדשה\"></img>" : "" %>',
							'<%=params%>'
							]
							<% if( i < messages.size()-1){%>,<%}}%>];
							drawGrid2Multi('dataGridDiv');
						</SCRIPT>
					</div>
				</td>
			</tr>
		</table>
	</div>
	<% } else {%>

		<div class="gridNoData" style="margin: 8px; border:1px silver solid; font-weight: normal;">אין לך הודעות</div>
	
	<% } %>
	<form name="messagesFormDelete" method="post" action="/shf/messages/deleteMessages.do">
		<input type="hidden" name="selectedRows" val="" />
	</form>
		<form name="messagesFormAcceptOffer" method="post" action="/shf/messages/acceptOffer.do">
		<input type="hidden" name="selectedRows" val="" />
	</form>
			<%if ("true".equals(request.getAttribute("messageAcceptOffer")) ) { %>
			<script type="text/javascript">
				alert('ההחלפה בוצעה בהצלחה');
			</script>
		<%} else if ("false".equals(request.getAttribute("messageAcceptOffer"))) {%>
			<script type="text/javascript">
				alert('לא ניתן לבצע החלפה');
			</script>
		<%} %>
	</BODY>
</HTML>
