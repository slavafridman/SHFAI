<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN"><%@page
	language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>
	
	<jsp:useBean id="innerJobForm" scope="request" type="bzq.shf.forms.InnerJobForm"></jsp:useBean>

<html>
<head>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>

<link rel="stylesheet" href="../../theme/Master.css" type="text/css">
<title>update_inner_job</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">
</head>
<BODY style="height:100%;width:100%">
	<div  style="width:100%;visibility:visible;height:100%;">
		<html:form action="/admin/manageInnerJobs" type="bzq.shf.forms.InnerJobForm" name="innerJobForm" onsubmit="return validateAddInnerJob();">	
		<html:hidden name="innerJobForm" property="action" value="update"></html:hidden>
		<html:hidden name="innerJobForm" property="code"></html:hidden>
			<table style="height:90%;width:100%;background-color:transparent;">
				<TR>
					<TD width="100%" height="100%" valign="top">
			
						<table width="100%" height="100%">
							<tr>
								<td valign="top" height="100%" width="100%">		
									<fieldset style="margin-right:30px;margin-top:100px;position:absolute;width:400px;direction:rtl;background-color:#ffffea;">
									<legend><img src="/shf/images/close_window.gif" style="cursor:hand" alt="סגור" onclick="clear_popup('popupDiv');"> עדכון פרטי תפקיד </legend>
										<TABLE width="100%" height="100%" cellpadding="2"  cellspacing="2">
											<TBODY>
												<TR>
													<TD style="padding:5px;">
														<table cellpadding="2" cellspacing="4" style="height:100%;">
															<tr>
																<td class=header>תיאור:</td>
																<td><html:text property="description" name="innerJobForm" style="font-size:12px;" /></td>
															</tr>
															<tr>
																<td class=header>אגף:</td>
																<td><shf:unitselect selectedName="innerJobForm" selectedProperty="orgUnit" tablename="unitCode" name="orgUnit" type="E01" style="font-size:12px;"  /></td>
															</tr>
															<tr>
																<td class=header>קבוצה:</td>
																<td><html:text property="groupId" size="4" maxlength="4" name="innerJobForm" style="font-size:12px;" /></td>
															</tr>
															<tr>
																<td class=header>פעיל:</td>
																<td>
																	<html:select property="active" name="innerJobForm" style="font-size:12px; ">
																		<html:option value="1">כן</html:option>
																		<html:option value="0">לא</html:option>
																	</html:select>
																</td>
															</tr>
															<tr>
																<td colspan=2 style="padding-top:10px;"><html:submit styleClass="button" >שמור</html:submit>
																&nbsp;&nbsp;<html:button styleClass="button" property="" onclick="clear_popup('popupDiv');">ביטול</html:button></td>
															</tr>
														</table>
													</TD>
												</TR>
											</TBODY>
										</TABLE>
									</fieldset>
								</td>
							</tr>
						</table>
					</TD>
				</TR>
			</table>
		</html:form>
	</div>
</body>
</html>