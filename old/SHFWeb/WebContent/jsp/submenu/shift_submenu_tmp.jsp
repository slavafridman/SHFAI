<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">

<%@taglib uri="/WEB-INF/shf-html.tld" prefix="shf"%>
<HTML>
<HEAD>
<%@ taglib uri="/WEB-INF/struts-html.tld" prefix="html" %>
<%@ taglib uri="/WEB-INF/struts-bean.tld" prefix="bean" %>
<%@ page 
language="java"
contentType="text/html; charset=WINDOWS-1255"
pageEncoding="WINDOWS-1255"
%>
<META http-equiv="Content-Type"
	content="text/html; charset=WINDOWS-1255">
<META name="GENERATOR" content="IBM WebSphere Studio">
<META http-equiv="Content-Style-Type" content="text/css">
<LINK href="/shf/theme/Master.css" rel="stylesheet" type="text/css">
<TITLE>submenu.jsp</TITLE>

<SCRIPT>
var openPop=null;
function popVisible(pop,over)
{ 
	thePop=document.getElementById(pop);
	if(thePop.style.visibility=='hidden')
	{
		try{
		openPop.style.visibility='hidden';
		}catch(e)
		{}
		thePop.style.visibility='visible';
		openPop=thePop;
	}else{
		if(over==0 && openPop!=null){
			thePop.style.visibility='hidden';
			openPop=null;
		}
	}
	
}
function closePop()
{
	try{
		openPop.style.visibility='hidden';
	}catch(e){}
}

</SCRIPT>

</HEAD>
<BODY>
<TABLE width=100% cellpadding="0" cellspacing="0" align=right>
	<TBODY>
		<TR bgcolor="#F4C531">
			<TD
				align="right"
				nowrap
				height="20"><!--Sub menu-->
			<TABLE
				width=100%
				border="0"
				cellspacing="0"
				cellpadding="0"
				height="16">
				<TBODY>
					<TR>
						
						<TD
							width="100"
							align="right"
							valign="top"
							nowrap
							onmouseover="popVisible('popup2',1)"
							onmouseout="popVisible('popup2',0);"
							onclick="popVisible('popup2',0);"
							dir="rtl"
							height="14">
						<CENTER>
						<TABLE
							border="0"
							cellpadding="0"
							cellspacing="0">
							<TBODY>
								<TR>
									<TD
										width="18"
										height="14"><IMG
										border="0"
										src="/shf/images/clock.gif"
										width="14"
										height="14"
										hspace="0"
										vspace="0"
										align="middle"></TD>
									<TD
										class="upmenuButtonText"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">משמרות</TD>
								</TR>
							</TBODY>
						</TABLE>
						</CENTER>
						<DIV
							id="popup2"
							class="popup"
							style="visibility: hidden"
							onclick="popVisible(this.id,0)">
						<TABLE
							border="0"
							width="100%"
							cellspacing="1"
							cellpadding="1"
							class="subMenu">
							<TBODY>
								<shf:security activity="shift_current">
								<TR>
									<TD width="100%" height="15" nowrap class="subMenuButtonText"
										align="center" valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate ('/shf/shift/currentParam.do');">מצב
									עדכני</TD>

								</TR>
								</shf:security>
								<shf:security activity="shift_search">
								<TR>
									<TD class="subMenuButtonText" align="center" valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate ('/shf/shift/searchParam.do');">תפעול משמרות</TD>
								</TR>
								</shf:security>
								<shf:security activity="shift_myshifts">
								<TR>
									<TD class="subMenuButtonText" align="center" valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate ('/shf/shift/myShiftParam.do');">המשמרת
									שלי</TD>
								</TR>
								</shf:security>
								
								<shf:security activity="replace_main">
								<TR>
									<TD class="subMenuButtonText" align="center" valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate ('/shf/replace/manageReplace.do');">ניהול
									החלפות</TD>
								</TR>
								</shf:security>
					
								<shf:security activity="break_replace">
								<TR>
									<TD width="100%" height="15" nowrap class="subMenuButtonText"
										align="center" valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate ('/shf/break/showManageBreak.do');">החלפת הפסקות</TD>
								</TR>
								</shf:security>								
								
							</TBODY>
						</TABLE>
						</DIV>
						</TD>
						<shf:security activity="shift_inforce_menu">
						<TD style="font-size: 11px; color:a4a477">|</TD>
						
						<TD
							width="100"
							align="right"
							valign="top"
							nowrap
							onmouseover="popVisible('popup3',1)"
							onmouseout="popVisible('popup3',0);"
							onclick="popVisible('popup3',0);"
							dir="rtl"
							height="14">
						<CENTER>
						<TABLE
							border="0"
							cellpadding="0"
							cellspacing="0">
							<TBODY>
								<TR>
									<TD
										width="18"
										height="14"><IMG
										border="0"
										src="/shf/images/inforce.gif"
										width="14"
										height="14"
										hspace="0"
										vspace="0"
										align="middle"></TD>
									<TD
										class="upmenuButtonText"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'">תגבור</TD>
								</TR>
							</TBODY>
						</TABLE>
						</CENTER>
						<DIV
							id="popup3"
							class="popup"
							style="visibility: hidden"
							onclick="popVisible(this.id,0)">
						<TABLE
							border="0"
							width="100%"
							cellspacing="1"
							cellpadding="1"
							class="subMenu">
							<TBODY>
								<shf:security activity="shift_inforce_view">
								<TR>
									<TD
										width="100%"
										height="15"
										nowrap
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/shift/inforceShift.do?mode=populate');">משמרות לתגבור</TD>
										
								</TR>
								</shf:security>
								<shf:security activity="shift_inforce_update">
								<TR>
									<TD
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/shift/addInforceReqParam.do');">הוסף משמרת לתגבור</TD>
								</TR>
								</shf:security>
								<shf:security activity="shift_inforce_agent">
								<TR>
									<TD
										class="subMenuButtonText"
										align="center"
										valign="middle"
										onmouseover="this.className='subMenuButtonTextOver'"
										onmouseout="this.className='subMenuButtonText'"
										onclick="javascript:navigate('/shf/shift/inforceSearchOptionals.do');">הוסף משמרת</TD>
								</TR>
								</shf:security>
								
							</TBODY>
						</TABLE>
						</DIV>
						</TD>
						</shf:security>
						<TD width=100%>&nbsp;</TD>
						<TD style="padding-left:10px;"
							align="left"
							valign="top"
							nowrap
							dir="ltr"
							height="14">
							<jsp:include page="left_side_menu.jsp"></jsp:include>
						</TD>
					</TR>
				</TBODY>
				
			</TABLE>
			<!--Sub menu--></TD>
			
		</TR>
	</TBODY>
</TABLE>

