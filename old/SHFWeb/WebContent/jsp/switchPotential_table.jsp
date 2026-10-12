<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/fmt" prefix="fmt"%>

<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" import="bzq.shf.bean.AgentDayBean,bzq.shf.utils.SHFUtils" %>

<jsp:useBean id="switchPotentials" class="java.util.Vector" scope="request"/>

<html>
	<HEAD>
	
		<META http-equiv="Content-Type"	content="text/html; charset=WINDOWS-1255">
		<META http-equiv="Content-Style-Type" content="text/css">
		
		<TITLE>switchPotential.jsp</TITLE>
		<shf:reloadErrors></shf:reloadErrors>
		<SCRIPT language="JavaScript">
			var myHeader=[
			"מוקד"
			,"שעת סוף<span style='display: none;' class='respHdr respHdrHide'/>"
			,"שעת התחלה<span style='display: none;' class='respHdr respHdrHide'/>"
			,"תאריך משמרת<span style='display: none;' class='respHdr respHdrHide'/>"
			,"שם"
			,"בחירה<span style='display: none;' class='respHdr respHdrOnly respHdrHide'/>"
			];
			var txtColor=['#000','#000','#000','#000','#000'];
			var selectedRow;
			var onclickActive=true;
			function onclickFunction(){
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
			
		</SCRIPT>
	
	</HEAD>

	<BODY class="nihilo">
	
		<c:choose>
			<c:when test="${ not empty switchPotentials && fn:length(switchPotentials) gt 0}">
				<SCRIPT language="JavaScript">

					var myData=[
					<%
					AgentDayBean shiftBean = null;
					String ename=null;					
					
					for (int i=0; i<switchPotentials.size(); i++) {
					
					shiftBean = (AgentDayBean)switchPotentials.get(i);
					if (shiftBean.getShiftActivity() == null)	// some shifts are exceptions but does not exist in EXCEPTIONS table
						continue; 
					String empname = shiftBean.getFirstName()+" "+shiftBean.getLastName();
					String moked = bzq.shf.utils.SHFTableUtils.getUnitCodeOfSite(shiftBean.getSiteId());
					
					ename = bzq.utils.BaseConvert.specialCharactersHTML(empname,true,true);
					
					%>
					[
						'<shf:tables tableName="unitCode" codeName="<%=String.valueOf(moked)%>"/>',
						'<shf:shftime date="<%=shiftBean.getShiftEnd()%>"/>',
						'<shf:shftime date="<%=shiftBean.getShiftStart()%>"/>',
						'<shf:shfdate date="<%=shiftBean.getShiftStart()%>"/>',
						'<%=ename%>',
						'<input type="checkbox" name="test" class="checkBox respSheckBox" onclick="checkBoxClick(this,event);">',
						'<%="shiftId="+shiftBean.getAgentDayId()
						+"&activity="+shiftBean.getShiftActivity().replace(";","")
						+"&endTime="+SHFUtils.formatDateToString(shiftBean.getShiftEnd(),"dd/MM/yyyy-HH:mm")
						+"&startTime="+SHFUtils.formatDateToString(shiftBean.getShiftStart(),"dd/MM/yyyy-HH:mm")
						+"&employeeId="+shiftBean.getEmployeeId()%>'

					]
					<%if(i<switchPotentials.size()-1){%>,<%}}%>];
		
					drawGrid2Multi('dataGridDiv');
				</SCRIPT>
			</c:when> 
			<c:otherwise>
				<div class="gridNoData">לא קיימות משמרות ליום זה</div>
			</c:otherwise>    
		</c:choose>
	
	</BODY>
</html>
