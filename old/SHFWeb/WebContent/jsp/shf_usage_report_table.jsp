<%@page import="bzq.shf.utils.TablesConstants"%>
<%@page import="bzq.shf.forms.MobileAuditRefForm"%>
<%@page import="java.util.Vector"%>
<%@page import="bzq.utils.TablesContainer"%>
<%@page import="bzq.utils.AppResources"%>
<%@page import="bzq.shf.utils.SHFConstants"%>
<%@page import="bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="bzq.shf.utils.SHFUtils"%>
<%@page import="bzq.shf.bean.UsageReportBean"%>
<%@ page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>

<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<jsp:useBean id="usageRes" class="java.util.Vector" scope="request"/>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>

<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
	<title>shf_usage_report_table.jsp</title>
	
	<script type="text/javascript">
		var myHeader=[
			"צוות"
			,"מוקד"
			,"תפקיד בפועל"
			,"פעולה"
			,"שם"
			,"שעה"
			,"תאריך"
			];
		var txtColor=['#000','#000','#000','#000','#000','#000','#000','#000'];
	</script>

</head>
<body class="nihilo">
	<%if (usageRes != null && usageRes.size() > 0) { %>
	<script type="text/javascript">
	var myData=[
	<%for (int i=0; i<usageRes.size(); i++) {
		UsageReportBean bean = (UsageReportBean)usageRes.get(i);
//		System.out.println(bean.get);

		AppResources appRes = AppResources.getInstance();
		TablesContainer tc = appRes.getTablesContainer();
		Vector mobileAuditRef = tc.getTable(TablesConstants.MOBILE_AUDIT_REF);
		String actionName = "";
		for (int k=0; k<mobileAuditRef.size(); k++) {
			MobileAuditRefForm ref = (MobileAuditRefForm)mobileAuditRef.get(k);
			if(Integer.valueOf(ref.getCode()).equals( bean.getActionId())) {
				actionName = ref.getDescription();
				break;
			}
		}
		
		String name = BaseConvert.specialCharactersHTML((bean.getFname() + " " + bean.getLname()), false, false);
		
	%>
	[
	'<%=BaseConvert.specialCharactersHTML(SHFTableUtils.getUnitName(bean.getOrgUnitId()), false, false)%>', 
	'<%=BaseConvert.specialCharactersHTML(SHFTableUtils.getUnitName(SHFTableUtils.getMokedCodeOf(bean.getOrgUnitId())), false, false)%>',
	'<%=BaseConvert.specialCharactersHTML(SHFTableUtils.getInnerJobName(bean.getInnerJobId()), false, false)%>',
	'<%=BaseConvert.specialCharactersHTML(actionName, false, false)%>',
	'<shf:employee empid="<%=bean.getEmployeeId()%>" empname="<%=name%>" />',
	'<shf:shftime date="<%=bean.getActionDate()%>"/>',
	'<shf:shfdate  date="<%=bean.getActionDate()%>"/>',
	]
	<%if (i < usageRes.size()-1) { %>,<%}%>
	
	<%} %>
	
	];
	drawGrid2('dataGridDiv');
	</script>	
	
	<%} else { %>
		<div class="gridNoData">אין נתונים</div>
	<%} %>
</body>
</html>