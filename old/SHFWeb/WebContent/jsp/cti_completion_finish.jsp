<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<jsp:useBean id="errors" class="java.util.Vector" scope="request"></jsp:useBean>
<jsp:useBean id="errorSet" class="java.util.HashSet" scope="request"></jsp:useBean>

<%@page language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>
	


<%@page import="bzq.shf.bean.EmployeeBean"%>
<%@page import="java.util.Iterator"%><html>
<head>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>

<link rel="stylesheet" href="../theme/Master.css" type="text/css">
<title>cti_completion_finish</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">

<shf:reloadErrors></shf:reloadErrors>

</head>
<body dir="rtl">
	<TABLE width="100%" height="100%" cellpadding="0" cellspacing="0">
		<TR>
			<TD dir="rtl" valign="top" style="height: 20px;"><jsp:include page="submenu/cti_submenu.jsp"></jsp:include> </TD>
		</TR>			
		<TR>
			<TD width="100%" height="100%" valign="top" style="padding-top: 3px; padding-bottom: 5px; padding-right: 6px; padding-left: 6px;">
				
				<table height="100%" width="100%">
					<TR>
					
					<TD valign="top">
					<FIELDSET class="form"">
						<legend>דיווח שעות נוכחות</legend>
						
								<%if((errors!=null && errors.size()>0)||(errorSet!=null && errorSet.size()>0)){ %>
								<p style="color:red;font-weight:bold;">התהליך הסתיים ללא הצלחה<br>שים לב לרשימת העובדים השגויים בצד שמאל.  </p>
								<%}else{%>
								<p style="color:#338833;font-weight:bold;">התהליך הסתיים בהצלחה.</p>
								<%}%>
								
					</FIELDSET>
					</TD>
					<%if(errors!=null && errors.size()>0){%>
					<TD valign="top" rowspan="2" height="100%">
						<div style="height:100%;overflow:auto;">
						<FIELDSET class="form" >
						<legend>שגויים</legend>
						
						
						<table width="100%">
							<%
							for(int i=0;i<errors.size();i++){
								EmployeeBean employee=(EmployeeBean)errors.get(i);				
							%>
								<TR>
								<TD class="data"><%=employee.getFname()+" "+employee.getLname()%></TD>
								<TD width="10px"></TD>
								<TD class="data"><shf:tables tableName="unitCode" codeName="<%=employee.getOrgUnitId()%>"/> </TD>
								
								</TR>	
							<%}%>
						</table>
						
						
						
						
						</FIELDSET>
						</div>
					</TD>
					<%} %>
					</TR>
					<TR>
					<TD valign="top" style="height:100%;padding:7px;">
						
						<% 
						
						if(errorSet!=null && errorSet.size()>0){
						%>
						<span class="header">שגיאות:</span>
						<%
						Iterator it=errorSet.iterator();
						while(it.hasNext()){
						try{
						%>
							<li><bean:message key="<%=(String)it.next()%>"/></li>
						<%}catch(Exception e){}}}%>
					</TD>
					</TR>
				</table>
			</TD>
		</TR>
		
	</TABLE>
</body>
</html>