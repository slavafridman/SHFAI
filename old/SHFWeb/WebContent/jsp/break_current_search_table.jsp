<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ page import="bzq.shf.utils.SHFUtils"%>
<%@ page import="java.util.Date" %>
<jsp:useBean 
	id="breakForm" 
	class="bzq.shf.forms.BreakSearchForm"
	scope="request">
</jsp:useBean>

<%@taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>


<%@page import="com.ibm.websphere.management.repository.Document"%>
<%@page import="java.util.HashMap"%>
<%@page import="bzq.shf.utils.SHFConstants"%><html:html>
<shf:reloadErrors></shf:reloadErrors>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
import="java.util.Vector,bzq.shf.bean.BreakBean,bzq.utils.BaseConvert"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255" >
<META name="GENERATOR" content="IBM WebSphere Studio" >
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="../theme/Master.css" rel="stylesheet" type="text/css">
<LINK href="../theme/shfgrid.css" rel="stylesheet" type="text/css">
<script src="/shf/js/shfgrid.js"></script>
<SCRIPT language="JavaScript">
var selectedRow;
var dataGridDivCurr=null;
var myData=null;
var myData0=null;
var myData1=null;
var myData2=null;
var myData3=null;
var myData4=null;
var myData5=null;

function setSelecion(i) {

	var selection = i;
	if (selection == 0) 
	{myData = myData0; }
	if (selection == 1) 
	{myData = myData1; }
	if (selection == 2) 
	{myData = myData2; }
	if (selection == 3) 
	{myData = myData3; }
	if (selection == 4) 
	{myData = myData4; }
	if (selection == 5) 
	{myData = myData5; }
	
	if (myData != null && myData.length > 0) {
		if (myData.length > 500) {
			alert("נשלפו כמות גדולה מידיי של הפסקות, אנא מקד את החיפוש");
			document.getElementById('dataGridDiv').innerHTML = '<div class="gridNoData">ההפסקות לא הוצגו, נא למקד את החיפוש</div>';
			return 0;
		}
		document.getElementById('dataGridDiv').innerHTML = drawGrid('dataGridDiv');
		}
		else 
		{
		document.getElementById('dataGridDiv').innerHTML = '<div class="gridNoData">אין נתונים</div>'; 
	}
	document.getElementById('dataGridDiv').style.display='';
	document.getElementById('bigDiv').style.display='none';
}

var myHeader=["החלפה","הערות להפסקה","איחור בדקות","מיקום","תור","תפקיד בפועל","שעת חזרה","שעת יציאה","שעת סיום","שעת התחלה","שם","תאריך","יום"];
var txtColor=['red','#000','#000','#000','#000','#000','#000','#000','#000', '#000'];
</SCRIPT>

<TITLE></TITLE>
</HEAD>
<BODY>

<%
String breakEnd = null;

Vector breakVec = null;
HashMap allTab = breakForm.getAllTab();

for (int ii=0;ii<6 && allTab != null;ii++) {
	if (ii==0) {breakVec = (Vector)allTab.get(SHFConstants.BREAK_FUTURE); } // breakForm.getFutureBreak();}
	if (ii==1) {breakVec = (Vector)allTab.get(SHFConstants.BREAK_CURRENT); } // breakForm.getInBreak();}
	if (ii==2) {breakVec = (Vector)allTab.get(SHFConstants.BREAK_NO_ENTRY); } // breakForm.getInBreakNotReturned();}
	if (ii==3) {breakVec = (Vector)allTab.get(SHFConstants.BREAK_NO_EXIT); } // breakForm.getNotGoToBreak();} 
	if (ii==4) {breakVec = (Vector)allTab.get(SHFConstants.BREAK_ENDED_OK); } // breakForm.getEndedOkBreak();}
	if (ii==5) {breakVec = (Vector)allTab.get(SHFConstants.BREAK_ENDED_NOT_OK); } // breakForm.getEndedNotOkBreak();}	
	if(breakVec!=null && breakVec.size()>0){
	int size=breakVec.size();
	%>
	<SCRIPT>
	<%if (ii==0)
		{ %> myData0=[ <%}%>
	<%if (ii==1)
		{ %> myData1=[ <%}%>
	<%if (ii==2)
		{ %> myData2=[ <%}%>
	<%if (ii==3)
		{ %> myData3=[ <%}%>
	<%if (ii==4)
		{ %> myData4=[ <%}%>
	<%if (ii==5)
		{ %> myData5=[ <%}%>			
	<%
	for(int i=0;i<size;i++){
		BreakBean breakBean=(BreakBean)breakVec.get(i);
		String empname=breakBean.getFirstName()+" "+breakBean.getLastName();
		String ename=bzq.shf.utils.SHFUtils.replace(empname,"\'","&#39;");
		%>
		[
		'<%= (ii==0 ? "<a href=\"#\"onclick=\"checkBreak("+breakBean.getAgentDayId()+", \\'"+BaseConvert.dateToString(breakBean.getStartTime(),"dd/MM/yyyy HH:mm")+"\\', \\'"+BaseConvert.dateToString(breakBean.getEndTime(),"dd/MM/yyyy HH:mm")+"\\', "+breakBean.getEmployeeId()+", "+breakBean.getDuration()+")\">לחץ להחלפה</a>" : "")%>',
		'<%=breakBean.getBreakRemark()%>',
		'<%=breakBean.getMinuteLate()>0?String.valueOf(breakBean.getMinuteLate()):""%>',
		'<%=breakBean.isWorkingFromHome() ? "בית" : "מוקד"%>',
		'<%=bzq.shf.utils.SHFTableUtils.getActivityNames(breakBean.getActivity())%>',
		'<%=bzq.shf.utils.SHFTableUtils.getInnerJobName(breakBean.getInnerJobId())%>',
		'<shf:shftime date="<%=breakBean.getEntryTime()%>"/>',
		'<shf:shftime date="<%=breakBean.getExitTime()%>"/>',
		'<shf:shftime date="<%=breakBean.getEndTime()%>"/>',
		'<shf:shftime date="<%=breakBean.getStartTime()%>"/>',
		'<shf:employee empid="<%=Integer.parseInt(breakBean.getEmployeeId())%>" empname="<%=ename%>"/>',
		'<shf:shfdate date="<%=breakBean.getStartTime()%>"/>',
		'<shf:dayofweek date="<%=breakBean.getStartTime()%>"/>',
		]
	<%if(i<size-1){%>,<%}}%>];

		//drawGrid2('dataGridDiv');
	</SCRIPT>
	<%
	}
	else{
	%>
		<div class="gridNoData">אין נתונים</div>
	<%
	}
}
%>
<script type="text/javascript">
	setClicked(1);
</script>
</BODY>
</html:html>
