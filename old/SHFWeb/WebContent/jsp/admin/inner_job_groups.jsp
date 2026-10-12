<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@page import="bzq.shf.bean.InnerJobBean"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="java.util.Set"%>
<%@page import="java.util.Iterator"%>
<jsp:useBean id="map" class="java.util.Hashtable" scope="request"></jsp:useBean>
<jsp:useBean id="innerJobForm" class="bzq.shf.forms.InnerJobForm" scope="request"></jsp:useBean>

<%@page language="java" contentType="text/html; charset=windows-1255"
	pageEncoding="windows-1255"%>

<html>
<head>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic"%>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

</head>

<body dir=rtl>

	<TABLE cellpadding="0" cellspacing="0" width="100%" height="100%">
		<TR>
			<TD><jsp:include page="../submenu/admin_submenu.jsp" /></TD>
		</TR>
		<TR>
			<TD valign="top" width=100%
				style="padding: 7px 7px 7px 7px; height: 100%;">
				<p>
					קבוצות של תפקידים בפועל באגף: <font color=navy><b><%=SHFTableUtils.getUnitName(innerJobForm.getOrgUnit())%></b></font>
				</p>
				<p>
					לחזרה לטבלת תפקידים בפועל <a href="/shf/admin/manageInnerJobs.do?action=view" style="color:#6688ff;">לחץ כאן</a>
				</p>
				<div id="innerJobGroupContainer" style="overflow-y:auto;height:600px;">
					<%
					Set unGrouped=(Set)map.get(new Integer(0));
					Iterator keysIt=map.keySet().iterator();
					for(;keysIt.hasNext();){ 
						Integer groupNum=(Integer)keysIt.next();
						if(groupNum.intValue()==0) continue;
						Set innerJobs=(Set)map.get(groupNum);
						Iterator jobsIt=innerJobs.iterator();
					%>
					<div id="innerJobGroup">
						<div id="innerJobGroupTitle">
							קבוצה
							<%=groupNum.intValue()%></div>
						<div id="innerJobGroupMembers">
							<lu> <%
							for(;jobsIt.hasNext();){ 
								InnerJobBean job=(InnerJobBean)jobsIt.next();
							%>
							<li><%=job.getDescription() %></li>

							<%}%> </lu>
						</div>
					</div>
					<%}if(unGrouped!=null){%>
					
					<div id="innerJobGroup">
						<div id="innerJobGroupTitle" style="color:yellow">תפקידים ללא קבוצה</div>
						<div id="innerJobGroupMembers">
							<lu> <%
							Iterator jobsIt=unGrouped.iterator();
							int tmp=0;
							for(;jobsIt.hasNext();){ 
								tmp++;
								InnerJobBean job=(InnerJobBean)jobsIt.next();
								%>
							
							<li><%=job.getDescription() %></li>

							<%}%> </lu>
						</div>
					</div>
					<%} %>
				</div></TD>
		</TR>
	</TABLE>
</body>

</html>