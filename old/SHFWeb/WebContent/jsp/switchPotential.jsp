<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%-- <%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %> --%>
<%@page import="java.net.URLEncoder"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<%@ taglib uri="http://java.sun.com/jsp/jstl/functions" prefix="fn"%>

<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" %>
<%@ page import="bzq.shf.utils.SHFTableUtils, bzq.shf.utils.SHFUtils" %>

<jsp:useBean id="switchPotentials" class="java.util.Vector" scope="request" />
<jsp:useBean id="myReplaceByCritrion" class="bzq.shf.transfer.ReplaceByCritrion" scope="request" />
<jsp:useBean id="offersLeft" type="java.lang.Integer" scope="request" />
<jsp:useBean id="offersLimitAgaf" class="java.lang.String" scope="request" />
<%-- <jsp:useBean id="switchPotentialFormSite" class="java.lang.String" scope="request" /> --%>

<%
String siteName = SHFTableUtils.getMokedNameOfSite(myReplaceByCritrion.getSite());
String endTime = SHFUtils.formatDateToString(myReplaceByCritrion.getEndTime() , "dd/MM/yyyy-HH:mm").split("-")[1];
String startTime = SHFUtils.formatDateToString(myReplaceByCritrion.getStartTime() , "dd/MM/yyyy-HH:mm").split("-")[1];
String startDate = SHFUtils.formatDateToString(myReplaceByCritrion.getStartTime() , "dd/MM/yyyy-HH:mm").split("-")[0];
String unitCode = myReplaceByCritrion.getSwitchPotentialFormSite();
String innerJobId = myReplaceByCritrion.getInnerJob();

%>

<%-- <%@ page import="bzq.shf.bean.AgentDayBean"%>
<%
switchPotentials.add(new AgentDayBean());
 %> --%>

