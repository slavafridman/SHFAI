<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c"%>
<html>
<head>
<script type="text/javascript" src="../dojo/dojo/dojo.js"
	djConfig="isDebug: false, parseOnLoad: true"></script>
<style type="text/css">
@import "../dojo/dojo/resources/dojo.css";

@import "../dojo/dijit/themes/nihilo/nihilo.css";

@import "../dojo/dijit/themes/dijit.css";
</style>

<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<jsp:useBean id="actualJobList" class="java.util.Vector" scope="request"></jsp:useBean>
<jsp:useBean id="actualJobBean" class="bzq.shf.bean.ActualJobBean"
	scope="page"></jsp:useBean>
<jsp:useBean id="actualJobForm" class="bzq.shf.forms.ActualJobForm"
	scope="request"></jsp:useBean>

<%@ page language="java" contentType="text/html; charset=WINDOWS-1255"
	pageEncoding="WINDOWS-1255" import="bzq.shf.utils.SHFTableUtils"%>
<%@page import="bzq.shf.forms.TableForm"%>
<%@page
	import="bzq.shf.utils.TablesConstants,java.util.Vector"%>
<script language="JavaScript" src="/shf/js/shfgrid.js"></script>
<script type="text/javascript">
dojo.require("dojo.parser");
dojo.require("dijit.Dialog");
</script>

<meta http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<meta name="GENERATOR" content="IBM WebSphere Studio">
<meta http-equiv="Content-Style-Type" content="text/css">
<link href="../theme/Master.css" rel="stylesheet" type="text/css">
<link href="/shf/theme/shfgrid.css" rel="stylesheet" type="text/css">

<SCRIPT>

function changeJobCode(myFormId){
	
	 var actionUrl="/<%=application.getAttribute("appName")%>/admin/updateActualJob.do"; 
  	 dojo.xhrPost({url:actionUrl,load:returnResults,error:returnResults,form:myFormId,handleAs:'text'});
}

function returnResults(data,ioArgs)
{
	if(data!='Update error'){
		var strData=data;
		//alert(strData);
 	}else
 	{
 		alert("error");
 	}
}	

	
</SCRIPT>

<TITLE></TITLE>
</HEAD>

<BODY dir="rtl">

<TABLE height="100%" width="100%" cellpadding="0" cellspacing="0" dir=rtl>
	<TR>
	<TD valign="top"><jsp:include page="submenu/admin_submenu.jsp" /></TD>
	</TR>
	<TR>

		<td valign="top" style="height: 100% width:100%; padding: 7px 7px 7px 7px ">
		<FIELDSET class=info style="padding: 7px 7px 7px 7px;">
		<LEGEND>מיפוי תפקידים</LEGEND>
		
		<shf:reloadErrors></shf:reloadErrors>
		<table dir="ltr" cellspacing="0" style="width:40%;height:10px">
							<thead>
								<tr bgcolor="white">
									<td class="headerAdm" align="center" width="40%">נציג/בכיר</td>
									<td class="headerAdm" align="center" width="60%">תפקידים</td>
															
								</tr>
							</thead>
		</table dir="ltr" >					
		<div  style="width:40%;height:650px;overflow-y: scroll ">
		<table>
		<tbody>					
		
			<%
			int size=actualJobList.size();
			for(int i=0;i<size;i++){
				actualJobBean=(bzq.shf.bean.ActualJobBean)actualJobList.get(i);
				String categoryName=actualJobBean.getCategoryName();
				String jobName=actualJobBean.getJobName();
				String categoryId=actualJobBean.getCategoryId()==null?"00":actualJobBean.getCategoryId().toString();
				Integer jobId=actualJobBean.getJobId();
			
			%>
			<tr>
			<td class="data"  align="right" width="70%" style="direction: rtl;" nowrap="nowrap"><%=jobName%></td>
			<td  align="right"  style="direction: rtl;">
			<form name="jobForm" id="jobForm<%=i%>" method="post">
			<bzq:select style="width:158px;font-size:10px;height:640px" 
					tablename="categoryJobCode" name="categoryId"
					selectedvalue="<%=categoryId%>" emptySelection="yes"  logic="onChange=changeJobCode(this.form.id)"></bzq:select>
			<input type="hidden" name="jobId" value="<%=jobId%>">
			<input type="hidden" name="jobName" value="<%=jobName%>">		
			</form>		
    		</td>
    		
			
			</tr>
			<%}%>	
			</tbody>						
		</table>				
		</div>				
	
</FIELDSET>
</TD>
</TR>

 <!--  TR>
		<TD colspan=7>
		<button onclick="updateCategoryTable();">עדכן</button>
		</TD>	
				
	</TR-->
	
</TABLE>
</BODY>

</HTML>
