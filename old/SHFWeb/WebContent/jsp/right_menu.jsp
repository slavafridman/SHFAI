<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html"%>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean"%>
<%@ page language="java" contentType="text/html; charset=WINDOWS-1255"
	pageEncoding="WINDOWS-1255"%>
<%@ page import="bzq.shf.utils.SHFConstants"%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>right_side.jsp</TITLE>

<SCRIPT>
	function btnClicked(btn) {
		if (btn == 8) {
			document.adminForm.submit();
		}

	}
</SCRIPT>
<SCRIPT language="JavaScript" src="/shf/js/shfutils.js"></SCRIPT>
</HEAD>

<%
	bzq.shf.profile.UserProfile user = (bzq.shf.profile.UserProfile) session
			.getAttribute("userProfile");
%>

<BODY onload="curTime('digclick')" dir="rtl">
	<TABLE class="mainMenu" cellpadding="0" cellspacing="0">
		<TBODY>
			<TR>
				<TD width=100% height="23px"
					style="background-color: #F4C531; font-size: 12px; color: navy;">שלום
					<%=user.getFirstName() + " " + user.getLastName()%></TD>
			</TR>
			<TR>
				<TD class=right_clockarea valign="top"><img
					src="/shf/images/logo_bezeq_new.bmp" height="130px"></TD>
			</TR>
			<TR>
				<TD class=digitalClock valign="top" id=digclick></TD>
			</TR>

			<!--Button-->
			<TR>
				<TD class="rightMenuTd">
					<TABLE border="0" width="100%" cellspacing="0" cellpadding="0">
						<TBODY>
							<%
								if (!"true".equals((String) request.getSession().getAttribute("isMobile"))) {
							%>
							<TR>

								<TD class="mainButtonAdd"><IMG class="rightMenuBtnDots"
									src="/shf/images/btnDots.gif"></TD>
								<TD class="mainButtonText"
									onmouseover="this.className='mainButtonTextOver'"
									onmouseout="this.className='mainButtonText'"
									onclick="top.frMain.location='/shf/attendance/param.do';">ניהול
									נוכחות</TD>

							</TR>
							<%
								}
							%>
							<TR>
								<TD class="mainButtonAdd"><IMG class="rightMenuBtnDots"
									src="/shf/images/btnDots.gif"></TD>
								<TD class="mainButtonText"
									onmouseover="this.className='mainButtonTextOver'"
									onmouseout="this.className='mainButtonText'"
									onclick="top.frMain.location='/shf/shift/shiftMenu.do'; if(top.isMobile){this.className='mainButtonText';}">ניהול
									משמרות</TD>

							</TR>
							<%
								if (!"true".equals((String) request.getSession().getAttribute("isMobile"))) {
							%>
							<TR>
								<TD class="mainButtonAdd"><IMG border="0"
									src="/shf/images/btnDots.gif" width="13" height="13"></TD>
								<TD class="mainButtonText"
									onmouseover="this.className='mainButtonTextOver'"
									onmouseout="this.className='mainButtonText'"
									onclick="top.frMain.location='/shf/employee/searchParam.do';">כרטיס
									עובד</TD>

							</TR>
							<%
								}
							%>
							<%
								if (!"true".equals((String) request.getSession().getAttribute("isMobile"))) {
							%>
							<shf:security activity="break_menu">
								<TR>
									<TD class="mainButtonAdd"><IMG border="0"
										src="/shf/images/btnDots.gif" width="13" height="13"></TD>
									<TD class="mainButtonText"
										onmouseover="this.className='mainButtonTextOver'"
										onmouseout="this.className='mainButtonText'"
										onclick="top.frMain.location='/shf/break/searchParam.do';">ניהול
										הפסקות</TD>

								</TR>
							</shf:security>
							<%
								}
							%>
							<shf:security activity="forecast_menu">
								<TR>
									<TD class="mainButtonAdd"><IMG border="0"
										src="/shf/images/btnDots.gif" width="13" height="13"></TD>
									<TD class="mainButtonText"
										onmouseover="this.className='mainButtonTextOver'"
										onmouseout="this.className='mainButtonText'"
										onclick="top.frMain.location='/shf/forecast/param.do';">
										ניהול זמינות</TD>

								</TR>
							</shf:security>
							<shf:security activity="login_menu">
								<TR>

									<TD class="mainButtonAdd"><IMG border="0"
										src="/shf/images/btnDots.gif" width="13" height="13"></TD>
									<TD class="mainButtonText"
										onmouseover="this.className='mainButtonTextOver'"
										onmouseout="this.className='mainButtonText'"
										onclick="top.frMain.location='/shf/completion/menu.do';">דיווח
										שעות נוכחות</TD>

								</TR>
							</shf:security>
							<shf:security activity="admin_menu">
								<TR>

									<TD class="mainButtonAdd"><IMG border="0"
										src="/shf/images/btnDots.gif" width="13" height="13"></TD>
									<TD class="mainButtonText"
										onmouseover="this.className='mainButtonTextOver'"
										onmouseout="this.className='mainButtonText'"
										onclick="top.frMain.location='/shf/admin.do';">ניהול
										מערכת</TD>

								</TR>
							</shf:security>
							<!-- shf:security activity="bi_reports"-->
							<%
								if (!"true".equals((String) request.getSession().getAttribute("isMobile"))) {
							%>
							<TR>

								<TD class="mainButtonAdd"><IMG border="0"
									src="/shf/images/btnDots.gif" width="13" height="13"></TD>
								<TD class="mainButtonText"
									onmouseover="this.className='mainButtonTextOver'"
									onmouseout="this.className='mainButtonText'"
									onclick="top.frMain.location='bi_cti.jsp';">הצגת נתוני CTI
								</TD>

							</TR>

							<TR>

								<TD class="mainButtonAdd"><IMG border="0"
									src="/shf/images/btnDots.gif" width="13" height="13"></TD>
								<TD class="mainButtonText"
									onmouseover="this.className='mainButtonTextOver'"
									onmouseout="this.className='mainButtonText'"
									onclick="window.open('http://portalbi.bezeq.com');">דוחות
									BI</TD>

							</TR>

							<shf:security activity="wfm_reports">
								<TR>

									<TD class="mainButtonAdd"><IMG border="0"
										src="/shf/images/btnDots.gif" width="13" height="13"></TD>
									<TD class="mainButtonText"
										onmouseover="this.className='mainButtonTextOver'"
										onmouseout="this.className='mainButtonText'"
										onclick="top.frMain.location='/shf/wfmReport.do';">דוח
										שיבוץ</TD>

								</TR>

								<TR>

									<TD class="mainButtonAdd"><IMG border="0"
										src="/shf/images/btnDots.gif" width="13" height="13"></TD>
									<TD class="mainButtonText"
										onmouseover="this.className='mainButtonTextOver'"
										onmouseout="this.className='mainButtonText'"
										onclick="top.frMain.location='/shf/wfmHRReport.do';">דוח
										מצבת</TD>
								</TR>
							</shf:security>

							<shf:security activity="admin_menu">
								<TR>
									<TD class="mainButtonAdd"><IMG border="0"
										src="/shf/images/btnDots.gif" width="13" height="13"></TD>
									<TD class="mainButtonText"
										onmouseover="this.className='mainButtonTextOver'"
										onmouseout="this.className='mainButtonText'"
										onclick="top.frMain.location='/shf/mobile/ReportParam.do';">דוח
										שיפטר במובייל</TD>
								</TR>
							</shf:security>
							
							<shf:security activity="lomdot_timing">
								<TR>
									<TD class="mainButtonAdd"><IMG border="0"
										src="/shf/images/btnDots.gif" width="13" height="13"></TD>
									<TD class="mainButtonText"
										onmouseover="this.className='mainButtonTextOver'"
										onmouseout="this.className='mainButtonText'"
										onclick="top.frMain.location='/shf/IWD/peleParam.do';">תזמון לומדות IWD</TD>
								</TR>
							</shf:security>

							<TR>
								<TD class="mainButtonAdd"><IMG border="0"
									src="/shf/images/btnDots.gif" width="13" height="13"></TD>
								<TD class="mainButtonText"
									onmouseover="this.className='mainButtonTextOver'"
									onmouseout="this.className='mainButtonText'"
									onclick="window.open('http://wfm-web.bezeq.com:8080/wfm');">WFM
								</TD>
							</TR>
							<%
								}
							%>
						</TBODY>
					</TABLE></TD>
			</TR>

			<!--Button-->
			<TR>
				<TD style="height: 100%;"><jsp:include page="news.jsp"></jsp:include></TD>
			</TR>

		</TBODY>
	</TABLE>

</BODY>
</HTML>
