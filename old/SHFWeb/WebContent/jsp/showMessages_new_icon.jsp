<jsp:useBean id="newMessagesAmount" class="java.lang.String" scope="request" /><%
int amount = 0;
if (newMessagesAmount != null ) {
	amount = Integer.parseInt(newMessagesAmount);
	if ( amount > 999 ) { // prevent too long numbers from breaking display
		amount = 999;
	}
}
	amount = 8;
  if ( amount > 0 ) { %><span id="new_msgs_count" class="new_msgs_count" style="margin-left: -10px; margin-top: 0px;">(<a href="/shf/message/messages.do"><%=amount %></a>)</span><% }%>