<jsp:useBean id="addShiftFromFileError" scope="request" class="java.lang.String"></jsp:useBean>
<%@ page import="bzq.shf.utils.SHFUtils"%>
<%@ page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>
<%
	String file = (String)request.getAttribute("addShiftFromFileError");
 %>
<!doctype html public "-//w3c//dtd html 4.01 transitional//en">
<html>
<shf:reloadErrors></shf:reloadErrors>
<head>
	<meta http-equiv="content-type" content="text/html; charset=windows-1255">
	<meta http-equiv="Cache-Control" content="must-revalidate">
	<meta http-equiv="Cache-Control" content="no-store">
	<meta http-equiv="Pragma" content="no-cache">
	<title>insert title here</title>
	<link href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
	<style type="text/css">
		@import "../dojo/dojo/resources/dojo.css";
	</style>
	<script type="text/javascript">
	<%if (!SHFUtils.isEmpty(addShiftFromFileError)) {%>
		 window.open("/shf/shift/addFromFile.do?mode=download","_blank");
	<%}%>
		function checkFile() {
			var input = document.getElementById("fileInput");
			var fileName = input.value;
			var fileNameExt = fileName.split(".");
			var errMsg = "";
			
			if(fileName.length === 0) {
				errMsg = "נא לבחור קובץ" + "\n" + "('BROWSE' באמצעות כפתור)";
			}
			
			if(!errMsg && ( fileName.length === 1 || fileNameExt[fileNameExt.length - 1] !== "csv")){
				errMsg = "קובץ לא מזוהה" + "\n" + ".CSV יש לבחור קובץ עם סיומת";
			}
			
			if(errMsg){
				alert(errMsg);
				return false;
			}
			
			return true;			
		}
		
		function checkSubmit() {
			if (checkFile()){
				document.getElementById("fileSubmit").disabled = true;
				document.getElementById("loadingImgDiv").style.display = "";
				document.forms["uploadFile"].submit();
			}
		}
	</script>
</head>
<body>
	<table width="100%" height="100%" cellpadding="0" cellspacing="0" dir="rtl">
		<tr>
			<td valign="top" dir="rtl" style="height: 20px;"><jsp:include page="submenu/shift_submenu.jsp"></jsp:include></td>
		</tr>
		<tr>
			<td valign="top" style="padding-top: 10px; padding-bottom: 5px; padding-right: 6px; padding-left: 7px;">
				<table width="100%">
					<thead></thead>
					<tbody>
						<tr>
							<td>
								<fieldset class="form">
									<legend>טעינת משמרות מקובץ</legend>
									<form enctype="multipart/form-data" action="/shf/shift/addFromFile.do?mode=upload" method="post" name="uploadFile">
										<div style="margin-top: 10px;">
											<span>1. </span><input id="fileInput" name="shiftsFile" type="file" size="64" accept=".csv" onchange="checkFile();">
										</div>
										<div style="margin-top: 10px;">
											<span>2. </span><input id="fileSubmit" type="button" value="טען קובץ" onclick="checkSubmit();">
										</div>
										<div style="margin-top: 10px;">
											<span>סוגי קבצים נתמכים : CSV</span>
										</div>
									</form>
								</fieldset>
							</td>
						</tr>
						<tr>
							<td>
								<div id="loadingImgDiv" style="position: absolute; width: 100%; height: 100%; z-index: 200; background: white; filter: alpha(opacity=70);  display: inline-block;vertical-align: middle; text-align: center; display: none;">
									<div style="width: 200px; height: 200px; z-index: 500; border: 1px solid grey; margin-top: 200px;">
										<img  alt="...המתן" src="/shf/images/wait.gif" style="width: 50%; margin-top:50px;">
									</div>
								</div>
							</td>
						</tr>
					</tbody>
				</table>
			</td>
		</tr>
		<tr>
			<td align="center" valign="top" id="myexceptionsdiv"
				style="display: none; padding-top: 0px; padding-right: 7px; padding-left: 7px; padding-bottom: 7px;" dir="ltr">
			</td>
		</tr>
	</table>
</body>
</html>