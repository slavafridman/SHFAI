package bzq.shf.taglib;

import java.util.Date;

import javax.servlet.jsp.JspException;

import org.apache.struts.util.RequestUtils;
import org.apache.struts.util.ResponseUtils;

import bzq.taglib.BaseHandlerTag;
import bzq.utils.BaseConvert;

public class CalendarTagExtra extends CalendarTag{
	
	public int doStartTag() throws JspException {
		
		
		
		return (SKIP_BODY);
	}
}
