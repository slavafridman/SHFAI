<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");

String moked=request.getParameter("moked");
String formName=request.getParameter("formName");
String property=request.getParameter("property");
int optionsLength=Integer.parseInt(request.getParameter("optionsLength"));

%> 

<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255"%>
<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">

<shf:orgunitCheckList parentUnit="<%=moked%>" name="<%=formName%>" type="J01" property="<%=property%>" optionsLength="<%=optionsLength%>" length="160"></shf:orgunitCheckList> 
