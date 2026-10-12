<%
response.setHeader("Cache-Control", "no-cache");
response.setHeader("Pragma", "no-cache");
response.addHeader("Cache-Control","no-store");
%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<jsp:useBean id="attendanceForm"
	class="bzq.shf.forms.AttendanceDataForm" scope="request">
</jsp:useBean>
<shf:shftime date="<%=attendanceForm.getStationArrivalTime()%>"></shf:shftime>