<HTML>
	<HEAD>
		<link rel="stylesheet" type="text/css" href="../dojo/dijit/themes/dijit.css"> 
		<link rel="stylesheet" type="text/css" 	href="../dojo/dijit/themes/nihilo/nihilo.css">
		<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
		<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">
		
		<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
		<META http-equiv="Content-Style-Type" content="text/css">
		<META http-equiv="CACHE-CONTROL" CONTENT="NO-CACHE">
		<META http-equiv="PRAGMA" CONTENT="NO-CACHE">
		
		<TITLE>switchPotential.jsp</TITLE>
		
		<shf:reloadErrors></shf:reloadErrors>
		
		<script src="/shf/js/shfgrid.js"></script>
		<script src="../js/jquery-1.12.0.min.js"></script>
		<script src="../js/shf_responsive.js"></script>
		<script type="text/javascript">
			var multiSelectLimit = <%=offersLeft %>;
			function sendOffer(  ){
				if(selectedRow==null || selectedRow=='') {
					alert("צריך לבחור משמרת להחלפה");
					return;
				} else {
					document.switchPotential.switchPotentialList.value = selectedRow;
					document.switchPotential.submit();
				}
			}
		
		</script>

	</HEAD>
	<BODY class="nihilo">
		<form name="switchPotential" method="get" action="/shf/replace/switchPotential.do" >
			<input type="hidden" name="shiftId" value="<%= myReplaceByCritrion.getShiftId() %>">
			<input type="hidden" name="employeePersonalId" value="<%= myReplaceByCritrion.getEmployeePersonalId() %>">
			<input type="hidden" name="activity" value="<%= myReplaceByCritrion.getActivity() %>">
			<input type="hidden" name="innerJob" value="<%= myReplaceByCritrion.getInnerJob() %>">
			<input type="hidden" name="fullname" value="<%= URLEncoder.encode(myReplaceByCritrion.getFullname(),"WINDOWS-1255") %>">
			<input type="hidden" name="employeeId" value="<%= myReplaceByCritrion.getEmployeeId() %>">
			<input type="hidden" name="employeeOrgUnit" value="<%= myReplaceByCritrion.getEmployeeOrgUnit() %>">
			<input type="hidden" name="switchPotentialList" value="">
			
			<TABLE width=100% height=100% cellpadding="0" cellspacing="0" dir="rtl">
				<TR>
					<TD valign="top" style="height:20px;">
						<jsp:include page="submenu/shift_submenu.jsp"></jsp:include>
					</TD>
				</TR>
				<TR>
					<TD valign=top style="padding-top:3px;padding-bottom:5px;padding-right:7px;padding-left:7px;">
						<table cellspacing="0" cellpadding="2" width="100%">
							<TR>
								<TD>
									<FIELDSET class=form >
										<legend> פוטנציאל משמרות להחלפה לפי סידור עבודה </legend>
										<TABLE cellspacing="0" cellpadding="2" width="48%" style="margin-top: 10px;">
											<TBODY>
												<TR style="marg">
													<td>
														<% if ( siteName != null  && endTime != null && startTime != null && startDate != null ){ %>
															<FIELDSET class="form respRemove">
																<legend>המשמרת שלי</legend>
																<TABLE dir=ltr cellSpacing=0 cellPadding=0 width="100%" align=center>
																<TBODY>
																	<TR align=right>
																		<TH class=header noWrap>מוקד</TH>
																		<TH class=header noWrap>סיום משמרת</TH>
																		<TH class=header noWrap>התחלת משמרת</TH>
																		<TH class=header noWrap>תאריך</TH>
																	</TR>
																	<TR align=right>
																		<TD class=data noWrap><%=siteName %>
																			<input type="hidden" name="site" value="<%= myReplaceByCritrion.getSite() %>" >
																		</TD>
																		<TD class=data noWrap><%=endTime %>
																			<input type="hidden" name="endTime" value="<%= SHFUtils.formatDateToString(myReplaceByCritrion.getEndTime() , "dd/MM/yyyy-HH:mm") %>">
																		</TD>
																		<TD class=data noWrap><%=startTime %>
																			<input type="hidden" name="startTime" value="<%= SHFUtils.formatDateToString(myReplaceByCritrion.getStartTime() , "dd/MM/yyyy-HH:mm") %>">
																		</TD>
																		<TD class=data noWrap><%=startDate %></TD>
																	</TR>
																</TBODY>
																</TABLE>
															</FIELDSET>
														<% } %>
													</td>
												</TR>
												<TR>
													<TD>
														<TABLE>
															<TR>
																<TD class="header">מוקד:</TD>
																<TD class="data">
																	<shf:unitselect tablename="unitCode" name="switchPotentialFormSite" type="G01" all="yes" selectedvalue="<%= unitCode %>"/>
																	<%-- <input type="hidden" name="switchPotentialFormSite" value="<%= switchPotentialFormSite %>"> --%>
																</TD>
																<TD style="width:10px;"></TD>
																<TD class="header" >
																	<div style="width: 97px;overflow: hidden;">
																		<button style = "width: 60px;" onclick="document.forms['switchPotential'].submit(); $(this).next().show();">חפש</button>
																		<span id="spLoader" style="display:none;"><img alt="נא להמתין" src="/shf/images/wait.gif"></span>
																	</div>
																</TD>
															</TR>
														</TABLE>
													</TD>
												</TR>
											</TBODY>
										</TABLE>
									<button style="float: left !important" onclick="top.frMain.location='/shf/shift/shiftMenu.do'; return false;">חזרה</button>
									</FIELDSET>
								
								</TD>
							</TR>
						</table>
					</TD>
				</TR>
				<TR>
					<TD style="float: right; padding-right: 10px;font-size: 12px;" class="respRemove">
						<SPAN>• ניתן לסמן כמה שורות ע"י מקשים CTRL+CLICK</SPAN>
					</TD>
				</TR>
				<TR>
					<c:if test="${ not empty switchPotentials && fn:length(switchPotentials) gt 0 }">
						<TD valign="top" style="padding-right:7px;padding-left:7px;" dir="ltr">
							<TABLE cellspacing=0 cellpadding=0 width=100% style="border-top:1px silver solid;border-left:1px silver solid;border-right:1px silver solid;">
								<TR class=tableTotal >
										<TD style='text-align:left' class=tableTotal style="padding-left:2px;padding-top:2px;">
											<img src='/shf/images/export.png' alt='הצע החלפה' onclick='sendOffer();' style='cursor:hand;' height=17px width=17px>
										</TD>
										<%-- <TD style='text-align:right' width=100% class=tableTotal><img src='/shf/images/search.png' height=16px> נמצאו ${fn:length(switchPotentials)} רשומות</TD> --%>
								</TR>
							</TABLE>
						</TD>
					</c:if>
				</TR>
				<TR>
					<TD height="100%" valign=top style="padding-top:0px;padding-right:7px;padding-left:7px;padding-bottom:7px;" dir="ltr">
						<DIV  style="overflow:auto;border:1px silver solid;height:100%;" id="dataGridDiv">
							<jsp:include page="switchPotential_table.jsp"></jsp:include>
						</DIV>
					</TD>
				</TR>
				<TR>
					<TD align="center" valign="middle" style="padding-top:0px;padding-right:7px;padding-left:7px;padding-bottom:7px;" dir="ltr">
						<DIV  style="width:100%;display:none;overflow:auto;align:center;" id="myExceptionsDiv">
						</DIV>
					</TD>	
				</TR>
			</TABLE>
		</form>
	</BODY>
</HTML>
