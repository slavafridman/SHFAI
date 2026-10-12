
<%
response.setHeader("Content-Disposition","attachment;filename=shifter_tmpfile.csv;");
response.setHeader("Pragma","no-chache");
String headers=request.getParameter("headers");
out.println(headers);

%>
