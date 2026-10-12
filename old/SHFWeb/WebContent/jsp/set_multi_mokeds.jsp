<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

String parent = request.getParameter("agaf");

%>
<jsp:useBean id="peleIWDForm" class="bzq.shf.forms.PeleIWDForm" scope="request"/>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255"%>
<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
	
<%	if(parent == null || parent.equals("-1")){ %>
		<shf:unitselect tablename="unitCode" name="moked"
		style="width:170px;font-size:10px;" type="<%=bzq.shf.utils.SHFConstants.MOKED_UNIT%>" all="yes"
		type="999" logic="disabled"/>
<%}	else { %>
		<shf:unitSelectCheckList name="peleIWDForm" tablename="unitCode" property="moked" length="150" optionsLength="256" type="<%=bzq.shf.utils.SHFConstants.MOKED_UNIT%>" parentunit="<%=parent %>"/>
<%}%>
