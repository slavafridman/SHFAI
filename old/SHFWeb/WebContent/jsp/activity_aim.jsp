<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">


<%@page import="bzq.utils.BaseConvert"%>
<%@page import="bzq.shf.utils.SHFUtils"%>
<%@page import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="java.util.Vector"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-logic.tld" prefix="logic" %>

<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<jsp:useBean id="activityList" class="java.util.Vector" scope="request"></jsp:useBean>
<jsp:useBean id="activityAim" class="bzq.shf.bean.ActivityAimBean"
	scope="page"></jsp:useBean>
<jsp:useBean id="activityAimForm" class="bzq.shf.forms.ActivityAimForm"
	scope="request"></jsp:useBean>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255"
	pageEncoding="WINDOWS-1255"%>
<%@ page%>
<SCRIPT language="JavaScript" src="/shf/js/shfgrid.js"></SCRIPT>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">
<TITLE>activity_aim.jsp</TITLE>
<shf:reloadErrors></shf:reloadErrors>
</HEAD>

<BODY dir="rtl">

<form name="activityAimForm" method="post" action="/shf/admin/viewActivityAim.do">
<SCRIPT>
function insertActivity(){
		
		for (var j=0; j<7; j++) {
			for (var i=0; i<24; i++) {
				 var str="0";
					document.forms['activityAimForm'].activityAim.value=document.forms['activityAimForm'].activityAim.value+str;
					if(i<23){
					document.forms['activityAimForm'].activityAim.value=document.forms['activityAimForm'].activityAim.value+";";
					}
				}
				document.forms['activityAimForm'].activityAim.value=document.forms['activityAimForm'].activityAim.value+",";	
				
			}
			
		document.forms['activityAimForm'].mode.value="insert";
		document.forms['activityAimForm'].action="/shf/admin/insertActivityAim.do";
		document.forms['activityAimForm'].submit();
	}
</SCRIPT>
<input type="hidden"  name="mode" >
<input type="hidden"  name="activityAim" value="">
<TABLE height="100%" width="100%" cellpadding="0" cellspacing="0" dir=rtl>
	<TR>
	<TD valign="top"><jsp:include page="submenu/admin_submenu.jsp" /></TD>
	</TR>
	
	<TR>
	<TD valign="top" style="height: 100%; padding: 7px 7px 7px 7px">
		<FIELDSET class=info style="padding: 7px 7px 7px 7px;"><LEGEND>עדכון
		יעדי זמן שיחה</LEGEND>
	
		<TABLE height="100%" width="100%">
		<TR>
		<TD >
		<div id="dataGridDiv" style="width:100% overflow: auto">
		<script type="text/javascript">
		<%
		Vector aimVec=(Vector)request.getAttribute("activityList");
		%>
		var myHeader=["תאור תור","עדכון"];
		var txtColor=['#000','#000'];
		var myData =[
		<%for (int i=0; i<aimVec.size(); i++){ %>
			<%activityAim = (bzq.shf.bean.ActivityAimBean)aimVec.get(i);%>
			
			<%String desc=SHFTableUtils.getVirtualActivityName(activityAim.getVirtualActivity());%>
			<%if ("".equals(desc)){
				desc = BaseConvert.specialCharactersHTML(SHFTableUtils.getMokedNameOfActivity(activityAim.getVirtualActivity()), true, true)+" - "+SHFTableUtils.getActivityName(activityAim.getVirtualActivity());
			} else {
				if ( ! desc.contains("ארצי")){
				desc = desc +" (ארצי) ";
				}
			}
			
			%>
			 
			['<%=desc%>',
			'<a href=/shf/admin/updateActivityAim.do?&virtualActivity=<%=activityAim.getVirtualActivity()%>&activityAim=<%=activityAim.getActivityAim()%>&mode=update>עדכון</a>']
			<%if (i<aimVec.size()-1){%>
			,
			<%}%>
		<%}%>
			
		];
		drawGrid2('dataGridDiv');
		<%--var myData=[<c:forEach items="${activityList}" var="item" varStatus="status">
			<%
			activityAim=(bzq.shf.bean.ActivityAimBean)pageContext.getAttribute( "item" );
			
			%>
			['<shf:activityAimTable tableName="virtualActivityCode" codeName="<%=activityAim.getVirtualActivity()%>" ></shf:activityAimTable>',
			 '<a href=/shf/admin/updateActivityAim.do?&virtualActivity=${item.virtualActivity}&activityAim=${item.activityAim}&mode=update>עדכון</a>']
			<c:if test="${!status.last}">,</c:if>			
		</c:forEach>];
		drawGrid2('dataGridDiv'); --%>
		
		</script>
		</div>
		</TD>
		</TR>
		</TABLE>
		</FIELDSET>
	</TD>
  </TR>
  <TR>
		<TD colspan=7>
		<button onclick="insertActivity();">הוסף</button>
		</TD>	
				
	</TR>
</TABLE>
</form>
</BODY>
</HTML>
