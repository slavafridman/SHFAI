/*
 * Created on 03/11/2008
 *
 * To change the template for this generated file go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
package bzq.shf.taglib;

import java.util.Calendar;
import java.util.Date;

import javax.servlet.jsp.JspException;
import org.apache.struts.util.ResponseUtils;

import bzq.shf.utils.SHFUtils;
import bzq.taglib.BaseHandlerTag;

/**
 * @author 04982497
 *
 * To change the template for this generated type comment go to
 * Window&gt;Preferences&gt;Java&gt;Code Generation&gt;Code and Comments
 */
public class DayOfWeekTag extends BaseHandlerTag {
	
	protected Date date;
	
	public int doStartTag() throws JspException {
		
		StringBuffer results = new StringBuffer();

		String d=SHFUtils.getDayOfWeek(date);
		
		results.append(d);
		ResponseUtils.write(pageContext, results.toString());
		return (SKIP_BODY);
	}
	
	

	/**
	 * @return
	 */
	public Date getDate() {
		return date;
	}

	/**
	 * @param long1
	 */
	public void setDate(Date d) {
		date = d;
	}

}
