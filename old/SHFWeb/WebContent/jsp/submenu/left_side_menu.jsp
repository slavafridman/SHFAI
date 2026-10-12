<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255" pageEncoding="WINDOWS-1255" %>
<%@ taglib uri="/WEB-INF/shf-html.tld" prefix="shf" %>

<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<!-- <LINK href="../theme/Master.css" rel="stylesheet" type="text/css"> -->
<TITLE>left_side_menu.jsp</TITLE>

<script type="text/javascript" src="/shf/js/shfutils.js"></script>

</HEAD>
<BODY>
<CENTER>
	<TABLE align="left"
		border="0"
		cellpadding="0"
		cellspacing="0">
		<TBODY>
			<TR>
				<TD
					class="upmenuButtonText"
					onmouseover="this.className='upmenuButtonTextOver'"
					onmouseout="this.className='upmenuButtonText'"
					onclick="javascript:history.go(-1)">חזרה</TD>
				<TD
					width="20"
					height="23"><IMG border="0" src="/shf/images/back.gif"
					width="16"
					height="14"
					hspace="3"
					vspace="0"
					align="middle">
					</TD>										
				<TD
					width="40"
					height="20"><span><IMG border="0" src="/shf/images/letter.gif"
					height="16"
					style="cursor:hand;"
					alt="הודעות"
					hspace="3"
					vspace="0"
					align="middle"
					onclick="javascript:window.location.href ='/shf/message/messages.do';"></span>
					
				
				</TD>
				<shf:msgIcon></shf:msgIcon>
				
				<TD
					width="20"
					height="20"><IMG border="0" src="/shf/images/about.gif"
					height="14"
					style="cursor:hand;"
					alt="אודות המערכת"
					hspace="3"
					vspace="0"
					align="middle"
					onclick="window.open('/shf/jsp/about.jsp','about','width=250 , height=130 , resizable=no, scrollbars=no, toolbar=no, location=no, directories=no, status=no');">
					
				</TD>
				<TD	
					width="20"
					height="20"><IMG border="0" src="/shf/images/sft_Menu.png"
					height="14"
					style="cursor:hand;"
					alt="הגדל חלון"
					hspace="3"
					vspace="0"
					align="middle"
					onclick="javascript:hideDisplayMenu(); drawOverlay(this,event)">
					
				</TD>
			</TR>
		</TBODY>
	</TABLE>
</CENTER>
</BODY>
</HTML>
