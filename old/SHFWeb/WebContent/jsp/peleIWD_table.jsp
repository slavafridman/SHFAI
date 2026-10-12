<%@ page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>

<jsp:useBean id="empAndModules" class="java.util.Vector" scope="request"/>
<jsp:useBean id="iwdLimit" class="java.lang.String" scope="request"/>


<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>

<%@page import="bzq.shf.bean.PeleIWDBean"%>
<%@page import="bzq.shf.bean.BreakBean,bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="bzq.utils.BaseConvert"%>
<%@page import="java.util.Vector"%>
<%@page import="bzq.utils.BaseConvert"%>

<%
	String desc = "תיאור פעילות";
	String start = "תאריך התחלה";
	String stop = "תאריך סיום";
	String duration = "משך<br/> (דק')";
	String moked = "מוקד";
	String innerJob = "תפקיד בפועל";
	String totalReq = "<span title=\\\"כלל האוכלוסיה שנדרשה לביצוע לפי מע' פל''א נכון לאתמול\\\">סה''כ <br/>נדרשו</span>";
	String totalCompleted = "<span title=\\\"השלימו את הלומדה לפי מע' פל''א נכון לאתמול\\\">סה''כ <br/>השלימו</span>";
	String sent = "<span title=>נשלחו <br/>ל IWD</span>";
	String scheduled = "<span title=>תוזמנו<br/>ולא נשלחו</span>";
	String available = "<span title=>לא<br/> תוזמנו</span>";
	String perTiming = "<span title=>כמות לכל<br/> תזמון (מקס' "+iwdLimit+")</span>";
	String interval = "<span title=>אינטרוול<br/> (דק')</span>";
	String totalForTiming = "<span title=>סה''כ<br/> לתזמן</span>";
	String actions = "<span title=>פעולות לביצוע</span>";
%>


<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">

	<title>Insert title here</title>
	<script type="text/javascript">

		var iwdMaxPerTiming = <%=iwdLimit%>;
		var myHeader=["<%=actions%>","<%=totalForTiming%>","<%=interval%>","<%=perTiming%>","<%=available%>","<%=scheduled%>","<%=sent%>","<%=totalCompleted%>","<%=totalReq%>","<%=innerJob%>","<%=moked%>","<%=duration%>","<%=stop%>","<%=start%>","<%=desc%>"];
		var txtColor=['#000','#000','#000','#000','#FF0000','#000','#008000','#000','#000','#000','#000','#000','#000','#000'];
		var selectedRow;
		
		function doSched(rowNum, moduleId, mokedId, innerJobId) {
		
			var amountPerTiming = document.getElementById('perTiming'+rowNum).value;
			var intervalSize = document.getElementById('intervalSize'+rowNum).value;
			var notSchedForModule = document.getElementById('notSchedForModule'+rowNum).value;
			var totalForTiming = document.getElementById('totalForTiming'+rowNum).value;
			
			if ( ! checkEmptyOrNaN(amountPerTiming,'כמות נציגים לכל תזמון')) {return false;}
			if ( ! checkEmptyOrNaN(intervalSize,'אינטרוול בין תזמונים')) {return false;}
			if ( ! checkEmptyOrNaN(totalForTiming,'סה"כ נציגים לתזמן')) {return false;}
			
			amountPerTiming = parseInt(amountPerTiming, 10);
			totalForTiming = parseInt(totalForTiming, 10);
			notSchedForModule = parseInt(notSchedForModule, 10);

			if (amountPerTiming > iwdMaxPerTiming) {
				alert('כמות נציגים לכל תזמון אינה יכולה להיות גדולה ממקסימום-' + iwdMaxPerTiming);
				return false;
			}
			if (amountPerTiming > totalForTiming) {
				alert('כמות נציגים לכל תזמון אינה יכולה להיות גדולה מערך \n ('+totalForTiming+') "בעמודת "סה"כ נציגים לתזמן' );
				return false;
			}
			if (totalForTiming > notSchedForModule) {
				alert('כמות סה\"כ נציגים לתזמן אינה יכולה להיות גדולה מערך \n ('+notSchedForModule+') "בעמודת "לא תוזמנו' );
				return false;
			}
			document.peleIWD.moduleId.value = moduleId;
			document.peleIWD.mokedId.value = mokedId;
			document.peleIWD.innerJobId.value = innerJobId;
			document.peleIWD.amountPerTiming.value = amountPerTiming;
			document.peleIWD.intervalSize.value = intervalSize;
			document.peleIWD.totalForTiming.value = totalForTiming;
			document.peleIWD.action = '/shf/IWD/peleSchedule.do';
			document.getElementById("loadingImgDiv").style.display = "";
			document.peleIWD.submit();
		}
		
		function cancelSched(moduleId, mokedId, innerJobId) {
			document.peleIWD.moduleId.value = moduleId;
			document.peleIWD.mokedId.value = mokedId;
			document.peleIWD.innerJobId.value = innerJobId;
			document.peleIWD.action = '/shf/IWD/peleScheduleCancel.do';
			document.getElementById("loadingImgDiv").style.display = "";
			document.peleIWD.submit();
		}
		
		function checkEmptyOrNaN (str,name) {
			if ( ! str  || isNaN(str)) {
				if (str == '' ) {
					alert('\'יש להזין ערך בשדה \''+name+'');
				} else {
					alert('יש להזין ערך נומרי בלבד');
				}
				return false;
			} else return true;
		}
		
	</script>
