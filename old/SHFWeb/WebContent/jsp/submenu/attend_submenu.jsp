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
						<shf:security activity="attend_flags">
						<TD
							width="120"
							align="right"
							valign="top"
							nowrap
							onmouseover="popVisible('popup2',1)"
							onmouseout="popVisible('popup2',0);"
							onclick="popVisible('popup2',0);"
							dir="rtl"
							height="14">
						<CENTER>
						<TABLE width=120px 
							border="0"
							cellpadding="0"
							cellspacing="0">
							<TBODY>
								<TR>
									<TD align="center"
										class="upmenuButtonText"
										onmouseover="this.className='upmenuButtonTextOver'"
										onmouseout="this.className='upmenuButtonText'"><IMG border="0"
										src="/shf/images/flag_menu.gif"
										hspace="5"
										vspace="0"
										valign="middle"> דגלים</TD>
								</TR>
							</TBODY>
						</TABLE>
						</CENTER>
						<DIV
							id="popup2"
							class="popup"
							style="visibility: hidden"
							onclick="popVisible(this.id,0)">
						<TABLE width=100%
							border="0"
							cellspacing="0"
							cellpadding="0" style="border:1px silver solid;">
							<TBODY>
								<TR>
									<TD width="100%" height="15" align="right" nowrap class="subMenuButtonText2"
										align="center" valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="addFlag(1);"><IMG border="0"
									src="/shf/images/flag1.gif"
									hspace="2"
									vspace="0"
									align="middle"> דגל איחור</TD>

								</TR>
								
								
								<TR>
									<TD width="100%" height="15" align="right" nowrap="nowrap"
										class="subMenuButtonText2" align="center" valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="addFlag(2);"><IMG border="0"
										src="/shf/images/flag2.gif"
										hspace="2"
										vspace="0"
										align="middle"> דגל צפי עזיבה</TD>
								</TR>
								
								<TR>
								
									<TD width="100%" height="15" align="right" nowrap="nowrap"
										class="subMenuButtonText2" align="center" valign="middle"
										onmouseover="this.className='subMenuButtonTextOver2'"
										onmouseout="this.className='subMenuButtonText2'"
										onclick="removeFlag();">הסר דגל</TD>
								</TR>
															
								
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
</BODY>