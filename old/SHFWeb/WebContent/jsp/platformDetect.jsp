<%@ page language="java" contentType="text/html; charset=windows-1255" pageEncoding="windows-1255"%>
<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN">
<html>
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=windows-1255">
	<title>platformDetect</title>
	<script type="text/javascript">
		var m = false;
		if (typeof window.matchMedia === 'function') {
			var isMobile = window.matchMedia("only screen and (max-width: 760px)");
		    if (isMobile.matches) {
		    	m = true;
		      	window.top.document.location="/shf/mPlatform.do";
		    }
		}
		if ( !m ) {
			window.top.document.location="/shf/login.do";
		}
	</script>
</head>

<body>

</body>
</html>