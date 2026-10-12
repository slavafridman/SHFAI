<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@page import="bzq.forms.TableForm"%>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255"%>
<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");
%> 
<jsp:useBean id="sites" class="java.util.ArrayList" scope="request"></jsp:useBean>
<jsp:useBean id="wfmReportForm" class="bzq.wfm.report.WfmReportForm" scope="request"></jsp:useBean>

<head>
<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">
</head>

<body dir="rtl">

	
		<%
		if(sites!=null && sites.size()>0){
			%>
			
				<select name="siteId" >
				<option value="0">הכל</option>
				<%
				
				String str=null;
				for(int i=0;i<sites.size();i++){
				TableForm site=(TableForm)sites.get(i);
				str="";
				if(wfmReportForm!=null && site.getCode().equals(wfmReportForm.getSiteId())){
					str="selected";
				}
				%>
				<option value="<%=site.getCode()%>" <%=str%> ><%=site.getDescription() %></option>
				<%
				}
				
				 %>
				 </select>
				
			<%
		}else{
		 %>
		 <select name="siteId" disabled="disabled"></select>
		 
		 <%} %>
		
							
</body>