<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>
<jsp:useBean id="poolExtAllocBean" class="bzq.shf.bean.PoolExtAllocBean" scope="request"></jsp:useBean>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%
	String actionResult = poolExtAllocBean.getTechMessageCode() == 1 || poolExtAllocBean.getTechMessageCode() == 101 || poolExtAllocBean.getTechMessageCode() == 104 ? "true" : "false";
 %>

<div style="height: 80px; width: 360px; display: inline-block;">
	<div><%=poolExtAllocBean.getDisplayMsg() %></div>
	<div style="text-align: center;position: absolute; bottom: 0; width: 100%; height: 40px;">		
		<button dojoType="dijit.form.Button"  id="poolConfirmButton" onclick="closeShiftAllocReleaseDialog(<%=actionResult%>,<%=poolExtAllocBean.getExtensionId()%> )" >אישור</button>
	</div>
</div>