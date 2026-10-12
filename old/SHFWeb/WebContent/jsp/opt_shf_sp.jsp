<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@ page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>
<%@ page import="bzq.shf.utils.SHFTableUtils"%>
<%@ page import="java.util.Iterator"%>
<%@ page import="java.util.Map"%>

<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>

<jsp:useBean id="allowedUnits" class="java.util.HashMap" scope="request"></jsp:useBean>

<html>
	<head>
		<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
		<link href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
		<title>opt_shf_sp</title>
		<shf:reloadErrors></shf:reloadErrors>
		<script type="text/javascript">
		
		function flagUpdate(el) {
			var inputs = document.getElementsByName("flaggedUnits");
			var change = false;
			for (i=0; i < inputs.length; i++) {
				if (inputs[i].checked  != inputs[i].defaultChecked) {
					change = true;
				}
			}
			if ( ! change) {
				alert("לא בוצעו שינויים");
				return false; 
			}
			document.forms['optUpdateFlag'].submit();
			el.disabled = true;
			document.getElementById("loadImg").style.display="";
			el.value="נא להמתין";
		}
		</script>
	</head>
	
	<body>
		<table width="100%" height="100%" cellpadding="0" cellspacing="0" >
			<tr>
				<td dir="rtl" valign="top" style="height: 20px;">
					<jsp:include page="submenu/admin_submenu.jsp"></jsp:include>
				</td>
			</tr>
			<tr>
				<td style="padding:7px 7px 7px 7px;font-size:16px; height: 20px;" valign="top" align="right" class="header">ניהול דגל חירום עבור הפסקות אוטומטיות</td>
			</tr>
			<tr>
				<td valign="top" align="right">
					<div style="overflow: auto;height: 100%; margin-right: 8px;">
						<form name="optUpdateFlag" action="/shf/admin/optShfSpUpdate.do" method="get"> 
							<table cellspacing="0" style="border:solid 1px silver; width: 350px;" >
								<thead>
									<tr bgcolor="white">
										<th class="headerAdm">סטטוס דגל</th>
										<th class="headerAdm">מוקד</th>
									</tr>
								</thead>
								<tbody>
									<% if(allowedUnits != null && allowedUnits.size() > 0) {
										Iterator it = allowedUnits.entrySet().iterator();
		 								while (it.hasNext()) {
		 									Map.Entry pair = (Map.Entry)it.next();
		 									boolean flagged = false;
		 									if (pair.getValue() != null) {
		 										flagged = ((Boolean)pair.getValue()).booleanValue();
		 									}
									%>
											<tr>
												<td align="center" class="data" style="border-bottom:1px silver solid; <%= flagged == true ? "background-color: pink;" : ""%>">
													<input type="checkbox" name="flaggedUnits" id="input_<%=(String)pair.getKey() %>"  value="<%=(String)pair.getKey() %>" <%=flagged == true ? "checked=\"checked\"" : ""%>>
												</td>
												<td align="center" class="data" style="border-bottom:1px silver solid; <%= flagged == true ? "background-color: pink;" : ""%>">
													<%=SHFTableUtils.getUnitName((String)pair.getKey()) %>
												</td>
											</tr>
									
									<%	} } %>
									<tr>
										<td colspan="2" align="center" class="data">
											<span style="width: 100px;">
												<img id="loadImg" src="/shf/images/wait.gif" style="display:none; height: 24px;float:left"/>
												<input type="button" value="עדכן" style="width:68px; float:right;" onclick="flagUpdate(this);">
											</span>
										</td>
									</tr>
								</tbody>
							</table>
						</form>
						<div>
							<span>דגל מורם, הפסקות אוטומטיות מושהות = <input type="checkbox" checked="checked" disabled="disabled"></span>
							<br>
							<span>דגל כבוי, הפסקות אוטומטיות עובדות רגיל = <input type="checkbox" disabled="disabled"></span>
						</div>	
					</div>

				</td>
			</tr>
		</table>
	</body>
</html>