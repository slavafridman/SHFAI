
<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<%@taglib uri="/WEB-INF/bzq-html.tld" prefix="bzq"%>
<jsp:useBean 
	id="shiftForm" 
	class="bzq.shf.forms.ShiftDataForm"
	scope="request">
</jsp:useBean>
<html>
<HEAD>

<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<SCRIPT language="JavaScript" src="/shf/js/shftree.js"></SCRIPT>

<META 	http-equiv="Content-Type"
		content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">

<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">

<TITLE></TITLE>
<SCRIPT>
function openCloseTree(obj,tree){
	if(obj.innerHTML!="<img src='/shf/images/opendir.png'>"){
		obj.innerHTML="<img src='/shf/images/opendir.png'>";
	}
	else{
		obj.innerHTML="<img src='/shf/images/directory.png'>";
	}
	hideDisplay(tree);
}
</SCRIPT>

</HEAD>

<BODY>
<%
bzq.shf.bean.ShiftTreeNodeBean treeNode=shiftForm.getTree();
if(treeNode == null || treeNode.getSons() == null || treeNode.getSons().isEmpty()) { 
%>
<div class="gridNoData">אין נתונים</div>
<%
}else{
java.util.HashMap tree=treeNode.getSons();
%>
<TABLE>
<TR>
	<TD onclick="openCloseTree(this,'tot');" class="treeMoked" width=10px style="cursor:hand;"><img src='/shf/images/directory.png'></TD>
	<td class="treeMoked">סה"כ</td>
	<TD style=""> - <%=treeNode.getTotal()%></TD>
	<td style="color: green; " >,<%=treeNode.getExistSum()%></td>
	<td style="color: red; ">,<%=treeNode.getMissSum()%></td>
	<td style="color: graytext; ">,<%=(treeNode.getTotal() - treeNode.getMissSum() - treeNode.getExistSum())%></td>
	<TD width=300px></TD>
</TR>
<TR id="tot" style="display:none;">
	<TD colspan=8><TABLE>
	<%
	java.util.Iterator mokeds=tree.keySet().iterator();
	while(mokeds.hasNext()){
	String key=(String)mokeds.next();
	bzq.shf.bean.ShiftTreeNodeBean moked=(bzq.shf.bean.ShiftTreeNodeBean)tree.get(key);
	%>
<TR>
	<TD width="20px"> </TD>
	<TD onclick="openCloseTree(this,'m<%=key%>');" class="treeMoked" width=10px style="cursor:hand;"><img src="/shf/images/directory.png"></TD>
	<td class="treeMoked"><shf:tables tableName="unitCode" codeName="<%=key%>"/></td>
	<td style="font: bold;"> - <%=moked.getTotal()%></td>
	<td style="font: bold;color: green; " >,<%=moked.getExistSum()%></td>
	<td style="font: bold;color: red; ">,<%=moked.getMissSum()%></td>
	<td style="font: bold;color: graytext; ">,<%=(moked.getTotal() - moked.getMissSum() - moked.getExistSum())%></td>
	<TD width=150px></TD>
</TR>
<TR id="m<%=key%>" style="display:none;">
	<TD colspan=8><TABLE>
	<%
	java.util.HashMap activities=moked.getSons();
	
	java.util.Iterator acts=activities.keySet().iterator();
	while(acts.hasNext()){
	String actkey=(String)acts.next();
	bzq.shf.bean.ShiftTreeNodeBean ac=(bzq.shf.bean.ShiftTreeNodeBean)activities.get(actkey);
	%>
<TR>
	<TD width=30px></TD>
	<TD onclick="openCloseTree(this,'a<%=key+actkey%>');" class="treeActivity" width=10px style="cursor:hand;"><img src="/shf/images/directory.png"></TD>
	<TD class="treeActivity"><%=bzq.shf.utils.SHFTableUtils.getActivityName(actkey)%></TD>
	<td style="font: bold;"> - <%=ac.getTotal()%></td>
	<td style="font: bold;color: green; " >,<%=ac.getExistSum()%></td>
	<td style="font: bold;color: red; ">,<%=ac.getMissSum()%></td>
	<td style="font: bold;color: graytext; ">,<%=(ac.getTotal() - ac.getMissSum() - ac.getExistSum())%></td>
	<TD width=100px></TD>
</TR>
<TR id="a<%=key+actkey%>" style="display:none;">
	<TD colspan=8><TABLE>
	<%
	java.util.HashMap skills=ac.getSons();
	
	java.util.Iterator sk=skills.keySet().iterator();
	while(sk.hasNext()){
	String skillkey=(String)sk.next();
	bzq.shf.bean.ShiftTreeNodeBean s=(bzq.shf.bean.ShiftTreeNodeBean)skills.get(skillkey);
	%> 
<TR>
	<TD width=45px></TD>
	<TD class="treeSkill"><shf:tables tableName="skillCode" codeName="<%=skillkey%>"/></TD>
	<td style="font: bold;"> - <%=s.getTotal()%></td>
	<td style="font: bold;color: green; " >,<%=s.getExistSum()%></td>
</TR>
<%}%>
</TABLE>
</TD>
<%}%>
</TABLE>
</TD>
<%}%>
</TABLE>
</TD>
</TABLE>
<%}%> 
</BODY>
</html>