</head>
<body>

<% if (empAndModules != null && empAndModules.size() > 0) { %>
<script type="text/javascript">
var myData=[
<% 
int totalAssignedCol = 0;
int totalCompletedCol = 0;
int totalSentCol = 0;
int totalScheduledCol = 0;
int totalAvailableCol = 0;

for (int i=0; i<empAndModules.size(); i++) {
	PeleIWDBean empModBean = (PeleIWDBean)empAndModules.get(i);
	String disabled = empModBean.getNotSchedForModule() == 0 ? "disabled" : "";
	String cancelDisabled = empModBean.getSchedForModule() == 0 ? "disabled" : "";
	String moduleParentInner = empModBean.getModuleId() + ",\\'" + empModBean.getParentId()+"\\'," + empModBean.getInnerJobId();
	if(empModBean.getTotalForModule() > 0){
		totalAssignedCol += empModBean.getTotalForModule();
	}
	if(empModBean.getCompletedForModule() > 0){
		totalCompletedCol += empModBean.getCompletedForModule();
	}
	if(empModBean.getReqSentForModule() > 0){
		totalSentCol += empModBean.getReqSentForModule();
	}
	if(empModBean.getSchedForModule() > 0){
		totalScheduledCol += empModBean.getSchedForModule();
	}
	if(empModBean.getNotSchedForModule() > 0){
		totalAvailableCol += empModBean.getNotSchedForModule();
	}
%>
[
'<input type="button" value="בטל" onClick="cancelSched(<%=moduleParentInner%>);" <%=cancelDisabled%>> / <input <%=disabled%> type="button" value="תזמן" onClick="doSched(<%=i%>,<%=moduleParentInner%>);">',
'<input type="text" size="3" id="totalForTiming<%=i%>" <%=disabled%>>',
'<input type="text" size="3" id="intervalSize<%=i%>" <%=disabled%>>',
'<input type="text" size="3" id="perTiming<%=i%>" <%=disabled%>>',

<%/*--------------------------- NotSchedForModule ---------------------------------------------*/%>
<%if(empModBean.getNotSchedForModule() > 0){
	String jsNamesArr = "[";
	for(int n = 0; n < empModBean.getNamesNotSchedForModule().size(); n++){
		String str = (String)empModBean.getNamesNotSchedForModule().get(n);
		jsNamesArr += "\\'" + str.replaceAll("'","\\\\\\\\\\\\'") + "\\'";
		if(n < empModBean.getNamesNotSchedForModule().size() - 1){
			jsNamesArr += ",";
		}
	}
	jsNamesArr += "]";
%>
	'<span onClick="namesForDialog(\'\',<%=jsNamesArr%>);" style="cursor: pointer;text-decoration: underline;"><%=empModBean.getNotSchedForModule()%></span><input type="hidden" id="notSchedForModule<%=i%>" value="<%=empModBean.getNotSchedForModule()%>">',
<%} else { %>
	'<%=empModBean.getNotSchedForModule()%><input type="hidden" id="notSchedForModule<%=i%>" value="<%=empModBean.getNotSchedForModule()%>">',
<%}%>

<%/*--------------------------- SchedForModule ------------------------------------------------*/%>
<%if(empModBean.getSchedForModule() > 0){
	String jsNamesArr = "[";
	for(int n = 0; n < empModBean.getNamesSchedForModule().size(); n++){
		String str = (String)empModBean.getNamesSchedForModule().get(n);
		jsNamesArr += "\\'" + str.replaceAll("'","\\\\\\\\\\\\'") + "\\'";
		if(n < empModBean.getNamesSchedForModule().size() - 1){
			jsNamesArr += ",";
		}
	}
	jsNamesArr += "]";
%>
	'<span onClick="namesForDialog(\'\',<%=jsNamesArr%>);" style="cursor: pointer;text-decoration: underline;"><%=empModBean.getSchedForModule()%></span>',
<%} else { %>
	'<%=empModBean.getSchedForModule()%>',
<%}%>

<%/*--------------------------- ReqSentForModule ----------------------------------------------*/%>
<%if(empModBean.getReqSentForModule() > 0){
	String jsNamesArr = "[";
	for(int n = 0; n < empModBean.getNamesReqSentForModule().size(); n++){
		String str = (String)empModBean.getNamesReqSentForModule().get(n);
		jsNamesArr += "\\'" + str.replaceAll("'","\\\\\\\\\\\\'") + "\\'";
		if(n < empModBean.getNamesReqSentForModule().size() - 1){
			jsNamesArr += ",";
		}
	}
	jsNamesArr += "]";
%>
	'<span onClick="namesForDialog(\'\',<%=jsNamesArr%>);" style="cursor: pointer;text-decoration: underline;"><%=empModBean.getReqSentForModule()%></span>',
<%} else { %>
	'<%=empModBean.getReqSentForModule()%>',
<%}%>

<%/*--------------------------- CompletedForModule --------------------------------------------*/%>
<%if(empModBean.getCompletedForModule() > 0){
	String jsNamesArr = "[";
	for(int n = 0; n < empModBean.getNamesCompletedForModule().size(); n++){
		String str = (String)empModBean.getNamesCompletedForModule().get(n);
		jsNamesArr += "\\'" + str.replaceAll("'","\\\\\\\\\\\\'") + "\\'";
		if(n < empModBean.getNamesCompletedForModule().size() - 1){
			jsNamesArr += ",";
		}
	}
	jsNamesArr += "]";
%>
	'<span onClick="namesForDialog(\'\',<%=jsNamesArr%>);" style="cursor: pointer;text-decoration: underline;"><%=empModBean.getCompletedForModule()%></span>',
<%} else { %>
	'<%=empModBean.getCompletedForModule()%>',
<%}%>

<%/*--------------------------- TotalForModule -----------------------------------------------*/%>
<% if (empModBean.getTotalForModule() > 0) {
	String jsNamesArr = "[";
	for(int n = 0; n < empModBean.getNamesForModule().size(); n++){
		String str = (String)empModBean.getNamesForModule().get(n);
		jsNamesArr += "\\'" + str.replaceAll("'","\\\\\\\\\\\\'") + "\\'";
		if(n < empModBean.getNamesForModule().size() - 1){
			jsNamesArr += ",";
		}
	}
	jsNamesArr += "]";
%>
	'<span onClick="namesForDialog(\'\',<%=jsNamesArr%>);" style="cursor: pointer;text-decoration: underline;"><%=empModBean.getTotalForModule()%></span>',
<%} else { %>
	'<%=empModBean.getTotalForModule()%>',
<%}%>

'<%=SHFTableUtils.getInnerJobName(String.valueOf(empModBean.getInnerJobId()))%>',
'<%=BaseConvert.specialCharacters(SHFTableUtils.getUnitName(empModBean.getParentId()))%>',
'<%=empModBean.getModuleTimeToComplete()%>',
'<%=bzq.utils.BaseConvert.dateToString(empModBean.getModuleCloseDateTime(),"dd/MM/yyyy")%>',
'<%=bzq.utils.BaseConvert.dateToString(empModBean.getModuleOpenDateTime(),"dd/MM/yyyy")%>',
'<%=BaseConvert.specialCharacters(empModBean.getModuleTitle()) %>'
]
<% if (i<empAndModules.size()-1){%>,<%}%>
<% } %>

,[
'<span class="colTotal"/>','<span class="colTotal"/>','<span class="colTotal"/>','<span class="colTotal"/>','<span class="colTotal"><%=totalAvailableCol%></span>','<span class="colTotal"><%=totalScheduledCol%></span>','<span class="colTotal"><%=totalSentCol%></span>','<span class="colTotal"><%=totalCompletedCol%></span>','<span class="colTotal"><%=totalAssignedCol%></span>','<span class="colTotal"/>','<span class="colTotal"/>','<span class="colTotal"/>','<span class="colTotal"/>','<span class="colTotal"/>','<span class="colTotalTitle">סה"כ</span>'
]
];
drawGrid2('dataGridDiv');
</script>

<% } else { %>
	<div class="gridNoData">אין נתונים</div>
<% } %>

</body>
</html>