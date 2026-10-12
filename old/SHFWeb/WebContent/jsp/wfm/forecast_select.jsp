<%@page import="bzq.forms.TableForm"%>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255"%>
<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");
%> 
<jsp:useBean id="forecasts" class="java.util.ArrayList" scope="request"></jsp:useBean>
<jsp:useBean id="wfmReportForm" class="bzq.wfm.report.WfmReportForm" scope="request"></jsp:useBean>

<META http-equiv="Content-Type" content="text/html; charset=WINDOWS-1255">


<body dir="rtl">

	
		<%
		if(forecasts!=null && forecasts.size()>0){
			%>
			
				<select name="forecastId" >
				<option value="0">ללא</option>
				<%
				
				String str=null;
				for(int i=0;i<forecasts.size();i++){
				TableForm forecast=(TableForm)forecasts.get(i);
				str="";
				if(wfmReportForm!=null && forecast.getCode().equals(wfmReportForm.getForecastId())){
					str="selected";
				}
				%>
				<option value="<%=forecast.getCode()%>" <%=str%> ><%=forecast.getDescription() %></option>
				<%
				}
				
				 %>
				 </select>
				
			<%
		}else{
		 %>
		 <select name="forecastId" disabled="disabled"></select>
		 
		 <%} %>
		
							
</body>