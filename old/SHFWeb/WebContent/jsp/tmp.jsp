<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>

<html>
<head>

<title>tmp</title>
<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
<meta name="GENERATOR" content="Rational® Application Developer™ for WebSphere® Software">
<meta charset="UTF-8" />

</head>
<body class=nihilo>
		<table cellpadding="1" cellspacing="1">
					<tr>
						<td class=header colspan=3>הערת משמרת</td>
					</tr>
					<tr>
						<td colspan=3 style="padding-bottom:5px;"><textarea id="remarkText" cols="35" rows="5" name="remark" ></textarea><br>
						<span style="color:#bbbbbb;font-size:11px;font-style:italic;">מקסימום 100 תווים</span>
						</td>
					</tr>
					<tr>
						<td>
						<button onclick="clear_popup('remarkPopupDiv');">ביטול</button>
						</td>
						<td>
						<button onclick="document.getElementById('remarkText').innerText='';">מחיקה</button>
						</td>
						<td>
						<button onclick="addShiftRemark();">שמור</button>
						</td>
						<td width=50px></td>
					</tr>
				</table>
				
</body>
</html>