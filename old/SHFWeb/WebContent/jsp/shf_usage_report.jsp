<%@ page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>
<!DOCTYPE html PUBLIC "-//W3C//Dtd HTML 4.01 transitional//EN">

<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>

<jsp:useBean id="mobileUsageForm" class="bzq.shf.forms.UsageReportForm" scope="request"/>
<jsp:useBean id="usageRes" class="java.util.Vector" scope="request"/>

<html>
<head>
	<META http-equiv="CACHE-CONTROL" CONTENT="NO-CACHE">
	<META http-equiv="PRAGMA" CONTENT="NO-CACHE">

	<title>shf_usage_report.jsp</title>
	
	<shf:reloadErrors></shf:reloadErrors>
	
	<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
	<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">
	
	<script language="JavaScript" src="/shf/js/calendar.js"></script>
	<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
	
	<script type="text/javascript">
		function subUsageRep() {
			var dateFromStr =  document.mobileReport.dateFrom.value;
			var dateFrom = new Date();
			dateFrom.setHours(0,0,0,0);
			dateFrom.setMonth(parseInt(dateFromStr.split('/')[1], 10) - 1, parseInt(dateFromStr.split('/')[0], 10));
			
			var dateToStr =  document.mobileReport.dateTo.value;
			var dateTo = new Date();
			dateTo.setHours(0,0,0,0);
			dateTo.setMonth(parseInt(dateToStr.split('/')[1],10) - 1, parseInt(dateToStr.split('/')[0], 10));

			if (dateFrom > dateTo ) {
				alert ("ערך בשדה 'מתאריך' צריך להיות \n 'קטן או שווה לערך בשדה 'עד תאריך");
				return;
			}
			document.forms['mobileReport'].action = "/shf/mobile/ReportResult.do";
			document.forms['mobileReport'].target = "";
			document.forms['mobileReport'].submit();
		}
		function exportExcel() {
 			document.forms['mobileReport'].action = "/shf/mobile/ReportExport.do";
			document.forms['mobileReport'].target = "_blank";
			document.forms['mobileReport'].submit();
		}
	
	</script>

</head>
<body class="nihilo">
<form name=mobileReport action="/shf/mobile/ReportResult.do" method="post" >
<table width="100%" height="100%" cellpadding="0" cellspacing="0">
	<tr>
		<td style="height:20px;"><jsp:include page="submenu/emptySubmenu.jsp" /></td>
	</tr>
	<tr>
		<td valign="top" style="padding-top: 10px; padding-bottom: 5px; padding-right: 6px; padding-left: 7px;">
			<fieldset class="form">
				<legend>דו"ח שימוש במובייל</legend>
				
				<table  cellspacing="2" cellpadding="2" width=100%>
					<tr>
						<td class="header" nowrap="nowrap" valign="top">מתאריך :</td>
						<td>
							<shf:calendar calname="dateFrom" name="mobileUsageForm" property="dateFrom" />
						</td>
						<td width="20px"></td>
						<td class="header" nowrap="nowrap" valign="top">עד תאריך :</td>
						<td>
							<shf:calendar calname="dateTo" name="mobileUsageForm" property="dateTo" />
						</td>
						<td width="20px"></td>
						<td class="header" nowrap="nowrap" valign="top">פעולה : </td>
						<td>
							<shf:mobileAction name="formAction" formName="mobileUsageForm" formProperty="formAction" />
						</td>
					</tr>
					<tr>
						<td class="header" nowrap="nowrap" valign="top">מוקד :</td>
						<td>
							<shf:unitselect tablename="unitCode" name="moked" selectedName="mobileUsageForm" selectedProperty="moked" type="G01" all="yes"/>
						</td>
						<td width="20px"></td>
						<td class="header">תפקיד בפועל:</td>
						<td class="data" valign="middle">
							<shf:innerJobCheckList name="mobileUsageForm" tablename="innerJobCode" property="innerJob" length="150" optionsLength="150" />
						</td>
						<td colspan=5></td>
						<td align="left" class="header" align="left">
							<button onclick="subUsageRep();">חפש</button>
						</td>
					</tr>
				</table>
			</fieldset>
		</td>
	</tr>
	<%if (usageRes != null && usageRes.size() > 0) { %>
	<tr>
		<td valign="top" style="padding-right: 7px; padding-left: 7px;"	dir="ltr">
			<table cellspacing="0" cellpadding="0" width="100%"	style="border-top: 1px silver solid; border-left: 1px silver solid; border-right: 1px silver solid;">
				<tr class="tableTotal">
					<td style='text-align: left' width=20px class=tableTotal style="padding-left:2px;padding-top:2px;">
						<img src='/shf/images/excell.png' alt='שמור לאקסל' onclick="exportExcel();" style='cursor: hand;'>
					</td>
					<td style="text-align: right;" class="tableTotal">
						<img src='/shf/images/search.png' height="16px"> נמצאו <%=usageRes.size()%> רשומות
					</td>
				</tr>
			</table>
		</td>
	</tr>
	<%} %>
	<tr>
		<td valign="top" height="100%" style="padding: 0px 7px 7px 7px;" dir="ltr">
			<div style="overflow: auto; border: 1px silver solid; height: 100%;" id="dataGridDiv">
				<jsp:include page="shf_usage_report_table.jsp"></jsp:include>
			</div>
		</td>
	</tr>
	<tr>
		<td align="center" valign="top" id="myExceptionsDiv" style="display: none; padding-top: 0px; padding-right: 7px; padding-left: 7px; padding-bottom: 7px;" dir="ltr"></td>
	</tr>
</table>
</form>
</body>
</html>